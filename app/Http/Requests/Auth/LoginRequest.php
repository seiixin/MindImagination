<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Anyone can hit the login endpoint.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Basic validation.
     */
    public function rules(): array
    {
        return [
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Attempt authentication with account state checks.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        // Find the user first to give precise error messages
        /** @var \App\Models\User|null $user */
        $user = User::where('email', (string) $this->input('email'))->first();

        if (! $user) {
            RateLimiter::hit($this->throttleKey());
            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        // Block disabled/blocked accounts explicitly
        if ($user->active_status !== 'enabled' || (bool) $user->is_blocked === true) {
            RateLimiter::hit($this->throttleKey());
            throw ValidationException::withMessages([
                'email' => __('Your account is disabled or blocked. Please contact support.'),
            ]);
        }

        // (Optional) If you want to require verification, uncomment:
        // if ($user->verification_status !== 'verified') {
        //     RateLimiter::hit($this->throttleKey());
        //     throw ValidationException::withMessages([
        //         'email' => __('Please verify your account before logging in.'),
        //     ]);
        // }

        // Check password
        if (! Hash::check((string) $this->input('password'), $user->password)) {
            RateLimiter::hit($this->throttleKey());
            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        // Log the user in (honor "remember me")
        Auth::login($user, (bool) $this->boolean('remember'));

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Throttle brute force attempts.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => (int) ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Unique key for throttling per email + IP.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(
            Str::lower((string) $this->input('email')).'|'.$this->ip()
        );
    }
}
