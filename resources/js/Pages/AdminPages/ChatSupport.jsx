import AdminLayout from '@/Layouts/AdminLayout';
import { ChatProvider } from '@/Components/Admin/ChatSupport/ChatContext';
import Inbox from '@/Components/Admin/ChatSupport/Inbox';
import Conversation from '@/Components/Admin/ChatSupport/Conversation';
import ChatSettings from '@/Components/Admin/ChatSupport/ChatSettings';

export default function ChatSupport() {
  return (
    <AdminLayout>
      <ChatProvider>
        <div className="flex h-screen p-4 gap-4">
          <Inbox />
          <Conversation />
          <ChatSettings />
        </div>
      </ChatProvider>
    </AdminLayout>
  );
}
