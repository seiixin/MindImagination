<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    public function index()
    {
        return response()->json(
            Asset::with(['category', 'comments', 'views', 'ratings', 'favorites'])->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id'              => 'required|exists:users,id',
            'category_id'          => 'nullable|exists:store_categories,id',
            'title'                => 'required|max:255',
            'description'          => 'nullable|string',
            'price'                => 'nullable|numeric|min:0',
            'maintenance_cost'     => 'nullable|numeric|min:0',
            'file_path'            => 'nullable|image|mimes:jpg,jpeg,png,webp',
            'video_path'           => 'nullable|file|mimes:mp4,mov,avi',
            'sub_image_path'       => 'nullable|array',
            'sub_image_path.*'     => 'image|mimes:jpg,jpeg,png,webp',
            'download_file_path'   => 'nullable|file',
            'cover_image_path'     => 'nullable|image|mimes:jpg,jpeg,png,webp',
        ]);

        // Handle single file fields
        foreach (['file_path', 'video_path', 'download_file_path', 'cover_image_path'] as $field) {
            if ($request->hasFile($field)) {
                $data[$field] = '/storage/' . $request->file($field)->store('assets', 'public');
            }
        }

        // Handle multiple sub images
        if ($request->hasFile('sub_image_path')) {
            $subImages = [];
            foreach ($request->file('sub_image_path') as $file) {
                $subImages[] = '/storage/' . $file->store('assets', 'public');
            }
            $data['sub_image_path'] = json_encode($subImages);
        }

        $asset = Asset::create($data);

        return response()->json($asset, 201);
    }

    public function show(Asset $asset)
    {
        $asset->load(['category', 'comments', 'views', 'ratings', 'favorites']);

        // Decode sub_image_path if stored as JSON
        if (is_string($asset->sub_image_path) && $this->isJson($asset->sub_image_path)) {
            $asset->sub_image_path = json_decode($asset->sub_image_path);
        }

        return response()->json($asset);
    }

    public function update(Request $request, Asset $asset)
    {
        $data = $request->validate([
            'user_id'              => 'sometimes|exists:users,id',
            'category_id'          => 'nullable|exists:store_categories,id',
            'title'                => 'required|max:255',
            'description'          => 'nullable|string',
            'price'                => 'nullable|numeric|min:0',
            'maintenance_cost'     => 'nullable|numeric|min:0',
            'file_path'            => 'nullable|image|mimes:jpg,jpeg,png,webp',
            'video_path'           => 'nullable|file|mimes:mp4,mov,avi',
            'sub_image_path'       => 'nullable|array',
            'sub_image_path.*'     => 'image|mimes:jpg,jpeg,png,webp',
            'download_file_path'   => 'nullable|file',
            'cover_image_path'     => 'nullable|image|mimes:jpg,jpeg,png,webp',
        ]);

        foreach (['file_path', 'video_path', 'download_file_path', 'cover_image_path'] as $field) {
            if ($request->hasFile($field)) {
                $data[$field] = '/storage/' . $request->file($field)->store('assets', 'public');
            }
        }

        if ($request->hasFile('sub_image_path')) {
            $subImages = [];
            foreach ($request->file('sub_image_path') as $file) {
                $subImages[] = '/storage/' . $file->store('assets', 'public');
            }
            $data['sub_image_path'] = json_encode($subImages);
        }

        $asset->update($data);

        return response()->json($asset);
    }

    public function destroy(Asset $asset)
    {
        $asset->delete();
        return response()->json(null, 204);
    }

    private function isJson($string)
    {
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }
}
