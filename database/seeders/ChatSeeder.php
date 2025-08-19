<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use Illuminate\Support\Facades\Hash;

class ChatSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure there is an admin to reply to messages
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name'          => 'System Admin',
                'username'      => 'admin',
                'mobile_number' => '09999999999',
                'password'      => Hash::make('password'),
                'is_admin'      => true,
            ]
        );

        // create dummy users (clients)
        $users = [
            [
                'name'          => 'Maria Cruz',
                'email'         => 'maria@example.com',
                'username'      => 'maria',
                'mobile_number' => '09171234567',
            ],
            [
                'name'          => 'Juan Dela Cruz',
                'email'         => 'juan@example.com',
                'username'      => 'juan',
                'mobile_number' => '09281234567',
            ],
            [
                'name'          => 'Ana Reyes',
                'email'         => 'ana@example.com',
                'username'      => 'ana',
                'mobile_number' => '09391234567',
            ],
        ];

        foreach ($users as $u) {
            $user = User::firstOrCreate(
                ['mobile_number' => $u['mobile_number']],   // won't duplicate if already inserted
                $u + ['password' => Hash::make('password')]
            );

            // Create a conversation
            $conversation = ChatConversation::create([
                'user_id'         => $user->id,
                'subject'         => 'Need help with my account',
                'status'          => 'open',
                'priority'        => 'medium',
                'last_message_at' => now(),
            ]);

            // Seed sample messages
            ChatMessage::create([
                'conversation_id' => $conversation->id,
                'sender_type'     => 'user',
                'sender_id'       => $user->id,
                'message'         => 'Hello admin, I need help with something.',
                'is_read'         => false,
            ]);

            ChatMessage::create([
                'conversation_id' => $conversation->id,
                'sender_type'     => 'admin',
                'sender_id'       => $admin->id,
                'message'         => 'Sure — how can I assist you?',
                'is_read'         => true,
            ]);
        }
    }
}
