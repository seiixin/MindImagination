<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetComment;
use App\Models\AssetRating;
use App\Models\AssetFavorite;
use App\Models\AssetView;
use Illuminate\Http\Request;

class AssetInteractionController extends Controller
{
    /*--------------------------------------------------------------
    | COMMENTS
    --------------------------------------------------------------*/
    public function commentsIndex(Asset $asset)
    {
        return response()->json($asset->comments()->with('user')->latest()->get());
    }

    public function commentsStore(Request $request, Asset $asset)
    {
        $data = $request->validate(['comment' => 'required|string']);
        $comment = AssetComment::create([
            'asset_id' => $asset->id,
            'user_id'  => $request->user()->id,
            'comment'  => $data['comment'],
        ]);
        return response()->json($comment, 201);
    }

    public function commentsUpdate(Request $request, Asset $asset, $id)
    {
        $comment = AssetComment::where('asset_id', $asset->id)->findOrFail($id);
        $this->authorize('update', $comment);
        $data = $request->validate(['comment' => 'required|string']);
        $comment->update($data);
        return response()->json($comment);
    }

    public function commentsDestroy(Asset $asset, $id)
    {
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
        return response()->json($asset->ratings()->with('user')->get());
    }

    public function ratingsStore(Request $request, Asset $asset)
    {
        $data = $request->validate(['rating' => 'required|integer|min=1|max:5']);
        $rating = AssetRating::updateOrCreate(
            ['asset_id' => $asset->id, 'user_id' => $request->user()->id],
            ['rating'   => $data['rating']]
        );
        return response()->json($rating, 201);
    }

    public function ratingsUpdate(Request $request, Asset $asset, $id)
    {
        $rating = AssetRating::where('asset_id',$asset->id)->findOrFail($id);
        $this->authorize('update', $rating);
        $data = $request->validate(['rating' => 'required|integer|min:1|max:5']);
        $rating->update($data);
        return response()->json($rating);
    }

    public function ratingsDestroy(Asset $asset, $id)
    {
        $rating = AssetRating::where('asset_id',$asset->id)->findOrFail($id);
        $this->authorize('delete', $rating);
        $rating->delete();
        return response()->json(null,204);
    }

    /*--------------------------------------------------------------
    | FAVORITES
    --------------------------------------------------------------*/
    public function favoritesIndex(Asset $asset)
    {
        return response()->json($asset->favorites()->with('user')->get());
    }

    public function favoritesStore(Request $request, Asset $asset)
    {
        $fav = AssetFavorite::firstOrCreate([
            'asset_id' => $asset->id,
            'user_id'  => $request->user()->id
        ]);
        return response()->json($fav, 201);
    }

    public function favoritesDestroy(Request $request, Asset $asset, $id)
    {
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
        return response()->json($asset->views()->with('user')->get());
    }

    public function viewsStore(Request $request, Asset $asset)
    {
        $view = AssetView::create([
            'asset_id' => $asset->id,
            'user_id'  => $request->user()->id ?? null,
            'viewed_at'=> now(),
        ]);
        return response()->json($view, 201);
    }
}
