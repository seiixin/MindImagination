<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    public function index()
    {
        return response()->json(Asset::with('category')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id'     => 'required|exists:users,id',
            'category_id' => 'nullable|exists:store_categories,id',
            'title'       => 'required|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'file_path'   => 'nullable|image|mimes:jpg,jpeg,png,webp',
        ]);

        // handle upload
        if ($request->hasFile('file_path')) {
            $path = $request->file('file_path')->store('assets', 'public'); // /storage/app/public/assets
            $data['file_path'] = '/storage/' . $path; // URL to access
        }

        $asset = Asset::create($data);

        return response()->json($asset, 201);
    }

    public function show(Asset $asset)
    {
        $asset->load('category');
        return response()->json($asset);
    }

    public function update(Request $request, Asset $asset)
    {
        $data = $request->validate([
            'user_id'     => 'sometimes|exists:users,id',
            'category_id' => 'nullable|exists:store_categories,id',
            'title'       => 'required|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'file_path'   => 'nullable|image|mimes:jpg,jpeg,png,webp',
        ]);

        // handle upload if file is present
        if ($request->hasFile('file_path')) {
            $path = $request->file('file_path')->store('assets', 'public');
            $data['file_path'] = '/storage/' . $path;
        }

        $asset->update($data);

        return response()->json($asset);
    }

    public function destroy(Asset $asset)
    {
        $asset->delete();
        return response()->json(null, 204);
    }
}
