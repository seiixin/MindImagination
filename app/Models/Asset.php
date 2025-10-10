<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory;

    /* ----------------------------------------------------------------------
     | Mass Assignment / Casts
     * ---------------------------------------------------------------------- */

    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'description',
        'file_path',
        'price',
        'points',
        'is_featured',
        'maintenance_cost',
        'video_path',
        'sub_image_path',
        'download_file_path',
        'cover_image_path',
    ];

    protected $casts = [
        'price'            => 'decimal:2',
        'maintenance_cost' => 'decimal:2',
        'points'           => 'integer',
        'sub_image_path'   => 'array',
        'is_featured'      => 'boolean',
    ];

    // Make computed attributes show up in arrays/JSON
    protected $appends = [
        'image_url',
        'is_premium',
        'has_maintenance',
    ];

    /* ----------------------------------------------------------------------
     | Relationships
     * ---------------------------------------------------------------------- */

    /** Catalog creator/owner (not the same as buyers) */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(StoreCategory::class, 'category_id');
    }

    /** Purchases linking users who own this asset (manual or checkout) */
    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    /**
     * Users who currently own this asset (completed + not revoked).
     */
    public function owners()
    {
        return $this->belongsToMany(User::class, 'purchases')
            ->withPivot(['status', 'source', 'revoked_at'])
            ->wherePivot('status', Purchase::STATUS_COMPLETED)
            ->wherePivotNull('revoked_at');
    }

    /** ----------------------- User interactions ----------------------- */
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

    /* ----------------------------------------------------------------------
     | Scopes
     * ---------------------------------------------------------------------- */

    /**
     * Assets owned by a specific user (completed + not revoked).
     * Example: Asset::ownedBy($userId)->get();
     */
    public function scopeOwnedBy($query, int $userId)
    {
        return $query->whereHas('purchases', function ($q) use ($userId) {
            $q->where('user_id', $userId)
              ->where('status', Purchase::STATUS_COMPLETED)
              ->whereNull('revoked_at');
        });
    }

    /* ----------------------------------------------------------------------
     | Accessors / Helpers
     * ---------------------------------------------------------------------- */

    /** Prefer cover image; fallback to main file path */
    public function getImageUrlAttribute(): ?string
    {
        return $this->cover_image_path ?: $this->file_path;
    }

    /** Treat as premium if it costs either money or points */
    public function getIsPremiumAttribute(): bool
    {
        return (float) $this->price > 0 || (int) $this->points > 0;
    }

    /** NEW: flag to show maintenance badge */
    public function getHasMaintenanceAttribute(): bool
    {
        return (float) ($this->maintenance_cost ?? 0) > 0;
    }

    // Optional helpers you already had
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
