<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next)
    {
        if (auth()->check()) {
            $u = auth()->user();

            // If disabled or blocked, immediately kill the session
            if ($u->is_blocked || $u->active_status !== 'enabled') {
                auth()->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')
                    ->withErrors(['email' => 'Your account is disabled or blocked.']);
            }
        }

        return $next($request);
    }
}
