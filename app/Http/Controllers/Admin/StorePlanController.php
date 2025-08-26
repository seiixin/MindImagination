<?php

// app/Http/Controllers/Admin/StorePlanController.php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StorePlan;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StorePlanController extends Controller
{
    public function index()
    {
        // return array for your axios usage
        return response()->json(StorePlan::orderByDesc('id')->get());
        // or: return inertia() if you render server-side
    }

    public function store(Request $req)
    {
        $data = $req->validate([
            'name'      => ['required', 'string', 'max:255', 'unique:store_plans,name'],
            'points'    => ['required', 'integer', 'min:0'],
            'price'     => ['required', 'numeric', 'min:0'],
            'image_url' => ['nullable', 'url', 'max:2048'],
        ]);
        $plan = StorePlan::create($data);
        return response()->json(['plan' => $plan], 201);
    }

    public function update($id, Request $req)
    {
        $plan = StorePlan::findOrFail($id);
        $data = $req->validate([
            'name'      => ['required', 'string', 'max:255', Rule::unique('store_plans','name')->ignore($plan->id)],
            'points'    => ['required', 'integer', 'min:0'],
            'price'     => ['required', 'numeric', 'min:0'],
            'image_url' => ['nullable', 'url', 'max:2048'],
            'active'    => ['sometimes', 'boolean'],
        ]);
        $plan->update($data);
        return response()->json(['plan' => $plan]);
    }

    public function destroy($id)
    {
        StorePlan::findOrFail($id)->delete();
        return response()->json(['ok' => true]);
    }
}
