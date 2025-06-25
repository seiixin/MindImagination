import GuestLayout from '@/Layouts/GuestLayout';
import { usePage } from '@inertiajs/react';

export default function ContactUs() {
  const { auth } = usePage().props;

  return (
    <GuestLayout>
      <section className="max-w-3xl mx-auto px-4 py-4 text-white space-y-3 text-sm">
        <h1 className="text-xl font-bold text-center drop-shadow">Contact Us</h1>
        <p className="text-center text-white/70 leading-snug">
          For concerns and inquiries, let us know. For urgent help, contact us via:
        </p>

        {/* Social Icons */}
        <div className="flex justify-center gap-3 text-lg">
          <a href="#" title="Facebook" className="hover:text-[#0ff] transition">
            <i className="fab fa-facebook-f" />
          </a>
          <a href="#" title="Discord" className="hover:text-[#0ff] transition">
            <i className="fab fa-discord" />
          </a>
        </div>

        {/* Contact Form */}
        <form className="bg-[#003153]/50 backdrop-blur-md border border-white/20 p-3 rounded space-y-2 shadow">
          <div>
            <label htmlFor="email" className="block font-medium mb-1">Email:</label>
            <input
              type="email"
              id="email"
              className="w-full px-2 py-1 rounded bg-[#e6f0fa] text-black"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block font-medium mb-1">Message:</label>
            <textarea
              id="message"
              rows="3"
              className="w-full px-2 py-1 rounded bg-[#e6f0fa] text-black"
              required
            />
          </div>

          {/* Anti-spam */}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="not-robot" className="accent-[#0077cc]" />
            <label htmlFor="not-robot">I am not a robot</label>
          </div>

          {/* Email Forward */}
          <div>
            <label htmlFor="forwardEmail" className="block font-medium mb-1">Forward to:</label>
            <input
              type="email"
              id="forwardEmail"
              placeholder="support@yourgame.com"
              className="w-full px-2 py-1 rounded bg-[#e6f0fa] text-black"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#cea76d] text-[#2f2714] py-1.5 rounded font-bold hover:bg-[#b88b3a]"
          >
            Send Message
          </button>
        </form>

        {/* Chat */}
        <div className="space-y-2">
          <h2 className="text-base font-semibold">Live Chat Support</h2>
          {auth?.user ? (
            <div className="bg-[#002444]/70 p-3 rounded shadow border border-white/10 space-y-2">
              <p className="text-white/70">You're logged in. Start chatting:</p>
              <div className="bg-white text-black p-2 h-28 overflow-y-auto rounded text-xs">
                <p className="italic">[Chat messages appear here...]</p>
              </div>
              <input
                type="text"
                placeholder="Type your message..."
                className="w-full px-2 py-1.5 rounded bg-[#e6f0fa] text-black"
              />
              <button className="w-full bg-[#98be5d] text-[#213008] py-1.5 rounded font-bold hover:bg-[#7ca233]">
                Send
              </button>
            </div>
          ) : (
            <p className="text-white/70 italic">
              You must <a href="/login" className="text-[#0ff] underline">log in</a> to use chat support.
            </p>
          )}
        </div>
      </section>
    </GuestLayout>
  );
}
