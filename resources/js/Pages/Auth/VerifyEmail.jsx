// resources/js/Pages/Auth/VerifyEmail.jsx
import React from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function VerifyEmail() {
  const { props } = usePage(); // expects { status } from controller
  const status = props?.status || null;

  const { post, processing } = useForm({});

  const resend = (e) => {
    e.preventDefault();
    post('/email/verification-notification'); // route('verification.send')
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e6ba0] px-4">
      <div className="w-full max-w-md relative backdrop-blur-md bg-[#14628dcc]/80 border-[5px] border-[#0e6ba0] shadow-inner rounded-xl p-6 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none rounded-xl border border-[#29b4e2]/40 blur-sm" />

        <h1 className="text-center text-2xl font-extrabold mb-2 tracking-wider">
          VERIFY YOUR EMAIL
        </h1>
        <p className="text-sm text-white/90 mb-4">
          We’ve sent a verification link to your email address. Please click the link to verify your account.
        </p>

        {status === 'verification-link-sent' && (
          <div className="mb-4 rounded-lg border border-[#98be5d] bg-[#98be5d]/20 px-3 py-2 text-sm">
            A new verification link has been sent to your email.
          </div>
        )}

        <form onSubmit={resend} className="space-y-3">
          <button
            type="submit"
            disabled={processing}
            className="w-full bg-[#cea76d] text-[#2f2714] py-2 rounded font-semibold text-sm hover:bg-[#b88b3a] disabled:opacity-70"
          >
            {processing ? 'Sending…' : 'Resend Verification Email'}
          </button>

          <div className="flex items-center justify-between text-xs text-white/80">
            <Link href="/logout" method="post" as="button" className="underline">
              Log out
            </Link>
            <Link href="/dashboard" className="underline text-[#cce5ff]">
              Go to Dashboard
            </Link>
          </div>
        </form>

        <div className="mt-6 text-xs text-white/70">
          Didn’t receive the email? Check your spam folder, or click “Resend Verification Email”.
        </div>
      </div>
    </div>
  );
}
