<?php

// database/migrations/2025_10_09_000001_refactor_downloads_points_to_downloads.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('downloads', function (Blueprint $table) {
            if (Schema::hasColumn('downloads', 'points_used')) {
                // requires doctrine/dbal
                $table->renameColumn('points_used', 'downloads');
            }

            // If you previously tracked both points_used + download_count,
            // keep only one canonical column: `downloads`
            if (Schema::hasColumn('downloads', 'download_count') && Schema::hasColumn('downloads', 'downloads')) {
                // Optional: if you want to preserve existing counts from download_count
                // run this SQL once before dropping the column:
                // DB::statement('UPDATE downloads SET downloads = COALESCE(download_count, downloads)');

                $table->dropColumn('download_count');
            }
        });
    }

    public function down(): void
    {
        Schema::table('downloads', function (Blueprint $table) {
            // best-effort rollback (adds the old columns back empty)
            if (!Schema::hasColumn('downloads', 'points_used')) {
                $table->integer('points_used')->nullable();
            }
            if (!Schema::hasColumn('downloads', 'download_count')) {
                $table->integer('download_count')->nullable();
            }
        });
    }
};
