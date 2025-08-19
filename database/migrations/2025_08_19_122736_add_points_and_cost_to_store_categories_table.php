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
        Schema::table('store_categories', function (Blueprint $table) {
            $table->integer('additional_points')->nullable();
            $table->decimal('purchase_cost', 10, 2)->nullable();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_categories', function (Blueprint $table) {
            //
        });
    }
};
