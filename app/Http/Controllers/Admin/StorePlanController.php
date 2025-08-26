<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\StorePlan;

class StorePlanController extends Controller
{
    // GET /admin/store-plans
    public function index()
    {
        return response()->json(StorePlan::orderByDesc('id')->get());
    }

    // POST /admin/store-plans
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'points'    => 'required|numeric|min:0',
            'price'     => 'required|numeric|min:0',
            'image_url' => 'nullable|url|max:2048',
            'active'    => 'sometimes|boolean',
        ]);

        $plan = StorePlan::create($data + ['active' => $request->boolean('active', true)]);

        return response()->json(['message' => 'Created!', 'plan' => $plan], 201);
    }

    // PUT /admin/store-plans/{id}
    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'points'    => 'required|numeric|min:0',
            'price'     => 'required|numeric|min:0',
            'image_url' => 'nullable|url|max:2048',
            'active'    => 'sometimes|boolean',
        ]);

        $plan = StorePlan::findOrFail($id);
        $plan->update($data);

        return response()->json(['message' => 'Updated!', 'plan' => $plan]);
    }

    // DELETE /admin/store-plans/{id}
    public function destroy($id)
    {
        $plan = StorePlan::findOrFail($id);
        $plan->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
