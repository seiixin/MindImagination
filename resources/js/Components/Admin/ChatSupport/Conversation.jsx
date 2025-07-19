import React, { useState } from 'react';
import { useChat } from './ChatContext';

export default function Conversation() {
  const { selectedConversation } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // When conversation changes, reset messages to that thread
  React.useEffect(() => {
    if (selectedConversation) {
      setMessages(selectedConversation.messages || []);
    }
  }, [selectedConversation]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const newMsg = {
      from: 'admin',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
  };

  if (!selectedConversation) {
    return (
      <div className="w-full bg-white rounded-2xl shadow-md p-4 flex items-center justify-center text-gray-400">
        Select a conversation
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-md p-4 w-full">
      <h2 className="text-lg font-bold mb-4 border-b pb-2">{selectedConversation.name}</h2>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-xs px-4 py-2 rounded-lg ${
              msg.from === 'admin' ? 'bg-gray-700 text-white self-end ml-auto' : 'bg-gray-200 text-gray-900 self-start'
            }`}
          >
            <div>{msg.text}</div>
            <div className="text-xs text-right opacity-70 mt-1">{msg.time}</div>
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
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
        <button
          onClick={handleSend}
          className="bg-gray-700 text-white px-4 py-2 rounded-full hover:bg-gray    -600 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
