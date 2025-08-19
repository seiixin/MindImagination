<?php

// Migration: create_active_games_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('active_games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('asset_id')->constrained()->onDelete('cascade');
            $table->string('session_id')->unique();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->enum('status', ['active', 'ended', 'crashed', 'timeout'])->default('active');
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['asset_id', 'status']);
            $table->index(['started_at', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('active_games');
    }
};
