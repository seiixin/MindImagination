<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class StorePlan extends Model
{
    use HasFactory;

    /**
     * Mass-assignable attributes.
     * Keep both image_url (for external links) and image_path (for uploaded files).
     */
    protected $fillable = [
        'name',
        'points',
        'price',
        'image_url',  
        'image_path',  
        'active',
    ];

    /**
     * Always include the computed image_url in array/JSON output.
     */
    protected $appends = ['image_url'];

    /**
     * Helpful casts.
     */
    protected $casts = [
        'points' => 'integer',
        'price'  => 'decimal:2',
        'active' => 'boolean',
    ];

    /**
     * Accessor: prefer the stored public file URL; fallback to external image_url column.
     *
     * @return string|null
     */
    public function getImageUrlAttribute(): ?string
    {
        // Prefer uploaded file in public disk (e.g., public/storage/plans/{imagecode})
        $path = $this->attributes['image_path'] ?? null;
        if (!empty($path)) {
            try {
                return Storage::disk('public')->url($path);
            } catch (\Throwable $e) {
                // If disk/url resolution fails, fall through to external URL
            }
        }

        // Fallback: whatever is in the DB's image_url column (external link)
        return $this->attributes['image_url'] ?? null;
    }
}
