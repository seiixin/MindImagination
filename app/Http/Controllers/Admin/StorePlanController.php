<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StorePlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class StorePlanController extends Controller
{
    /**
     * Build a consistent response shape with a guaranteed image_url.
     */
    protected function transform(StorePlan $plan): array
    {
        // Prefer file on the public disk; fallback to external URL column.
        $computedUrl = null;
        if (!empty($plan->image_path)) {
            try {
                $computedUrl = Storage::disk('public')->url($plan->image_path);
            } catch (\Throwable $e) {
                // swallow and fallback below
            }
        }
        $computedUrl = $computedUrl ?: ($plan->getRawOriginal('image_url') ?: null);

        return [
            'id'         => $plan->id,
            'name'       => $plan->name,
            'points'     => (int) $plan->points,
            'price'      => (float) $plan->price,
            'active'     => (bool) $plan->active,
            'image_path' => $plan->image_path,          // keep for admin debug if you want
            'image_url'  => $computedUrl,               // ✅ always present for UI rendering
            'created_at' => $plan->created_at,
            'updated_at' => $plan->updated_at,
        ];
    }

    /**
     * GET /admin/store-plans
     */
    public function index()
    {
        $plans = StorePlan::orderByDesc('id')->get()->map(fn ($p) => $this->transform($p));
        return response()->json($plans);
    }

    /**
     * POST /admin/store-plans
     * Accepts either external image_url or uploaded image_file.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'       => ['required', 'string', 'max:255', 'unique:store_plans,name'],
            'points'     => ['required', 'numeric', 'min:0'],
            'price'      => ['required', 'numeric', 'min:0'],
            'image_url'  => ['nullable', 'url', 'max:2048'],
            'image_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'active'     => ['sometimes', 'boolean'],
        ]);

        // If a file is uploaded, store it and record image_path
        if ($request->hasFile('image_file')) {
            $data['image_path'] = $request->file('image_file')->store('plans', 'public'); // e.g. plans/abc123.png
        }

        $data['active'] = $request->boolean('active', true);

        $plan = StorePlan::create($data)->fresh();

        return response()->json([
            'message' => 'Created!',
            'plan'    => $this->transform($plan),   // ✅ always includes computed image_url
        ], 201);
    }

    /**
     * PUT /admin/store-plans/{id}
     * If a new file is uploaded, delete the old file (if any) and store the new one.
     */
    public function update(Request $request, $id)
    {
        $plan = StorePlan::findOrFail($id);

        $data = $request->validate([
            'name'       => ['required', 'string', 'max:255', Rule::unique('store_plans', 'name')->ignore($plan->id)],
            'points'     => ['required', 'numeric', 'min:0'],
            'price'      => ['required', 'numeric', 'min:0'],
            'image_url'  => ['nullable', 'url', 'max:2048'],
            'image_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:10240'],
            'active'     => ['sometimes', 'boolean'],
        ]);

        // If a new file arrives, replace old one
        if ($request->hasFile('image_file')) {
            if (!empty($plan->image_path) && Storage::disk('public')->exists($plan->image_path)) {
                Storage::disk('public')->delete($plan->image_path);
            }
            $data['image_path'] = $request->file('image_file')->store('plans', 'public');
        }

        if ($request->has('active')) {
            $data['active'] = $request->boolean('active');
        }

        $plan->update($data);

        return response()->json([
            'message' => 'Updated!',
            'plan'    => $this->transform($plan->fresh()),   // ✅ consistent payload
        ]);
    }

    /**
     * DELETE /admin/store-plans/{id}
     * Delete the stored file in public disk before removing the record.
     */
    public function destroy($id)
    {
        $plan = StorePlan::findOrFail($id);

        if (!empty($plan->image_path) && Storage::disk('public')->exists($plan->image_path)) {
            Storage::disk('public')->delete($plan->image_path);
        }

        $plan->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
