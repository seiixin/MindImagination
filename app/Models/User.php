<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
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

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'is_blocked' => 'boolean',
            'points' => 'integer',
        ];
    }

    /**
     * Boot method to add model event listeners
     */
    protected static function boot()
    {
        parent::boot();

        // Debug: Log when user is being updated
        static::updating(function ($user) {
            \Log::info('User model updating event triggered', [
                'user_id' => $user->id,
                'dirty_fields' => $user->getDirty(),
                'original_values' => array_intersect_key($user->getOriginal(), $user->getDirty())
            ]);
        });

        // Debug: Log after user is updated
        static::updated(function ($user) {
            \Log::info('User model updated event triggered', [
                'user_id' => $user->id,
                'current_values' => $user->only([
                    'verification_status',
                    'active_status',
                    'role',
                    'points',
                    'address'
                ])
            ]);
        });
    }
}
