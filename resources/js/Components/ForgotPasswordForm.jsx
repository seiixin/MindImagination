// resources/js/Components/ForgotPasswordForm.jsx
import React from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function ForgotPasswordForm() {
  const { props } = usePage();               // read flashed status from middleware
  const status = props?.status || null;

  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/forgot-password', {
      preserveScroll: true,
      onSuccess: () => {
        // keep email if you prefer; here we clear it after successful send
        reset('email');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status && (
        <div className="rounded-md bg-[#a0d6cd] text-[#113029] px-3 py-2 text-sm">
          {status}
        </div>
      )}

      <label className="block text-sm font-semibold text-white mb-1" htmlFor="email">
        Email Address
      </label>
      <input
        id="email"
        type="email"
        name="email"
        value={data.email}
        onChange={(e) => setData('email', e.target.value)}
        className="w-full px-3 py-2 rounded bg-[#a0d6cd] text-[#113029] placeholder:text-[#113029] text-sm"
        placeholder="you@example.com"
        required
        autoFocus
        autoComplete="email"
      />
      {errors.email && <p className="text-red-300 text-xs">{errors.email}</p>}

      <button
        type="submit"
        disabled={processing}
        className="w-full bg-[#cea76d] text-[#2f2714] py-2 rounded font-semibold text-sm hover:bg-[#b88b3a] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {processing ? 'Sending link…' : 'Send Reset Link'}
      </button>

      <p className="text-center text-xs text-white/80">
        Remembered your password?{' '}
        <Link href="/login" className="text-[#cce5ff] underline">Login</Link>
      </p>
    </form>
  );
}
