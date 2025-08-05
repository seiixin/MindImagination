<?php
// app/Http/Controllers/Admin/PolicyController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Policy;
use Illuminate\Http\Request;

class PolicyController extends Controller
{
    public function index()
    {
        $policies = Policy::all()->keyBy('type')->map(function ($p) {
            return [
                'description' => $p->description,
                'items' => $p->items ?? [],
            ];
        });

        return response()->json($policies);
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'type' => 'required|string|unique:policies,type',
            'description' => 'required|string',
            'items' => 'nullable|array',
            'items.*' => 'string',
        ]);
        $policy = Policy::create($v);
        return response()->json([
            'type' => $policy->type,
            'description' => $policy->description,
            'items' => $policy->items,
        ], 201);
    }

public function update(Request $request, $type)
{
    $v = $request->validate([
        'description' => 'nullable|string',
        'items' => 'nullable|array',
        'items.*' => 'string',
    ]);

    // Use firstOrCreate to either find existing or create new
    $policy = Policy::firstOrCreate(
        ['type' => $type], // search criteria
        ['description' => '', 'items' => []] // default values if creating
    );

    $policy->update($v);

    return response()->json([
        'type' => $policy->type,
        'description' => $policy->description,
        'items' => $policy->items,
    ]);
}

    public function destroy($type)
    {
        Policy::where('type', $type)->firstOrFail()->delete();
        return response()->json(['message' => 'deleted']);
    }
}
