<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->text('comments')->nullable()->after('description');
            $table->integer('viewers')->default(0)->after('comments');
            $table->float('ratings')->default(0)->after('viewers');
            $table->decimal('maintenance_cost', 10, 2)->nullable()->after('ratings');
            $table->boolean('favorites')->default(false)->after('maintenance_cost');
            // media/file paths
            $table->string('video_path')->nullable()->after('file_path');
            $table->text('sub_image_path')->nullable()->after('video_path');
            $table->string('download_file_path')->nullable()->after('sub_image_path');
            $table->string('cover_image_path')->nullable()->after('download_file_path');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn([
                'maintenance_cost',
                'favorites',
                'video_path',
                'sub_image_path',
                'download_file_path',
                'cover_image_path'
            ]);
        });
    }
};
