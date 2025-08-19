<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'description',
        'file_path',
        'price',
        'is_featured',
        'maintenance_cost',
        'video_path',
        'sub_image_path',
        'download_file_path',
        'cover_image_path'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(StoreCategory::class, 'category_id');
    }

    /** user interactions */

    public function comments()
    {
        return $this->hasMany(AssetComment::class);
    }

    public function views()
    {
        return $this->hasMany(AssetView::class);
    }

    public function ratings()
    {
        return $this->hasMany(AssetRating::class);
    }

    public function favorites()
    {
        return $this->hasMany(AssetFavorite::class);
    }

    // Optional helpers
    public function averageRating()
    {
        return $this->ratings()->avg('rating');
    }

    public function favoritesCount()
    {
        return $this->favorites()->count();
    }

    public function viewsCount()
    {
        return $this->views()->count();
    }
}
