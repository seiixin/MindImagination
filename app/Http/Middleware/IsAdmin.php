<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        // Must be logged in AND pass the model's admin logic
        if ($user && method_exists($user, 'isAdmin') && $user->isAdmin()) {
            return $next($request);
        }

        // For API/AJAX requests, return 403; otherwise redirect
        if ($request->expectsJson()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Optional: flash message if you use Inertia/Blade flashes
        return redirect()->route('dashboard')->with('error', 'Admin access required.');
    }
}
