import React, { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';

/** -------------------------------------------------------------
 * Small helpers
 * ------------------------------------------------------------ */
const ADMIN = '/admin';

/** Build an absolute image URL (fixes 404 thumbnails). */
function toImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path;
  }
  // most Laravel uploads live under storage; strip optional "public/"
  return `/storage/${path.replace(/^public\//, '')}`;
}

/** GET JSON with cookies + AJAX headers (prevents 419 on GET). */
async function apiGet(path, params = {}) {
  const url = new URL(`${ADMIN}${path}`, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && `${v}` !== '') url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** -------------------------------------------------------------
 * MAIN COMPONENT
 * ------------------------------------------------------------ */
export default function UserManagement({ selectedUser, onBack, defaultFreeRegPoints = 100 }) {
  /* ====================== User form state ====================== */
  const [user, setUser] = useState({
    fullName: '',
    userName: '',
    emailAddress: '',
    mobileNumber: '',
    address: '',
    userPoints: '',
    password: '',
    verificationStatus: 'pending',
    activeStatus: 'enabled',
    access: 'viewer',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userPointsDirty, setUserPointsDirty] = useState(false);

  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  useEffect(() => {
    if (selectedUser) {
      setUser({
        fullName: selectedUser.fullName || '',
        userName: selectedUser.userName || '',
        emailAddress: selectedUser.emailAddress || '',
        mobileNumber: selectedUser.mobileNumber || '',
        address: selectedUser.address || '',
        userPoints: String(selectedUser.userPoints ?? 0),
        password: '',
        verificationStatus: selectedUser.verificationStatus || 'pending',
        activeStatus: selectedUser.activeStatus || 'enabled',
        access: selectedUser.access || 'viewer',
      });
      setUserPointsDirty(false);
    } else {
      setUser({
        fullName: '',
        userName: '',
        emailAddress: '',
        mobileNumber: '',
        address: '',
        userPoints: String(defaultFreeRegPoints ?? 0),
        password: '',
        verificationStatus: 'pending',
        activeStatus: 'enabled',
        access: 'viewer',
      });
      setUserPointsDirty(false);
    }
    setErrors({});
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser && !userPointsDirty) {
      setUser((prev) => ({ ...prev, userPoints: String(defaultFreeRegPoints ?? 0) }));
    }
  }, [defaultFreeRegPoints, selectedUser, userPointsDirty]);

  const handleChange = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (field === 'userPoints') setUserPointsDirty(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!user.fullName?.trim()) newErrors.fullName = 'Full name is required';
    if (!user.userName?.trim()) newErrors.userName = 'Username is required';

    if (!user.emailAddress?.trim()) {
      newErrors.emailAddress = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.emailAddress)) {
      newErrors.emailAddress = 'Please enter a valid email address';
    }

    if (!user.mobileNumber?.trim()) newErrors.mobileNumber = 'Mobile number is required';

    if (user.userPoints === '' || user.userPoints === null || user.userPoints === undefined) {
      newErrors.userPoints = 'Points are required';
    } else if (parseInt(user.userPoints, 10) < 0) {
      newErrors.userPoints = 'Points cannot be negative';
    }

    if (!selectedUser && !user.password?.trim()) {
      newErrors.password = 'Password is required for new users';
    } else if (user.password && user.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const payload = useMemo(
    () => ({
      fullName: user.fullName.trim(),
      userName: user.userName.trim(),
      emailAddress: user.emailAddress.trim(),
      mobileNumber: user.mobileNumber.trim(),
      address: user.address?.trim() || '',
      userPoints: parseInt(user.userPoints, 10) || 0,
      password: user.password.trim(),
      verificationStatus: user.verificationStatus,
      activeStatus: user.activeStatus,
      access: user.access,
    }),
    [user]
  );

  const submitUser = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    if (selectedUser) {
      router.put(`${ADMIN}/users/${selectedUser.id}`, payload, {
        preserveScroll: true,
        onSuccess: () => {
          setIsSubmitting(false);
          onBack();
        },
        onError: (be) => {
          setIsSubmitting(false);
          const t = {};
          Object.entries(be).forEach(([k, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs[0] : msgs;
            t[k] = msg;
            if (k === 'userName' && msg?.includes('already been taken')) {
              t[k] = 'This username is already taken.';
            } else if (k === 'emailAddress' && msg?.includes('already been taken')) {
              t[k] = 'This email address is already registered.';
            } else if (k === 'mobileNumber' && msg?.includes('already been taken')) {
              t[k] = 'This mobile number is already registered.';
            }
          });
          setErrors(t);
        },
      });
    } else {
      router.post(`${ADMIN}/users`, payload, {
        preserveScroll: true,
        onSuccess: () => {
          setIsSubmitting(false);
          onBack();
        },
        onError: (be) => {
          setIsSubmitting(false);
          const t = {};
          Object.entries(be).forEach(([k, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs[0] : msgs;
            t[k] = msg;
          });
          setErrors(t);
        },
      });
    }
  };

  const deleteUser = () => {
    if (!selectedUser) return;
    if (!confirm('Delete this user?')) return;
    setIsSubmitting(true);
    router.delete(`${ADMIN}/users/${selectedUser.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setIsSubmitting(false);
        onBack();
      },
      onError: () => {
        setIsSubmitting(false);
        alert('Failed to delete user.');
      },
    });
  };

  /* =================== Owned assets (list + assign) =================== */
  const [owned, setOwned] = useState([]);
  const [ownedMeta, setOwnedMeta] = useState({ page: 1, last_page: 1, total: 0, per_page: 15 });
  const [ownedLoading, setOwnedLoading] = useState(false);

  const fetchOwnedAssets = async (page = 1, q = '') => {
    if (!selectedUser?.id) return;
    setOwnedLoading(true);
    try {
      const data = await apiGet(`/users/${selectedUser.id}/owned-assets`, {
        page,
        per_page: ownedMeta.per_page || 15,
        q,
      });
      setOwned(data.data || []);
      setOwnedMeta({
        page: data.pagination?.current_page ?? 1,
        last_page: data.pagination?.last_page ?? 1,
        total: data.pagination?.total ?? 0,
        per_page: data.pagination?.per_page ?? 15,
      });
    } catch (e) {
      console.error(e);
      alert('Failed to load owned assets.');
    } finally {
      setOwnedLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser) fetchOwnedAssets(1, '');
  }, [selectedUser?.id]); // eslint-disable-line

  const revokeOwnership = async (purchaseId) => {
    if (!confirm('Revoke this asset from the user?')) return;
    router.delete(`${ADMIN}/owned-assets/${purchaseId}`, {
      preserveScroll: true,
      onSuccess: () => fetchOwnedAssets(ownedMeta.page),
      onError: () => alert('Failed to revoke ownership.'),
    });
  };

  /* =================== Asset picker modal =================== */
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerMeta, setPickerMeta] = useState({ page: 1, last_page: 1 });
  const [pickerItems, setPickerItems] = useState([]);
  const [assigning, setAssigning] = useState(null);

  const fetchPicker = async (page = 1, q = '') => {
    setPickerLoading(true);
    try {
      const data = await apiGet('/assets-light', { page, per_page: 12, q });
      setPickerItems((data.data || []).map((a) => ({ ...a, image_url: toImageUrl(a.image_url) })));
      setPickerMeta({
        page: data.pagination?.current_page ?? 1,
        last_page: data.pagination?.last_page ?? 1,
      });
      setPickerPage(page);
    } catch (e) {
      console.error(e);
      alert('Failed to load assets.');
    } finally {
      setPickerLoading(false);
    }
  };

  const openPicker = () => {
    setPickerOpen(true);
    fetchPicker(1, '');
  };

  const assignAsset = async (assetId) => {
    if (!selectedUser?.id) return;
    setAssigning(assetId);
    router.post(
      `${ADMIN}/users/${selectedUser.id}/owned-assets`,
      { asset_id: assetId },
      {
        preserveScroll: true,
        onSuccess: () => {
          setAssigning(null);
          fetchOwnedAssets(ownedMeta.page);
          alert('Asset assigned.');
        },
        onError: () => {
          setAssigning(null);
          alert('Failed to assign asset.');
        },
      }
    );
  };

  /* =================== Render =================== */
  const formFields = [
    { key: 'fullName', label: 'Full Name', type: 'text', required: true },
    { key: 'userName', label: 'Username', type: 'text', required: true },
    { key: 'emailAddress', label: 'Email Address', type: 'email', required: true },
    { key: 'mobileNumber', label: 'Mobile Number', type: 'text', required: true },
    { key: 'address', label: 'Address', type: 'text', required: false },
    { key: 'userPoints', label: 'Points', type: 'number', required: true },
  ];

  const selectFields = [
    { key: 'verificationStatus', label: 'Verification Status', options: ['verified', 'unverified', 'pending'] },
    { key: 'activeStatus', label: 'Active Status', options: ['enabled', 'disabled'] },
    { key: 'access', label: 'Access Role', options: ['admin', 'editor', 'viewer'] },
  ];

  return (
    <div className="space-y-6">
      {/* ===== User form ===== */}
      <div className={`bg-gray-200 p-6 rounded-xl ${neuShadow}`}>
        <form onSubmit={submitUser} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {formFields.map(({ key, label, type, required }) => (
              <div key={key} className={`p-4 rounded-xl bg-gray-200 ${neuShadow}`}>
                <label className="block text-xs font-bold uppercase mb-2 text-gray-600">
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={type}
                  value={user[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl bg-gray-200 outline-none text-center ${
                    errors[key] ? 'border-2 border-red-500' : ''
                  }`}
                  min={type === 'number' ? '0' : undefined}
                />
                {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
              </div>
            ))}

            {/* Password */}
            <div className={`p-4 rounded-xl bg-gray-200 ${neuShadow}`}>
              <label className="block text-xs font-bold uppercase mb-2 text-gray-600">
                Password {!selectedUser && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                value={user.password || ''}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={selectedUser ? 'Leave empty to keep current password' : 'Enter password'}
                className={`w-full px-3 py-2 rounded-xl bg-gray-200 outline-none text-center ${
                  errors.password ? 'border-2 border-red-500' : ''
                }`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Selects */}
            {selectFields.map(({ key, label, options }) => (
              <div key={key} className={`p-4 rounded-xl bg-gray-200 ${neuShadow}`}>
                <label className="block text-xs font-bold uppercase mb-2 text-gray-600">{label}</label>
                <select
                  value={user[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl bg-gray-200 outline-none ${
                    errors[key] ? 'border-2 border-red-500' : ''
                  }`}
                >
                  {options.map((o) => (
                    <option key={o} value={o}>
                      {o.toUpperCase()}
                    </option>
                  ))}
                </select>
                {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-full text-gray-700 font-semibold bg-[#e0e0e0]
                         shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]
                         hover:shadow-[inset_8px_8px_15px_#bebebe,inset_-8px_-8px_15px_#ffffff]
                         transition-all duration-200 ease-in-out"
            >
              {isSubmitting ? 'Processing...' : selectedUser ? 'UPDATE USER' : 'CREATE USER'}
            </button>

            {selectedUser && (
              <button
                type="button"
                onClick={deleteUser}
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-full font-bold text-white bg-red-500 hover:bg-red-600 transition-colors ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                } ${neuShadow}`}
              >
                DELETE USER
              </button>
            )}

            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-full text-gray-700 font-semibold bg-[#e0e0e0]
                         shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]
                         hover:shadow-[inset_8px_8px_15px_#bebebe,inset_-8px_-8px_15px_#ffffff]
                         transition-all duration-200 ease-in-out"
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>

      {/* ===== Current user info + Ownership ===== */}
      {selectedUser && (
        <div className={`bg-gray-200 p-6 rounded-xl ${neuShadow}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-700">User</h3>
            <button
              type="button"
              onClick={openPicker}
              className="px-4 py-2 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Assign Asset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-6">
            <div><span className="font-semibold text-gray-600">ID:</span> <p className="text-gray-800">{selectedUser.id}</p></div>
            <div><span className="font-semibold text-gray-600">Verification:</span> <p className="capitalize">{selectedUser.verificationStatus || 'N/A'}</p></div>
            <div><span className="font-semibold text-gray-600">Status:</span> <p className="capitalize">{selectedUser.activeStatus || 'N/A'}</p></div>
            <div><span className="font-semibold text-gray-600">Role:</span> <p className="capitalize">{selectedUser.access || 'N/A'}</p></div>
            <div><span className="font-semibold text-gray-600">Points:</span> <p className="text-blue-600 font-bold">{selectedUser.userPoints}</p></div>
          </div>

          <h4 className="font-semibold mb-2">Owned Items</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left">
                <tr>
                  <th className="py-2 pr-4">Item</th>
                  <th className="py-2 pr-4">Points</th>
                  <th className="py-2 pr-4">Price</th>
                  <th className="py-2 pr-4">Granted At</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {ownedLoading && (
                  <tr><td colSpan="5" className="py-4 text-center">Loading...</td></tr>
                )}
                {!ownedLoading && owned.length === 0 && (
                  <tr><td colSpan="5" className="py-4 text-center">No owned items.</td></tr>
                )}
                {!ownedLoading && owned.map((row) => (
                  <tr key={row.purchase_id} className="border-t">
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <img src={toImageUrl(row.asset?.image_url)} alt="" className="w-8 h-8 object-cover rounded" />
                        <span>{row.asset?.title}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4">{row.asset?.points ?? '-'}</td>
                    <td className="py-2 pr-4">{row.asset?.price ?? '-'}</td>
                    <td className="py-2 pr-4">{row.granted_at ?? '-'}</td>
                    <td className="py-2">
                      <button
                        onClick={() => revokeOwnership(row.purchase_id)}
                        className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* pagination */}
            <div className="flex items-center gap-2 mt-3">
              <button
                className="px-3 py-1 rounded border"
                disabled={ownedMeta.page <= 1}
                onClick={() => fetchOwnedAssets(ownedMeta.page - 1)}
              >
                Prev
              </button>
              <span className="text-xs">
                Page {ownedMeta.page} of {ownedMeta.last_page}
              </span>
              <button
                className="px-3 py-1 rounded border"
                disabled={ownedMeta.page >= ownedMeta.last_page}
                onClick={() => fetchOwnedAssets(ownedMeta.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Asset Picker Modal ===== */}
      {pickerOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[95%] max-w-3xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Assign Asset</h3>
              <button className="px-3 py-1 rounded border" onClick={() => setPickerOpen(false)}>
                Close
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                placeholder="Search assets..."
                className="flex-1 px-3 py-2 rounded border"
              />
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={() => fetchPicker(1, pickerQuery)}>
                Search
              </button>
            </div>

            {pickerLoading && <div className="py-6 text-center">Loading...</div>}

            {!pickerLoading && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pickerItems.map((a) => (
                    <div key={a.id} className="border rounded-lg p-3 flex gap-3">
                      <img src={toImageUrl(a.image_url)} alt="" className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <div className="font-semibold">{a.title}</div>
                        <div className="text-xs text-gray-600">Points: {a.points ?? 0}</div>
                        <div className="text-xs text-gray-600">Price: {Number(a.price ?? 0).toFixed(2)}</div>
                      </div>
                      <button
                        disabled={assigning === a.id}
                        onClick={() => assignAsset(a.id)}
                        className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {assigning === a.id ? 'Assigning…' : 'Assign'}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    className="px-3 py-1 rounded border"
                    disabled={pickerMeta.page <= 1}
                    onClick={() => fetchPicker(pickerMeta.page - 1, pickerQuery)}
                  >
                    Prev
                  </button>
                  <span className="text-xs">
                    Page {pickerMeta.page} of {pickerMeta.last_page}
                  </span>
                  <button
                    className="px-3 py-1 rounded border"
                    disabled={pickerMeta.page >= pickerMeta.last_page}
                    onClick={() => fetchPicker(pickerMeta.page + 1, pickerQuery)}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Errors summary */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Please fix the following errors:</strong>
          <ul className="mt-2">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field} className="text-sm">• {message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
