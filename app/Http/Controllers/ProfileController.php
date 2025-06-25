<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

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

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'mobile_number' => 'nullable|string|max:20',
        ]);

        $user->update($request->only('name', 'email', 'mobile_number'));

        return back()->with('success', 'Profile updated successfully.');
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!\Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Incorrect current password.']);
        }

        $user->update(['password' => bcrypt($request->password)]);

        return back()->with('success', 'Password updated successfully.');
    }

    public function deactivate(Request $request)
    {
        $user = $request->user();

        // Soft delete user or mark as deactivated
        $user->update(['is_blocked' => true]);

        Auth::logout();

        return redirect('/')->with('success', 'Account deactivated successfully.');
    }
}
