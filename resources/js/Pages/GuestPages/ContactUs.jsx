// resources/js/Pages/GuestPages/ContactUs.jsx
import GuestLayout from '@/Layouts/GuestLayout';
import { usePage } from '@inertiajs/react';

export default function ContactUs() {
  const { auth } = usePage().props;

  return (
    <GuestLayout>
      <section className="max-w-3xl mx-auto px-4 py-6 text-white space-y-4">
        <h1 className="text-2xl font-bold text-center drop-shadow">Contact Us</h1>
        <p className="text-center text-white/70 text-sm leading-snug">
          For concerns and inquiries, please let us know and we will get back to you.
          For urgent concerns, contact us via:
        </p>

        {/* Social Icons */}
        <div className="flex justify-center gap-4 text-xl">
          <a href="#" title="Facebook" className="hover:text-[#0ff] transition">
            <i className="fab fa-facebook-f" />
          </a>
          <a href="#" title="Discord" className="hover:text-[#0ff] transition">
            <i className="fab fa-discord" />
          </a>
        </div>

        {/* Contact Form */}
        <form className="bg-[#003153]/50 backdrop-blur-md border border-white/20 p-4 rounded space-y-3 text-sm shadow">
          <div>
            <label htmlFor="email" className="block font-medium mb-1">Email address:</label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-1.5 rounded bg-[#e6f0fa] text-black"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block font-medium mb-1">Message:</label>
            <textarea
              id="message"
              rows="4"
              className="w-full px-3 py-1.5 rounded bg-[#e6f0fa] text-black"
              required
            />
          </div>

          {/* Anti-spam */}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="not-robot" className="accent-[#0077cc]" />
            <label htmlFor="not-robot">I am not a robot</label>
          </div>

          {/* Editable Email Forward */}
          <div>
            <label htmlFor="forwardEmail" className="block font-medium mb-1">
              Forward responses to:
            </label>
            <input
              type="email"
              id="forwardEmail"
              placeholder="support@yourgame.com"
              className="w-full px-3 py-1.5 rounded bg-[#e6f0fa] text-black"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#cea76d] text-[#2f2714] py-1.5 rounded font-bold hover:bg-[#b88b3a]"
          >
            Send Message
          </button>
        </form>

        {/* In-site Chat */}
        <div className="text-sm space-y-2">
          <h2 className="text-lg font-semibold">Live Chat Support</h2>
          {auth?.user ? (
            <div className="bg-[#002444]/70 p-3 rounded shadow border border-white/10 space-y-2">
              <p className="text-white/70">You're logged in. Start chatting below:</p>
              <div className="bg-white text-black p-2 h-36 overflow-y-auto rounded text-xs">
                <p className="italic">[Chat messages appear here...]</p>
              </div>
              <input
                type="text"
                placeholder="Type your message..."
                className="w-full px-3 py-1.5 rounded bg-[#e6f0fa] text-black"
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
