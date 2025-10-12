// resources/js/Pages/Auth/ResetPassword.jsx
import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const { props } = usePage();
  // Breeze passes these from the controller
  const tokenProp = props?.token || '';
  const emailProp = props?.email || '';

  const { data, setData, post, processing, errors, reset } = useForm({
    token: tokenProp,
    email: emailProp,
    password: '',
    password_confirmation: '',
  });

  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const handleChange = (e) => setData(e.target.name, e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/reset-password', {
      preserveScroll: true,
      onSuccess: () => reset('password', 'password_confirmation'),
    });
  };

  return (
    <GuestLayout>
      <Head title="Reset Password" />
      <div className="max-w-md w-full mx-auto">
        <h1 className="text-center text-2xl font-extrabold mb-6 tracking-wider text-white">
          Reset Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hidden token (required by backend) */}
          <input type="hidden" name="token" value={data.token} />

          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-semibold text-white">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-[#a0d6cd] text-[#113029] placeholder:text-[#113029] text-sm"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            {errors.email && <p className="text-red-300 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-semibold text-white">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                name="password"
                value={data.password}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 rounded bg-[#a0d6cd] text-[#113029] placeholder:text-[#113029] text-sm"
                placeholder="Enter new password"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute top-1/2 -translate-y-1/2 right-2 text-[#113029] focus:outline-none"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-300 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="password_confirmation" className="block mb-1 text-sm font-semibold text-white">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="password_confirmation"
                type={showPwd2 ? 'text' : 'password'}
                name="password_confirmation"
                value={data.password_confirmation}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-10 rounded bg-[#a0d6cd] text-[#113029] placeholder:text-[#113029] text-sm"
                placeholder="Re-enter new password"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd2((s) => !s)}
                className="absolute top-1/2 -translate-y-1/2 right-2 text-[#113029] focus:outline-none"
                aria-label={showPwd2 ? 'Hide password confirmation' : 'Show password confirmation'}
              >
                {showPwd2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password_confirmation && (
              <p className="text-red-300 text-xs mt-1">{errors.password_confirmation}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full bg-[#cea76d] text-[#2f2714] py-2 rounded font-semibold text-sm hover:bg-[#b88b3a] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {processing ? 'Resetting…' : 'Reset Password'}
          </button>

          <p className="text-center text-xs text-white/80">
            Remembered your password?{' '}
            <Link href="/login" className="text-[#cce5ff] underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </GuestLayout>
  );
}
