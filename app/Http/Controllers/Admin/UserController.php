<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index()
    {
        try {
            $users = User::orderBy('created_at', 'desc')->get();

            // Debug: Log the users data to check if status fields are being retrieved
            \Log::info('Users retrieved:', $users->toArray());

            return Inertia::render('AdminPages/Users', [
                'users' => $users
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching users: ' . $e->getMessage());
            return Inertia::render('AdminPages/Users', [
                'users' => [],
                'error' => 'Failed to load users'
            ]);
        }
    }

    public function store(Request $request)
    {
        try {
            // Debug: Log incoming request data
            \Log::info('Creating user with data:', $request->all());

            $validated = $request->validate([
                'fullName' => 'required|string|max:255',
                'userName' => 'required|string|max:255|unique:users,username',
                'emailAddress' => 'required|email|max:255|unique:users,email',
                'mobileNumber' => 'required|string|max:20|unique:users,mobile_number',
                'address' => 'nullable|string|max:1000',
                'userPoints' => 'required|integer|min:0',
                'password' => 'required|string|min:6',
                'verificationStatus' => 'required|string|in:verified,unverified,pending',
                'activeStatus' => 'required|string|in:enabled,disabled',
                'access' => 'required|string|in:admin,editor,viewer',
            ]);

            $userData = [
                'name' => $validated['fullName'],
                'username' => $validated['userName'],
                'email' => $validated['emailAddress'],
                'mobile_number' => $validated['mobileNumber'],
                'address' => $validated['address'],
                'points' => $validated['userPoints'],
                'password' => Hash::make($validated['password']),
                'verification_status' => $validated['verificationStatus'],
                'active_status' => $validated['activeStatus'],
                'role' => $validated['access'],
            ];

            // Debug: Log the data being saved
            \Log::info('User data being created:', $userData);

            $user = User::create($userData);

            // Debug: Log created user
            \Log::info('User created successfully:', $user->fresh()->toArray());

            return redirect()->back()->with('success', 'User created successfully.');

        } catch (ValidationException $e) {
            \Log::warning('Validation failed during user creation:', $e->errors());
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput($request->all());
        } catch (\Exception $e) {
            \Log::error('Error creating user: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return redirect()->back()
                ->with('error', 'Failed to create user: ' . $e->getMessage())
                ->withInput($request->all());
        }
    }

    public function update(Request $request, User $user)
    {
        try {
            // Debug: Log incoming request data
            \Log::info('=== UPDATE USER REQUEST ===');
            \Log::info('User ID: ' . $user->id);
            \Log::info('Request data:', $request->all());
            \Log::info('Current user data BEFORE update:', $user->toArray());

            $validated = $request->validate([
                'fullName' => 'required|string|max:255',
                'userName' => 'required|string|max:255|unique:users,username,' . $user->id,
                'emailAddress' => 'required|email|max:255|unique:users,email,' . $user->id,
                'mobileNumber' => 'required|string|max:20|unique:users,mobile_number,' . $user->id,
                'address' => 'nullable|string|max:1000',
                'userPoints' => 'required|integer|min:0',
                'password' => 'nullable|string|min:6',
                'verificationStatus' => 'required|string|in:verified,unverified,pending',
                'activeStatus' => 'required|string|in:enabled,disabled',
                'access' => 'required|string|in:admin,editor,viewer',
            ]);

            \Log::info('Validated data:', $validated);

            $updateData = [
                'name' => $validated['fullName'],
                'username' => $validated['userName'],
                'email' => $validated['emailAddress'],
                'mobile_number' => $validated['mobileNumber'],
                'address' => $validated['address'],
                'points' => $validated['userPoints'],
                'verification_status' => $validated['verificationStatus'],
                'active_status' => $validated['activeStatus'],
                'role' => $validated['access'],
            ];

            // Only update password if provided
            if (!empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
                \Log::info('Password will be updated');
            } else {
                \Log::info('Password will NOT be updated (empty)');
            }

            // Debug: Log the data being updated
            \Log::info('Update data being sent to database:', $updateData);

            // Perform the update
            $updateResult = $user->update($updateData);
            \Log::info('Update result (boolean):', ['result' => $updateResult]);

            // Refresh the user instance to get updated data from database
            $user->refresh();

            // Debug: Log updated user data from database
            \Log::info('User data AFTER update from database:', $user->toArray());

            // Double-check specific fields
            \Log::info('Specific fields after update:', [
                'verification_status' => $user->verification_status,
                'active_status' => $user->active_status,
                'role' => $user->role,
                'points' => $user->points,
                'address' => $user->address,
            ]);

            return redirect()->back()->with('success', 'User updated successfully.');

        } catch (ValidationException $e) {
            \Log::warning('Validation failed during user update:', $e->errors());
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput($request->all());
        } catch (\Exception $e) {
            \Log::error('Error updating user: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());

            // Log the exact SQL error if available
            if (method_exists($e, 'getSql')) {
                \Log::error('SQL Error: ' . $e->getSql());
            }

            return redirect()->back()
                ->with('error', 'Failed to update user: ' . $e->getMessage())
                ->withInput($request->all());
        }
    }

    public function destroy(User $user)
    {
        try {
            \Log::info('Deleting user:', $user->toArray());

            $user->delete();

            \Log::info('User deleted successfully');

            return redirect()->back()->with('success', 'User deleted successfully.');
        } catch (\Exception $e) {
            \Log::error('Error deleting user: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete user: ' . $e->getMessage());
        }
    }
}
