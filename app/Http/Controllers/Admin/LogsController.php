<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\Download;
use App\Models\ActiveGame;
use Illuminate\Http\Request;

class LogsController extends Controller
{
    /**
     * GET /admin/logs/purchases
     * Paginated purchase logs
     */
    public function purchases(Request $request)
    {
        $perPage  = (int) $request->input('per_page', 50);
        $perPage  = $perPage > 0 ? min($perPage, 200) : 50;

        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');
        $search   = trim((string) $request->input('search', ''));
        $searchBy = strtolower((string) $request->input('search_by', 'any'));

        if (!in_array($searchBy, ['email', 'name', 'asset', 'any'], true)) {
            $searchBy = 'any';
        }

        $query = Purchase::with(['user:id,name,email', 'asset:id,title,category_id', 'asset.category:id,name'])
            ->orderBy('created_at', 'desc');

        if ($dateFrom) $query->whereDate('created_at', '>=', $dateFrom);
        if ($dateTo)   $query->whereDate('created_at',   '<=', $dateTo);

        if ($search !== '') {
            $query->where(function ($qq) use ($search, $searchBy) {
                if ($searchBy === 'email') {
                    $qq->whereHas('user', fn($u) => $u->where('email', 'like', "%{$search}%"));
                } elseif ($searchBy === 'name') {
                    $qq->whereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%"));
                } elseif ($searchBy === 'asset') {
                    $qq->whereHas('asset', fn($a) => $a->where('title', 'like', "%{$search}%"));
                } else {
                    $qq->whereHas('user', fn($u) => $u
                        ->where('email', 'like', "%{$search}%")
                        ->orWhere('name',  'like', "%{$search}%"))
                       ->orWhereHas('asset', fn($a) => $a->where('title', 'like', "%{$search}%"));
                }
            });
        }

        $purchases = $query->paginate($perPage);

        return response()->json([
            'data' => $purchases->items(),
            'pagination' => [
                'current_page' => $purchases->currentPage(),
                'last_page'    => $purchases->lastPage(),
                'per_page'     => $purchases->perPage(),
                'total'        => $purchases->total(),
            ],
        ]);
    }

    /**
     * GET /admin/logs/downloads
     * Paginated download logs
     * Exposes:
     *   - downloads (computed on model: downloads|download_count|points_used)
     *   - points_used (raw legacy column for admin visibility & export)
     */
    public function downloads(Request $request)
    {
        $perPage  = (int) $request->input('per_page', 50);
        $perPage  = $perPage > 0 ? min($perPage, 200) : 50;

        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');
        $search   = trim((string) $request->input('search', ''));
        $searchBy = strtolower((string) $request->input('search_by', 'any'));

        if (!in_array($searchBy, ['email', 'name', 'asset', 'any'], true)) {
            $searchBy = 'any';
        }

        $query = Download::with(['user:id,name,email', 'asset:id,title,category_id', 'asset.category:id,name'])
            ->orderBy('created_at', 'desc');

        if ($dateFrom) $query->whereDate('created_at', '>=', $dateFrom);
        if ($dateTo)   $query->whereDate('created_at',   '<=', $dateTo);

        if ($search !== '') {
            $query->where(function ($qq) use ($search, $searchBy) {
                if ($searchBy === 'email') {
                    $qq->whereHas('user', fn($u) => $u->where('email', 'like', "%{$search}%"));
                } elseif ($searchBy === 'name') {
                    $qq->whereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%"));
                } elseif ($searchBy === 'asset') {
                    $qq->whereHas('asset', fn($a) => $a->where('title', 'like', "%{$search}%"));
                } else {
                    $qq->whereHas('user', fn($u) => $u
                        ->where('email', 'like', "%{$search}%")
                        ->orWhere('name',  'like', "%{$search}%"))
                       ->orWhereHas('asset', fn($a) => $a->where('title', 'like', "%{$search}%"));
                }
            });
        }

        $downloads = $query->paginate($perPage);

        // Ensure each row includes explicit integers for admin UI
        $items = collect($downloads->items())->map(function ($row) {
            // Accessors: $row->downloads (appended), raw columns still present
            $row->downloads   = (int) ($row->downloads ?? 0);
            $row->points_used = (int) ($row->getRawOriginal('points_used') ?? 0);
            $row->download_count = is_null($row->getRawOriginal('download_count'))
                ? null
                : (int) $row->getRawOriginal('download_count');
            return $row;
        })->values();

        return response()->json([
            'data' => $items,
            'pagination' => [
                'current_page' => $downloads->currentPage(),
                'last_page'    => $downloads->lastPage(),
                'per_page'     => $downloads->perPage(),
                'total'        => $downloads->total(),
            ],
        ]);
    }

