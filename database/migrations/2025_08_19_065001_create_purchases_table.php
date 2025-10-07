<?php
// Migration: create_purchases_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();

            // Ownership links
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('asset_id')->constrained()->cascadeOnDelete();

            // Commercials (0 for manual grants)
            $table->unsignedInteger('points_spent')->default(0);
            $table->decimal('cost_amount', 10, 2)->default(0);
            $table->string('currency', 3)->default('PHP');

            // Lifecycle / audit
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded', 'revoked'])->default('completed');
            $table->string('source', 20)->default('manual'); // manual | checkout | system
            $table->timestamp('revoked_at')->nullable();

            $table->timestamps();

            // Lookups
            $table->index(['user_id', 'created_at']);
            $table->index(['asset_id', 'created_at']);
            $table->index(['status']);
            $table->index(['source']);

            // Prevent duplicate ownership rows in 'completed' state
            $table->unique(['user_id', 'asset_id', 'status'], 'uniq_user_asset_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
