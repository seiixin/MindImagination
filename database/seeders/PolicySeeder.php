<?php
// database/seeders/PolicySeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Policy;

class PolicySeeder extends Seeder
{
    public function run()
    {
        Policy::firstOrCreate(
            ['type' => 'privacy'],
            [
                'description' => 'Our privacy policy description goes here.',
                'items' => [
                    'We collect information you provide directly to us',
                    'We use your information to provide our services',
                    'We protect your personal information'
                ]
            ]
        );

        Policy::firstOrCreate(
            ['type' => 'about'],
            [
                'description' => 'About our company description goes here.',
                'items' => [
                    'We are a technology company',
                    'We provide innovative solutions',
                    'We value our customers'
                ]
            ]
        );
    }
}
