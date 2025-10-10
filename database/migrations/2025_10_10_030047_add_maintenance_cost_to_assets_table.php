<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('assets', 'maintenance_cost')) {
            Schema::table('assets', function (Blueprint $table) {
                $table->decimal('maintenance_cost', 10, 2)
                      ->default(0)
                      ->after('price');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('assets', 'maintenance_cost')) {
            Schema::table('assets', function (Blueprint $table) {
                $table->dropColumn('maintenance_cost');
            });
        }
    }
};
