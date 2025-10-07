// resources/js/Pages/AdminPages/Chat/Conversation.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useChat } from './ChatContext';
import { Paperclip, Send, Loader2, RefreshCcw } from 'lucide-react';

// ---- axios defaults (Laravel CSRF + XHR header) ----
if (typeof window !== 'undefined') {
  axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (token) axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
}

export default function Conversation() {
  const { selectedConversation } = useChat();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);

  const listRef = useRef(null);
  const fileRef = useRef(null);
  const pollRef = useRef(null);
  const seenIds = useRef(new Set()); // dedupe for Echo + polling

  const isImage = (url = '') => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test((url || '').split('?')[0]);
  const getAttachmentUrl = (msg) =>
    msg.attachment_url || (msg.attachment_path ? `/storage/${msg.attachment_path}` : null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (!listRef.current) return;
      listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }, []);

  const setDedupMessages = useCallback((list) => {
    setMessages(list);
    seenIds.current = new Set(list.map((m) => m.id).filter(Boolean));
  }, []);

  const addMessageUnique = useCallback((m) => {
    if (!m) return;
    setMessages((prev) => {
      if (m.id && seenIds.current.has(m.id)) return prev;
      if (m.id) seenIds.current.add(m.id);
      return [...prev, m];
    });
  }, []);

  const loadMessages = useCallback(
    async (convId) => {
      if (!convId) return;
      try {
        setLoading(true);
        setError('');
        const { data } = await axios.get(`/admin/chat/conversations/${convId}`);
        const list = data?.messages || [];
        setDedupMessages(list);
        scrollToBottom();
      } catch (e) {
        console.error(e);
        setError('Failed to load messages.');
      } finally {
        setLoading(false);
      }
    },
    [scrollToBottom, setDedupMessages]
  );

  // When a conversation is selected
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!selectedConversation?.id) {
      setMessages([]);
      setText('');
      setFile(null);
      setError('');
      return;
    }

    setText('');
    setFile(null);
    setError('');
    loadMessages(selectedConversation.id);

    // Polling fallback (kept even with Echo; dedupe prevents dupes)
    pollRef.current = setInterval(() => loadMessages(selectedConversation.id), 6000);
    return () => clearInterval(pollRef.current);
  }, [selectedConversation?.id, loadMessages]);

  // Echo/Reverb subscribe to private channel: conversations.{id}
  useEffect(() => {
    if (!selectedConversation?.id || typeof window === 'undefined' || !window.Echo) return;

    const channelName = `conversations.${selectedConversation.id}`;
    const chan = window.Echo.private(channelName).listen('.ChatMessageCreated', (e) => {
      addMessageUnique({
        id: e.id,
        conversation_id: e.conversation_id,
        sender_type: e.sender_type,
        sender_id: e.sender_id,
        sender_name: e.sender_name,
        message: e.message,
        attachment_path: e.attachment_path,
        attachment_url: e.attachment_url,
        created_at: e.created_at,
        full_date: e.full_date,
      });
      scrollToBottom();
    });

    return () => {
      try {
        chan.stopListening('.ChatMessageCreated');
        window.Echo.leave(`private-${channelName}`);
      } catch {}
    };
  }, [selectedConversation?.id, addMessageUnique, scrollToBottom]);

  const handleSend = async () => {
    if (!selectedConversation?.id) return;
    if (!text.trim() && !file) return;

    setSending(true);
    setError('');
    try {
      const form = new FormData();
      if (text.trim()) form.append('message', text.trim());
      if (file) form.append('attachment', file);

      const { data } = await axios.post(
        `/admin/chat/conversations/${selectedConversation.id}/messages`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // Optimistic append (Echo may also arrive; dedupe handles it)
      addMessageUnique(data);
      setText('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      scrollToBottom();
    } catch (e) {
      console.error(e);
      setError('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending) handleSend();
    }
  };

  const refreshNow = () => selectedConversation?.id && loadMessages(selectedConversation.id);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Select a conversation
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-md p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <div>
          <h2 className="text-lg font-bold">{selectedConversation.user_name}</h2>
          <div className="text-sm text-gray-500">{selectedConversation.user_email}</div>
          {selectedConversation.subject && (
            <div className="text-xs text-gray-500 mt-1">Subject: {selectedConversation.subject}</div>
          )}
        </div>
        <button
          onClick={refreshNow}
          className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
          title="Refresh"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1 min-h-[360px]"
      >
        {loading ? (
          <div className="flex items-center justify-center text-gray-500 py-8">
            <Loader2 className="animate-spin mr-2" /> Loading…
          </div>
        ) : messages.length ? (
          messages.map((msg) => {
            const mine = msg.sender_type === 'admin';
            const atUrl = getAttachmentUrl(msg);
            return (
              <div
                key={msg.id}
                className={`max-w-[75%] px-3 py-2 rounded-2xl break-words shadow ${mine ? 'bg-gray-800 text-white ml-auto rounded-br-md' : 'bg-gray-100 text-gray-900 mr-auto rounded-bl-md'}`}
              >
                <div className={`text-[11px] opacity-70 mb-1 ${mine ? 'text-gray-200' : 'text-gray-600'}`}>
                  {mine ? 'You' : (msg.sender_name || 'User')} • {msg.full_date || msg.created_at}
                </div>

                {atUrl && (
                  <div className="mb-2">
                    {isImage(atUrl) ? (
                      <a href={atUrl} target="_blank" rel="noreferrer">
                        <img src={atUrl} alt="attachment" className="rounded-md max-h-48" />
                      </a>
                    ) : (
                      <a
                        href={atUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`underline ${mine ? 'text-blue-200' : 'text-blue-700'}`}
                      >
                        Download attachment
                      </a>
                    )}
                  </div>
                )}

                {msg.message && <div className="whitespace-pre-wrap">{msg.message}</div>}
              </div>
            );
          })
        ) : (
          <div className="text-gray-500 text-center py-8">No messages yet.</div>
        )}
      </div>

      {/* Error */}
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}

      {/* Composer */}
      <div className="space-y-2">
        {/* File picker row with small preview name */}
        {file && (
          <div className="flex items-center justify-between text-xs bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            <div className="flex items-center gap-2">
              <Paperclip size={14} />
              <span className="max-w-[240px] truncate">{file.name}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileRef.current) fileRef.current.value = '';
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              Remove
            </button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
          className="block w-full text-sm file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border file:border-gray-300 file:bg-gray-50 hover:file:bg-gray-100"
        />

        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 resize-y min-h-[42px] max-h-40"
          />

          {/* GREEN send button */}
          <button
            onClick={handleSend}
            disabled={sending || (!text.trim() && !file)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
              sending || (!text.trim() && !file)
                ? 'bg-green-700/50 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
            title="Send"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            <span>{sending ? 'Sending…' : 'Send'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
