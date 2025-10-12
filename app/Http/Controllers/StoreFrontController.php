<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Purchase;
use App\Models\Slide;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;

class StorefrontController extends Controller
{
    public function index(Request $request)
    {
        // -------- Slides (defensive sa missing columns)
        $slides = Slide::query()
            ->when(Schema::hasColumn('slides', 'is_featured'), fn ($q) => $q->where('is_featured', true))
            ->when(Schema::hasColumn('slides', 'is_active'), fn ($q) => $q->where('is_active', true))
            ->when(Schema::hasColumn('slides', 'sort_order'), fn ($q) => $q->orderBy('sort_order'))
            ->get(['id', 'image_path', 'details']);

        // -------- Base selectable asset fields
        $assetFields = array_values(array_filter([
            'id',
            'title',
            Schema::hasColumn('assets', 'description') ? 'description' : null,
            Schema::hasColumn('assets', 'cover_image_path') ? 'cover_image_path' : null,
            'file_path',
            'points',
            'price',
            Schema::hasColumn('assets', 'slug') ? 'slug' : null,
            Schema::hasColumn('assets', 'category_id') ? 'category_id' : null,
        ]));

        // -------- Query (with live counts & avg rating)
        $assetsQuery = Asset::query()
            ->when(Schema::hasColumn('assets', 'is_published'), fn ($q) => $q->where('is_published', 1))
            ->withCount(['comments', 'favorites', 'views'])
            ->when(
                method_exists(app('db')->connection()->getQueryGrammar(), 'compileAverage'),
                fn ($q) => $q->withAvg('ratings', 'rating') // adds alias ratings_avg_rating
            )
            // Eager-load category with NAME (IMPORTANT)
            ->when(Schema::hasColumn('assets', 'category_id'), fn ($q) => $q->with([
                // expect relation Asset::belongsTo(StoreCategory::class, 'category_id')->as('category')
                'category:id,name,additional_points,purchase_cost',
            ]))
            ->latest('id')
            ->limit(24);

        $assetsCollection = $assetsQuery->get($assetFields);

        // -------- Owned asset IDs (for current user)
        $ownedIds = [];
        if (auth()->check()) {
            $statusCompleted = defined(Purchase::class . '::STATUS_COMPLETED')
                ? Purchase::STATUS_COMPLETED
                : 'completed';

            $ownedQuery = Purchase::where('user_id', auth()->id())
                ->where('status', $statusCompleted);

            if (Schema::hasColumn('purchases', 'revoked_at')) {
                $ownedQuery->whereNull('revoked_at');
            }

            $ownedIds = $ownedQuery->pluck('asset_id')->all();
        }

        // -------- Map to frontend payload (now includes category_name)
        $assets = $assetsCollection->map(function ($a) use ($ownedIds) {
            $slug = (Schema::hasColumn('assets', 'slug') && !empty($a->slug))
                ? $a->slug
                : Str::slug($a->title ?? (string) $a->id);

            $imageUrl = (Schema::hasColumn('assets', 'cover_image_path') && !empty($a->cover_image_path))
                ? $a->cover_image_path
                : $a->file_path;

            $avg = isset($a->ratings_avg_rating) ? (float) $a->ratings_avg_rating : 0.0;

            // Pull from relation safely
            $categoryName = optional($a->category)->name; // <<--- HERE
            $categoryPoints = optional($a->category)->additional_points;
            $categoryPrice  = optional($a->category)->purchase_cost;

            return [
                'id'              => $a->id,
                'title'           => $a->title,
                'slug'            => $slug,
                'image_url'       => $imageUrl,
                'description'     => $a->description ?? null,
                'points'          => $a->points ?? $categoryPoints,
                'price'           => $a->price  ?? $categoryPrice,
                'category_name'   => $categoryName ?? 'Uncategorized', // <<--- send to FE
                'comments_count'  => (int) ($a->comments_count ?? 0),
                'favorites_count' => (int) ($a->favorites_count ?? 0),
                'views_count'     => (int) ($a->views_count ?? 0),
                'avg_rating'      => round($avg, 2),
                'owned'           => in_array($a->id, $ownedIds, true),
            ];
        });

        return Inertia::render('GuestPages/Store', [
            'slides' => $slides,
            'assets' => $assets,
        ]);
    }
}
