import GuestLayout from '@/Layouts/GuestLayout';
import RegisterForm from '@/Components/RegisterForm';

export default function Register() {
  return (
    <GuestLayout>
      <div className="max-w-md w-full mx-auto mt-10 bg-[#14628d]/70 border border-[#0e6ba0] shadow-md rounded-lg p-6 text-white backdrop-blur-md">
        <h2 className="text-xl font-bold text-center mb-4">Create Account</h2>
        <RegisterForm />
      </div>
    </GuestLayout>
  );
}
