<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /* ----------------------------------------------------------------------
     | Mass Assignment / Hidden / Casts
     * ---------------------------------------------------------------------- */

    protected $fillable = [
        'name',
        'username',
        'email',
        'mobile_number',
        'address',
        'password',
        'is_admin',
        'is_blocked',
        'points',
        'verification_status',
        'active_status',
        'role',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_admin'          => 'boolean',
            'is_blocked'        => 'boolean',
            'points'            => 'integer',
        ];
    }

    /* ----------------------------------------------------------------------
     | Relationships
     * ---------------------------------------------------------------------- */

    /** Assets created/published by this user (catalog owner/creator) */
    public function assets()
    {
        return $this->hasMany(Asset::class);
    }

    /** Purchase rows (canonical user↔asset ownership, incl. manual grants) */
    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    /** Convenience: only completed (owned) purchases, still active (not revoked) */
    public function ownedPurchases()
    {
        return $this->purchases()->active();
    }

    /** Retrieve Assets owned by the user via purchases (completed & active) */
    public function ownedAssets()
    {
        return Asset::query()
            ->select('assets.*')
            ->join('purchases', 'purchases.asset_id', '=', 'assets.id')
            ->where('purchases.user_id', $this->id)
            ->where('purchases.status', Purchase::STATUS_COMPLETED)
            ->whereNull('purchases.revoked_at');
    }

    /* ----------------------------------------------------------------------
     | Attribute / Helper Methods
     * ---------------------------------------------------------------------- */

    public function isAdmin(): bool
    {
        // Either boolean flag or role enum—treat either as admin
        return (bool) $this->is_admin || $this->role === 'admin';
    }

    public function isEnabled(): bool
    {
        return $this->active_status === 'enabled' && !$this->is_blocked;
    }

    /** Quick check if user already owns the given asset id */
    public function ownsAsset(int $assetId): bool
    {
        return $this->purchases()
            ->where('asset_id', $assetId)
            ->where('status', Purchase::STATUS_COMPLETED)
            ->whereNull('revoked_at')
            ->exists();
    }

    /** Grant an asset manually (idempotent via unique index + updateOrCreate) */
    public function grantAssetManually(int $assetId): Purchase
    {
        return Purchase::grantManual($this->id, $assetId);
    }

    /* ----------------------------------------------------------------------
     | Model Events (debug logs)
     * ---------------------------------------------------------------------- */

    protected static function boot()
    {
        parent::boot();

        static::updating(function ($user) {
            \Log::info('User model updating event triggered', [
                'user_id'       => $user->id,
                'dirty_fields'  => $user->getDirty(),
                'original_vals' => array_intersect_key($user->getOriginal(), $user->getDirty()),
            ]);
        });

        static::updated(function ($user) {
            \Log::info('User model updated event triggered', [
                'user_id'        => $user->id,
                'current_values' => $user->only([
                    'verification_status',
                    'active_status',
                    'role',
                    'points',
                    'address',
                ]),
            ]);
        });
    }
}
