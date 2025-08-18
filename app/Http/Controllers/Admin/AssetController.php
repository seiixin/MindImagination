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
        $request->validate([
            'user_id'     => 'required|exists:users,id',
            'category_id' => 'nullable|exists:store_categories,id',
            'title'       => 'required|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'file_path'   => 'nullable|string',
        ]);

        $asset = Asset::create($request->all());

        return response()->json($asset, 201);
    }

    public function show(Asset $asset)
    {
        $asset->load('category');
        return response()->json($asset);
    }

    public function update(Request $request, Asset $asset)
    {
        $request->validate([
            'user_id'     => 'sometimes|exists:users,id',
            'category_id' => 'nullable|exists:store_categories,id',
            'title'       => 'required|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'file_path'   => 'nullable|string',
        ]);

        $asset->update($request->all());
        return response()->json($asset);
    }

    public function destroy(Asset $asset)
    {
        $asset->delete();
        return response()->json(null, 204);
    }
}
