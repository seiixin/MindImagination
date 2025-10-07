<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;

class ProfileController extends Controller
{
    public function edit(Request $request)
    {
        return Inertia::render('UserPages/Profile', [
            'user' => $request->user(),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'email'         => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'mobile_number' => ['nullable', 'string', 'max:20'],
        ]);

        $user->update($validated);

        return back()->with('success', 'Profile updated successfully.');
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password'         => ['required', 'confirmed', Rules\Password::defaults(), 'different:current_password'],
        ]);

        // Because your User model casts 'password' => 'hashed', this will be hashed automatically.
        $request->user()->update([
            'password' => $request->password,
        ]);

        return back()->with('status', 'password-updated');
    }

    public function deactivate(Request $request)
    {
        $user = $request->user();

        // Mark the account as deactivated/blocked (soft policy, adjust to your needs)
        $user->update(['is_blocked' => true]);

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('success', 'Account deactivated successfully.');
    }
}
