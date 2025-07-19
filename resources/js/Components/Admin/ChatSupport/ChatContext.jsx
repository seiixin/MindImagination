import { createContext, useContext, useState } from 'react';

// Create the context
const ChatContext = createContext();

// Provide the context
export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([
    { id: 1, name: 'Juan Dela Cruz', lastMessage: 'Hello there!' },
    { id: 2, name: 'Maria Clara', lastMessage: 'Kumusta po?' },
  ]);

  const [selectedConversation, setSelectedConversation] = useState(null);

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      selectedConversation,
      selectConversation,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

// Hook to use the context
export const useChat = () => useContext(ChatContext);
