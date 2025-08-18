<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StoreCategory;
use Illuminate\Http\Request;

class StoreCategoryController extends Controller
{
    public function index()
    {
        return response()->json(StoreCategory::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|max:255',
        ]);

        $category = StoreCategory::create([
            'name' => $request->name,
        ]);

        return response()->json($category, 201);
    }

    public function show(StoreCategory $storeCategory)
    {
        return response()->json($storeCategory);
    }

    public function update(Request $request, StoreCategory $storeCategory)
    {
        $request->validate([
            'name' => 'required|max:255',
        ]);

        $storeCategory->update([
            'name' => $request->name,
        ]);

        return response()->json($storeCategory);
    }

    public function destroy(StoreCategory $storeCategory)
    {
        $storeCategory->delete();
        return response()->json(null, 204);
    }
}
