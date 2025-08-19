<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\Download;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Return dashboard statistics.
     */
    public function stats(): JsonResponse
    {
        // total purchase points
        $totalPurchasePoints = Purchase::sum('points_spent');

        // total downloads
        $totalDownloads = Download::sum('download_count');

        // top 5 users by points
        $topUsers = User::orderBy('points', 'desc')
            ->take(5)
            ->get(['id', 'name', 'points']);

        // attach download count to each top user
        $topUsers->transform(function ($user) {
            $user->downloads = Download::where('user_id', $user->id)->sum('download_count');
            return $user;
        });

        return response()->json([
            'topUsers' => $topUsers,
            'totalPurchasePoints' => $totalPurchasePoints,
            'totalDownloads' => $totalDownloads,
        ]);
    }
}
