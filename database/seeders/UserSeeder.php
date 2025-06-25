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
        // Normal User Account
        User::create([
            'username' => 'sidneyuser',
            'name' => 'Sidney Garcinan',
            'email' => 'sidneygarcinan@gmail.com',
            'mobile_number' => '09171234567',
            'email_verified_at' => now(),
            'password' => Hash::make('112803Ss'),
            'is_admin' => false,
            'is_blocked' => false,
            'points' => 0,
            'remember_token' => Str::random(10),
        ]);

        // Admin Account
        User::create([
            'username' => 'adminmaster',
            'name' => 'Admin Master',
            'email' => 'admin@example.com',
            'mobile_number' => '09179876543',
            'email_verified_at' => now(),
            'password' => Hash::make('112803Ss'),
            'is_admin' => true,
            'is_blocked' => false,
            'points' => 0,
            'remember_token' => Str::random(10),
        ]);
    }
}
