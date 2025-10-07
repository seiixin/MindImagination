<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    use HasFactory;

    // Status constants
    public const STATUS_PENDING   = 'pending';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED    = 'failed';
    public const STATUS_REFUNDED  = 'refunded';
    public const STATUS_REVOKED   = 'revoked';

    // Source constants
    public const SOURCE_MANUAL   = 'manual';
    public const SOURCE_CHECKOUT = 'checkout';
    public const SOURCE_SYSTEM   = 'system';

    protected $fillable = [
        'user_id',
        'asset_id',
        'points_spent',
        'cost_amount',
        'currency',
        'status',
        'source',
        'revoked_at',
    ];

    protected $attributes = [
        'points_spent' => 0,
        'cost_amount'  => 0.00,
        'currency'     => 'PHP',
        'status'       => self::STATUS_COMPLETED,
        'source'       => self::SOURCE_MANUAL,
    ];

    protected $casts = [
        'points_spent' => 'integer',
        'cost_amount'  => 'decimal:2',
        'revoked_at'   => 'datetime',
        'created_at'   => 'datetime',
        'updated_at'   => 'datetime',
    ];

    /* ------------------------------ Relations ------------------------------ */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    /* -------------------------------- Scopes -------------------------------- */

    /** Only completed (owned) items */
    public function scopeOwned($q)
    {
        return $q->where('status', self::STATUS_COMPLETED);
    }

    /** Only manual grants (admin-assigned) */
    public function scopeManual($q)
    {
        return $q->where('source', self::SOURCE_MANUAL);
    }

    /** Not revoked (still usable) */
    public function scopeActive($q)
    {
        return $q->whereNull('revoked_at')->where('status', self::STATUS_COMPLETED);
    }

    /* ------------------------------ Helpers -------------------------------- */

    /**
     * Grant (or ensure) ownership. Uses the unique (user_id, asset_id, status) index.
     */
    public static function grantManual(int $userId, int $assetId): self
    {
        return static::updateOrCreate(
            ['user_id' => $userId, 'asset_id' => $assetId, 'status' => self::STATUS_COMPLETED],
            [
                'source'       => self::SOURCE_MANUAL,
                'points_spent' => 0,
                'cost_amount'  => 0,
                'currency'     => 'PHP',
                'revoked_at'   => null,
            ]
        );
    }

    /**
     * Revoke ownership (soft revoke, keeps audit trail).
     */
    public function revoke(): bool
    {
        return $this->update([
            'status'     => self::STATUS_REVOKED,
            'revoked_at' => now(),
        ]);
    }
}
