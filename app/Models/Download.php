<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Download extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'asset_id',
        'points_used',
        'download_count',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'points_used' => 'integer',
        'download_count' => 'integer',
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
}
