<?php
// Migration: create_purchases_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('asset_id')->constrained()->onDelete('cascade');
            $table->integer('points_spent');
            $table->decimal('cost_amount', 10, 2);
            $table->string('currency', 3)->default('PHP');
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('completed');
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['asset_id', 'created_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('purchases');
    }
};
