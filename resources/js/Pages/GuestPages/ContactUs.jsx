// resources/js/Pages/GuestPages/ContactUs.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Paperclip, Send, Loader2, RefreshCcw } from 'lucide-react';

// ---- axios defaults (Laravel CSRF + XHR header) ----
if (typeof window !== 'undefined') {
  axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (token) axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
}

function InitialAvatar({ name = 'User' }) {
  const initials = useMemo(() => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() || '')
      .join('');
  }, [name]);

  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-[11px] font-bold text-white">
      {initials || 'U'}
    </div>
  );
}

export default function ContactUs() {
  const { auth } = usePage().props;

  // ---------- LOAD CONTACT SETTINGS FROM BACKEND ----------
  const [contact, setContact] = useState({
    email: null,
    facebook: null,
    discord: null,
    phone: null,
    address: null,
    website: null,
  });
  const [loadingContact, setLoadingContact] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get('/contact/settings'); // from UserContactUsController@show
        if (!mounted) return;
        setContact({
          email: data?.email ?? null,
          facebook: data?.facebook ?? null,
          discord: data?.discord ?? null,
          phone: data?.phone ?? null,
          address: data?.address ?? null,
          website: data?.website ?? null,
        });
      } catch {
        // keep defaults if fails
      } finally {
        if (mounted) setLoadingContact(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ---------- Contact form (left) ----------
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [notRobot, setNotRobot] = useState(false);

  const [sendingForm, setSendingForm] = useState(false);
  const [okForm, setOkForm] = useState('');
  const [errForm, setErrForm] = useState('');

  const templateText = `Requesting for premium product availability:
Here are the details request.
Category Name:
Product Item Name:
I am already member.
Here is my email address: (Leave blank if not yet member)
I’m requesting for inquiry in its purchase cost and plan to purchase this premium product.
Message:
(Leave blank if no message)
Thank you`;

  function insertTemplate() {
    setSubject('Premium Item Inquiry');
    setMessage(templateText);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setOkForm('');
    setErrForm('');

    if (!notRobot) {
      setErrForm('Please confirm you are not a robot.');
      return;
    }

    const formspree = import.meta.env.VITE_FORMSPREE_CONTACT?.trim();

    try {
      setSendingForm(true);

      if (formspree) {
        const fd = new FormData();
        fd.append('email', email);
        fd.append('_replyto', email);
        fd.append('subject', subject);
        fd.append('_subject', subject || 'Contact Form');
        fd.append('message', message);
        fd.append('_gotcha', '');

        const res = await fetch(formspree, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: fd,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.errors?.[0]?.message || 'Failed to send message.');
        }

        setOkForm('Message sent! We’ll get back to you soon.');
        setEmail('');
        setSubject('');
        setMessage('');
        setNotRobot(false);
      } else {
        await axios.post('/contact/send', { email, subject, message });
        setOkForm('Message sent via server. Thank you!');
        setEmail('');
        setSubject('');
        setMessage('');
        setNotRobot(false);
      }
    } catch (err) {
      setErrForm(err?.message || 'Something went wrong.');
    } finally {
      setSendingForm(false);
    }
  }

  // ---------- Chat (right, auth only) ----------
  const [activeConv, setActiveConv] = useState(null);
  const [messagesList, setMessagesList] = useState([]);
  const [convSubject, setConvSubject] = useState('Support Inquiry');
  const [chatText, setChatText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [sendingChat, setSendingChat] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);

  const listRef = useRef(null);
  const fileInputRef = useRef(null);
  const seenIds = useRef(new Set()); // de-dup incoming messages (Echo/polling)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  }, []);

  const addMessageUnique = useCallback((m) => {
    if (!m) return;
    setMessagesList((prev) => {
      if (m.id && seenIds.current.has(m.id)) return prev;
      if (m.id) seenIds.current.add(m.id);
      return [...prev, m];
    });
  }, []);

  useEffect(() => {
    if (!auth?.user) return;
    loadMyConversations();
  }, [auth?.user]);

  async function loadMyConversations() {
    try {
      setLoadingThread(true);
      const { data } = await axios.get('/chat/conversations');
      const pick = data?.[0] ?? null;
      setActiveConv(pick || null);
      if (pick) {
        await loadMessages(pick.id);
      } else {
        setMessagesList([]);
        seenIds.current = new Set();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingThread(false);
    }
  }

  async function loadMessages(conversationId) {
    try {
      const { data } = await axios.get(`/chat/conversations/${conversationId}`);
      const list = data.messages || [];
      setMessagesList(list);
      seenIds.current = new Set(list.map((m) => m.id).filter(Boolean));
      scrollToBottom();
    } catch (e) {
      console.error(e);
    }
  }

  function getAttachmentUrl(msg) {
    if (msg.attachment_url) return msg.attachment_url;
    if (msg.attachment_path) return `/storage/${msg.attachment_path}`;
    return null;
  }

  async function sendChat(e) {
    e.preventDefault();
    if (!auth?.user) return;
    if (!chatText.trim() && !attachment) return;

    setSendingChat(true);
    try {
      if (!activeConv) {
        const form = new FormData();
        form.append('subject', convSubject || 'Support Inquiry');
        if (chatText.trim()) form.append('message', chatText.trim());
        if (attachment) form.append('attachment', attachment);

        const { data } = await axios.post('/chat/conversations', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setActiveConv(data);
        setChatText('');
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await loadMessages(data.id);
        return;
      }

      const form = new FormData();
      if (chatText.trim()) form.append('message', chatText.trim());
      if (attachment) form.append('attachment', attachment);

      const { data } = await axios.post(
        `/chat/conversations/${activeConv.id}/messages`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // optimistic (still deduped if Echo replays it)
      addMessageUnique(data);
      setChatText('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      scrollToBottom();
    } catch (e) {
      console.error(e);
      alert('Failed to send. Please try again.');
    } finally {
      setSendingChat(false);
    }
  }

  function onComposerKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendingChat) sendChat(e);
    }
  }

  // Fallback polling
  useEffect(() => {
    if (!activeConv?.id) return;
    const t = setInterval(() => loadMessages(activeConv.id), 7000);
    return () => clearInterval(t);
  }, [activeConv?.id]);

  // Reverb/Echo
  useEffect(() => {
    if (!auth?.user || !activeConv?.id || typeof window === 'undefined' || !window.Echo) return;

    const channelName = `conversations.${activeConv.id}`;
    const channel = window.Echo.private(channelName).listen('.ChatMessageCreated', (e) => {
      addMessageUnique({
        id: e.id,
        conversation_id: e.conversation_id,
        sender_type: e.sender_type,
        sender_id: e.sender_id,
        message: e.message,
        attachment_path: e.attachment_path,
        attachment_url: e.attachment_url,
        full_date: e.full_date,
        created_at: e.created_at,
      });
      scrollToBottom();
    });

    return () => {
      try {
        channel.stopListening('.ChatMessageCreated');
        window.Echo.leave(`private-${channelName}`);
      } catch {}
    };
  }, [auth?.user, activeConv?.id, addMessageUnique, scrollToBottom]);

  const previewUrl = useMemo(() => (attachment ? URL.createObjectURL(attachment) : ''), [attachment]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Helpers for tel/maps
  const cleanTel = (t) => String(t || '').replace(/[^\d+]/g, '');

  return (
    <GuestLayout>
      <section className="mx-auto max-w-6xl px-4 py-6 text-white">
        <h1 className="text-center text-xl font-bold drop-shadow">Contact Us</h1>
        <p className="text-center leading-snug text-white/70">
          For concerns and inquiries, let us know. For urgent help, contact us via:
        </p>

        {/* Social Icons (CLICKABLE) */}
        <div className="mt-2 flex justify-center gap-4 text-lg">
          <a
            href={contact.facebook || '#'}
            target="_blank"
            rel="noopener noreferrer"
            title="Facebook"
            aria-disabled={!contact.facebook}
            className={`transition hover:text-[#0ff] ${contact.facebook ? '' : 'pointer-events-none opacity-50'}`}
          >
            <i className="fab fa-facebook-f" />
          </a>
          <a
            href={contact.discord || '#'}
            target="_blank"
            rel="noopener noreferrer"
            title="Discord"
            aria-disabled={!contact.discord}
            className={`transition hover:text-[#0ff] ${contact.discord ? '' : 'pointer-events-none opacity-50'}`}
          >
            <i className="fab fa-discord" />
          </a>
        </div>

        {/* Phone + Address under icons */}
        <div className="mb-4 mt-2 text-center text-sm text-white/80 space-y-1">
          {loadingContact ? (
            <div className="animate-pulse text-white/50">Loading contact…</div>
          ) : (
            <>
              {contact.phone && (
                <div>
                  <a
                    href={`tel:${cleanTel(contact.phone)}`}
                    className="underline decoration-sky-400 underline-offset-2"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.address && (
                <div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-sky-400 underline-offset-2"
                    title={contact.address}
                  >
                    {contact.address}
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* LEFT: Contact form */}
          <form
            onSubmit={onSubmit}
            className="rounded-xl border border-white/20 bg-[#002a4a]/80 p-3 shadow backdrop-blur-md md:p-4"
          >
            {okForm && (
              <div className="mb-3 rounded border border-emerald-400/50 bg-emerald-600/20 px-3 py-2 text-sm text-emerald-100">
                {okForm}
              </div>
            )}
            {errForm && (
              <div className="mb-3 rounded border border-rose-400/50 bg-rose-600/20 px-3 py-2 text-sm text-rose-100">
                {errForm}
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="email" className="mb-1 block text-sm font-semibold">
                Email:
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={contact.email || 'you@example.com'}
                className="w-full rounded bg-[#e6f0fa] px-2 py-2 text-black ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="subject" className="mb-1 block text-sm font-semibold">
                Name Or Subject:
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded bg-[#e6f0fa] px-2 py-2 text-black ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div className="mb-2">
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="message" className="text-sm font-semibold">
                  Message:
                </label>
                <button
                  type="button"
                  onClick={insertTemplate}
                  className="rounded border border-white/30 bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                  title="Insert message template"
                >
                  Insert Message Template
                </button>
              </div>

              <textarea
                id="message"
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded bg-[#e6f0fa] px-2 py-2 text-black ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-sky-400"
                required
              />
            </div>

            <div className="mb-3 mt-3 flex items-center gap-2">
              <input
                id="not-robot"
                type="checkbox"
                checked={notRobot}
                onChange={(e) => setNotRobot(e.target.checked)}
                className="h-4 w-4 accent-[#0077cc]"
              />
              <label htmlFor="not-robot" className="text-sm">
                I am not a robot
              </label>
            </div>

            <button
              type="submit"
              disabled={sendingForm}
              className={`w-full rounded border border-[#b88b3a] py-2 font-bold tracking-wide transition ${
                sendingForm
                  ? 'cursor-not-allowed bg-[#b88b3a] text-[#2f2714] opacity-60'
                  : 'bg-[#cea76d] text-[#2f2714] hover:bg-[#b88b3a]'
              }`}
            >
              {sendingForm ? 'Sending…' : 'Send Message'}
            </button>
          </form>

          {/* RIGHT: Live Chat Support */}
          <div className="flex flex-col rounded-xl border border-white/20 bg-[#0b1627]/80 p-0 shadow backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-xl bg-[#0f1e36]/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600" />
                <div>
                  <div className="text-sm font-semibold">Mind Imagination Support</div>
                  <div className="text-xs text-white/60">
                    {auth?.user ? 'Typically replies within a few hours' : 'Log in to start chatting'}
                  </div>
                </div>
              </div>

              {auth?.user && (
                <button
                  onClick={loadMyConversations}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
                  title="Refresh"
                >
                  <RefreshCcw size={14} />
                  Refresh
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div ref={listRef} className="min-h-[360px] max-h-[360px] flex-1 space-y-2 overflow-y-auto px-3 py-3">
              {!auth?.user ? (
                <div className="py-10 text-center text-white/70">
                  You must{' '}
                  <a href="/login" className="underline decoration-sky-400 underline-offset-2">
                    log in
                  </a>{' '}
                  to use chat support.
                </div>
              ) : loadingThread ? (
                <div className="flex items-center justify-center py-10 text-white/70">
                  <Loader2 className="mr-2 animate-spin" /> Loading thread…
                </div>
              ) : messagesList.length ? (
                messagesList.map((m) => {
                  const mine = m.sender_type === 'user';
                  const atUrl = getAttachmentUrl(m);
                  const isImg = atUrl ? /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(atUrl.split('?')[0]) : false;

                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      {!mine && (
                        <div className="mr-2 self-end">
                          <InitialAvatar name="Support" />
                        </div>
                      )}

                      <div className="max-w-[78%]">
                        <div
                          className={`rounded-2xl px-3 py-2 text-[13px] shadow ${
                            mine ? 'rounded-br-md bg-[#0084ff] text-white' : 'rounded-bl-md bg-white text-gray-900'
                          }`}
                        >
                          {atUrl && (
                            <div className="mb-2">
                              {isImg ? (
                                <a href={atUrl} target="_blank" rel="noreferrer">
                                  <img src={atUrl} alt="attachment" className="max-h-52 rounded-md" />
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

                          {m.message && <div className="whitespace-pre-wrap">{m.message}</div>}
                        </div>

                        <div className={`mt-1 px-1 text-[11px] ${mine ? 'text-white/70 text-right' : 'text-white/60'}`}>
                          {m.full_date || m.created_at}
                        </div>
                      </div>

                      {mine && (
                        <div className="ml-2 self-end">
                          <InitialAvatar name={auth?.user?.name || 'You'} />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-white/60">No messages yet.</div>
              )}
            </div>

            {/* Composer */}
            {auth?.user && (
              <form onSubmit={sendChat} className="border-t border-white/10 p-3">
                {!activeConv && (
                  <input
                    type="text"
                    placeholder="Subject (optional)"
                    value={convSubject}
                    onChange={(e) => setConvSubject(e.target.value)}
                    className="mb-2 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                )}

                {attachment && (
                  <div className="mb-2 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
                    <div className="flex items-center gap-2">
                      <Paperclip size={14} />
                      <span className="max-w-[220px] truncate">{attachment.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachment(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-white/60 hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {previewUrl && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(attachment?.name || '') && (
                  <div className="mb-2">
                    <img src={previewUrl} alt="preview" className="max-h-40 rounded-lg border border-white/10" />
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                    <textarea
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      onKeyDown={onComposerKeyDown}
                      placeholder="Write a message…"
                      rows={1}
                      className="min-h-[40px] max-h-40 w-full resize-y bg-transparent text-sm text-white placeholder-white/60 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/90 hover:bg-white/20"
                      title="Attach"
                    >
                      <Paperclip size={18} />
                    </button>

                    {/* GREEN SEND BUTTON */}
                    <button
                      disabled={sendingChat || (!chatText.trim() && !attachment)}
                      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white ${
                        sendingChat || (!chatText.trim() && !attachment)
                          ? 'cursor-not-allowed bg-green-700/50'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {sendingChat ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                      <span className="hidden sm:inline">{sendingChat ? 'Sending…' : 'Send'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </GuestLayout>
  );
}
