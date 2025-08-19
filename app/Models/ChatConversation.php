<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'subject',
        'status',
        'priority',
        'last_message_at',
        'admin_read_at',
        'user_read_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'admin_read_at' => 'datetime',
        'user_read_at' => 'datetime',
    ];

    // Relationship with User
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Relationship with Messages
    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id')->orderBy('created_at');
    }

    // Get latest message
    public function latestMessage(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id')->latest();
    }

    // Scope for unread conversations by admin
    public function scopeUnreadByAdmin($query)
    {
        return $query->whereNull('admin_read_at')
                    ->orWhere('admin_read_at', '<', 'last_message_at');
    }

    // Check if conversation has unread messages for admin
    public function hasUnreadMessagesForAdmin(): bool
    {
        if (!$this->admin_read_at) {
            return $this->messages()->exists();
        }

        return $this->messages()
                   ->where('created_at', '>', $this->admin_read_at)
                   ->where('sender_type', '!=', 'admin')
                   ->exists();
    }

    // Mark as read by admin
    public function markAsReadByAdmin(): void
    {
        $this->update(['admin_read_at' => now()]);
    }

    // Mark as read by user
    public function markAsReadByUser(): void
    {
        $this->update(['user_read_at' => now()]);
    }
}
