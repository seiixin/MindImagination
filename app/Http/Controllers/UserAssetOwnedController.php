<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Download;
use App\Models\Purchase;
use App\Models\User; // <-- import User
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UserAssetOwnedController extends Controller
{
    /**
     * GET /my/owned-assets
     * Returns JSON for the dashboard to render the user's owned assets.
     */
    public function index(Request $request)
    {
        $user    = $request->user();
        $q       = trim((string) $request->query('q', ''));
        $perPage = (int) ($request->query('per_page', 50)) ?: 50;

        $select = ['id', 'title', 'file_path', 'download_file_path', 'points', 'maintenance_cost', 'category_id'];
        if (Schema::hasColumn('assets', 'cover_image_path')) {
            $select[] = 'cover_image_path';
        }

        $paginator = Asset::query()
            ->select($select)
            ->ownedBy($user->id)
            ->when($q !== '', fn ($qq) => $qq->where('title', 'like', "%{$q}%"))
            ->latest('id')
            ->paginate($perPage);

        $paginator->getCollection()->transform(function (Asset $a) use ($user) {
            $rawImage = (Schema::hasColumn('assets', 'cover_image_path') && !empty($a->cover_image_path))
                ? $a->cover_image_path
                : $a->file_path;

            $maintenanceCost = (float) ($a->maintenance_cost ?? 0);

            $hasDownloadedBefore = Download::query()
                ->where('user_id', $user->id)
                ->where('asset_id', $a->id)
                ->exists();

            // Prefer route() but fall back to URL strings if Ziggy/names differ
            $downloadUrl = function () use ($a) {
                try { return route('user.owned-assets.download', $a->id); }
                catch (\Throwable) { return url('/my/owned-assets/'.$a->id.'/download'); }
            };
            $previewUrl = function () use ($a) {
                try { return route('user.owned-assets.preview', $a->id); }
                catch (\Throwable) { return url('/my/owned-assets/'.$a->id.'/download/preview'); }
            };

            return [
                'id'                      => $a->id,
                'title'                   => $a->title,
                'image_url'               => $this->toPublicUrl($rawImage) ?? '/Images/placeholder.png',
                'points'                  => (int) ($a->points ?? 0),

                'maintenance_cost'        => $maintenanceCost,
                'has_maintenance'         => $maintenanceCost > 0,
                'can_view_maintenance'    => true,

                'has_downloaded_before'   => $hasDownloadedBefore,
                'downloadable'            => (bool) (($a->download_file_path ?: $a->file_path)),

                'download_url'            => $downloadUrl(),
                'preview_url'             => $previewUrl(),
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
     * GET /my/owned-assets/{asset}/download/preview
     */
    public function preview(Request $request, $asset)
    {
        $user  = $request->user();
        $asset = $this->findAssetByIdLoosely($asset);

        $owned = Purchase::query()
            ->where('user_id', $user->id)
            ->where('asset_id', $asset->id)
            ->where('status', Purchase::STATUS_COMPLETED)
            ->when(Schema::hasColumn('purchases', 'revoked_at'), fn ($q) => $q->whereNull('revoked_at'))
            ->exists();

        if (!$owned) {
            return response()->json([
                'owned'   => false,
                'message' => 'You do not own this asset.',
            ], 403);
        }

        $hasDownloadedBefore = Download::query()
            ->where('user_id', $user->id)
            ->where('asset_id', $asset->id)
            ->exists();

        $maintenanceCost = (float) ($asset->maintenance_cost ?? 0);
        $costNow         = ($hasDownloadedBefore && $maintenanceCost > 0) ? $maintenanceCost : 0.0;
        $canAfford       = (int) ($user->points ?? 0) >= (int) $costNow;

        return response()->json([
            'owned'                 => true,
            'has_maintenance'       => $maintenanceCost > 0,
            'maintenance_cost'      => $maintenanceCost,
            'has_downloaded_before' => $hasDownloadedBefore,
            'cost_now'              => $costNow,
            'can_afford'            => $canAfford,
        ]);
    }

    /**
     * GET or POST /my/owned-assets/{asset}/download
     * Accepts confirm via JSON body (POST) or query string (GET).
     */
    public function download(Request $request, $asset)
    {
        $user  = $request->user();
        $asset = $this->findAssetByIdLoosely($asset);

        // Ownership check
        $owned = Purchase::query()
            ->where('user_id', $user->id)
            ->where('asset_id', $asset->id)
            ->where('status', Purchase::STATUS_COMPLETED)
            ->when(Schema::hasColumn('purchases', 'revoked_at'), fn ($q) => $q->whereNull('revoked_at'))
            ->exists();

        abort_unless($owned, 403, 'You do not own this asset.');

        // Determine cost
        $hasDownloadedBefore = Download::query()
            ->where('user_id', $user->id)
            ->where('asset_id', $asset->id)
            ->exists();

        $maintenanceCost = (float) ($asset->maintenance_cost ?? 0);
        $costNow         = ($hasDownloadedBefore && $maintenanceCost > 0) ? $maintenanceCost : 0.0;

        // Confirm flag from JSON or query string
        $confirmed = $request->boolean('confirm', false)
            || filter_var($request->query('confirm'), FILTER_VALIDATE_BOOLEAN);

        if ($costNow > 0 && !$confirmed) {
            $payload = [
                'owned'                 => true,
                'has_maintenance'       => $maintenanceCost > 0,
                'maintenance_cost'      => $maintenanceCost,
                'has_downloaded_before' => $hasDownloadedBefore,
                'cost_now'              => $costNow,
                'can_afford'            => (int) ($user->points ?? 0) >= (int) $costNow,
                'message'               => 'Confirmation required to deduct maintenance points.',
            ];
            return $request->expectsJson()
                ? response()->json($payload, 409)
                : back()->withErrors($payload['message'] ?? 'Confirmation required.');
        }

        // Resolve path
        $path = $asset->download_file_path ?: $asset->file_path;
        abort_if(empty($path), 404, 'No downloadable file for this asset.');

        // Deduct + log (FIX: lock user row via query, not model instance)
        try {
            DB::transaction(function () use ($request, $user, $asset, $costNow) {
                if ($costNow > 0) {
                    $u = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
                    if ((int) ($u->points ?? 0) < (int) $costNow) {
                        abort(422, 'Insufficient points to download this asset.');
                    }
                    // decrement safely
                    $u->points = (int) $u->points - (int) $costNow;
                    $u->save();
                }

                $log = Download::firstOrCreate(
                    ['user_id' => $user->id, 'asset_id' => $asset->id],
                    ['download_count' => 0, 'points_used' => 0]
                );

                if (Schema::hasColumn('downloads', 'download_count')) {
                    $log->download_count = (int) ($log->download_count ?? 0) + 1;
                }
                if ($costNow > 0 && Schema::hasColumn('downloads', 'points_used')) {
                    $log->points_used = (int) ($log->points_used ?? 0) + (int) $costNow;
                }

                $log->ip_address = $request->ip();
                $ua              = (string) ($request->userAgent() ?? '');
                $log->user_agent = mb_substr($ua, 0, 255);
                $log->save();
            });
        } catch (\Throwable $e) {
            Log::warning('Download deduction/log failed', [
                'user_id'  => $user->id,
                'asset_id' => $asset->id,
                'error'    => $e->getMessage(),
            ]);
            abort(500, 'Failed to process download.');
        }

        // Serve or redirect
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $request->expectsJson()
                ? response()->json(['url' => $path])
                : redirect()->away($path);
        }

        $relative = $this->normalizeStoragePath($path);
        $filename = Str::slug($asset->title ?: ('asset-' . $asset->id));
        $ext      = pathinfo($relative, PATHINFO_EXTENSION);
        $name     = $ext ? ($filename . '.' . $ext) : $filename;

        // 1) public disk
        try {
            $publicDisk = Storage::disk('public');
            if ($publicDisk->exists($relative)) {
                // temporaryUrl may throw on local; wrap it safely
                try {
                    if (method_exists($publicDisk, 'temporaryUrl')) {
                        $url = $publicDisk->temporaryUrl($relative, now()->addMinutes(5));
                        return $request->expectsJson()
                            ? response()->json(['url' => $url])
                            : redirect()->away($url);
                    }
                } catch (\Throwable $e) {
                    Log::info('public temporaryUrl not supported, falling back', ['rel' => $relative]);
                }

                if (!$request->expectsJson()) {
                    return $publicDisk->download($relative, $name);
                }
                return response()->json(['url' => $publicDisk->url($relative)]);
            }
        } catch (\Throwable $e) {
            Log::warning('Public disk check failed', ['e' => $e->getMessage(), 'rel' => $relative]);
        }

        // 2) default disk
        $disk = config('filesystems.default', 'public');
        if ($disk !== 'public') {
            try {
                $d = Storage::disk($disk);
                if ($d->exists($relative)) {
                    try {
                        if (method_exists($d, 'temporaryUrl')) {
                            $url = $d->temporaryUrl($relative, now()->addMinutes(5));
                            return $request->expectsJson()
                                ? response()->json(['url' => $url])
                                : redirect()->away($url);
                        }
                    } catch (\Throwable $e) {
                        Log::info('default temporaryUrl not supported, falling back', ['disk' => $disk, 'rel' => $relative]);
                    }

                    if (!$request->expectsJson()) {
                        return $d->download($relative, $name);
                    }
                    return response()->json(['url' => $d->url($relative)]);
                }
            } catch (\Throwable $e) {
                Log::warning('Default disk check failed', ['disk' => $disk, 'e' => $e->getMessage(), 'rel' => $relative]);
            }
        }

        // 3) fallback to public/storage
        $publicStoragePath = public_path('storage/' . ltrim($relative, '/'));
        if (is_file($publicStoragePath)) {
            if ($request->expectsJson()) {
                return response()->json(['url' => url('storage/' . ltrim($relative, '/'))]);
            }
            return response()->download($publicStoragePath, $name);
        }

        // 4) raw /storage path in DB
        $normalizedOriginal = str_replace('\\', '/', (string) $path);
        if (Str::startsWith($normalizedOriginal, '/storage/')) {
            $finalUrl = url($normalizedOriginal);
            return $request->expectsJson()
                ? response()->json(['url' => $finalUrl])
                : redirect()->away($finalUrl);
        }

        Log::warning('Download file not found', [
            'asset_id' => $asset->id,
            'db_path'  => $path,
            'relative' => $relative,
        ]);

        abort(404, 'File not found.');
    }

    /** SoftDeletes support check */
    private function modelSupportsSoftDeletes(string $modelClass): bool
    {
        $traits = function_exists('class_uses_recursive')
            ? class_uses_recursive($modelClass)
            : class_uses($modelClass);

        return in_array(\Illuminate\Database\Eloquent\SoftDeletes::class, $traits, true);
    }

    /** Find Asset by id, ignoring global scopes (and include trashed when applicable) */
    private function findAssetByIdLoosely($assetId): Asset
    {
        $query = Asset::query()->withoutGlobalScopes();
        if ($this->modelSupportsSoftDeletes(Asset::class)) {
            $query = $query->withTrashed();
        }
        return $query->findOrFail((int) $assetId);
    }

    /** Convert stored path to a public URL */
    private function toPublicUrl($path): ?string
    {
        if (!$path) return null;

        if (is_string($path)) {
            $p = str_replace('\\', '/', $path);

            if (Str::startsWith($p, ['http://', 'https://'])) return $p;
            if (Str::startsWith($p, '/storage/')) return url($p);
            if (Str::startsWith(ltrim($p, '/'), 'public/storage/')) {
                $p = '/' . ltrim(substr(ltrim($p, '/'), strlen('public/')), '/');
                return url($p);
            }

            $normalized = ltrim($p, '/');
            return Storage::disk('public')->url($normalized);
        }

        return null;
    }

    /** Normalize path for Storage disk calls */
    private function normalizeStoragePath(string $path): string
    {
        $p = str_replace('\\', '/', $path);
        $p = ltrim($p, '/');

        if (Str::startsWith($p, 'public/storage/')) {
            $p = substr($p, strlen('public/storage/'));
        } elseif (Str::startsWith($p, 'storage/')) {
            $p = substr($p, strlen('storage/'));
        }

        return ltrim($p, '/');
    }
}
