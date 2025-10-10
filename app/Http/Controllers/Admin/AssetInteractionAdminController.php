<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\AssetComment;
use App\Models\AssetFavorite;
use App\Models\AssetRating;
use App\Models\AssetView;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class AssetInteractionAdminController extends Controller
{
    /**
     * COMMENTS
     * =========
     * Full CRUD with admin-specified user + asset.
     */

    public function commentsIndex(Request $request)
    {
        $perPage  = (int) ($request->integer('per_page') ?: 20);
        $assetId  = $request->integer('asset_id');
        $userId   = $request->integer('user_id');
        $search   = trim((string) $request->get('q', ''));

        $q = AssetComment::query()->with(['user:id,name,email', 'asset:id,title']);

        if ($assetId) $q->where('asset_id', $assetId);
        if ($userId)  $q->where('user_id',  $userId);
        if ($search !== '') {
            $q->where('comment', 'like', '%' . str_replace('%', '\%', $search) . '%');
        }

        $q->latest('id');

        if ($request->boolean('paginate', true)) {
            return response()->json($q->paginate($perPage));
        }

        return response()->json($q->limit($perPage)->get());
    }

    public function commentsStore(Request $request)
    {
        $data = $request->validate([
            'asset_id' => ['required', Rule::exists('assets', 'id')],
            'user_id'  => ['required', Rule::exists('users', 'id')],
            'comment'  => ['required', 'string'],
        ]);

        $comment = AssetComment::create($data)->load(['user:id,name,email', 'asset:id,title']);

        return response()->json($comment, 201);
    }

    public function commentsUpdate(Request $request, int $id)
    {
        $comment = AssetComment::findOrFail($id);

        $data = $request->validate([
            'asset_id' => ['sometimes', Rule::exists('assets', 'id')],
            'user_id'  => ['sometimes', Rule::exists('users', 'id')],
            'comment'  => ['required', 'string'],
        ]);

        $comment->update($data);

        return response()->json($comment->load(['user:id,name,email', 'asset:id,title']));
    }

    public function commentsDestroy(int $id)
    {
        $comment = AssetComment::findOrFail($id);
        $comment->delete();

        return response()->json(null, 204);
    }

    /**
     * FAVORITES
     * =========
     * Index / single create / delete / bulk-generate.
     */

    public function favoritesIndex(Request $request)
    {
        $perPage = (int) ($request->integer('per_page') ?: 20);
        $assetId = $request->integer('asset_id');
        $userId  = $request->integer('user_id');

        $q = AssetFavorite::query()->with(['user:id,name,email', 'asset:id,title']);

        if ($assetId) $q->where('asset_id', $assetId);
        if ($userId)  $q->where('user_id',  $userId);

        $q->latest('id');

        if ($request->boolean('paginate', true)) {
            return response()->json($q->paginate($perPage));
        }

        return response()->json($q->limit($perPage)->get());
    }

    public function favoritesStore(Request $request)
    {
        $data = $request->validate([
            'asset_id' => ['required', Rule::exists('assets', 'id')],
            'user_id'  => ['required', Rule::exists('users', 'id')],
        ]);

        $fav = AssetFavorite::firstOrCreate($data);

        return response()->json($fav->load(['user:id,name,email', 'asset:id,title']), 201);
    }

    public function favoritesDestroy(int $id)
    {
        $fav = AssetFavorite::findOrFail($id);
        $fav->delete();

        return response()->json(null, 204);
    }

    public function favoritesGenerate(Request $request)
    {
        $validated = $request->validate([
            'asset_id' => ['required', Rule::exists('assets', 'id')],
            'count'    => ['required', 'integer', 'min:1', 'max:10000'],
            // Optional: restrict pool to these users
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer', Rule::exists('users', 'id')],
            // Optional: exclude these users
            'exclude_user_ids' => ['nullable', 'array'],
            'exclude_user_ids.*' => ['integer', Rule::exists('users', 'id')],
        ]);

        $assetId = (int) $validated['asset_id'];
        $count   = (int) $validated['count'];

        // Build candidate user pool
        $poolIds = $this->candidateUserIds(
            Arr::get($validated, 'user_ids', []),
            Arr::get($validated, 'exclude_user_ids', [])
        );

        // Remove users that already favorited this asset
        $existingUserIds = AssetFavorite::where('asset_id', $assetId)->pluck('user_id')->all();
        $eligible = array_values(array_diff($poolIds, $existingUserIds));

        $toCreate = min($count, count($eligible));
        $now = now();

        $rows = [];
        if ($toCreate > 0) {
            $selected = $this->pickRandomSubset($eligible, $toCreate);
            foreach ($selected as $uid) {
                $rows[] = [
                    'asset_id'   => $assetId,
                    'user_id'    => $uid,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            DB::table((new AssetFavorite)->getTable())->insert($rows);
        }

        return response()->json([
            'requested' => $count,
            'created'   => $toCreate,
            'skipped'   => $count - $toCreate, // likely due to uniqueness / pool size
            'total'     => AssetFavorite::where('asset_id', $assetId)->count(),
        ], 201);
    }

    /**
     * RATINGS
     * =======
     * Index / single create+update / delete / bulk-generate.
     */

    public function ratingsIndex(Request $request)
    {
        $perPage = (int) ($request->integer('per_page') ?: 20);
        $assetId = $request->integer('asset_id');
        $userId  = $request->integer('user_id');

        $q = AssetRating::query()->with(['user:id,name,email', 'asset:id,title']);

        if ($assetId) $q->where('asset_id', $assetId);
        if ($userId)  $q->where('user_id',  $userId);

        $q->latest('id');

        if ($request->boolean('paginate', true)) {
            return response()->json($q->paginate($perPage));
        }

        return response()->json($q->limit($perPage)->get());
    }

    public function ratingsStore(Request $request)
    {
        $data = $request->validate([
            'asset_id' => ['required', Rule::exists('assets', 'id')],
            'user_id'  => ['required', Rule::exists('users', 'id')],
            'rating'   => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        $row = AssetRating::updateOrCreate(
            ['asset_id' => $data['asset_id'], 'user_id' => $data['user_id']],
            ['rating'   => $data['rating']]
        );

        return response()->json([
            'rating' => $row->load(['user:id,name,email', 'asset:id,title']),
            'avg'    => round((float) AssetRating::where('asset_id', $data['asset_id'])->avg('rating'), 1),
        ], 201);
    }

    public function ratingsUpdate(Request $request, int $id)
    {
        $data = $request->validate([
            'asset_id' => ['sometimes', Rule::exists('assets', 'id')],
            'user_id'  => ['sometimes', Rule::exists('users', 'id')],
            'rating'   => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        $row = AssetRating::findOrFail($id);
        $row->update($data);

        $assetId = (int) ($data['asset_id'] ?? $row->asset_id);

        return response()->json([
            'rating' => $row->load(['user:id,name,email', 'asset:id,title']),
            'avg'    => round((float) AssetRating::where('asset_id', $assetId)->avg('rating'), 1),
        ]);
    }

    public function ratingsDestroy(int $id)
    {
        $row = AssetRating::findOrFail($id);
        $assetId = (int) $row->asset_id;
        $row->delete();

        return response()->json([
            'avg' => round((float) AssetRating::where('asset_id', $assetId)->avg('rating'), 1),
        ], 200);
    }

    public function ratingsGenerate(Request $request)
    {
        $validated = $request->validate([
            'asset_id' => ['required', Rule::exists('assets', 'id')],
            'count'    => ['required', 'integer', 'min:1', 'max:10000'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer', Rule::exists('users', 'id')],
            'exclude_user_ids' => ['nullable', 'array'],
            'exclude_user_ids.*' => ['integer', Rule::exists('users', 'id')],
            // Optional: weights for 1..5 (array of 5 non-negative ints/floats)
            'weights'  => ['nullable', 'array', 'size:5'],
        ]);

        $assetId = (int) $validated['asset_id'];
        $count   = (int) $validated['count'];
        $weights = $this->normalizeWeights($validated['weights'] ?? null);

        $poolIds = $this->candidateUserIds(
            Arr::get($validated, 'user_ids', []),
            Arr::get($validated, 'exclude_user_ids', [])
        );

        // Remove users that already rated this asset
        $existingUserIds = AssetRating::where('asset_id', $assetId)->pluck('user_id')->all();
        $eligible = array_values(array_diff($poolIds, $existingUserIds));

        $toCreate = min($count, count($eligible));
        $now = now();

        $rows = [];
        if ($toCreate > 0) {
            $selected = $this->pickRandomSubset($eligible, $toCreate);
            foreach ($selected as $uid) {
                $rows[] = [
                    'asset_id'   => $assetId,
                    'user_id'    => $uid,
                    'rating'     => $this->weightedRating($weights),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            DB::table((new AssetRating)->getTable())->insert($rows);
        }

        return response()->json([
            'requested' => $count,
            'created'   => $toCreate,
            'skipped'   => $count - $toCreate,
            'avg'       => round((float) AssetRating::where('asset_id', $assetId)->avg('rating'), 1),
            'total'     => AssetRating::where('asset_id', $assetId)->count(),
        ], 201);
    }

    /**
     * VIEWS
     * =====
     * Index / optional single create / delete / bulk-generate.
     * (Admin generation creates plain rows; it does NOT use public de-dupe logic.)
     */

    public function viewsIndex(Request $request)
    {
        $perPage = (int) ($request->integer('per_page') ?: 20);
        $assetId = $request->integer('asset_id');
        $userId  = $request->integer('user_id');

        $q = AssetView::query()->with(['user:id,name,email', 'asset:id,title']);

        if ($assetId) $q->where('asset_id', $assetId);
        if ($userId !== null) {
            // allow 0/"null" to mean guest rows (user_id null)
            if ($userId === 0) {
                $q->whereNull('user_id');
            } else {
                $q->where('user_id', $userId);
            }
        }

        $q->latest('id');

        if ($request->boolean('paginate', true)) {
            return response()->json($q->paginate($perPage));
        }

        return response()->json($q->limit($perPage)->get());
    }

    public function viewsStore(Request $request)
    {
        $data = $request->validate([
            'asset_id' => ['required', Rule::exists('assets', 'id')],
            'user_id'  => ['nullable', Rule::exists('users', 'id')],
        ]);

        $now = now();
        $view = AssetView::create([
            'asset_id'   => $data['asset_id'],
            'user_id'    => $data['user_id'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return response()->json($view->load(['user:id,name,email', 'asset:id,title']), 201);
    }

    public function viewsDestroy(int $id)
    {
        $row = AssetView::findOrFail($id);
        $row->delete();

        return response()->json(null, 204);
    }

    public function viewsGenerate(Request $request)
    {
        $validated = $request->validate([
            'asset_id'         => ['required', Rule::exists('assets', 'id')],
            'count'            => ['required', 'integer', 'min:1', 'max:100000'],
            // Optional: control guests vs users
            'guest_ratio'      => ['nullable', 'numeric', 'min:0', 'max:1'], // e.g., 0.3 => 30% guest views
            // Optional: restrict pool to these users
            'user_ids'         => ['nullable', 'array'],
            'user_ids.*'       => ['integer', Rule::exists('users', 'id')],
            'exclude_user_ids' => ['nullable', 'array'],
            'exclude_user_ids.*' => ['integer', Rule::exists('users', 'id')],
        ]);

        $assetId    = (int) $validated['asset_id'];
        $count      = (int) $validated['count'];
        $guestRatio = isset($validated['guest_ratio']) ? (float) $validated['guest_ratio'] : 0.15;

        $poolIds = $this->candidateUserIds(
            Arr::get($validated, 'user_ids', []),
            Arr::get($validated, 'exclude_user_ids', [])
        );

        $rows = [];
        $now  = Carbon::now();

        for ($i = 0; $i < $count; $i++) {
            $useGuest = (mt_rand() / mt_getrandmax()) < $guestRatio;
            $uid = $useGuest || empty($poolIds)
                ? null
                : $poolIds[array_rand($poolIds)];

            // Slightly randomize created_at within the last 30 days
            $created = $now->copy()->subDays(random_int(0, 30))->subMinutes(random_int(0, 60 * 24));

            $rows[] = [
                'asset_id'   => $assetId,
                'user_id'    => $uid,
                'created_at' => $created,
                'updated_at' => $created,
            ];
        }

        DB::table((new AssetView)->getTable())->insert($rows);

        return response()->json([
            'requested' => $count,
            'created'   => $count,
            'total'     => AssetView::where('asset_id', $assetId)->count(),
        ], 201);
    }

    /**
     * Helpers
     * =======
     */

    /**
     * Return a pool of user ids for generation:
     * - If $restrictIds provided: start from that set (and keep order randomized)
     * - Else: use all users (optionally excluding admins if the column exists)
     * - Remove any ids in $excludeIds
     */
    private function candidateUserIds(array $restrictIds = [], array $excludeIds = []): array
    {
        if (!empty($restrictIds)) {
            $ids = array_values(array_unique(array_map('intval', $restrictIds)));
        } else {
            $q = User::query()->select('id');

            // Prefer to exclude admins if such a column exists
            try {
                if (Schema::hasColumn('users', 'is_admin')) {
                    $q->where(function ($qq) {
                        $qq->whereNull('is_admin')->orWhere('is_admin', false);
                    });
                }
            } catch (\Throwable $e) {
                // ignore schema check failure
            }

            $ids = $q->pluck('id')->all();
        }

        if (!empty($excludeIds)) {
            $ids = array_values(array_diff($ids, array_map('intval', $excludeIds)));
        }

        // Shuffle to avoid bias
        shuffle($ids);

        return $ids;
    }

    /**
     * Pick up to $n distinct random values from $arr.
     */
    private function pickRandomSubset(array $arr, int $n): array
    {
        $n = min($n, count($arr));
        if ($n <= 0) return [];
        shuffle($arr);
        return array_slice($arr, 0, $n);
    }

    /**
     * Normalize weights array for ratings 1..5.
     * Default: [3, 5, 12, 35, 45] => skewed to 4–5 stars.
     * Returns cumulative distribution for efficient sampling.
     */
    private function normalizeWeights(?array $weights): array
    {
        $w = $weights ?? [3, 5, 12, 35, 45];
        if (count($w) !== 5) $w = [3, 5, 12, 35, 45];

        $sum = array_sum($w);
        if ($sum <= 0) $w = [1, 1, 1, 1, 1];

        // build cumulative
        $cum = [];
        $running = 0.0;
        foreach ($w as $v) {
            $running += ($v / array_sum($w));
            $cum[] = $running;
        }
        // ensure last is exactly 1.0
        $cum[4] = 1.0;

        return $cum;
    }

    /**
     * Sample a single star rating (1..5) from cumulative weights.
     */
    private function weightedRating(array $cum): int
    {
        $r = mt_rand() / mt_getrandmax();
        foreach ($cum as $i => $edge) {
            if ($r <= $edge) return $i + 1;
        }
        return 5;
    }
}
