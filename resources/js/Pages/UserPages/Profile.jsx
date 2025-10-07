// resources/js/Pages/UserPages/Profile.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Profile() {
  const { auth, flash } = usePage().props;

  // Toggles
  const [editingInfo, setEditingInfo] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  // ---------------- Profile Info Form ----------------
  const infoForm = useForm({
    name: auth?.user?.name ?? '',
    email: auth?.user?.email ?? '',
    mobile_number: auth?.user?.mobile_number ?? '',
  });

  const handleInfoEdit = () => setEditingInfo(true);

  const handleInfoUpdate = (e) => {
    e.preventDefault();
    infoForm.patch(route('profile.update'), {
      preserveScroll: true,
      onSuccess: () => setEditingInfo(false),
    });
  };

  // ---------------- Password Form ----------------
  const passForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const handlePasswordEdit = () => {
    setEditingPassword(true);
    passForm.reset();
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    passForm.patch(route('profile.password'), {
      preserveScroll: true,
      onSuccess: () => {
        setEditingPassword(false);
        passForm.reset();
      },
    });
  };

  // ---------------- Deactivate ----------------
  const handleDeactivate = (e) => {
    e.preventDefault();
    if (confirm('Are you sure you want to deactivate your account?')) {
      router.delete(route('profile.deactivate'));
    }
  };

  // Highlight password-updated flash
  const [statusMsg, setStatusMsg] = useState('');
  useEffect(() => {
    if (flash?.status === 'password-updated') {
      setStatusMsg('Password updated successfully.');
      const t = setTimeout(() => setStatusMsg(''), 3000);
      return () => clearTimeout(t);
    }
  }, [flash?.status]);

  return (
    <AuthenticatedLayout>
      <Head title="Profile" />

      <div className="min-h-screen flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-xl bg-[#001f35]/60 text-white rounded-lg shadow-md p-6 space-y-8">

          {/* Flash / Status */}
          {statusMsg && (
            <div className="rounded bg-emerald-600/20 border border-emerald-400/50 px-3 py-2 text-sm text-emerald-100">
              {statusMsg}
            </div>
          )}
          {flash?.success && (
            <div className="rounded bg-emerald-600/20 border border-emerald-400/50 px-3 py-2 text-sm text-emerald-100">
              {flash.success}
            </div>
          )}

          {/* Info Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold border-b border-white/20 pb-2">Profile Information</h2>

            {!editingInfo ? (
              <div className="space-y-2">
                <p><strong>Name:</strong> {auth.user.name}</p>
                <p><strong>Email:</strong> {auth.user.email}</p>
                {auth.user.mobile_number && (
                  <p><strong>Mobile:</strong> {auth.user.mobile_number}</p>
                )}
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
                    value={infoForm.data.name}
                    onChange={(e) => infoForm.setData('name', e.target.value)}
                    className="w-full rounded px-3 py-2 text-black"
                  />
                  {infoForm.errors.name && <p className="text-red-400 text-sm">{infoForm.errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    type="email"
                    value={infoForm.data.email}
                    onChange={(e) => infoForm.setData('email', e.target.value)}
                    className="w-full rounded px-3 py-2 text-black"
                  />
                  {infoForm.errors.email && <p className="text-red-400 text-sm">{infoForm.errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-1">Mobile Number (optional)</label>
                  <input
                    type="text"
                    value={infoForm.data.mobile_number}
                    onChange={(e) => infoForm.setData('mobile_number', e.target.value)}
                    className="w-full rounded px-3 py-2 text-black"
                  />
                  {infoForm.errors.mobile_number && (
                    <p className="text-red-400 text-sm">{infoForm.errors.mobile_number}</p>
                  )}
                </div>

                <div className="flex justify-between gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2 rounded"
                    disabled={infoForm.processing}
                  >
                    {infoForm.processing ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded"
                    onClick={() => {
                      setEditingInfo(false);
                      infoForm.reset();
                      infoForm.setData({
                        name: auth?.user?.name ?? '',
                        email: auth?.user?.email ?? '',
                        mobile_number: auth?.user?.mobile_number ?? '',
                      });
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
                  <label className="block text-sm mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passForm.data.current_password}
                    onChange={(e) => passForm.setData('current_password', e.target.value)}
                    className="w-full rounded px-3 py-2 text-black"
                  />
                  {passForm.errors.current_password && (
                    <p className="text-red-400 text-sm">{passForm.errors.current_password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm mb-1">New Password</label>
                  <input
                    type="password"
                    value={passForm.data.password}
                    onChange={(e) => passForm.setData('password', e.target.value)}
                    className="w-full rounded px-3 py-2 text-black"
                  />
                  {passForm.errors.password && <p className="text-red-400 text-sm">{passForm.errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={passForm.data.password_confirmation}
                    onChange={(e) => passForm.setData('password_confirmation', e.target.value)}
                    className="w-full rounded px-3 py-2 text-black"
                  />
                </div>

                <div className="flex justify-between gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-amber-400 hover:bg-amber-300 text-black font-semibold py-2 rounded"
                    disabled={passForm.processing}
                  >
                    {passForm.processing ? 'Updating…' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded"
                    onClick={() => {
                      setEditingPassword(false);
                      passForm.reset();
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
              disabled={infoForm.processing || passForm.processing}
            >
              Deactivate Account
            </button>
          </section>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
