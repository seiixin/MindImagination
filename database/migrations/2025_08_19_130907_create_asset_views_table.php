<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('asset_views', function (Blueprint $table) {
            if (!Schema::hasColumn('asset_views', 'session_id')) {
                $table->string('session_id', 100)->nullable()->index()->after('user_id');
            }
            if (!Schema::hasColumn('asset_views', 'ip_address')) {
                $table->string('ip_address', 45)->nullable()->after('session_id');
            }
            if (!Schema::hasColumn('asset_views', 'created_at') && !Schema::hasColumn('asset_views', 'viewed_at')) {
                $table->timestamp('created_at')->nullable();
            }
        });
    }

    public function down(): void {
        Schema::table('asset_views', function (Blueprint $table) {
            if (Schema::hasColumn('asset_views', 'session_id'))  $table->dropColumn('session_id');
            if (Schema::hasColumn('asset_views', 'ip_address'))  $table->dropColumn('ip_address');
        });
    }
};
