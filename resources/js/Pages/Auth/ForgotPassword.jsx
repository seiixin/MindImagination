// resources/js/Pages/ForgotPassword.jsx
import GuestLayout from '@/Layouts/GuestLayout';
import ForgotPasswordForm from '@/Components/ForgotPasswordForm';

export default function ForgotPassword() {
  return (
    <GuestLayout>
      <div className="max-w-md w-full mx-auto mt-10 bg-[#14628d]/70 border border-[#0e6ba0] shadow-md rounded-lg p-6 text-white backdrop-blur-md">
        <h2 className="text-xl font-bold text-center mb-4">Forgot Password</h2>
        <p className="text-sm text-white/80 text-center mb-6">
          Enter your email address and we’ll send you a link to reset your password.
        </p>
        <ForgotPasswordForm />
      </div>
    </GuestLayout>
  );
}
