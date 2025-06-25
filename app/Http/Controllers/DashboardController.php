<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        return Inertia::render('UserPages/Dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'points' => $user->points,
                'is_admin' => $user->is_admin,
                'acquiredAssets' => $user->acquiredAssets ?? [], // optional if eager loaded
                'is_blocked' => $user->is_blocked,
            ]
        ]);
    }
}
