<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),

            'auth' => [
                'user' => fn () => optional($request->user())?->only([
                    'id',
                    'name',
                    'email',
                    'email_verified_at',
                    'points',  // Add the 'points' field here
                ]),
            ],

            // Flash/Status para magamit ng VerifyEmail.jsx (status === 'verification-link-sent')
            'status' => fn () => session('status'),

            // (Optional) generic flash messages kung gumagamit ka ng with('success')/with('error')
            'flash' => [
                'success' => fn () => session('success'),
                'error'   => fn () => session('error'),
            ],
        ];
    }
}
