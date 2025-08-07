<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('contact_settings', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->string('facebook')->nullable();
            $table->string('discord')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('website')->nullable();
            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contact_settings');
    }
};
