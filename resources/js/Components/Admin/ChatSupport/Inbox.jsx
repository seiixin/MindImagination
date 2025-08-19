import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useChat } from './ChatContext';

export default function Inbox() {
  const { selectedConversation, selectConversation } = useChat();
  const [inbox, setInbox] = useState([]);

  useEffect(() => {
    axios.get('/admin/chat/conversations')
      .then(res => setInbox(res.data))
      .catch(console.error);
  }, []);

  return (
    <div className="w-1/4 bg-white rounded-2xl shadow-md p-4 h-full overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">Inbox</h2>
      <div className="space-y-2">
        {inbox.map(conv => (
          <div
            key={conv.id}
            onClick={() => selectConversation(conv)}
            className={`p-3 rounded-lg cursor-pointer transition ${
              selectedConversation?.id === conv.id
                ? 'bg-pink-100'
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex justify-between">
              <span className="font-semibold">{conv.user_name}</span>
              <span className="text-xs text-gray-500">{conv.last_message_time}</span>
            </div>
            <div className="text-sm text-gray-600 truncate">
              {conv.last_message}
            </div>
            {conv.unread && (
              <span className="inline-block mt-1 text-xs text-white bg-gray-700 px-2 py-0.5 rounded-full">
                New
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
