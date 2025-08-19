<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ChatController extends Controller
{
    /**
     * Get all conversations for admin
     */
    public function getConversations()
    {
        $conversations = ChatConversation::with(['user:id,name,email', 'latestMessage'])
            ->orderByDesc('last_message_at')
            ->get()
            ->map(function ($conversation) {
                $latestMessage = $conversation->latestMessage->first();

                return [
                    'id' => $conversation->id,
                    'user_id' => $conversation->user_id,
                    'user_name' => $conversation->user->name,
                    'user_email' => $conversation->user->email,
                    'subject' => $conversation->subject,
                    'status' => $conversation->status,
                    'priority' => $conversation->priority,
                    'last_message' => $latestMessage ? $latestMessage->message : '',
                    'last_message_time' => $conversation->last_message_at?->diffForHumans(),
                    'unread' => $conversation->hasUnreadMessagesForAdmin(),
                    'created_at' => $conversation->created_at->format('M d, Y h:i A'),
                ];
            });

        return response()->json($conversations);
    }

    /**
     * Get messages for a specific conversation
     */
    public function getMessages(ChatConversation $conversation)
    {
        $messages = $conversation->messages()
            ->with('sender:id,name')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'message' => $message->message,
                    'sender_type' => $message->sender_type,
                    'sender_name' => $message->sender->name,
                    'attachment_path' => $message->attachment_path,
                    'created_at' => $message->created_at->format('h:i A'),
                    'full_date' => $message->created_at->format('M d, Y h:i A'),
                    'is_read' => $message->is_read,
                ];
            });

        // Mark conversation as read by admin
        $conversation->markAsReadByAdmin();

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'user_name' => $conversation->user->name,
                'user_email' => $conversation->user->email,
                'subject' => $conversation->subject,
                'status' => $conversation->status,
                'priority' => $conversation->priority,
            ],
            'messages' => $messages,
        ]);
    }

    /**
     * Send a message as admin
     */
    public function sendMessage(Request $request, ChatConversation $conversation)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'attachment' => 'nullable|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx',
        ]);

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('chat-attachments', 'public');
        }

        $message = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'admin',
            'sender_id' => Auth::id(),
            'message' => $request->message,
            'attachment_path' => $attachmentPath,
        ]);

        // Update conversation status if it was closed
        if ($conversation->status === 'closed') {
            $conversation->update(['status' => 'open']);
        }

        return response()->json([
            'id' => $message->id,
            'message' => $message->message,
            'sender_type' => $message->sender_type,
            'sender_name' => Auth::user()->name,
            'attachment_path' => $message->attachment_path,
            'created_at' => $message->created_at->format('h:i A'),
            'full_date' => $message->created_at->format('M d, Y h:i A'),
        ]);
    }

    /**
     * Update conversation status
     */
    public function updateConversationStatus(Request $request, ChatConversation $conversation)
    {
        $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
        ]);

        $conversation->update([
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'Conversation status updated successfully',
            'status' => $conversation->status,
        ]);
    }

    /**
     * Update conversation priority
     */
    public function updateConversationPriority(Request $request, ChatConversation $conversation)
    {
        $request->validate([
            'priority' => 'required|in:low,medium,high,urgent',
        ]);

        $conversation->update([
            'priority' => $request->priority,
        ]);

        return response()->json([
            'message' => 'Conversation priority updated successfully',
            'priority' => $conversation->priority,
        ]);
    }

    /**
     * Get chat statistics for admin dashboard
     */
    public function getStats()
    {
        $stats = [
            'total_conversations' => ChatConversation::count(),
            'unread_conversations' => ChatConversation::whereHas('messages', function ($query) {
                $query->where('sender_type', 'user');
            })->whereNull('admin_read_at')->count(),
            'open_conversations' => ChatConversation::where('status', 'open')->count(),
            'resolved_today' => ChatConversation::where('status', 'resolved')
                ->whereDate('updated_at', today())->count(),
            'average_response_time' => '2.5 hours', // This would need more complex calculation
        ];

        return response()->json($stats);
    }

    /**
     * Search conversations
     */
    public function searchConversations(Request $request)
    {
        $query = $request->get('query', '');
        $status = $request->get('status', '');
        $priority = $request->get('priority', '');

        $conversations = ChatConversation::with(['user:id,name,email', 'latestMessage'])
            ->when($query, function ($q) use ($query) {
                $q->whereHas('user', function ($userQuery) use ($query) {
                    $userQuery->where('name', 'LIKE', "%{$query}%")
                             ->orWhere('email', 'LIKE', "%{$query}%");
                })->orWhere('subject', 'LIKE', "%{$query}%");
            })
            ->when($status, function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->when($priority, function ($q) use ($priority) {
                $q->where('priority', $priority);
            })
            ->orderByDesc('last_message_at')
            ->get()
            ->map(function ($conversation) {
                $latestMessage = $conversation->latestMessage->first();

                return [
                    'id' => $conversation->id,
                    'user_name' => $conversation->user->name,
                    'user_email' => $conversation->user->email,
                    'subject' => $conversation->subject,
                    'status' => $conversation->status,
                    'priority' => $conversation->priority,
                    'last_message' => $latestMessage ? $latestMessage->message : '',
                    'last_message_time' => $conversation->last_message_at?->diffForHumans(),
                    'unread' => $conversation->hasUnreadMessagesForAdmin(),
                ];
            });

        return response()->json($conversations);
    }
}
