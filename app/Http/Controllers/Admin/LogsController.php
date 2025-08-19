<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\Download;
use App\Models\ActiveGame;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LogsController extends Controller
{
    /**
     * Get purchase logs
     */
    public function purchases(Request $request)
    {
        $query = Purchase::with(['user', 'asset.category'])
            ->orderBy('created_at', 'desc');

        // Apply filters if provided
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $purchases = $query->paginate(50);

        return response()->json([
            'data' => $purchases->items(),
            'pagination' => [
                'current_page' => $purchases->currentPage(),
                'last_page' => $purchases->lastPage(),
                'per_page' => $purchases->perPage(),
                'total' => $purchases->total(),
            ]
        ]);
    }

    /**
     * Get download logs
     */
    public function downloads(Request $request)
    {
        $query = Download::with(['user', 'asset.category'])
            ->orderBy('created_at', 'desc');

        // Apply filters if provided
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $downloads = $query->paginate(50);

        return response()->json([
            'data' => $downloads->items(),
            'pagination' => [
                'current_page' => $downloads->currentPage(),
                'last_page' => $downloads->lastPage(),
                'per_page' => $downloads->perPage(),
                'total' => $downloads->total(),
            ]
        ]);
    }

    /**
     * Get active games logs
     */
    public function activeGames(Request $request)
    {
        $query = ActiveGame::with(['user', 'asset.category'])
            ->active() // Only get currently active games
            ->orderBy('started_at', 'desc');

        // Apply filters if provided
        if ($request->has('date_from')) {
            $query->whereDate('started_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('started_at', '<=', $request->date_to);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $activeGames = $query->paginate(50);

        return response()->json([
            'data' => $activeGames->items(),
            'pagination' => [
                'current_page' => $activeGames->currentPage(),
                'last_page' => $activeGames->lastPage(),
                'per_page' => $activeGames->perPage(),
                'total' => $activeGames->total(),
            ]
        ]);
    }

    /**
     * Get logs statistics
     */
    public function stats()
    {
        $stats = [
            'total_purchases' => Purchase::count(),
            'total_downloads' => Download::sum('download_count'),
            'active_games_count' => ActiveGame::active()->count(),
            'today_purchases' => Purchase::whereDate('created_at', today())->count(),
            'today_downloads' => Download::whereDate('created_at', today())->sum('download_count'),
            'revenue_today' => Purchase::whereDate('created_at', today())->sum('cost_amount'),
            'revenue_total' => Purchase::sum('cost_amount'),
        ];

        return response()->json($stats);
    }

    /**
     * Export logs data
     */
    public function export(Request $request)
    {
        $type = $request->input('type', 'purchases');

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$type}_export_" . date('Y_m_d') . ".csv\"",
        ];

        $callback = function () use ($type) {
            $file = fopen('php://output', 'w');

            switch ($type) {
                case 'purchases':
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
                                '₱' . number_format($purchase->cost_amount, 2)
                            ]);
                        }
                    });
                    break;

                case 'downloads':
                    fputcsv($file, ['Date', 'Email', 'Name', 'Asset', 'Category', 'Points']);

                    Download::with(['user', 'asset.category'])->chunk(100, function ($downloads) use ($file) {
                        foreach ($downloads as $download) {
                            fputcsv($file, [
                                $download->created_at->format('m/d/y'),
                                $download->user->email,
                                $download->user->name,
                                $download->asset->title,
                                $download->asset->category->name,
                                $download->points_used . ' pts'
                            ]);
                        }
                    });
                    break;

                case 'active':
                    fputcsv($file, ['Date Started', 'Email', 'Name', 'Asset', 'Category']);

                    ActiveGame::active()->with(['user', 'asset.category'])->chunk(100, function ($games) use ($file) {
                        foreach ($games as $game) {
                            fputcsv($file, [
                                $game->started_at->format('m/d/y'),
                                $game->user->email,
                                $game->user->name,
                                $game->asset->title,
                                $game->asset->category->name
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
