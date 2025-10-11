<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * Render the Users Inertia page (newest first).
     */
    public function index()
    {
        try {
            $users = User::orderByDesc('created_at')->get();

            Log::info('Users retrieved (admin index)', ['count' => $users->count()]);

            return Inertia::render('AdminPages/Users', [
                'users' => $users,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching users: ' . $e->getMessage());

            return Inertia::render('AdminPages/Users', [
                'users' => [],
                'error' => 'Failed to load users',
            ]);
        }
    }

    /**
     * Lightweight JSON list for dropdowns/selects.
     * Returns id, name, email (email optional).
     */
    public function light(Request $request)
    {
        $q            = trim((string) $request->get('q', ''));
        $limit        = (int) ($request->integer('limit') ?: 100);
        $limit        = max(1, min($limit, 500));
        $excludeIds   = array_map('intval', (array) $request->input('exclude_ids', []));
        $onlyEnabled  = $request->boolean('only_enabled', false);
        $includeEmail = $request->boolean('include_email', true);

        $query = User::query()->orderBy('name');

        $select = ['id', 'name'];
        if ($includeEmail) {
            $select[] = 'email';
        }
        if (Schema::hasColumn('users', 'username')) {
            $select[] = 'username';
        }

        $query->select(array_unique($select));

        if ($q !== '') {
            $like = '%' . str_replace('%', '\%', $q) . '%';
            $query->where(function ($qq) use ($like) {
                $qq->where('name', 'like', $like)
                   ->orWhere('email', 'like', $like);
                if (Schema::hasColumn('users', 'username')) {
                    $qq->orWhere('username', 'like', $like);
                }
            });
        }

        if (!empty($excludeIds)) {
            $query->whereNotIn('id', $excludeIds);
        }

        if ($onlyEnabled && Schema::hasColumn('users', 'active_status')) {
            $query->where('active_status', 'enabled');
        }

        $users = $query->limit($limit)->get();

        $payload = $users->map(function ($u) use ($includeEmail) {
            return array_filter([
                'id'    => $u->id,
                'name'  => $u->name,
                'email' => $includeEmail ? $u->email : null,
            ], fn ($v) => !is_null($v));
        });

        return response()->json($payload);
    }

    /**
     * Store a newly created user.
     * Applies "Free Registration Points" if userPoints is not provided.
     * Also auto-syncs is_admin with role.
     */
    public function store(Request $request)
    {
        try {
            Log::info('Creating user (admin)', ['payload' => $request->all()]);

            $validated = $request->validate([
                'fullName'           => 'required|string|max:255',
                'userName'           => 'required|string|max:255|unique:users,username',
                'emailAddress'       => 'required|email|max:255|unique:users,email',
                'mobileNumber'       => 'required|string|max:20|unique:users,mobile_number',
                'address'            => 'nullable|string|max:1000',
                'userPoints'         => 'nullable|integer|min:0',
                'password'           => 'required|string|min:6',
                'verificationStatus' => 'required|string|in:verified,unverified,pending',
                'activeStatus'       => 'required|string|in:enabled,disabled',
                'access'             => 'required|string|in:admin,editor,viewer',
            ]);

            // Configurable default free points
            $defaultFreePoints = (int) config('app.default_free_points', 100);

            $role     = $validated['access'];
            $isAdmin  = $role === 'admin' ? 1 : 0;

            $userData = [
                'name'                 => $validated['fullName'],
                'username'             => $validated['userName'],
                'email'                => strtolower($validated['emailAddress']),
                'mobile_number'        => $validated['mobileNumber'],
                'address'              => $validated['address'] ?? null,
                'points'               => isset($validated['userPoints'])
                                            ? (int) $validated['userPoints']
                                            : $defaultFreePoints,
                'password'             => Hash::make($validated['password']),
                'verification_status'  => $validated['verificationStatus'],
                'active_status'        => $validated['activeStatus'],
                'role'                 => $role,
                'is_admin'             => $isAdmin, // ✅ auto-sync
            ];

            $user = User::create($userData);

            Log::info('User created successfully', ['id' => $user->id]);

            return redirect()->back()->with('success', 'User created successfully.');
        } catch (ValidationException $e) {
            Log::warning('Validation failed during user creation', ['errors' => $e->errors()]);

            return redirect()
                ->back()
                ->withErrors($e->errors())
                ->withInput($request->all());
        } catch (\Exception $e) {
            Log::error('Error creating user: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return redirect()
                ->back()
                ->with('error', 'Failed to create user: ' . $e->getMessage())
                ->withInput($request->all());
        }
    }

    /**
     * Update an existing user.
     * Points update only if userPoints is explicitly provided.
     * If user is disabled, purge their sessions and rotate remember token.
     * Auto-sync is_admin with role.
     */
    public function update(Request $request, User $user)
    {
        try {
            Log::info('=== UPDATE USER REQUEST ===', [
                'user_id' => $user->id,
                'payload' => $request->all(),
                'before'  => $user->toArray(),
            ]);

            $validated = $request->validate([
                'fullName'           => 'required|string|max:255',
                'userName'           => 'required|string|max:255|unique:users,username,' . $user->id,
                'emailAddress'       => 'required|email|max:255|unique:users,email,' . $user->id,
                'mobileNumber'       => 'required|string|max:20|unique:users,mobile_number,' . $user->id,
                'address'            => 'nullable|string|max:1000',
                'userPoints'         => 'nullable|integer|min:0',
                'password'           => 'nullable|string|min:6',
                'verificationStatus' => 'required|string|in:verified,unverified,pending',
                'activeStatus'       => 'required|string|in:enabled,disabled',
                'access'             => 'required|string|in:admin,editor,viewer',
            ]);

            // Capture old status BEFORE update
            $wasEnabled = $user->getOriginal('active_status') === 'enabled';

            $role    = $validated['access'];
            $isAdmin = $role === 'admin' ? 1 : 0;

            $updateData = [
                'name'                 => $validated['fullName'],
                'username'             => $validated['userName'],
                'email'                => strtolower($validated['emailAddress']),
                'mobile_number'        => $validated['mobileNumber'],
                'address'              => $validated['address'] ?? null,
                'verification_status'  => $validated['verificationStatus'],
                'active_status'        => $validated['activeStatus'],
                'role'                 => $role,
                'is_admin'             => $isAdmin, // ✅ auto-sync
            ];

            // Only set points if explicitly provided
            if (array_key_exists('userPoints', $validated) && $validated['userPoints'] !== null) {
                $updateData['points'] = (int) $validated['userPoints'];
            }

            if (!empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
                Log::info('Password will be updated');
            } else {
                Log::info('Password not updated (empty)');
            }

            $updateResult = $user->update($updateData);
            Log::info('User update result', ['result' => (bool) $updateResult]);

            // Reload latest values
            $user->refresh();

            // If status flipped from enabled -> disabled, revoke remember token & purge sessions (DB driver)
            if ($wasEnabled && $user->active_status !== 'enabled') {
                Log::info('User moved to DISABLED — rotating remember token & purging sessions', [
                    'user_id' => $user->id,
                ]);

                // Rotate remember token to invalidate "remember me"
                $user->setRememberToken(Str::random(60));
                $user->save();

                // Purge sessions only when using database driver
                if (config('session.driver') === 'database') {
                    DB::table(config('session.table', 'sessions'))
                        ->where('user_id', $user->id)
                        ->delete();

                    Log::info('Database sessions purged', ['user_id' => $user->id]);
                } else {
                    Log::info('Session driver is not database; sessions will expire via middleware.');
                }
            }

            Log::info('User AFTER update', [
                'user' => $user->toArray(),
            ]);

            return redirect()->back()->with('success', 'User updated successfully.');
        } catch (ValidationException $e) {
            Log::warning('Validation failed during user update', ['errors' => $e->errors()]);

            return redirect()
                ->back()
                ->withErrors($e->errors())
                ->withInput($request->all());
        } catch (\Exception $e) {
            Log::error('Error updating user: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return redirect()
                ->back()
                ->with('error', 'Failed to update user: ' . $e->getMessage())
                ->withInput($request->all());
        }
    }

    /**
     * Delete a user.
     */
    public function destroy(User $user)
    {
        try {
            Log::info('Deleting user', ['user' => $user->toArray()]);

            $user->delete();

            Log::info('User deleted successfully', ['user_id' => $user->id ?? null]);

            return redirect()->back()->with('success', 'User deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error deleting user: ' . $e->getMessage());

            return redirect()->back()->with('error', 'Failed to delete user: ' . $e->getMessage());
        }
    }

    /**
     * Assign / adjust Free Registration Points.
     *
     * Request:
     *  - points: int (required)
     *  - mode: 'set' | 'add' | 'sub' | 'increment' | 'decrement' (default: 'set')
     */
    public function assignFreePoints(Request $request, User $user)
    {
        try {
            $validated = $request->validate([
                'points' => 'required|integer',
                'mode'   => 'nullable|string|in:set,add,sub,increment,decrement',
            ]);

            $mode   = $validated['mode'] ?? 'set';
            $before = (int) $user->points;
            $delta  = (int) $validated['points'];

            switch ($mode) {
                case 'add':
                case 'increment':
                    $user->points = $before + $delta;
                    break;

                case 'sub':
                case 'decrement':
                    $user->points = max(0, $before - $delta);
                    break;

                case 'set':
                default:
                    $user->points = max(0, $delta);
                    break;
            }

            $user->save();

            Log::info('Free Registration Points updated', [
                'user_id' => $user->id,
                'mode'    => $mode,
                'before'  => $before,
                'delta'   => $delta,
                'after'   => $user->points,
            ]);

            return redirect()->back()->with('success', 'Free Registration Points updated successfully.');
        } catch (ValidationException $e) {
            Log::warning('Validation failed during points assignment', ['errors' => $e->errors()]);

            return redirect()
                ->back()
                ->withErrors($e->errors())
                ->withInput($request->all());
        } catch (\Exception $e) {
            Log::error('Error assigning free points: ' . $e->getMessage());

            return redirect()->back()->with('error', 'Failed to assign free points.');
        }
    }
}
