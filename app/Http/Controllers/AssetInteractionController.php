<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetComment;
use App\Models\AssetFavorite;
use App\Models\AssetRating;
use App\Models\AssetView;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AssetInteractionController extends Controller
{
    /*--------------------------------------------------------------
    | COMMENTS
    --------------------------------------------------------------*/
    public function commentsIndex(Asset $asset)
    {
        return response()->json(
            $asset->comments()->with('user')->latest()->get()
        );
    }

    public function commentsStore(Request $request, Asset $asset)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $data = $request->validate([
            'comment' => 'required|string',
        ]);

        try {
            $comment = AssetComment::create([
                'asset_id' => $asset->id,
                'user_id'  => $request->user()->id,
                'comment'  => $data['comment'],
            ])->load('user');

            return response()->json($comment, 201);
        } catch (\Throwable $e) {
            Log::error('commentsStore failed', ['e' => $e]);
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function commentsUpdate(Request $request, Asset $asset, $id)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $comment = AssetComment::where('asset_id', $asset->id)->findOrFail($id);
        $this->authorize('update', $comment);

        $data = $request->validate(['comment' => 'required|string']);
        $comment->update($data);

        return response()->json($comment->load('user'));
    }

    public function commentsDestroy(Request $request, Asset $asset, $id)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $comment = AssetComment::where('asset_id', $asset->id)->findOrFail($id);
        $this->authorize('delete', $comment);
        $comment->delete();

        return response()->json(null, 204);
    }

    /*--------------------------------------------------------------
    | RATINGS
    --------------------------------------------------------------*/
    public function ratingsIndex(Asset $asset)
    {
        return response()->json(
            $asset->ratings()->with('user')->get()
        );
    }

    public function ratingsStore(Request $request, Asset $asset)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $data = $request->validate(['rating' => 'required|integer|min:1|max:5']);

        try {
            $rating = AssetRating::updateOrCreate(
                ['asset_id' => $asset->id, 'user_id' => $request->user()->id],
                ['rating'   => (int) $data['rating']]
            )->load('user');

            $avg = round((float) $asset->ratings()->avg('rating'), 1);

            return response()->json(['rating' => $rating, 'avg' => $avg], 201);
        } catch (\Throwable $e) {
            Log::error('ratingsStore failed', ['e' => $e]);
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function ratingsUpdate(Request $request, Asset $asset, $id)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $rating = AssetRating::where('asset_id', $asset->id)->findOrFail($id);
        $this->authorize('update', $rating);

        $data = $request->validate(['rating' => 'required|integer|min:1|max:5']);
        $rating->update(['rating' => (int) $data['rating']]);

        $avg = round((float) $asset->ratings()->avg('rating'), 1);

        return response()->json(['rating' => $rating->load('user'), 'avg' => $avg]);
    }

    public function ratingsDestroy(Request $request, Asset $asset, $id)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $rating = AssetRating::where('asset_id', $asset->id)->findOrFail($id);
        $this->authorize('delete', $rating);
        $rating->delete();

        $avg = round((float) $asset->ratings()->avg('rating'), 1);

        return response()->json(['avg' => $avg], 200);
    }

    /*--------------------------------------------------------------
    | FAVORITES
    --------------------------------------------------------------*/
    public function favoritesIndex(Asset $asset)
    {
        return response()->json(
            $asset->favorites()->with('user')->get()
        );
    }

    public function favoritesStore(Request $request, Asset $asset)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $fav = AssetFavorite::firstOrCreate([
            'asset_id' => $asset->id,
            'user_id'  => $request->user()->id,
        ]);

        return response()->json($fav->load('user'), 201);
    }

    public function favoritesDestroy(Request $request, Asset $asset, $id)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $fav = AssetFavorite::where('asset_id', $asset->id)
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $this->authorize('delete', $fav);
        $fav->delete();

        return response()->json(null, 204);
    }

    /*--------------------------------------------------------------
    | VIEWS
    --------------------------------------------------------------*/
    public function viewsIndex(Asset $asset)
    {
        return response()->json(
            $asset->views()->with('user')->get()
        );
    }

    public function viewsStore(Request $request, Asset $asset)
    {
        // Use the model-level helper so insertion logic lives in AssetView
        // (handles guest/auth, session/ip, viewed_at, and de-dupe)
        try {
            $res = AssetView::recordUnique($asset, $request, 30); // 30-minute window
            return response()->json(['ok' => true, 'deduped' => $res['deduped']]);
        } catch (\Throwable $e) {
            Log::error('viewsStore failed', ['e' => $e]);
            return response()->json(['ok' => false, 'message' => 'Server error'], 500);
        }
    }
}
