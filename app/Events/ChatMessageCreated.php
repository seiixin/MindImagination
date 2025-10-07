<?php

namespace App\Events;

use App\Models\ChatMessage;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class ChatMessageCreated implements ShouldBroadcastNow
{
    use SerializesModels;

    public function __construct(public ChatMessage $message) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('chat.conversation.'.$this->message->conversation_id)];
    }

    public function broadcastAs(): string
    {
        return 'message.created';
    }

    public function broadcastWith(): array
    {
        // normalize payload for React (same keys the UI already expects)
        $m = $this->message->loadMissing('sender:id,name');
        return [
            'id'              => $m->id,
            'message'         => $m->message,
            'sender_type'     => $m->sender_type,
            'sender_name'     => $m->sender?->name,
            'attachment_path' => $m->attachment_path,
            'attachment_url'  => $m->attachment_path ? \Storage::disk('public')->url($m->attachment_path) : null,
            'created_at'      => $m->created_at->format('h:i A'),
            'full_date'       => $m->created_at->format('M d, Y h:i A'),
            'conversation_id' => $m->conversation_id,
        ];
    }
}