    /**
     * GET /admin/logs/active
     * Currently active games
     */
    public function activeGames(Request $request)
    {
        $perPage  = (int) $request->input('per_page', 50);
        $perPage  = $perPage > 0 ? min($perPage, 200) : 50;
        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');
        $search   = (string) $request->input('search', '');

        $query = ActiveGame::with(['user:id,name,email', 'asset:id,title,category_id', 'asset.category:id,name'])
            ->active()
            ->orderBy('started_at', 'desc');

        if ($dateFrom) $query->whereDate('started_at', '>=', $dateFrom);
        if ($dateTo)   $query->whereDate('started_at',   '<=', $dateTo);

        if ($search !== '') {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhere('name',  'like', "%{$search}%");
            });
        }

        $activeGames = $query->paginate($perPage);

        return response()->json([
            'data' => $activeGames->items(),
            'pagination' => [
                'current_page' => $activeGames->currentPage(),
                'last_page'    => $activeGames->lastPage(),
                'per_page'     => $activeGames->perPage(),
                'total'        => $activeGames->total(),
            ],
        ]);
    }

    /**
     * GET /admin/logs/stats
     * Aggregate counts & sums
     * - downloads use computed 'downloads'
     * - includes points_used totals for visibility
     */
    public function stats()
    {
        // Sum computed downloads by iterating once (keeps correctness with accessor precedence)
        $totalDownloads = Download::get()->sum(fn($d) => (int) $d->downloads);
        $todayDownloads = Download::whereDate('created_at', today())->get()->sum(fn($d) => (int) $d->downloads);

        // Legacy points visibility
        $pointsUsedTotal = (int) Download::sum('points_used');
        $pointsUsedToday = (int) Download::whereDate('created_at', today())->sum('points_used');

        $stats = [
            'total_purchases'     => Purchase::count(),
            'total_downloads'     => $totalDownloads,
            'active_games_count'  => ActiveGame::active()->count(),

            'today_purchases'     => Purchase::whereDate('created_at', today())->count(),
            'today_downloads'     => $todayDownloads,

            'revenue_today'       => (float) Purchase::whereDate('created_at', today())->sum('cost_amount'),
            'revenue_total'       => (float) Purchase::sum('cost_amount'),

            // New: points visibility
            'points_used_total'   => $pointsUsedTotal,
            'points_used_today'   => $pointsUsedToday,
        ];

        return response()->json($stats);
    }

    /**
     * GET /admin/logs/export?type=purchases|downloads|active
     * CSV exports
     * - Downloads CSV now includes both "Downloads" and "Points Used"
     */
    public function export(Request $request)
    {
        $type = $request->input('type', 'purchases');

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$type}_export_" . date('Y_m_d') . ".csv\"",
        ];

        $callback = function () use ($type) {
            $file = fopen('php://output', 'w');

            switch ($type) {
                case 'purchases':
                    fputcsv($file, ['Date', 'Email', 'Name', 'Asset', 'Category', 'Points Spent', 'Cost']);
                    Purchase::with(['user', 'asset.category'])
                        ->orderBy('created_at', 'desc')
                        ->chunk(200, function ($chunk) use ($file) {
                            foreach ($chunk as $p) {
                                fputcsv($file, [
                                    optional($p->created_at)->format('m/d/y'),
                                    $p->user->email,
                                    $p->user->name,
                                    $p->asset->title,
                                    optional($p->asset->category)->name,
                                    (int) ($p->points_spent ?? 0),
                                    number_format((float) $p->cost_amount, 2, '.', ''),
                                ]);
                            }
                        });
                    break;

                case 'downloads':
                    // Include both computed Downloads and raw Points Used
                    fputcsv($file, ['Date', 'Email', 'Name', 'Asset', 'Category', 'Downloads', 'Points Used']);
                    Download::with(['user', 'asset.category'])
                        ->orderBy('created_at', 'desc')
                        ->chunk(200, function ($chunk) use ($file) {
                            foreach ($chunk as $d) {
                                fputcsv($file, [
                                    optional($d->created_at)->format('m/d/y'),
                                    $d->user->email,
                                    $d->user->name,
                                    $d->asset->title,
                                    optional($d->asset->category)->name,
                                    (int) $d->downloads,                          // accessor
                                    (int) ($d->getRawOriginal('points_used') ?? 0), // raw column
                                ]);
                            }
                        });
                    break;

                case 'active':
                    fputcsv($file, ['Date Started', 'Email', 'Name', 'Asset', 'Category']);
                    ActiveGame::active()
                        ->with(['user', 'asset.category'])
                        ->orderBy('started_at', 'desc')
                        ->chunk(200, function ($chunk) use ($file) {
                            foreach ($chunk as $g) {
                                fputcsv($file, [
                                    optional($g->started_at)->format('m/d/y'),
                                    $g->user->email,
                                    $g->user->name,
                                    $g->asset->title,
                                    optional($g->asset->category)->name,
                                ]);
                            }
                        });
                    break;
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
