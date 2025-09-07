<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Asset extends Model
{
    use HasFactory;

    /** Public filesystem disk */
    protected string $mediaDisk = 'public';
    /** Default folder for media on the public disk */
    protected string $mediaDir  = 'assets';

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
        'sub_image_path',      // JSON string in DB
        'download_file_path',
        'cover_image_path',
    ];

    /** Always include resolved URLs in the API payload */
    protected $appends = [
        'file_url',
        'cover_image_url',
        'video_url',
        'download_file_url',
        'sub_image_urls',
    ];

    /* ================= Relations ================= */

    public function user()      { return $this->belongsTo(User::class); }
    public function category()  { return $this->belongsTo(StoreCategory::class, 'category_id'); }
    public function comments()  { return $this->hasMany(AssetComment::class); }
    public function views()     { return $this->hasMany(AssetView::class); }
    public function ratings()   { return $this->hasMany(AssetRating::class); }
    public function favorites() { return $this->hasMany(AssetFavorite::class); }

    public function averageRating()  { return $this->ratings()->avg('rating'); }
    public function favoritesCount() { return $this->favorites()->count(); }
    public function viewsCount()     { return $this->views()->count(); }

    /* ================= Helpers ================= */

    /**
     * Build a public URL from any stored/legacy value.
     * Accepts:
     *  - absolute URLs (returned as-is)
     *  - "/storage/..." (returned with APP_URL)
     *  - "assets/xyz.png" (relative on public disk)
     *  - "xyz.png" (bare filename -> assumed inside assets/)
     */
    protected function toPublicUrl(?string $path): ?string
    {
        if (!$path) return null;

        // Absolute URL
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        // Legacy absolute storage path
        if (str_starts_with($path, '/storage/')) {
            return url($path);
        }

        // Normalize: trim leading slash
        $path = ltrim($path, '/');

        // If just a filename (no slash), assume it's under the media folder
        if (!str_contains($path, '/')) {
            $path = "{$this->mediaDir}/{$path}";
        }

        // Normal case: relative path on the public disk
        return Storage::disk($this->mediaDisk)->url($path); // -> /storage/{relative}
    }

    /**
     * Normalize any incoming value to a clean relative path we store in DB.
     * E.g. full URL -> strip APP_URL, "/storage/assets/..." -> "assets/...",
     * bare filename -> "assets/filename.ext"
     */
    protected function toRelativePath(?string $path): ?string
    {
        if (!$path) return null;

        $path = trim($path);

        // Strip APP_URL prefix if present
        $app = rtrim(config('app.url'), '/');
        if ($app && str_starts_with($path, $app)) {
            $path = substr($path, strlen($app));
        }

        // Normalize leading slash
        $path = ltrim($path, '/');

        // If value is like "storage/...", convert to disk-relative
        if (str_starts_with($path, 'storage/')) {
            $path = preg_replace('#^storage/#', '', $path); // -> "assets/..."
        }

        // If it's just a filename, force it to our media folder
        if (!str_contains($path, '/')) {
            $path = "{$this->mediaDir}/{$path}";
        }

        return $path; // e.g. "assets/xyz.png"
    }

    protected function toPublicUrlsFromRaw($raw): array
    {
        if (!$raw) return [];
        $arr = is_array($raw) ? $raw : json_decode($raw, true);
        if (!is_array($arr)) return [];
        return array_values(array_filter(array_map(
            fn ($v) => is_string($v) && $v !== '' ? $this->toPublicUrl($v) : null,
            $arr
        )));
    }

    protected function toRelativeArray($value): array
    {
        if (!$value) return [];
        $arr = is_array($value) ? $value : json_decode($value, true);
        if (!is_array($arr)) return [];
        return array_values(array_filter(array_map(
            fn ($v) => is_string($v) && $v !== '' ? $this->toRelativePath($v) : null,
            $arr
        )));
    }

    /* ================= Accessors: return absolute URLs ================= */

    public function getFilePathAttribute($value)
    {
        return $this->toPublicUrl($this->getRawOriginal('file_path'));
    }

    public function getCoverImagePathAttribute($value)
    {
        return $this->toPublicUrl($this->getRawOriginal('cover_image_path'));
    }

    public function getVideoPathAttribute($value)
    {
        return $this->toPublicUrl($this->getRawOriginal('video_path'));
    }

    public function getDownloadFilePathAttribute($value)
    {
        return $this->toPublicUrl($this->getRawOriginal('download_file_path'));
    }

    public function getSubImagePathAttribute($value)
    {
        return $this->toPublicUrlsFromRaw($this->getRawOriginal('sub_image_path'));
    }

    /* =============== Mutators: store relative paths in DB =============== */

    public function setFilePathAttribute($value)
    {
        $this->attributes['file_path'] = $this->toRelativePath($value);
    }

    public function setCoverImagePathAttribute($value)
    {
        $this->attributes['cover_image_path'] = $this->toRelativePath($value);
    }

    public function setVideoPathAttribute($value)
    {
        $this->attributes['video_path'] = $this->toRelativePath($value);
    }

    public function setDownloadFilePathAttribute($value)
    {
        $this->attributes['download_file_path'] = $this->toRelativePath($value);
    }

    public function setSubImagePathAttribute($value)
    {
        $this->attributes['sub_image_path'] = json_encode($this->toRelativeArray($value));
    }

    /* =============== Appended convenience fields ================= */

    public function getFileUrlAttribute()         { return $this->file_path; }
    public function getCoverImageUrlAttribute()   { return $this->cover_image_path; }
    public function getVideoUrlAttribute()        { return $this->video_path; }
    public function getDownloadFileUrlAttribute() { return $this->download_file_path; }
    public function getSubImageUrlsAttribute()    { return $this->sub_image_path; }
}
