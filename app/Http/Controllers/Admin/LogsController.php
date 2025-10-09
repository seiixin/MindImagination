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
     * Get purchase logs
     */
public function purchases(Request $request)
{
    $perPage  = (int) ($request->input('per_page', 50)) ?: 50;
    $dateFrom = $request->input('date_from');
    $dateTo   = $request->input('date_to');
    $search   = trim((string) $request->input('search', ''));
    $searchBy = strtolower((string) $request->input('search_by', 'any'));

    if (!in_array($searchBy, ['email','name','asset','any'], true)) {
        $searchBy = 'any';
    }

    $query = Purchase::with(['user', 'asset.category'])
        ->orderBy('created_at', 'desc');

    if ($dateFrom) $query->whereDate('created_at', '>=', $dateFrom);
    if ($dateTo)   $query->whereDate('created_at', '<=', $dateTo);

    if ($search !== '') {
        $query->where(function ($qq) use ($search, $searchBy) {
            if ($searchBy === 'email') {
                $qq->whereHas('user', fn($u) => $u->where('email', 'like', "%{$search}%"));
            } elseif ($searchBy === 'name') {
                $qq->whereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%"));
            } elseif ($searchBy === 'asset') {
                $qq->whereHas('asset', fn($a) => $a->where('title', 'like', "%{$search}%"));
            } else { // any
                $qq->whereHas('user', fn($u) => $u
                        ->where('email', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%"))
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
     * Get download logs (now uses the `downloads` column)
     */
// app/Http/Controllers/Admin/LogsController.php

    public function downloads(Request $request)
    {
        $perPage  = (int) ($request->input('per_page', 50)) ?: 50;
        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');
        $search   = trim((string) $request->input('search', ''));
        $searchBy = strtolower((string) $request->input('search_by', 'any'));

        // sanitize searchBy
        if (!in_array($searchBy, ['email','name','asset','any'], true)) {
            $searchBy = 'any';
        }

        $query = \App\Models\Download::with(['user', 'asset.category'])
            ->orderBy('created_at', 'desc');

        if ($dateFrom) $query->whereDate('created_at', '>=', $dateFrom);
        if ($dateTo)   $query->whereDate('created_at', '<=', $dateTo);

        if ($search !== '') {
            $query->where(function ($qq) use ($search, $searchBy) {
                if ($searchBy === 'email') {
                    $qq->whereHas('user', fn($u) => $u->where('email', 'like', "%{$search}%"));
                } elseif ($searchBy === 'name') {
                    $qq->whereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%"));
                } elseif ($searchBy === 'asset') {
                    $qq->whereHas('asset', fn($a) => $a->where('title', 'like', "%{$search}%"));
                } else { // any
                    $qq->whereHas('user', fn($u) => $u
                            ->where('email', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%"))
                    ->orWhereHas('asset', fn($a) => $a->where('title', 'like', "%{$search}%"));
                }
            });
        }

        $downloads = $query->paginate($perPage);

        return response()->json([
            'data' => $downloads->items(),
            'pagination' => [
                'current_page' => $downloads->currentPage(),
                'last_page'    => $downloads->lastPage(),
                'per_page'     => $downloads->perPage(),
                'total'        => $downloads->total(),
            ],
        ]);
    }

    /**
     * Get active games logs
     */
    public function activeGames(Request $request)
    {
        $perPage   = (int) ($request->input('per_page', 50)) ?: 50;
        $dateFrom  = $request->input('date_from');
        $dateTo    = $request->input('date_to');
        $search    = (string) $request->input('search', '');

        $query = ActiveGame::with(['user', 'asset.category'])
            ->active() // Only get currently active games
            ->orderBy('started_at', 'desc');

        if ($dateFrom) {
            $query->whereDate('started_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('started_at', '<=', $dateTo);
        }
        if ($search !== '') {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
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
     * Get logs statistics
     * - Downloads now sum the `downloads` column
     */
    public function stats()
    {
        $stats = [
            'total_purchases'   => Purchase::count(),
            'total_downloads'   => Download::sum('downloads'),
            'active_games_count'=> ActiveGame::active()->count(),
            'today_purchases'   => Purchase::whereDate('created_at', today())->count(),
            'today_downloads'   => Download::whereDate('created_at', today())->sum('downloads'),
            'revenue_today'     => Purchase::whereDate('created_at', today())->sum('cost_amount'),
            'revenue_total'     => Purchase::sum('cost_amount'),
        ];

        return response()->json($stats);
    }

    /**
     * Export logs data
     * - Downloads CSV shows "Downloads" and uses the `downloads` column
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
                    // Keep as-is if purchases still track points
                    fputcsv($file, ['Date', 'Email', 'Name', 'Asset', 'Category', 'Points', 'Cost']);

                    Purchase::with(['user', 'asset.category'])->chunk(100, function ($purchases) use ($file) {
                        foreach ($purchases as $purchase) {
                            fputcsv($file, [
                                $purchase->created_at->format('m/d/y'),
                                $purchase->user->email,
                                $purchase->user->name,
                                $purchase->asset->title,
                                $purchase->asset->category->name,
                                $purchase->points_spent . ' pts',
                                '₱' . number_format($purchase->cost_amount, 2),
                            ]);
                        }
                    });
                    break;

                case 'downloads':
                    // Header + data now use `Downloads`
                    fputcsv($file, ['Date', 'Email', 'Name', 'Asset', 'Category', 'Downloads']);

                    Download::with(['user', 'asset.category'])->chunk(100, function ($downloads) use ($file) {
                        foreach ($downloads as $d) {
                            fputcsv($file, [
                                $d->created_at->format('m/d/y'),
                                $d->user->email,
                                $d->user->name,
                                $d->asset->title,
                                $d->asset->category->name,
                                $d->downloads,
                            ]);
                        }
                    });
                    break;

                case 'active':
                    fputcsv($file, ['Date Started', 'Email', 'Name', 'Asset', 'Category']);

                    ActiveGame::active()
                        ->with(['user', 'asset.category'])
                        ->chunk(100, function ($games) use ($file) {
                            foreach ($games as $game) {
                                fputcsv($file, [
                                    $game->started_at->format('m/d/y'),
                                    $game->user->email,
                                    $game->user->name,
                                    $game->asset->title,
                                    $game->asset->category->name,
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
