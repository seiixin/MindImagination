<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Schema;

class UserOwnedAssetController extends Controller
{
    // No extra middleware guard here; your routes handle admin access.

    /**
     * List a user’s owned assets (status = completed).
     * GET /admin/users/{user}/owned-assets?q=&per_page=&page=
     */
    public function index(Request $request, User $user)
    {
        $q       = trim((string) $request->query('q', ''));
        $perPage = (int) ($request->query('per_page', 15)) ?: 15;

        $assetCols = $this->assetSelect();

        $query = Purchase::query()
            ->with(['asset:' . implode(',', $assetCols)])
            ->where('user_id', $user->id)
            ->where('status', 'completed');

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

    /**
     * Show one ownership row (ensures it belongs to the user).
     * GET /admin/users/{user}/owned-assets/{purchase}
     */
    public function show(User $user, Purchase $purchase)
    {
        abort_unless($purchase->user_id === $user->id, 404, 'Not found.');

        $purchase->loadMissing('asset:' . implode(',', $this->assetSelect()));

        return response()->json([
            'user'     => ['id' => $user->id, 'name' => $user->name],
            'purchase' => $this->presentPurchase($purchase),
        ]);
    }

    /**
     * Manually grant asset ownership (idempotent).
     * POST /admin/users/{user}/owned-assets   { asset_id }
     */
    public function store(Request $request, User $user)
    {
        $validated = $request->validate([
            'asset_id' => ['required', 'integer', Rule::exists('assets', 'id')],
        ]);
        $assetId = (int) $validated['asset_id'];

        $alreadyOwned = Purchase::where('user_id', $user->id)
            ->where('asset_id', $assetId)
            ->where('status', 'completed')
            ->exists();

        if ($alreadyOwned) {
            return response()->json(['message' => 'Asset already owned by user.'], 200);
        }

        try {
            $purchase = DB::transaction(function () use ($user, $assetId) {
                return Purchase::create([
                    'user_id'      => $user->id,
                    'asset_id'     => $assetId,
                    'points_spent' => 0,
                    'cost_amount'  => 0,
                    'currency'     => 'PHP',
                    'status'       => 'completed',
                ]);
            });

            $purchase->load('asset:' . implode(',', $this->assetSelect()));

            Log::info('Manual asset grant', [
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
            return response()->json(['message' => 'Failed to grant asset.'], 500);
        }
    }

    /**
     * Update ownership (simple status toggle or explicit set).
     * PATCH /admin/owned-assets/{purchase}
     * Body: { action?: revoke|unrevoke, status?: pending|completed|failed|refunded }
     */
    public function update(Request $request, Purchase $purchase)
    {
        $validated = $request->validate([
            'action' => ['nullable', Rule::in(['revoke', 'unrevoke'])],
            'status' => ['nullable', Rule::in(['pending', 'completed', 'failed', 'refunded'])],
        ]);

        try {
            DB::transaction(function () use ($purchase, $validated) {
                if (($validated['action'] ?? null) === 'revoke') {
                    $purchase->update(['status' => 'refunded']);
                } elseif (($validated['action'] ?? null) === 'unrevoke') {
                    $purchase->update(['status' => 'completed']);
                }

                if (array_key_exists('status', $validated) && $validated['status'] !== null) {
                    $purchase->update(['status' => $validated['status']]);
                }
            });

            $purchase->refresh()->loadMissing('asset:' . implode(',', $this->assetSelect()));

            Log::info('Ownership updated', [
                'purchase_id' => $purchase->id,
                'status'      => $purchase->status,
                'admin_id'    => auth()->id(),
            ]);

            return response()->json([
                'message'  => 'Ownership updated.',
                'purchase' => $this->presentPurchase($purchase),
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
     * Revoke (default) or hard delete ownership.
     * DELETE /admin/owned-assets/{purchase}?mode=revoke|delete
     */
    public function destroy(Request $request, Purchase $purchase)
    {
        $mode = $request->query('mode', 'revoke');

        try {
            if ($mode === 'delete') {
                $payload = [
                    'purchase_id' => $purchase->id,
                    'user_id'     => $purchase->user_id,
                    'asset_id'    => $purchase->asset_id,
                    'admin_id'    => auth()->id(),
                ];
                $purchase->delete();
                Log::info('Ownership hard deleted', $payload);
                return response()->json(['message' => 'Ownership deleted.'], 200);
            }

            $purchase->update(['status' => 'refunded']); // revoke
            Log::info('Ownership revoked', [
                'purchase_id' => $purchase->id,
                'user_id'     => $purchase->user_id,
                'asset_id'    => $purchase->asset_id,
                'admin_id'    => auth()->id(),
            ]);

            return response()->json(['message' => 'Ownership revoked.'], 200);
        } catch (\Throwable $e) {
            Log::error('Ownership revoke/delete failed', [
                'purchase_id' => $purchase->id,
                'mode'        => $mode,
                'error'       => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to modify ownership.'], 500);
        }
    }

    /**
     * Minimal asset list for the admin picker.
     * GET /admin/assets-light?q=&category_id=&per_page=&page=
     */
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
                'points'      => $a->points,
                'price'       => $a->price,
                'category_id' => $a->category_id,
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

    /**
     * Bulk grant.
     * POST /admin/users/{user}/owned-assets/bulk  { asset_ids: int[] }
     */
    public function bulkStore(Request $request, User $user)
    {
        $validated = $request->validate([
            'asset_ids'   => ['required', 'array', 'min:1'],
            'asset_ids.*' => ['integer', Rule::exists('assets', 'id')],
        ]);

        $assetIds = array_values(array_unique(array_map('intval', $validated['asset_ids'])));
        $result   = ['granted' => [], 'skipped' => []];

        try {
            DB::transaction(function () use ($user, $assetIds, &$result) {
                foreach ($assetIds as $assetId) {
                    $owned = Purchase::where('user_id', $user->id)
                        ->where('asset_id', $assetId)
                        ->where('status', 'completed')
                        ->exists();

                    if ($owned) {
                        $result['skipped'][] = $assetId;
                        continue;
                    }

                    Purchase::create([
                        'user_id'      => $user->id,
                        'asset_id'     => $assetId,
                        'points_spent' => 0,
                        'cost_amount'  => 0,
                        'currency'     => 'PHP',
                        'status'       => 'completed',
                    ]);

                    $result['granted'][] = $assetId;
                }
            });

            Log::info('Bulk manual grant', [
                'user_id'  => $user->id,
                'result'   => $result,
                'admin_id' => auth()->id(),
            ]);

            return response()->json(['message' => 'Bulk grant finished.', 'result' => $result], 201);
        } catch (\Throwable $e) {
            Log::error('Bulk manual grant failed', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to bulk grant.'], 500);
        }
    }

    /**
     * Bulk revoke/delete.
     * DELETE /admin/owned-assets/bulk  { purchase_ids: int[], mode?: revoke|delete }
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'purchase_ids'   => ['required', 'array', 'min:1'],
            'purchase_ids.*' => ['integer', Rule::exists('purchases', 'id')],
            'mode'           => ['nullable', Rule::in(['revoke', 'delete'])],
        ]);

        $mode = $validated['mode'] ?? 'revoke';

        try {
            DB::transaction(function () use ($validated, $mode) {
                $purchases = Purchase::whereIn('id', $validated['purchase_ids'])->get();
                foreach ($purchases as $p) {
                    if ($mode === 'delete') {
                        $p->delete();
                    } else {
                        $p->update(['status' => 'refunded']);
                    }
                }
            });

            Log::info('Bulk ownership modification', [
                'purchase_ids' => $validated['purchase_ids'],
                'mode'         => $mode,
                'admin_id'     => auth()->id(),
            ]);

            return response()->json(['message' => 'Bulk operation completed.']);
        } catch (\Throwable $e) {
            Log::error('Bulk ownership modification failed', [
                'purchase_ids' => $validated['purchase_ids'] ?? [],
                'mode'         => $mode,
                'error'        => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to perform bulk operation.'], 500);
        }
    }

    /* ===== Helpers ===== */

    private function assetSelect(): array
    {
        $cols = ['id', 'title', 'file_path', 'points', 'price', 'category_id'];
        if (Schema::hasColumn('assets', 'cover_image_path')) {
            $cols[] = 'cover_image_path';
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

        return [
            'purchase_id' => $p->id,
            'user_id'     => $p->user_id,
            'asset_id'    => $p->asset_id,
            'status'      => $p->status,
            'granted_at'  => optional($p->created_at)?->toDateTimeString(),
            'asset'       => $asset ? [
                'id'          => $asset->id,
                'title'       => $asset->title,
                'image_url'   => $image,
                'points'      => $asset->points,
                'price'       => $asset->price,
                'category_id' => $asset->category_id,
            ] : null,
        ];
    }
}
