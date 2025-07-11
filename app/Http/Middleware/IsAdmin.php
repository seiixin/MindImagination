<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;

class IsAdmin
{
    public function handle($request, Closure $next)
    {
        // Adjust field name if your users table uses 'is_admin'
        if (Auth::check() && Auth::user()->is_admin) {
            return $next($request);
        }

        // Optional: redirect somewhere else if not admin
        return redirect()->route('dashboard');
    }
}
