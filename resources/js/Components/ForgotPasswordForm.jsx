// resources/js/Components/ForgotPasswordForm.jsx
import React, { useState } from 'react';
import { Link } from '@inertiajs/react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: replace with Inertia.post('/forgot-password', { email })
    console.log('Send reset link to:', email);
  };

  return (
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
  );
}
