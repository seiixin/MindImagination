<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1) Create table if it doesn't exist
        if (!Schema::hasTable('downloads')) {
            Schema::create('downloads', function (Blueprint $table) {
                $table->id();

                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('asset_id')->constrained()->cascadeOnDelete();

                // Counters used by app code today
                $table->unsignedInteger('download_count')->default(0);
                $table->integer('points_used')->nullable()->default(0);

                $table->string('ip_address', 45)->nullable();
                $table->string('user_agent', 255)->nullable();

                $table->timestamps();
                // Optional: only on fresh create to avoid collisions
                $table->index(['asset_id', 'created_at']);
                $table->index(['user_id', 'asset_id']);
            });

            return;
        }

        // 2) If it exists, add any missing columns safely
        Schema::table('downloads', function (Blueprint $table) {
            if (!Schema::hasColumn('downloads', 'download_count')) {
                $table->unsignedInteger('download_count')->default(0)->after('asset_id');
            }
            if (!Schema::hasColumn('downloads', 'points_used')) {
                $table->integer('points_used')->nullable()->default(0)->after('download_count');
            }
            if (!Schema::hasColumn('downloads', 'ip_address')) {
                $table->string('ip_address', 45)->nullable()->after('points_used');
            }
            if (!Schema::hasColumn('downloads', 'user_agent')) {
                $table->string('user_agent', 255)->nullable()->after('ip_address');
            }

            // Timestamps: add what’s missing only
            $hasCreated = Schema::hasColumn('downloads', 'created_at');
            $hasUpdated = Schema::hasColumn('downloads', 'updated_at');
            if (!$hasCreated && !$hasUpdated) {
                $table->timestamps();
            } else {
                if (!$hasCreated) {
                    $table->timestamp('created_at')->nullable()->useCurrent();
                }
                if (!$hasUpdated) {
                    $table->timestamp('updated_at')->nullable()->useCurrentOnUpdate()->useCurrent();
                }
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('downloads')) {
            return;
        }

        // Best-effort rollback: huwag galawin ang counters para di mawala data
        Schema::table('downloads', function (Blueprint $table) {
            if (Schema::hasColumn('downloads', 'user_agent')) {
                $table->dropColumn('user_agent');
            }
            if (Schema::hasColumn('downloads', 'ip_address')) {
                $table->dropColumn('ip_address');
            }
            // Intentionally NOT dropping download_count / points_used
        });
    }
};
