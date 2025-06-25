import GuestLayout from '@/Layouts/GuestLayout';
import { useState } from 'react';
import { Link } from '@inertiajs/react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: submit using Inertia.post('/forgot-password', { email })
  };

  return (
    <GuestLayout>
      <div className="max-w-md w-full mx-auto mt-10 bg-[#14628d]/70 border border-[#0e6ba0] shadow-md rounded-lg p-6 text-white backdrop-blur-md">
        <h2 className="text-xl font-bold text-center mb-4">Forgot Password</h2>
        <p className="text-sm text-white/80 text-center mb-6">
          Enter your email address and we’ll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-[#a0d6cd] text-[#113029] placeholder:text-[#113029] text-sm"
            required
          />

          <button
            type="submit"
            className="w-full bg-[#cea76d] text-[#2f2714] py-2 rounded font-semibold text-sm hover:bg-[#b88b3a]"
          >
            Send Reset Link
          </button>

          <p className="text-center text-xs text-white/80">
            Remembered your password?{' '}
            <Link href="/login" className="text-[#cce5ff] underline">Login</Link>
          </p>
        </form>
      </div>
    </GuestLayout>
  );
}
