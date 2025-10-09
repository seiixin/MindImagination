<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AssetController extends Controller
{
    /* =========================================================
     | Admin JSON API (used by your admin Item.jsx)
     * =======================================================*/

    public function index()
    {
        $items = Asset::with(['category', 'comments', 'views', 'ratings', 'favorites'])->get();
        $items = $items->map(fn ($a) => $this->transformAsset($a));
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id'              => 'required|exists:users,id',
            'category_id'          => 'nullable|exists:store_categories,id',
            'title'                => 'required|max:255',
            'description'          => 'nullable|string',
            'price'                => 'nullable|numeric|min:0',
            'points'               => 'nullable|integer|min:0',
            'maintenance_cost'     => 'nullable|numeric|min:0',

            'file_path'            => 'nullable|image|mimes:jpg,jpeg,png,webp',
            'video_path'           => 'nullable|file|mimetypes:video/mp4,video/quicktime,video/x-msvideo',
            'sub_image_path'       => 'nullable|array',
            'sub_image_path.*'     => 'image|mimes:jpg,jpeg,png,webp',
            'download_file_path'   => 'nullable|file',
            'cover_image_path'     => 'nullable|image|mimes:jpg,jpeg,png,webp',
        ]);

        // single-file fields
        foreach (['file_path', 'video_path', 'download_file_path', 'cover_image_path'] as $field) {
            if ($request->hasFile($field)) {
                $data[$field] = $request->file($field)->store('assets', 'public'); // e.g. "assets/xxx.ext"
            }
        }

        // multiple screenshots
        $data['sub_image_path'] = [];
        if ($request->hasFile('sub_image_path')) {
            foreach ((array) $request->file('sub_image_path') as $file) {
                $data['sub_image_path'][] = $file->store('assets', 'public');
            }
        }

        // Optional slug
        if (Schema::hasColumn('assets', 'slug') && empty($data['slug'] ?? null)) {
            $base = Str::slug($data['title']);
            $slug = $base;
            $i = 1;
            while (Asset::where('slug', $slug)->exists()) {
                $slug = $base.'-'.$i++;
            }
            $data['slug'] = $slug;
        }

        // Because Asset::$casts has sub_image_path => 'array', passing an array is correct.
        $asset = Asset::create($data)->load(['category', 'comments', 'views', 'ratings', 'favorites']);

        return response()->json($this->transformAsset($asset), 201);
    }

    public function show(Asset $asset)
    {
        $asset->load(['category', 'comments', 'views', 'ratings', 'favorites']);
        return response()->json($this->transformAsset($asset));
    }

    public function update(Request $request, Asset $asset)
    {
        $data = $request->validate([
            'user_id'              => 'sometimes|exists:users,id',
            'category_id'          => 'nullable|exists:store_categories,id',
            'title'                => 'required|max:255',
            'description'          => 'nullable|string',
            'price'                => 'nullable|numeric|min:0',
            'points'               => 'nullable|integer|min:0',
            'maintenance_cost'     => 'nullable|numeric|min:0',

            'file_path'            => 'nullable|image|mimes:jpg,jpeg,png,webp',
            'video_path'           => 'nullable|file|mimetypes:video/mp4,video/quicktime,video/x-msvideo',
            'sub_image_path'       => 'nullable|array',
            'sub_image_path.*'     => 'image|mimes:jpg,jpeg,png,webp',
            'download_file_path'   => 'nullable|file',
            'cover_image_path'     => 'nullable|image|mimes:jpg,jpeg,png,webp',

            // optional control: replace instead of append
            'replace_sub_images'   => 'nullable|boolean',
        ]);

        // single-file fields
        foreach (['file_path', 'video_path', 'download_file_path', 'cover_image_path'] as $field) {
            if ($request->hasFile($field)) {
                $data[$field] = $request->file($field)->store('assets', 'public');
            }
        }

        // multiple screenshots: append by default, or replace if requested
        $newSubs = [];
        if ($request->hasFile('sub_image_path')) {
            foreach ((array) $request->file('sub_image_path') as $file) {
                $newSubs[] = $file->store('assets', 'public');
            }
        }

        if ($newSubs) {
            $replace = (bool) ($data['replace_sub_images'] ?? false);
            unset($data['replace_sub_images']);

            $existing = is_array($asset->sub_image_path) ? $asset->sub_image_path : [];
            $data['sub_image_path'] = $replace ? array_values($newSubs)
                                               : array_values(array_merge($existing, $newSubs));
        }

        // Optional: set slug once if column exists and asset had none
        if (Schema::hasColumn('assets', 'slug') && isset($data['title']) && empty($asset->slug)) {
            $base = Str::slug($data['title']);
            $slug = $base;
            $i = 1;
            while (Asset::where('slug', $slug)->where('id', '!=', $asset->id)->exists()) {
                $slug = $base.'-'.$i++;
            }
            $data['slug'] = $slug;
        }

        $asset->update($data);
        $asset->load(['category', 'comments', 'views', 'ratings', 'favorites']);

        return response()->json($this->transformAsset($asset));
    }

    public function destroy(Asset $asset)
    {
        $asset->delete();
        return response()->json(null, 204);
    }

    /* =========================================================
     | Guest page: show by slug (used by /assets/{slug})
     * =======================================================*/
    public function showBySlug(string $slug)
    {
        $query = Asset::with([
            'category',
            'comments.user',
            'views',
            'ratings',
            'favorites',
        ]);

        $asset = Schema::hasColumn('assets', 'slug')
            ? $query->where('slug', $slug)->first()
            : null;

        if (!$asset) {
            $asset = $query
                ->whereRaw('LOWER(REPLACE(title," ","-")) = ?', [strtolower($slug)])
                ->first();
        }

        if (!$asset && ctype_digit($slug)) {
            $asset = $query->find($slug);
        }

        if (!$asset) abort(404);

        $arr = $this->transformAsset($asset);
        $arr['views_count']     = $asset->views()->count();
        $arr['favorites_count'] = $asset->favorites()->count();
        $arr['comments_count']  = $asset->comments()->count();
        $arr['avg_rating']      = (float) ($asset->ratings()->avg('rating') ?? 0);
        $arr['slug']            = $asset->slug ?? Str::slug($asset->title ?? (string) $asset->id);

        return Inertia::render('UserPages/AssetDetails', [
            'asset' => $arr,
            'auth'  => ['user' => auth()->user()],
        ]);
    }

    /* ===================== Helpers ===================== */

    private function transformAsset(Asset $asset): array
    {
        $arr = $asset->toArray();

        foreach (['file_path', 'cover_image_path', 'video_path', 'download_file_path'] as $field) {
            $arr[$field] = $this->toPublicUrl($asset->{$field});
        }

        // sub images
        $sub = $asset->sub_image_path;
        if (!is_array($sub)) {
            $raw = $asset->getRawOriginal('sub_image_path');
            $decoded = is_string($raw) ? json_decode($raw, true) : [];
            $sub = is_array($decoded) ? $decoded : [];
        }
        $arr['sub_image_path'] = array_map(fn ($p) => $this->toPublicUrl($p), $sub);

        return $arr;
    }

    /**
     * Turn a stored path into a public URL.
     * Accepts: null, absolute URL, "/storage/...", "assets/xxx.ext", or "/assets/xxx.ext".
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
            $normalized = ltrim($path, '/'); // "assets/xxx.ext"
            return Storage::disk('public')->url($normalized); // APP_URL + "/storage/{path}"
        }

        return null;
    }
}
