<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender_type',
        'sender_id',
        'message',
        'attachment_path',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'created_at' => 'datetime',
    ];

    // Relationship with Conversation
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    // Polymorphic relationship with sender (User or Admin)
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    // Check if message is from admin
    public function isFromAdmin(): bool
    {
        return $this->sender_type === 'admin';
    }

    // Check if message is from user
    public function isFromUser(): bool
    {
        return $this->sender_type === 'user';
    }

    // Boot method to update conversation timestamp
    protected static function boot()
    {
        parent::boot();

        static::created(function ($message) {
            // Update the conversation's last_message_at timestamp
            $message->conversation->update([
                'last_message_at' => $message->created_at
            ]);
        });
    }
}
