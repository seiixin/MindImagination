<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

// Optional: only used if you have a settings table like in other parts of your app
use App\Models\Setting;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register'); // change if your page lives elsewhere
    }

    /**
     * Handle an incoming registration request.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'username'        => ['required', 'string', 'max:50', 'alpha_dash', 'unique:users,username'],
            'email'           => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'mobile_number'   => ['required', 'string', 'max:30', 'unique:users,mobile_number'],
            'address'         => ['nullable', 'string', 'max:1000'],
            'password'        => ['required', 'confirmed', Rules\Password::defaults()],
            'terms'           => ['accepted'],
        ]);

        // Normalize a couple of inputs
        $email    = mb_strtolower(trim($validated['email']));
        $username = trim($validated['username']);

        // Get Free Registration Points from Admin config (with fallbacks)
        $freePoints = $this->freeRegistrationPoints();

        $user = User::create([
            'name'                => $validated['name'],
            'username'            => $username,
            'email'               => $email,
            'mobile_number'       => $validated['mobile_number'],
            'address'             => $validated['address'] ?? null,
            'password'            => Hash::make($validated['password']),

            // Explicit defaults (also backed by DB defaults)
            'is_admin'            => false,
            'is_blocked'          => false,
            'points'              => $freePoints,          // ✅ apply free points
            'verification_status' => 'pending',
            'active_status'       => 'enabled',
            'role'                => 'viewer',
        ]);

        event(new Registered($user));
        Auth::login($user);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Resolve free registration points from Admin config / settings.
     *
     * Priority:
     *   1) DB settings: key = 'free_registration_points'
     *   2) config('store.free_registration_points')
     *   3) config('app.default_free_points', 100)  // matches your Admin reference
     */
    private function freeRegistrationPoints(): int
    {
        // 1) DB Setting (if your app has a settings table)
        try {
            if (class_exists(Setting::class)) {
                $dbVal = Setting::query()
                    ->where('key', 'free_registration_points')
                    ->value('value');

                if (!is_null($dbVal) && $dbVal !== '') {
                    return max(0, (int) $dbVal);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Unable to read free_registration_points from settings table', [
                'error' => $e->getMessage(),
            ]);
        }

        // 2) Config file (e.g., config/store.php => ['free_registration_points' => 150])
        $cfgStore = config('store.free_registration_points');
        if (!is_null($cfgStore)) {
            return max(0, (int) $cfgStore);
        }

        // 3) App config fallback (your Admin uses this)
        return max(0, (int) config('app.default_free_points', 100));
    }
}
