<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class AssetController extends Controller
{
    /** Change if you use a custom public disk (e.g. 'uploads') */
    private string $mediaDisk = 'public';
    /** Folder inside the disk */
    private string $mediaDir  = 'assets';

    public function index()
    {
        $items = Asset::with(['category','comments','views','ratings','favorites'])->get();
        $items = $items->map(fn (Asset $a) => $this->transformAsset($a));
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id'            => 'required|exists:users,id',
            'category_id'        => 'nullable|exists:store_categories,id',
            'title'              => 'required|max:255',
            'description'        => 'nullable|string',
            'price'              => 'nullable|numeric|min:0',
            'maintenance_cost'   => 'nullable|numeric|min:0',

            'file_path'          => 'nullable|image|mimes:jpg,jpeg,png,webp',
            'cover_image_path'   => 'nullable|image|mimes:jpg,jpeg,png,webp',
            'video_path'         => 'nullable|file|mimetypes:video/mp4,video/quicktime,video/x-msvideo,video/webm',
            'download_file_path' => 'nullable|file',
            'sub_image_path'     => 'nullable|array',
            'sub_image_path.*'   => 'image|mimes:jpg,jpeg,png,webp',
        ]);

        // store single files (DB keeps RELATIVE paths like "assets/xxx.ext")
        foreach (['file_path','cover_image_path','video_path','download_file_path'] as $f) {
            if ($request->hasFile($f)) {
                $data[$f] = $this->storeUploaded($request->file($f));
            }
        }

        // store multiple sub images
        if ($request->hasFile('sub_image_path')) {
            $subs = [];
            foreach ($request->file('sub_image_path') as $file) {
                $subs[] = $this->storeUploaded($file);
            }
            $data['sub_image_path'] = json_encode($subs);
        }

        $asset = Asset::create($data);
        $asset->load(['category','comments','views','ratings','favorites']);

        return response()->json($this->transformAsset($asset), 201);
    }

    public function show(Asset $asset)
    {
        $asset->load(['category','comments','views','ratings','favorites']);
        return response()->json($this->transformAsset($asset));
    }

    public function update(Request $request, Asset $asset)
    {
        $data = $request->validate([
            'user_id'            => 'sometimes|exists:users,id',
            'category_id'        => 'nullable|exists:store_categories,id',
            'title'              => 'required|max:255',
            'description'        => 'nullable|string',
            'price'              => 'nullable|numeric|min:0',
            'maintenance_cost'   => 'nullable|numeric|min:0',

            'file_path'          => 'nullable|image|mimes:jpg,jpeg,png,webp',
            'cover_image_path'   => 'nullable|image|mimes:jpg,jpeg,png,webp',
            'video_path'         => 'nullable|file|mimetypes:video/mp4,video/quicktime,video/x-msvideo,video/webm',
            'download_file_path' => 'nullable|file',
            'sub_image_path'     => 'nullable|array',
            'sub_image_path.*'   => 'image|mimes:jpg,jpeg,png,webp',
        ]);

        foreach (['file_path','cover_image_path','video_path','download_file_path'] as $f) {
            if ($request->hasFile($f)) {
                $data[$f] = $this->storeUploaded($request->file($f));
            }
        }

        if ($request->hasFile('sub_image_path')) {
            $subs = [];
            foreach ($request->file('sub_image_path') as $file) {
                $subs[] = $this->storeUploaded($file);
            }
            $data['sub_image_path'] = json_encode($subs);
        }

        $asset->update($data);
        $asset->load(['category','comments','views','ratings','favorites']);

        return response()->json($this->transformAsset($asset));
    }

    public function destroy(Asset $asset)
    {
        $asset->delete();
        return response()->json(null, 204);
    }

    /* ================= Helpers ================= */

    /** Save a file to the configured disk/dir and return a RELATIVE path like "assets/xxx.ext" */
    private function storeUploaded(UploadedFile $file): string
    {
        return $file->store($this->mediaDir, $this->mediaDisk);
    }

    /** Make public URL from stored path (accepts absolute, /storage/..., or relative) */
    private function toPublicUrl(?string $path): ?string
    {
        if (!$path) return null;

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        if (str_starts_with($path, '/storage/')) {
            return url($path);
        }

        return Storage::disk($this->mediaDisk)->url($path); // -> APP_URL/storage/{path}
    }

    /** Ensure JSON response always contains absolute URLs for media fields */
    private function transformAsset(Asset $asset): array
    {
        $arr = $asset->toArray();

        foreach (['file_path','cover_image_path','video_path','download_file_path'] as $f) {
            $arr[$f] = $this->toPublicUrl($asset->getRawOriginal($f) ?: $arr[$f] ?? null);
        }

        // sub images: accept already-decoded array or raw JSON in DB
        $raw = $asset->getRawOriginal('sub_image_path');
        $list = [];

        if (is_array($asset->sub_image_path)) {
            $list = array_map(fn($p) => $this->toPublicUrl($p), $asset->sub_image_path);
        } elseif (is_string($raw)) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $list = array_map(fn($p) => $this->toPublicUrl($p), $decoded);
            }
        }

        $arr['sub_image_path'] = $list;

        return $arr;
    }
}
