<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Schema;

class UserOwnedAssetController extends Controller
{
    /** LIST: GET /admin/users/{user}/owned-assets */
    public function index(Request $request, User $user)
    {
        $q       = trim((string) $request->query('q', ''));
        $perPage = (int) ($request->query('per_page', 15)) ?: 15;

        $assetCols = $this->assetSelect();

        $query = Purchase::query()
            ->with(['asset:' . implode(',', $assetCols)])
            ->where('user_id', $user->id)
            ->where('status', Purchase::STATUS_COMPLETED);

        if ($q !== '') {
            $query->whereHas('asset', fn ($sub) => $sub->where('title', 'like', "%{$q}%"));
        }

        $paginator = $query
            ->latest('purchases.id')
            ->paginate($perPage)
            ->through(fn (Purchase $p) => $this->presentPurchase($p));

        return response()->json([
            'user'       => ['id' => $user->id, 'name' => $user->name],
            'query'      => $q,
            'data'       => $paginator->items(),
            'pagination' => [
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    /** SHOW: GET /admin/users/{user}/owned-assets/{purchase} */
    public function show(User $user, Purchase $purchase)
    {
        abort_unless($purchase->user_id === $user->id, 404, 'Not found.');
        $purchase->loadMissing('asset:' . implode(',', $this->assetSelect()));

        return response()->json([
            'user'     => ['id' => $user->id, 'name' => $user->name],
            'purchase' => $this->presentPurchase($purchase),
        ]);
    }

    /** STORE: POST /admin/users/{user}/owned-assets  {asset_id, allow_overdraft?:bool} */
    public function store(Request $request, User $user)
    {
        $validated = $request->validate([
            'asset_id'        => ['required', 'integer', Rule::exists('assets', 'id')],
            'allow_overdraft' => ['nullable', 'boolean'],
        ]);
        $assetId        = (int) $validated['asset_id'];
        $allowOverdraft = (bool) ($validated['allow_overdraft'] ?? false);

        $alreadyOwned = Purchase::where('user_id', $user->id)
            ->where('asset_id', $assetId)
            ->where('status', Purchase::STATUS_COMPLETED)
            ->exists();

        if ($alreadyOwned) {
            return response()->json(['message' => 'Asset already owned by user.'], 200);
        }

        try {
            $purchase = DB::transaction(function () use ($user, $assetId, $allowOverdraft) {
                $u     = User::where('id', $user->id)->lockForUpdate()->firstOrFail();
                $asset = Asset::findOrFail($assetId);

                $assetPoints = (int) ($asset->points ?? 0);
                $assetPrice  = (float) ($asset->price ?? 0);

                if (!$allowOverdraft && $u->points < $assetPoints) {
                    abort(422, 'Insufficient points to grant this asset.');
                }

                $u->points = (int) $u->points - $assetPoints;
                $u->save();

                return Purchase::create([
                    'user_id'      => $u->id,
                    'asset_id'     => $asset->id,
                    'points_spent' => $assetPoints,
                    'cost_amount'  => $assetPrice,
                    'currency'     => 'PHP',
                    'status'       => Purchase::STATUS_COMPLETED,
                    'source'       => Purchase::SOURCE_MANUAL,
                    'revoked_at'   => null,
                ]);
            });

            $purchase->load('asset:' . implode(',', $this->assetSelect()));

            Log::info('Manual asset grant (with points deduction)', [
                'purchase_id' => $purchase->id,
                'user_id'     => $user->id,
                'asset_id'    => $assetId,
                'admin_id'    => auth()->id(),
            ]);

            return response()->json([
                'message'  => 'Asset granted successfully.',
                'purchase' => $this->presentPurchase($purchase),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Manual asset grant failed', [
                'user_id'  => $user->id,
                'asset_id' => $assetId,
                'error'    => $e->getMessage(),
            ]);
            $code = (int) ($e->getCode() ?: 500);
            return response()->json(['message' => $e->getMessage()], $code >= 400 && $code < 600 ? $code : 500);
        }
    }

    /**
     * UPDATE: PATCH /admin/owned-assets/{purchase}
     * { action?: revoke|unrevoke, status?: pending|completed|failed|revoked, refund_points?: bool }
     *
     * NOTE: If refund_points=true during revoke, the purchase row is DELETED.
     */
    public function update(Request $request, Purchase $purchase)
    {
        $validated = $request->validate([
            'action'        => ['nullable', Rule::in(['revoke', 'unrevoke'])],
            'status'        => ['nullable', Rule::in([
                Purchase::STATUS_PENDING, Purchase::STATUS_COMPLETED,
                Purchase::STATUS_FAILED, Purchase::STATUS_REVOKED
            ])],
            'refund_points' => ['nullable', 'boolean'],
        ]);
        $refundPoints = (bool) ($validated['refund_points'] ?? false);

        try {
            $result = DB::transaction(function () use ($purchase, $validated, $refundPoints) {
                $wasCompleted = $purchase->status === Purchase::STATUS_COMPLETED;

                // --- ACTIONS ---
                if (($validated['action'] ?? null) === 'revoke') {
                    return $this->safeRevoke($purchase, $wasCompleted, $refundPoints);
                } elseif (($validated['action'] ?? null) === 'unrevoke') {
                    // try to return to COMPLETED (guard uniqueness)
                    try {
                        $purchase->update(['status' => Purchase::STATUS_COMPLETED, 'revoked_at' => null]);
                    } catch (QueryException $qe) {
                        if (($qe->errorInfo[1] ?? null) === 1062) {
                            abort(422, 'Already owned (another COMPLETED row exists for this asset).');
                        }
                        throw $qe;
                    }
                }

                // --- DIRECT STATUS OVERRIDE ---
                if (array_key_exists('status', $validated) && $validated['status'] !== null) {
                    if ($validated['status'] === Purchase::STATUS_REVOKED) {
                        return $this->safeRevoke($purchase, $wasCompleted, $refundPoints);
                    }
                    if ($validated['status'] === Purchase::STATUS_COMPLETED) {
                        try {
                            $purchase->update(['status' => Purchase::STATUS_COMPLETED, 'revoked_at' => null]);
                        } catch (QueryException $qe) {
                            if (($qe->errorInfo[1] ?? null) === 1062) {
                                abort(422, 'Already owned (another COMPLETED row exists for this asset).');
                            }
                            throw $qe;
                        }
                    } else {
                        $purchase->update(['status' => $validated['status']]);
                    }
                }

                // back-fill snapshots if we’re now COMPLETED
                if ($purchase->status === Purchase::STATUS_COMPLETED) {
                    $needsPoints = $purchase->points_spent === null;
                    $needsCost   = $purchase->cost_amount === null;
                    if ($needsPoints || $needsCost) {
                        $asset   = $purchase->asset ?: Asset::find($purchase->asset_id);
                        $updates = [];
                        if ($needsPoints) $updates['points_spent'] = (int) ($asset->points ?? 0);
                        if ($needsCost)   $updates['cost_amount']  = (float) ($asset->price ?? 0);
                        if ($updates) $purchase->update($updates);
                    }
                }

                return 'ok';
            });

            // If deleted during refund, don't try to refresh
            $exists = $purchase->exists;
            if ($exists) {
                $purchase->refresh()->loadMissing('asset:' . implode(',', $this->assetSelect()));
            }

            Log::info('Ownership updated', [
                'purchase_id' => $purchase->id ?? null,
                'status'      => $exists ? $purchase->status : 'deleted',
                'admin_id'    => auth()->id(),
                'result'      => $result,
            ]);

            $message = (!$exists || $result === 'deleted')
                ? 'Ownership revoked, points refunded, and log removed.'
                : 'Ownership updated.';

            return response()->json([
                'message'  => $message,
                'purchase' => $exists ? $this->presentPurchase($purchase) : null,
            ]);
        } catch (\Throwable $e) {
            Log::error('Ownership update failed', [
                'purchase_id' => $purchase->id,
                'error'       => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to update ownership.'], 500);
        }
    }

    /**
     * DESTROY: DELETE /admin/owned-assets/{purchase}?mode=revoke|delete
     * Body (when mode=revoke): { refund_points?: bool }
     *
     * NOTE: If refund_points=true during revoke, the purchase row is DELETED.
     */
    public function destroy(Request $request, Purchase $purchase)
    {
        $mode         = $request->query('mode', 'revoke');
        $refundPoints = (bool) $request->boolean('refund_points', false);

        try {
            if ($mode === 'delete') {
                $wasCompleted = $purchase->status === Purchase::STATUS_COMPLETED;
                $uid = $purchase->user_id;

                DB::transaction(function () use ($purchase, $wasCompleted, $refundPoints, $uid) {
                    if ($wasCompleted && $refundPoints) {
                        $u = User::where('id', $uid)->lockForUpdate()->first();
                        if ($u) {
                            $u->points = (int) $u->points + (int) ($purchase->points_spent ?? 0);
                            $u->save();
                        }
                    }
                    $purchase->delete();
                });

                Log::info('Ownership hard deleted', [
                    'purchase_id' => $purchase->id,
                    'refund'      => $refundPoints,
                    'admin_id'    => auth()->id(),
                ]);

                return response()->json(['message' => 'Ownership deleted.'], 200);
            }

            // mode = revoke (preferred)
            $result = DB::transaction(function () use ($purchase, $refundPoints) {
                return $this->safeRevoke($purchase, $purchase->status === Purchase::STATUS_COMPLETED, $refundPoints);
            });

            Log::info('Ownership revoked', [
                'purchase_id' => $purchase->id ?? null,
                'user_id'     => $purchase->user_id,
                'asset_id'    => $purchase->asset_id,
                'refund'      => $refundPoints,
                'removed_log' => $result === 'deleted',
                'admin_id'    => auth()->id(),
            ]);

            $msg = ($result === 'deleted')
                ? 'Ownership revoked, points refunded, and log removed.'
                : 'Ownership revoked.';

            return response()->json(['message' => $msg], 200);
        } catch (\Throwable $e) {
            Log::error('Ownership revoke/delete failed', [
                'purchase_id' => $purchase->id,
                'mode'        => $mode,
                'error'       => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to modify ownership.'], 500);
        }
    }

    /** Minimal picker: GET /admin/assets-light */
    public function assetsLight(Request $request)
    {
        $q        = trim((string) $request->query('q', ''));
        $category = $request->query('category_id');
        $perPage  = (int) ($request->query('per_page', 12)) ?: 12;

        $select = $this->assetSelect();

        $query = Asset::query()
            ->select($select)
            ->when(Schema::hasColumn('assets', 'is_published'), fn ($qq) => $qq->where('is_published', 1))
            ->when($q !== '', fn ($qq) => $qq->where('title', 'like', "%{$q}%"))
            ->when($category, fn ($qq) => $qq->where('category_id', $category))
            ->latest('id');

        $paginator = $query->paginate($perPage)->through(function (Asset $a) {
            $image = (Schema::hasColumn('assets', 'cover_image_path') && $a->cover_image_path)
                ? $a->cover_image_path
                : $a->file_path;

            return [
                'id'          => $a->id,
                'title'       => $a->title,
                'image_url'   => $image,
                'points'      => (int) $a->points,
                'price'       => (float) $a->price,
                'category_id' => $a->category_id,
                // optional: surface maintenance for pickers too
                'maintenance_cost' => (float) ($a->maintenance_cost ?? 0),
                'has_maintenance'  => ((float) ($a->maintenance_cost ?? 0)) > 0,
            ];
        });

        return response()->json([
            'data'       => $paginator->items(),
            'pagination' => [
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
            'query' => $q,
        ]);
    }

    /* ===================== Helpers ===================== */

    /**
     * Revoke safely.
     * - If $refundPoints === true:
     *    * refund user's points (if it was COMPLETED)
     *    * DELETE the purchase row (remove the log)
     *    * return "deleted"
     * - If $refundPoints === false:
     *    * set status=REVOKED (keep the row)
     *    * return "revoked"
     */
    private function safeRevoke(Purchase $purchase, bool $wasCompleted, bool $refundPoints): string
    {
        if ($refundPoints) {
            // refund then delete
            if ($wasCompleted) {
                $u = User::where('id', $purchase->user_id)->lockForUpdate()->first();
                if ($u) {
                    $u->points = (int) $u->points + (int) ($purchase->points_spent ?? 0);
                    $u->save();
                }
            }
            $purchase->delete();
            return 'deleted';
        }

        // Keep a single REVOKED row for this pair (avoid unique collisions).
        Purchase::where('user_id', $purchase->user_id)
            ->where('asset_id', $purchase->asset_id)
            ->where('status', Purchase::STATUS_REVOKED)
            ->where('id', '!=', $purchase->id)
            ->delete();

        try {
            $purchase->update(['status' => Purchase::STATUS_REVOKED, 'revoked_at' => now()]);
        } catch (QueryException $qe) {
            if (($qe->errorInfo[1] ?? null) === 1062) {
                // As a last resort, just delete the current one to satisfy the constraint.
                $purchase->delete();
                return 'deleted';
            }
            throw $qe;
        }

        return 'revoked';
    }

    private function assetSelect(): array
    {
        // Base columns
        $cols = ['id', 'title', 'file_path', 'points', 'price', 'category_id'];

        // Optional columns
        if (Schema::hasColumn('assets', 'cover_image_path')) {
            $cols[] = 'cover_image_path';
        }
        if (Schema::hasColumn('assets', 'maintenance_cost')) {
            $cols[] = 'maintenance_cost';
        }

        return $cols;
    }

    private function presentPurchase(Purchase $p): array
    {
        $asset = $p->asset;
        $image = null;
        if ($asset) {
            $image = (Schema::hasColumn('assets', 'cover_image_path') && !empty($asset->cover_image_path))
                ? $asset->cover_image_path
                : $asset->file_path;
        }

        // Compute maintenance fields safely
        $maintenanceCost = $asset ? (float) ($asset->maintenance_cost ?? 0) : 0.0;
        $hasMaintenance  = $maintenanceCost > 0;

        return [
            'purchase_id'  => $p->id,
            'user_id'      => $p->user_id,
            'asset_id'     => $p->asset_id,
            'status'       => $p->status,
            'source'       => $p->source,
            'points_spent' => (int) $p->points_spent,
            'cost_amount'  => (float) $p->cost_amount,
            'currency'     => $p->currency,
            'granted_at'   => optional($p->created_at)?->toDateTimeString(),

            'asset'        => $asset ? [
                'id'                   => $asset->id,
                'title'                => $asset->title,
                'image_url'            => $image,
                'points'               => (int) $asset->points,
                'price'                => (float) $asset->price,
                'category_id'          => $asset->category_id,
                // NEW fields for admin views:
                'maintenance_cost'     => $maintenanceCost,
                'has_maintenance'      => $hasMaintenance,
                // Admins can always view maintenance details
                'can_view_maintenance' => true,
            ] : null,
        ];
    }
}
