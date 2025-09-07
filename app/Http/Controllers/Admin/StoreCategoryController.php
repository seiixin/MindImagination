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
        $data = $request->validate([
            'name'              => 'required|string|max:255',
            'additional_points' => 'nullable|integer|min:0',
            'purchase_cost'     => 'nullable|numeric|min:0',
        ]);

        // Coerce empty strings to null (in case frontend sends '')
        $payload = [
            'name'              => $data['name'],
            'additional_points' => $request->filled('additional_points')
                ? (int) $request->input('additional_points')
                : null,
            'purchase_cost'     => $request->filled('purchase_cost')
                ? (float) $request->input('purchase_cost')
                : null,
        ];

        $category = StoreCategory::create($payload);

        return response()->json($category, 201);
    }

    public function show(StoreCategory $storeCategory)
    {
        return response()->json($storeCategory);
    }

    public function update(Request $request, StoreCategory $storeCategory)
    {
        $data = $request->validate([
            'name'              => 'required|string|max:255',
            'additional_points' => 'nullable|integer|min:0',
            'purchase_cost'     => 'nullable|numeric|min:0',
        ]);

        $payload = [
            'name'              => $data['name'],
            'additional_points' => $request->filled('additional_points')
                ? (int) $request->input('additional_points')
                : null,
            'purchase_cost'     => $request->filled('purchase_cost')
                ? (float) $request->input('purchase_cost')
                : null,
        ];

        $storeCategory->update($payload);

        return response()->json($storeCategory);
    }

    public function destroy(StoreCategory $storeCategory)
    {
        $storeCategory->delete();
        return response()->json(null, 204);
    }
}
