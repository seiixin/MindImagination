<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActiveGame extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'asset_id',
        'session_id',
        'started_at',
        'ended_at',
        'status',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function scopeActive($query)
    {
        return $query->whereNull('ended_at')->where('status', 'active');
    }
}
