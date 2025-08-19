<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create chat_conversations table
        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('subject')->nullable();
            $table->enum('status', ['open', 'in_progress', 'resolved', 'closed'])->default('open');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->timestamp('last_message_at')->nullable();
            $table->timestamp('admin_read_at')->nullable();
            $table->timestamp('user_read_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'priority']);
            $table->index('last_message_at');
        });

        // Create chat_messages table
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('chat_conversations')->onDelete('cascade');
            $table->enum('sender_type', ['user', 'admin']);
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->text('message');
            $table->string('attachment_path')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
            $table->index('sender_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_conversations');
    }
};
