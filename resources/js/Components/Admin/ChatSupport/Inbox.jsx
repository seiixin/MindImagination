import React from 'react';
import { useChat } from './ChatContext';

const dummyInbox = [
  {
    id: 1,
    name: 'Maria Cruz',
    lastMessage: 'Hi Admin, I noticed that the new game asset',
    timestamp: '10:24 AM',
    unread: true,
    messages: [
        {
        from: 'client',
        text: "Hi Admin, I noticed that the new game asset 'Ice Dragon Mount' is missing some textures when viewed in low settings. Can you please check or provide an updated file? Thanks?",
        time: '10:24 AM'
        },
        { from: 'admin', text: 'Sige po, check ko ngayon.', time: '10:26 AM' },
    ],
  },
  {
    id: 2,
    name: 'Juan Dela Cruz',
    lastMessage: 'Thank you po!',
    timestamp: 'Yesterday',
    unread: false,
    messages: [
      { from: 'client', text: 'Thank you po!', time: '2:00 PM' },
    ],
  },
];

export default function Inbox() {
  const { selectedConversation, selectConversation } = useChat(); // ✅ use selectConversation from context

  return (
    <div className="w-1/4 bg-white rounded-2xl shadow-md p-4 h-full overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">Inbox</h2>
      <div className="space-y-2">
        {dummyInbox.map((conv) => (
          <div
            key={conv.id}
            onClick={() => selectConversation(conv)} // ✅ update selection properly
            className={`p-3 rounded-lg cursor-pointer transition ${
              selectedConversation?.id === conv.id ? 'bg-pink-100' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex justify-between">
              <span className="font-semibold">{conv.name}</span>
              <span className="text-xs text-gray-500">{conv.timestamp}</span>
            </div>
            <div className="text-sm text-gray-600 truncate">
              {conv.lastMessage}
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
