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

                return [
                    'id'           => $a->id,
                    'title'        => $a->title,
                    'image_url'    => $this->toPublicUrl($rawImage) ?? '/Images/placeholder.png',
                    'points'       => (int) ($a->points ?? 0),
                    'maintenance'  => (bool) ((float) ($a->maintenance_cost ?? 0) > 0),
                    'downloadable' => (bool) (($a->download_file_path ?: $a->file_path)),
                    'download_url' => route('user.owned-assets.download', $a->id),
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
     */
    public function download(Request $request, Asset $asset)
    {
        $user = $request->user();

        // --- Ownership check (COMPLETED + not revoked) ---
        $owned = Purchase::query()
            ->where('user_id', $user->id)
            ->where('asset_id', $asset->id)
            ->where('status', Purchase::STATUS_COMPLETED)
            ->when(Schema::hasColumn('purchases', 'revoked_at'), fn ($q) => $q->whereNull('revoked_at'))
            ->exists();

        abort_unless($owned, 403, 'You do not own this asset.');

        // --- Determine downloadable path ---
        $path = $asset->download_file_path ?: $asset->file_path;
        abort_if(empty($path), 404, 'No downloadable file for this asset.');

        // --- Log download (robust, never blocks download) ---
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

        // --- Serve/redirect file ---
        // If already a full URL, just redirect out.
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return redirect()->away($path);
        }

        // Normalize possible "/storage/..." or "/assets/..." to a disk-relative path.
        $relative = $this->normalizeStoragePath($path); // e.g. "assets/file.png"

        // Use configured disk; for S3/GCS prefer a signed temporary URL.
        $disk = config('filesystems.default', 'public');

        try {
            $diskInstance = Storage::disk($disk);

            if (method_exists($diskInstance, 'temporaryUrl') && $diskInstance->exists($relative)) {
                $url = $diskInstance->temporaryUrl($relative, now()->addMinutes(5));
                return redirect()->away($url);
            }

            if ($diskInstance->exists($relative)) {
                $filename = Str::slug($asset->title ?: ('asset-' . $asset->id));
                $ext      = pathinfo($relative, PATHINFO_EXTENSION);
                $name     = $ext ? ($filename . '.' . $ext) : $filename;
                return $diskInstance->download($relative, $name);
            }
        } catch (\Throwable $e) {
            // fall through to public disk check
        }

        // Fallback to public disk explicitly
        if ($disk !== 'public') {
            $public = Storage::disk('public');
            if ($public->exists($relative)) {
                $filename = Str::slug($asset->title ?: ('asset-' . $asset->id));
                $ext      = pathinfo($relative, PATHINFO_EXTENSION);
                $name     = $ext ? ($filename . '.' . $ext) : $filename;
                return $public->download($relative, $name);
            }
        }

        abort(404, 'File not found.');
    }

    /* ===================== Helpers ===================== */

    /**
     * Convert DB media paths to a public URL the browser can load.
     * Accepts null, absolute URLs, "/storage/...", "assets/abc.jpg", or "/assets/abc.jpg".
     */
    private function toPublicUrl($path): ?string
    {
        if (!$path) return null;

        if (is_string($path) && (str_starts_with($path, 'http://') || str_starts_with($path, 'https://'))) {
            return $path;
        }

        if (is_string($path) && str_starts_with($path, '/storage/')) {
            return url($path);
        }

        if (is_string($path)) {
            $normalized = ltrim($path, '/'); // remove any leading "/"
            return Storage::disk('public')->url($normalized); // => APP_URL + "/storage/{normalized}"
        }

        return null;
    }

    /**
     * Normalize any stored path to a disk-relative path (for Storage::* calls).
     * Examples:
     *   "/storage/assets/foo.png" -> "assets/foo.png"
     *   "assets/foo.png"         -> "assets/foo.png"
     *   "/assets/foo.png"        -> "assets/foo.png"
     */
    private function normalizeStoragePath(string $path): string
    {
        $p = ltrim($path, '/');

        if (str_starts_with($p, 'storage/')) {
            // Strip the "storage/" prefix to map to storage/app/public/*
            return ltrim(substr($p, strlen('storage/')), '/');
        }

        return $p;
    }
}
