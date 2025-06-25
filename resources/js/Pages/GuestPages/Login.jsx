import GuestLayout from '@/Layouts/GuestLayout';
import SignInPanel from '@/Components/SignInPanel';

export default function Login() {
  return (
    <GuestLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <SignInPanel />
      </div>
    </GuestLayout>
  );
}
