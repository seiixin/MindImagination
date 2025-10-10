<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use App\Models\Asset;
use App\Models\User;

class AssetView extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'asset_id',
        'user_id',
        'session_id',
        'ip_address',
        'viewed_at',
        'created_at',   // ← add this so we can set it manually when needed
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function (AssetView $view) {
            $table = $view->getTable();

            // If table has viewed_at, prefer that; otherwise fall back to created_at (nullable)
            if (Schema::hasColumn($table, 'viewed_at') && empty($view->viewed_at)) {
                $view->viewed_at = now();
            } elseif (Schema::hasColumn($table, 'created_at') && empty($view->created_at)) {
                $view->created_at = now();
            }
        });
    }

    public function asset() { return $this->belongsTo(Asset::class); }
    public function user()  { return $this->belongsTo(User::class); }

    public static function recordUnique(Asset $asset, Request $request, int $minutes = 30): array
    {
        $userId    = optional($request->user())->id;
        $sessionId = $request->session()->getId();
        $ip        = $request->ip();

        $table        = (new static)->getTable();
        $timestampCol = Schema::hasColumn($table, 'viewed_at') ? 'viewed_at' : 'created_at';

        // De-dupe by recent window (handles both auth users and guests via session)
        $q = static::query()
            ->where('asset_id', $asset->id)
            ->when($timestampCol, fn ($qq) => $qq->where($timestampCol, '>=', now()->subMinutes($minutes)));

        if ($userId) {
            $q->where('user_id', $userId);
        } elseif (Schema::hasColumn($table, 'session_id')) {
            $q->where('session_id', $sessionId);
        }

        $deduped = $q->exists();
        $created = false;
        $row     = null;

        if (!$deduped) {
            $data = [
                'asset_id' => $asset->id,
                'user_id'  => $userId,
            ];

            if (Schema::hasColumn($table, 'session_id')) $data['session_id'] = $sessionId;
            if (Schema::hasColumn($table, 'ip_address')) $data['ip_address'] = $ip;

            // ✅ Set the right timestamp column explicitly
            if ($timestampCol === 'viewed_at' && Schema::hasColumn($table, 'viewed_at')) {
                $data['viewed_at'] = now();
            } elseif ($timestampCol === 'created_at' && Schema::hasColumn($table, 'created_at')) {
                $data['created_at'] = now();
            }

            $row     = static::create($data);
            $created = true;
        }

        return ['created' => $created, 'deduped' => $deduped, 'view' => $row];
    }
}
