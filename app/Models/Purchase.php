<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    use HasFactory;

    /* ----------------------------------------------------------------------
     | Status & Source constants (match DB values)
     * ---------------------------------------------------------------------- */
    public const STATUS_PENDING   = 'pending';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED    = 'failed';

    // Your DB stores "revoked". We alias "refunded" to the same DB value.
    public const STATUS_REVOKED   = 'revoked';
    public const STATUS_REFUNDED  = self::STATUS_REVOKED;

    public const SOURCE_MANUAL    = 'manual';
    public const SOURCE_CHECKOUT  = 'checkout';
    public const SOURCE_SYSTEM    = 'system';

    /* ----------------------------------------------------------------------
     | Mass assignment / defaults / casts
     * ---------------------------------------------------------------------- */
    protected $fillable = [
        'user_id',
        'asset_id',
        'points_spent',  // snapshot of asset->points at time of grant
        'cost_amount',   // snapshot of asset->price at time of grant
        'currency',
        'status',
        'source',
        // ❌ no revoked_at column referenced
    ];

    // Reasonable defaults for manual admin grants
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
        'created_at'   => 'datetime',
        'updated_at'   => 'datetime',
        // ❌ no revoked_at cast
    ];

    /* ----------------------------------------------------------------------
     | Relationships
     * ---------------------------------------------------------------------- */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    /* ----------------------------------------------------------------------
     | Scopes
     * ---------------------------------------------------------------------- */
    /** Completed/owned */
    public function scopeOwned($q)
    {
        return $q->where('status', self::STATUS_COMPLETED);
    }

    /** Manual grants (admin) */
    public function scopeManual($q)
    {
        return $q->where('source', self::SOURCE_MANUAL);
    }

    /**
     * Active = currently owned (just "completed" in DB).
     * (No revoked_at filtering since we don't have that column.)
     */
    public function scopeActive($q)
    {
        return $q->where('status', self::STATUS_COMPLETED);
    }

    /** Refunded (alias) -> actually rows with status "revoked" */
    public function scopeRefunded($q)
    {
        return $q->where('status', self::STATUS_REFUNDED); // == 'revoked'
    }

    /* ----------------------------------------------------------------------
     | Helpers (optional, for cleaner controllers)
     * ---------------------------------------------------------------------- */

    /**
     * Grant (or ensure) ownership with zero snapshots.
     * Useful for legacy/manual grants; controller prefers explicit snapshots.
     */
    public static function grantManual(int $userId, int $assetId): self
    {
        return static::updateOrCreate(
            [
                'user_id' => $userId,
                'asset_id' => $assetId,
                'status' => self::STATUS_COMPLETED,
            ],
            [
                'source'       => self::SOURCE_MANUAL,
                'points_spent' => 0,
                'cost_amount'  => 0,
                'currency'     => 'PHP',
            ]
        );
    }

    /**
     * Complete a purchase taking snapshots from an Asset model.
     * (Does not modify user points—controller already did that.)
     */
    public function completeWithSnapshotFromAsset(?\App\Models\Asset $asset): self
    {
        $updates = [];

        if ($this->status !== self::STATUS_COMPLETED) {
            $updates['status'] = self::STATUS_COMPLETED;
        }
        if ($asset) {
            if ($this->points_spent === null) {
                $updates['points_spent'] = (int) ($asset->points ?? 0);
            }
            if ($this->cost_amount === null) {
                $updates['cost_amount'] = (float) ($asset->price ?? 0);
            }
        }

        if (!empty($updates)) {
            $this->update($updates);
        }

        return $this->fresh();
    }

    /**
     * Mark as refunded (alias -> sets status to "revoked").
     * Controller handles any user points refund.
     */
    public function markRefunded(): bool
    {
        return $this->update(['status' => self::STATUS_REFUNDED]); // writes "revoked"
    }

    /**
     * Legacy soft revoke (equivalent to markRefunded).
     */
    public function revoke(): bool
    {
        return $this->update(['status' => self::STATUS_REVOKED]);
    }
}
