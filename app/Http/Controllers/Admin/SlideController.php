<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Slide;
use Illuminate\Support\Facades\Storage;
class SlideController extends Controller
{
    // GET all slides
    public function index()
    {
        return Slide::all();
    }

    // GET single slide
    public function show(Slide $slide)
    {
        return response()->json($slide);
    }

    // POST create slide

public function store(Request $request)
{
    $validated = $request->validate([
        'image_path' => 'required|file|image|max:2048', // accepts image files
        'details' => 'nullable|string',
    ]);

    // Store the image
    $path = $request->file('image_path')->store('slides', 'public');

    // Save in DB
    $slide = Slide::create([
        'image_path' => "/storage/{$path}",
        'details' => $validated['details'] ?? null,
    ]);

    return response()->json($slide, 201);
}

public function update(Request $request, Slide $slide)
{
    $validated = $request->validate([
        'image_path' => 'sometimes|file|image|max:2048',
        'details' => 'nullable|string',
    ]);

    if ($request->hasFile('image_path')) {
        // Delete old image if needed
        if ($slide->image_path) {
            $oldPath = str_replace('/storage/', '', $slide->image_path);
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('image_path')->store('slides', 'public');
        $slide->image_path = "/storage/{$path}";
    }

    $slide->details = $validated['details'] ?? $slide->details;
    $slide->save();

    return response()->json($slide);
}
    // DELETE slide
    public function destroy(Slide $slide)
    {
        $slide->delete();
        return response()->json(['message' => 'Slide deleted successfully']);
    }

    // add this method
public function publicIndex()
{
    return \App\Models\Slide::query()
        // remove these when(...) lines if you don't have these columns
        ->when(\Schema::hasColumn('slides', 'is_featured'), fn($q) => $q->where('is_featured', true))
        ->when(\Schema::hasColumn('slides', 'is_active'), fn($q) => $q->where('is_active', true))
        ->when(\Schema::hasColumn('slides', 'sort_order'), fn($q) => $q->orderBy('sort_order'))
        ->get(['id','image_path','details']);
}

}
