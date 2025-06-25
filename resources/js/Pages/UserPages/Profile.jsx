import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Profile() {
  const { auth } = usePage().props;
  const [editingInfo, setEditingInfo] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  const { data, setData, patch, processing, errors, reset } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const handleInfoEdit = () => {
    setEditingInfo(true);
    setData({
      name: auth.user.name || '',
      email: auth.user.email || '',
    });
  };

  const handlePasswordEdit = () => {
    setEditingPassword(true);
    setData({
      password: '',
      password_confirmation: '',
    });
  };

  const handleInfoUpdate = (e) => {
    e.preventDefault();
    patch(route('profile.update'), {
      preserveScroll: true,
      onSuccess: () => setEditingInfo(false),
    });
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    patch(route('profile.password'), {
      preserveScroll: true,
      onSuccess: () => {
        setEditingPassword(false);
        reset('password', 'password_confirmation');
      },
    });
  };

  const handleDeactivate = (e) => {
    e.preventDefault();
    if (confirm('Are you sure you want to deactivate your account?')) {
      router.delete(route('profile.deactivate'));
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title="Profile" />

      <div className="min-h-screen flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-xl bg-[#001f35]/60 text-white rounded-lg shadow-md p-6 space-y-8">
          {/* Info Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold border-b border-white/20 pb-2">Profile Information</h2>

            {!editingInfo ? (
              <div className="space-y-2">
                <p><strong>Name:</strong> {auth.user.name}</p>
                <p><strong>Email:</strong> {auth.user.email}</p>
                <button
                  onClick={handleInfoEdit}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2 px-4 rounded"
                >
                  Edit Info
                </button>
              </div>
            ) : (
              <form onSubmit={handleInfoUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Name</label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="w-full rounded px-3 py-2 text-black"
                  />
                  {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    className="w-full rounded px-3 py-2 text-black"
                  />
                  {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
                </div>
                <div className="flex justify-between gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2 rounded"
                    disabled={processing}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded"
                    onClick={() => {
                      setEditingInfo(false);
                      reset('name', 'email');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Password Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold border-b border-white/20 pb-2">Change Password</h2>

            {!editingPassword ? (
              <button
                onClick={handlePasswordEdit}
                className="bg-amber-400 hover:bg-amber-300 text-black font-semibold py-2 px-4 rounded"
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">New Password</label>
                  <input
                    type="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    className="w-full rounded px-3 py-2 text-black"
                  />
                  {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    className="w-full rounded px-3 py-2 text-black"
                  />
                </div>
                <div className="flex justify-between gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-amber-400 hover:bg-amber-300 text-black font-semibold py-2 rounded"
                    disabled={processing}
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded"
                    onClick={() => {
                      setEditingPassword(false);
                      reset('password', 'password_confirmation');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Deactivate Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-red-400 border-b border-white/20 pb-2">Deactivate Account</h2>
            <p className="text-sm text-white/80">
              This will permanently deactivate your account.
            </p>
            <button
              onClick={handleDeactivate}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-2 rounded"
              disabled={processing}
            >
              Deactivate Account
            </button>
          </section>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
