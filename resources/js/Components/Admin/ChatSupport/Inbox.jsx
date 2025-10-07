// resources/js/Pages/AdminPages/Chat/Inbox.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useChat } from './ChatContext';
import { RefreshCcw, Search, Mail, Circle } from 'lucide-react';

// ---- axios defaults (Laravel CSRF + XHR header) ----
if (typeof window !== 'undefined') {
  axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (token) axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
}

export default function Inbox() {
  const { selectedConversation, selectConversation } = useChat();
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const pollRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchInbox = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.get('/admin/chat/conversations');
      setInbox(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchInbox = useCallback(async (q) => {
    if (!q?.trim()) {
      fetchInbox();
      return;
    }
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.get('/admin/chat/search', { params: { query: q.trim() } });
      setInbox(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('Search failed.');
    } finally {
      setLoading(false);
    }
  }, [fetchInbox]);

  // initial fetch + polling
  useEffect(() => {
    fetchInbox();
    clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchInbox, 8000);
    return () => clearInterval(pollRef.current);
  }, [fetchInbox]);

  // debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchInbox(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, searchInbox]);

  // optional: soft-clear unread badge locally when you click a thread
  const handleSelect = (conv) => {
    selectConversation(conv);
    setInbox((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread: false } : c))
    );
  };

  return (
    <div className="w-full md:w-80 bg-white rounded-2xl shadow-md h-full flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Inbox</h2>
          <button
            onClick={fetchInbox}
            className="inline-flex items-center gap-1 text-sm px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, subject…"
            className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-200"
            type="text"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {error && (
          <div className="mx-2 mb-2 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading && !inbox.length ? (
          <div className="text-gray-500 text-sm px-3 py-8 text-center">Loading…</div>
        ) : inbox.length ? (
          <div className="space-y-2">
            {inbox.map((conv) => {
              const isActive = selectedConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelect(conv)}
                  className={`w-full text-left p-3 rounded-xl transition border ${
                    isActive
                      ? 'bg-sky-50 border-sky-200'
                      : 'bg-white hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold truncate">{conv.user_name}</span>
                        {conv.unread && (
                          <span className="inline-flex items-center gap-1 text-xs text-white bg-gray-800 px-2 py-0.5 rounded-full">
                            <Circle size={8} className="fill-white" />
                            New
                          </span>
                        )}
                      </div>

                      {conv.subject && (
                        <div className="text-[11px] text-gray-500 truncate">
                          {conv.subject}
                        </div>
                      )}

                      <div className="mt-0.5 text-sm text-gray-600 truncate flex items-center gap-1">
                        <Mail size={14} className="text-gray-400" />
                        <span className="truncate">{conv.last_message || '—'}</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-[11px] text-gray-500 ml-2">
                      {conv.last_message_time || ''}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-sm px-3 py-8 text-center">No conversations.</div>
        )}
      </div>
    </div>
  );
}
