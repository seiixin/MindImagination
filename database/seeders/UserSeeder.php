<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin Account
        User::create([
            'username' => 'adminmaster',
            'name' => 'Admin Master',
            'email' => 'admin@example.com',
            'mobile_number' => '09179876543',
            'address' => '123 Admin Street, Admin City',
            'email_verified_at' => now(),
            'password' => Hash::make('112803Ss'),
            'is_admin' => true,
            'is_blocked' => false,
            'points' => 1000,
            'verification_status' => 'verified',
            'active_status' => 'enabled',
            'role' => 'admin',
            'remember_token' => Str::random(10),
        ]);

        // Editor Account
        User::create([
            'username' => 'editoruser',
            'name' => 'Editor User',
            'email' => 'editor@example.com',
            'mobile_number' => '09181234567',
            'address' => '456 Editor Avenue, Content City',
            'email_verified_at' => now(),
            'password' => Hash::make('112803Ss'),
            'is_admin' => false,
            'is_blocked' => false,
            'points' => 500,
            'verification_status' => 'verified',
            'active_status' => 'enabled',
            'role' => 'editor',
            'remember_token' => Str::random(10),
        ]);

        // Normal User Account (Verified)
        User::create([
            'username' => 'sidneyuser',
            'name' => 'Sidney Garcinan',
            'email' => 'sidneygarcinan@gmail.com',
            'mobile_number' => '09171234567',
            'address' => '789 User Boulevard, User Town',
            'email_verified_at' => now(),
            'password' => Hash::make('112803Ss'),
            'is_admin' => false,
            'is_blocked' => false,
            'points' => 250,
            'verification_status' => 'verified',
            'active_status' => 'enabled',
            'role' => 'viewer',
            'remember_token' => Str::random(10),
        ]);

        // Normal User Account (Pending Verification)
        User::create([
            'username' => 'johndoe',
            'name' => 'John Doe',
            'email' => 'johndoe@example.com',
            'mobile_number' => '09191234568',
            'address' => '321 Pending Street, Verification City',
            'email_verified_at' => null,
            'password' => Hash::make('password123'),
            'is_admin' => false,
            'is_blocked' => false,
            'points' => 0,
            'verification_status' => 'pending',
            'active_status' => 'enabled',
            'role' => 'viewer',
            'remember_token' => Str::random(10),
        ]);

        // Normal User Account (Unverified)
        User::create([
            'username' => 'janedoe',
            'name' => 'Jane Doe',
            'email' => 'janedoe@example.com',
            'mobile_number' => '09201234569',
            'address' => '654 Unverified Lane, Waiting City',
            'email_verified_at' => null,
            'password' => Hash::make('password123'),
            'is_admin' => false,
            'is_blocked' => false,
            'points' => 0,
            'verification_status' => 'unverified',
            'active_status' => 'enabled',
            'role' => 'viewer',
            'remember_token' => Str::random(10),
        ]);

        // Disabled User Account
        User::create([
            'username' => 'disableduser',
            'name' => 'Disabled User',
            'email' => 'disabled@example.com',
            'mobile_number' => '09211234570',
            'address' => '987 Disabled Drive, Inactive City',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
            'is_admin' => false,
            'is_blocked' => true,
            'points' => 0,
            'verification_status' => 'verified',
            'active_status' => 'disabled',
            'role' => 'viewer',
            'remember_token' => Str::random(10),
        ]);

        // High Points User
        User::create([
            'username' => 'vipuser',
            'name' => 'VIP User',
            'email' => 'vip@example.com',
            'mobile_number' => '09221234571',
            'address' => '111 VIP Plaza, Premium City',
            'email_verified_at' => now(),
            'password' => Hash::make('vippass123'),
            'is_admin' => false,
            'is_blocked' => false,
            'points' => 2500,
            'verification_status' => 'verified',
            'active_status' => 'enabled',
            'role' => 'viewer',
            'remember_token' => Str::random(10),
        ]);

        // Test User for Development
        User::create([
            'username' => 'testuser',
            'name' => 'Test User',
            'email' => 'test@example.com',
            'mobile_number' => '09231234572',
            'address' => '222 Test Street, Development City',
            'email_verified_at' => now(),
            'password' => Hash::make('test123'),
            'is_admin' => false,
            'is_blocked' => false,
            'points' => 100,
            'verification_status' => 'verified',
            'active_status' => 'enabled',
            'role' => 'viewer',
            'remember_token' => Str::random(10),
        ]);
    }
}
