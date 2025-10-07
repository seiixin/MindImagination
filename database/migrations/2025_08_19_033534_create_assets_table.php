<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();

            // owner/user
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Store Category relation
            $table->foreignId('category_id')
                ->nullable()
                ->constrained('store_categories')
                ->nullOnDelete();

            // item details
            $table->string('title');                       // item name
            $table->text('description')->nullable();
            $table->string('file_path')->nullable();       // allow null for admin uploads
            $table->decimal('price', 10, 2)->default(0);   // per-asset price
            $table->unsignedInteger('points')->default(0); // per-asset points
            $table->boolean('is_featured')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
