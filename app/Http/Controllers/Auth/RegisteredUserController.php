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

// Optional: only if you actually have a settings table/model
use App\Models\Setting;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     */
    public function store(Request $request): RedirectResponse
    {
        // 🔧 Accept legacy keys from older UI:
        // - map mobile -> mobile_number
        // - default password_confirmation to password when missing (to pass confirmed rule)
        $request->merge([
            'mobile_number'         => $request->input('mobile_number') ?? $request->input('mobile'),
            'password_confirmation' => $request->input('password_confirmation') ?? $request->input('password'),
        ]);

        Log::debug('Incoming register payload (sanitized)', [
            'name'          => $request->input('name'),
            'username'      => $request->input('username'),
            'email'         => $request->input('email'),
            'mobile_number' => $request->input('mobile_number'),
            'has_password'  => $request->filled('password'),
        ]);

        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'username'        => ['required', 'string', 'max:50', 'alpha_dash', 'unique:users,username'],
            'email'           => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'mobile_number'   => ['required', 'string', 'max:30', 'unique:users,mobile_number'],
            'address'         => ['nullable', 'string', 'max:1000'],
            'password'        => ['required', 'confirmed', Rules\Password::defaults()],
            'terms'           => ['accepted'],
        ]);

        // Normalize inputs
        $email    = mb_strtolower(trim($validated['email']));
        $username = trim($validated['username']);

        // Configurable free registration points
        $freePoints = $this->freeRegistrationPoints();

        // Create the user
        $user = User::create([
            'name'                => $validated['name'],
            'username'            => $username,
            'email'               => $email,
            'mobile_number'       => $validated['mobile_number'],
            'address'             => $validated['address'] ?? null,
            'password'            => Hash::make($validated['password']),

            // Explicit defaults (also in DB)
            'is_admin'            => false,
            'is_blocked'          => false,
            'points'              => $freePoints,      // ✅ apply free points
            'verification_status' => 'pending',
            'active_status'       => 'enabled',
            'role'                => 'viewer',
        ]);

        // Send email verification (Breeze)
        event(new Registered($user));

        // Log in then let 'verified' middleware gate the dashboard
        Auth::login($user);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Resolve free registration points from Admin config / settings.
     *
     * Priority:
     *  1) DB settings: key = 'free_registration_points' (if Setting model exists)
     *  2) config('store.free_registration_points')
     *  3) config('app.default_free_points', 100)
     */
    private function freeRegistrationPoints(): int
    {
        // 1) DB Setting (optional)
        try {
            if (class_exists(Setting::class)) {
                $dbVal = Setting::query()
                    ->where('key', 'free_registration_points')
                    ->value('value');

                if ($dbVal !== null && $dbVal !== '') {
                    return max(0, (int) $dbVal);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Unable to read free_registration_points from settings table', [
                'error' => $e->getMessage(),
            ]);
        }

        // 2) Config file (e.g. config/store.php)
        $cfgStore = config('store.free_registration_points');
        if ($cfgStore !== null) {
            return max(0, (int) $cfgStore);
        }

        // 3) App fallback (matches your Admin reference)
        return max(0, (int) config('app.default_free_points', 100));
    }
}
