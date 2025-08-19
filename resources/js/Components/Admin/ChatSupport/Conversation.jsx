import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useChat } from './ChatContext';

export default function Conversation() {
  const { selectedConversation } = useChat();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Load messages when a conversation gets selected
  useEffect(() => {
    if (!selectedConversation) return;
    axios.get(`/admin/chat/conversations/${selectedConversation.id}`)
      .then(res => setMessages(res.data.messages))
      .catch(console.error);
  }, [selectedConversation]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    axios.post(
      `/admin/chat/conversations/${selectedConversation.id}/messages`,
      { message: newMessage }
    ).then(res => {
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    });
  };

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Select a conversation
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-md p-4">
      <h2 className="text-lg font-bold mb-4 border-b pb-2">
        {selectedConversation.user_name}
      </h2>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`max-w-xs px-4 py-2 rounded-lg ${
              msg.sender_type === 'admin'
                ? 'bg-gray-700 text-white self-end ml-auto'
                : 'bg-gray-200 text-gray-900 self-start'
            }`}
          >
            <div>{msg.message}</div>
            <div className="text-xs text-right opacity-70 mt-1">{msg.created_at}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2"
        />
        <button
          onClick={handleSend}
          className="bg-gray-700 text-white px-4 py-2 rounded-full"
        >
          Send
        </button>
      </div>
    </div>
  );
}
