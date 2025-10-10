<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class AssetView extends Model
{
    use HasFactory;

    /**
     * We manage timestamps manually to support:
     * - public tracking via viewed_at or created_at
     * - admin-generated dummy rows with explicit created_at/updated_at
     */
    public $timestamps = false;

    /**
     * Allow plain creates for admin dummy data.
     */
    protected $fillable = [
        'asset_id',
        'user_id',
        'session_id',
        'ip_address',
        'viewed_at',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'viewed_at'  => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function (AssetView $view) {
            $table = $view->getTable();

            // Prefer an explicit "viewed_at" column if present; otherwise use created_at.
            if (Schema::hasColumn($table, 'viewed_at') && empty($view->viewed_at)) {
                $view->viewed_at = now();
            } elseif (Schema::hasColumn($table, 'created_at') && empty($view->created_at)) {
                $view->created_at = now();
            }

            // Mirror updated_at when present so admin bulk inserts look consistent.
            if (Schema::hasColumn($table, 'updated_at') && empty($view->updated_at)) {
                $view->updated_at = $view->created_at ?? now();
            }
        });
    }

    /* -----------------------------------------------------------------
     | Relationships
     * -----------------------------------------------------------------*/
    public function asset()
    {
        return $this->belongsTo(Asset::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /* -----------------------------------------------------------------
     | Public tracking helper (kept as-is, with light resiliency)
     | De-dupes by recent window using user_id OR session_id (fallback ip).
     * -----------------------------------------------------------------*/
    public static function recordUnique(Asset $asset, Request $request, int $minutes = 30): array
    {
        $userId    = optional($request->user())->id;
        $sessionId = $request->hasSession() ? $request->session()->getId() : null;
        $ip        = $request->ip();

        $table        = (new static)->getTable();
        $hasViewedAt  = Schema::hasColumn($table, 'viewed_at');
        $hasCreatedAt = Schema::hasColumn($table, 'created_at');
        $hasUpdatedAt = Schema::hasColumn($table, 'updated_at');
        $hasSessionId = Schema::hasColumn($table, 'session_id');
        $hasIp        = Schema::hasColumn($table, 'ip_address');

        // Choose the timestamp column used for the time window
        $timestampCol = $hasViewedAt ? 'viewed_at' : ($hasCreatedAt ? 'created_at' : null);

        $q = static::query()->where('asset_id', $asset->id);

        if ($timestampCol) {
            $q->where($timestampCol, '>=', now()->subMinutes($minutes));
        }

        if ($userId) {
            $q->where('user_id', $userId);
        } elseif ($hasSessionId && $sessionId) {
            $q->where('session_id', $sessionId);
        } elseif ($hasIp && $ip) {
            // Fallback when session_id column is missing
            $q->where('ip_address', $ip);
        }

        $deduped = $q->exists();
        $created = false;
        $row     = null;

        if (!$deduped) {
            $data = [
                'asset_id' => $asset->id,
                'user_id'  => $userId,
            ];

            if ($hasSessionId) $data['session_id'] = $sessionId;
            if ($hasIp)        $data['ip_address'] = $ip;

            // Set timestamps explicitly based on available columns
            if ($hasViewedAt) {
                $data['viewed_at'] = now();
            } elseif ($hasCreatedAt) {
                $data['created_at'] = now();
            }
            if ($hasUpdatedAt) {
                $data['updated_at'] = $data['created_at'] ?? $data['viewed_at'] ?? now();
            }

            $row     = static::create($data);
            $created = true;
        }

        return [
            'created' => $created,
            'deduped' => $deduped,
            'view'    => $row,
        ];
    }
}
