<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Download;
use App\Models\Purchase;
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
     * (Completed purchases; not revoked.)
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
            ->ownedBy($user->id) // scope on Asset model (COMPLETED + not revoked)
            ->when($q !== '', fn ($qq) => $qq->where('title', 'like', "%{$q}%"))
            ->latest('id')
            ->paginate($perPage)
            ->through(function (Asset $a) {
                $rawImage = (Schema::hasColumn('assets', 'cover_image_path') && !empty($a->cover_image_path))
                    ? $a->cover_image_path
                    : $a->file_path;

                $maintenanceCost = (float) ($a->maintenance_cost ?? 0);

                return [
                    'id'                 => $a->id,
                    'title'              => $a->title,
                    'image_url'          => $this->toPublicUrl($rawImage) ?? '/Images/placeholder.png',
                    'points'             => (int) ($a->points ?? 0),
                    // New/explicit fields for the dashboard badge:
                    'maintenance_cost'   => $maintenanceCost,
                    'has_maintenance'    => $maintenanceCost > 0,
                    // Optional helper if you want a single gate flag on UI (this route returns owned items)
                    'can_view_maintenance' => true,
                    'downloadable'       => (bool) (($a->download_file_path ?: $a->file_path)),
                    'download_url'       => route('user.owned-assets.download', $a->id),
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
     * GET /my/owned-assets/{asset}/download
     * Authorizes ownership, logs the download, then serves/redirects to file.
     *
     * NOTE: no implicit model binding here to avoid global-scope/soft-delete 404s.
     */
    public function download(Request $request, $asset)
    {
        // Build query without implicit binding to avoid global scopes
        $query = Asset::query()->withoutGlobalScopes();

        // Only call withTrashed() if Asset uses SoftDeletes
        if ($this->modelSupportsSoftDeletes(\App\Models\Asset::class)) {
            $query = $query->withTrashed();
        }

        $asset = $query->findOrFail((int) $asset);

        $user = $request->user();

        // --- Ownership check ---
        $owned = Purchase::query()
            ->where('user_id', $user->id)
            ->where('asset_id', $asset->id)
            ->where('status', Purchase::STATUS_COMPLETED)
            ->when(Schema::hasColumn('purchases', 'revoked_at'), fn ($q) => $q->whereNull('revoked_at'))
            ->exists();

        abort_unless($owned, 403, 'You do not own this asset.');

        // --- Resolve path ---
        $path = $asset->download_file_path ?: $asset->file_path;
        abort_if(empty($path), 404, 'No downloadable file for this asset.');

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return redirect()->away($path);
        }

        $relative = $this->normalizeStoragePath($path);

        // Log download (non-blocking)
        try {
            DB::transaction(function () use ($request, $user, $asset) {
                $log = Download::firstOrCreate(
                    ['user_id' => $user->id, 'asset_id' => $asset->id],
                    ['download_count' => 0, 'points_used' => 0]
                );

                $log->ip_address     = $request->ip();
                $ua                  = (string) ($request->userAgent() ?? '');
                $log->user_agent     = mb_substr($ua, 0, 255);
                $log->download_count = (int) ($log->download_count ?? 0) + 1;
                $log->save();
            });
        } catch (\Throwable $e) {
            Log::warning('Download log failed', [
                'user_id'  => $user->id,
                'asset_id' => $asset->id,
                'error'    => $e->getMessage(),
            ]);
        }

        $filename = Str::slug($asset->title ?: ('asset-' . $asset->id));
        $ext      = pathinfo($relative, PATHINFO_EXTENSION);
        $name     = $ext ? ($filename . '.' . $ext) : $filename;

        // 1) public disk (local dev default)
        try {
            $publicDisk = Storage::disk('public');
            if ($publicDisk->exists($relative)) {
                if (method_exists($publicDisk, 'temporaryUrl')) {
                    $url = $publicDisk->temporaryUrl($relative, now()->addMinutes(5));
                    return redirect()->away($url);
                }
                return $publicDisk->download($relative, $name);
            }
        } catch (\Throwable $e) {
            Log::warning('Public disk check failed', ['e' => $e->getMessage(), 'rel' => $relative]);
        }

        // 2) default disk (if not public)
        $disk = config('filesystems.default', 'public');
        if ($disk !== 'public') {
            try {
                $d = Storage::disk($disk);
                if ($d->exists($relative)) {
                    if (method_exists($d, 'temporaryUrl')) {
                        $url = $d->temporaryUrl($relative, now()->addMinutes(5));
                        return redirect()->away($url);
                    }
                    return $d->download($relative, $name);
                }
            } catch (\Throwable $e) {
                Log::warning('Default disk check failed', ['disk' => $disk, 'e' => $e->getMessage(), 'rel' => $relative]);
            }
        }

        // 3) fallback to physical public/storage path
        $publicStoragePath = public_path('storage/' . ltrim($relative, '/'));
        if (is_file($publicStoragePath)) {
            return response()->download($publicStoragePath, $name);
        }

        // 4) if DB path starts with /storage, just redirect there
        $normalizedOriginal = str_replace('\\', '/', (string) $path);
        if (Str::startsWith($normalizedOriginal, '/storage/')) {
            return redirect()->away(url($normalizedOriginal));
        }

        Log::warning('Download file not found', [
            'asset_id' => $asset->id,
            'db_path'  => $path,
            'relative' => $relative,
            'checked'  => [
                'public_disk' => Storage::disk('public')->exists($relative),
                'public_path' => $publicStoragePath,
            ],
        ]);

        abort(404, 'File not found.');
    }

    /**
     * Return true if the model uses SoftDeletes.
     */
    private function modelSupportsSoftDeletes(string $modelClass): bool
    {
        $traits = function_exists('class_uses_recursive')
            ? class_uses_recursive($modelClass)
            : class_uses($modelClass);

        return in_array(\Illuminate\Database\Eloquent\SoftDeletes::class, $traits, true);
    }

    /* ===================== Helpers ===================== */

    /**
     * Convert DB media paths to a public URL the browser can load.
     * Accepts null, absolute URLs, "/storage/...", "assets/abc.jpg", "/assets/abc.jpg",
     * and Windows backslashes.
     */
    private function toPublicUrl($path): ?string
    {
        if (!$path) return null;

        if (is_string($path)) {
            $p = str_replace('\\', '/', $path); // Windows → forward slashes

            if (Str::startsWith($p, ['http://', 'https://'])) {
                return $p;
            }

            // If already /storage/... return absolute URL
            if (Str::startsWith($p, '/storage/')) {
                return url($p);
            }

            // If it mistakenly includes 'public/storage/...', map to '/storage/...'
            if (Str::startsWith(ltrim($p, '/'), 'public/storage/')) {
                $p = '/' . ltrim(substr(ltrim($p, '/'), strlen('public/')), '/'); // → '/storage/...'
                return url($p);
            }

            // Otherwise treat as "public" disk relative (e.g., "assets/xyz.png")
            $normalized = ltrim($p, '/');
            return Storage::disk('public')->url($normalized); // => APP_URL + "/storage/{normalized}"
        }

        return null;
    }

    /**
     * Normalize any stored path to a disk-relative path (for Storage::* calls).
     * Handles:
     *   "assets/foo.zip"            -> "assets/foo.zip"
     *   "/assets/foo.zip"           -> "assets/foo.zip"
     *   "/storage/assets/foo.zip"   -> "assets/foo.zip"
     *   "public/storage/assets/..." -> "assets/..."
     * Also converts backslashes to forward slashes.
     */
    private function normalizeStoragePath(string $path): string
    {
        // Normalize slashes
        $p = str_replace('\\', '/', $path);
        $p = ltrim($p, '/');

        if (Str::startsWith($p, 'public/storage/')) {
            $p = substr($p, strlen('public/storage/')); // → "assets/..."
        } elseif (Str::startsWith($p, 'storage/')) {
            $p = substr($p, strlen('storage/'));        // → "assets/..."
        }

        return ltrim($p, '/');
    }
}
