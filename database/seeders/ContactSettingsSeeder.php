<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ContactSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('contact_settings')->insert([
            'email'     => 'contact@example.com',
            'facebook'  => 'https://facebook.com/example',
            'discord'   => 'https://discord.gg/example',
            'phone'     => '+1234567890',
            'address'   => '123 Example Street, City, Country',
            'website'   => 'https://example.com',
            'created_at'=> now(),
            'updated_at'=> now(),
        ]);
    }
}
