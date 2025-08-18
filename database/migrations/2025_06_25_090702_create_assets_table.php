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

            // For Store Category relation
            $table->foreignId('category_id')
                  ->nullable()
                  ->constrained('store_categories')
                  ->onDelete('set null');

            // item details
            $table->string('title');              // item name
            $table->text('description')->nullable();
            $table->string('file_path')->nullable(); // allow null for admin
            $table->decimal('price', 8, 2)->default(0);
            $table->boolean('is_featured')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
