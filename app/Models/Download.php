<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Download extends Model
{
    use HasFactory;

    // Current DB columns: id, user_id, asset_id, points_used, download_count, ip_address, user_agent, created_at, updated_at

    protected $fillable = [
        'user_id',
        'asset_id',
        'ip_address',
        'user_agent',

        // Keep legacy columns fillable since they actually exist in your table:
        'points_used',
        'download_count',
    ];

    protected $casts = [
        'points_used'   => 'integer',
        'download_count'=> 'integer',
        'created_at'    => 'datetime',
        'updated_at'    => 'datetime',
    ];

    /**
     * Always expose a computed "downloads" field in JSON.
     * Order of precedence:
     *   1) real `downloads` column (if ever added)
     *   2) `download_count` (your current downloads)
     *   3) `points_used` (legacy points)
     */
    protected $appends = ['downloads'];

    public function getDownloadsAttribute($value): int
    {
        // If a real `downloads` column exists & has value, respect it.
        if (!is_null($value)) {
            return (int) $value;
        }

        // Prefer download_count from DB row
        $dc = $this->getRawOriginal('download_count');
        if (!is_null($dc)) {
            return (int) $dc;
        }

        // Fallback to points_used
        $pu = $this->getRawOriginal('points_used');
        if (!is_null($pu)) {
            return (int) $pu;
        }

        return 0;
    }

    /** Relationships */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }
}
