import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { usePage, router } from '@inertiajs/react';
import UserList from '@/Components/Admin/UsersManagement/UserList';
import UserManagement from '@/Components/Admin/UsersManagement/UserManagement';
import axios from 'axios';

// Ziggy (optional)
const hasZiggy = typeof window !== 'undefined' && typeof window.route === 'function';
const r = (name, params = {}) => (hasZiggy ? window.route(name, params) : null);

// Fallback URLs if Ziggy isn't present
const url = {
  grant: (userId) => `/admin/users/${userId}/owned-assets`,
  updatePurchase: (purchaseId) => `/admin/owned-assets/${purchaseId}`,
  bulkGrant: (userId) => `/admin/users/${userId}/owned-assets/bulk`,
  bulkDestroy: () => `/admin/owned-assets/bulk`,
};

export default function Users() {
  const { users: rawUsers = [] } = usePage().props;
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'management' | null
  const [selectedUser, setSelectedUser] = useState(null);

  // UX helpers
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  // === Free Registration Points ===
  const [freeRegPoints, setFreeRegPoints] = useState(100);
  const [savedFreeRegPoints, setSavedFreeRegPoints] = useState(100);
  const [isEditingFRP, setIsEditingFRP] = useState(false);

  // Load saved FRP
  useEffect(() => {
    try {
      const v = localStorage.getItem('freeRegPointsDefault');
      if (v !== null) {
        const n = Number(v);
        if (!Number.isNaN(n) && n >= 0) {
          setFreeRegPoints(n);
          setSavedFreeRegPoints(n);
        }
      }
    } catch {}
  }, []);

  const handleEditFRP = () => setIsEditingFRP(true);
  const handleCancelFRP = () => { setFreeRegPoints(savedFreeRegPoints); setIsEditingFRP(false); };
  const handleSaveFRP = async () => {
    const n = Number(freeRegPoints);
    if (Number.isNaN(n) || n < 0) return;
    try {
      localStorage.setItem('freeRegPointsDefault', String(n));
      setSavedFreeRegPoints(n);
      setIsEditingFRP(false);
      setNotice('Saved default free registration points.');
    } catch {
      setError('Failed to save locally.');
    }
  };

  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  const formatUsers = (users) =>
    users.map((u) => ({
      id: u.id,
      fullName: u.name || '',
      userName: u.username || '',
      emailAddress: u.email || '',
      mobileNumber: u.mobile_number || '',
      address: u.address || '',
      userPoints: u.points || 0,
      password: '',
      verificationStatus: u.verification_status || 'pending',
      activeStatus: u.active_status || 'enabled',
      access: u.role || 'viewer',
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));

  const formattedUsers = formatUsers(rawUsers);

  const handleUserSelect = (user) => { setSelectedUser(user); setCurrentView('management'); };
  const handleAddUser = () => { setSelectedUser(null); setCurrentView('management'); };
  const handleBackToMain = () => { setCurrentView(null); setSelectedUser(null); setTimeout(() => setCurrentView('list'), 0); };

  // Refresh only 'users' prop then update selectedUser row
  const refreshUsersProp = useCallback(async () => {
    return new Promise((resolve) => {
      router.reload({ only: ['users'], onFinish: () => resolve() });
    });
  }, []);

  const refreshUserRow = useCallback(
    async (userId) => {
      await refreshUsersProp();
      const fresh = formatUsers((usePage().props || {}).users || []);
      const updated = fresh.find((u) => u.id === userId);
      if (updated) setSelectedUser(updated);
    },
    [refreshUsersProp]
  );

  /* ====================== API Actions (axios; JSON responses) ====================== */

  // Grant asset to user (deduct points). allow_overdraft optional.
  const grantAssetToUser = useCallback(
    async ({ userId, assetId, allowOverdraft = false }) => {
      setBusy(true); setError(null); setNotice(null);
      try {
        const endpoint = (r && r('admin.users.owned-assets.store', { user: userId })) || url.grant(userId);
        await axios.post(endpoint, { asset_id: assetId, allow_overdraft: !!allowOverdraft });
        await refreshUserRow(userId);
        setNotice('Asset granted and points deducted.');
      } catch (e) {
        const status = e?.response?.status;
        const message = e?.response?.data?.message || (status === 422 ? 'Insufficient points.' : 'Failed to grant asset.');
        setError(message);
      } finally { setBusy(false); }
    },
    [refreshUserRow]
  );

  // Revoke purchase; optionally refund points
  const revokePurchase = useCallback(
    async ({ purchaseId, userId, refundPoints = false }) => {
      setBusy(true); setError(null); setNotice(null);
      try {
        const endpoint = (r && r('admin.owned-assets.update', { purchase: purchaseId })) || url.updatePurchase(purchaseId);
        await axios.patch(endpoint, { action: 'revoke', refund_points: !!refundPoints });
        await refreshUserRow(userId);
        setNotice(refundPoints ? 'Ownership revoked and points refunded.' : 'Ownership revoked.');
      } catch {
        setError('Failed to revoke ownership.');
      } finally { setBusy(false); }
    },
    [refreshUserRow]
  );

  // Unrevoke (restore to completed). No re-deduction by design.
  const unrevokePurchase = useCallback(
    async ({ purchaseId, userId }) => {
      setBusy(true); setError(null); setNotice(null);
      try {
        const endpoint = (r && r('admin.owned-assets.update', { purchase: purchaseId })) || url.updatePurchase(purchaseId);
        await axios.patch(endpoint, { action: 'unrevoke' });
        await refreshUserRow(userId);
        setNotice('Ownership restored.');
      } catch {
        setError('Failed to restore ownership.');
      } finally { setBusy(false); }
    },
    [refreshUserRow]
  );

  // Bulk grant (deduct points for each); optional overdraft
  const bulkGrantAssets = useCallback(
    async ({ userId, assetIds, allowOverdraft = false }) => {
      setBusy(true); setError(null); setNotice(null);
      try {
        const endpoint = (r && r('admin.users.owned-assets.bulkStore', { user: userId })) || url.bulkGrant(userId);
        await axios.post(endpoint, { asset_ids: assetIds, allow_overdraft: !!allowOverdraft });
        await refreshUserRow(userId);
        setNotice('Bulk grant finished. Points deducted as needed.');
      } catch {
        setError('Failed bulk grant.');
      } finally { setBusy(false); }
    },
    [refreshUserRow]
  );

  // Bulk revoke; optional refund
  const bulkRevokePurchases = useCallback(
    async ({ purchaseIds, refundPoints = false, userId }) => {
      setBusy(true); setError(null); setNotice(null);
      try {
        const endpoint = (r && r('admin.owned-assets.bulkDestroy')) || url.bulkDestroy();
        await axios.delete(endpoint, { data: { purchase_ids: purchaseIds, mode: 'revoke', refund_points: !!refundPoints } });
        await refreshUserRow(userId);
        setNotice(refundPoints ? 'Bulk revoke done with refunds.' : 'Bulk revoke done.');
      } catch {
        setError('Failed bulk revoke.');
      } finally { setBusy(false); }
    },
    [refreshUserRow]
  );

  /* ====================== Prompted wrappers (refund & overdraft UX) ====================== */

  // Simple window.confirm flows so admins can choose refund/overdraft without extra UI work
  const promptGrantAsset = useCallback(
    async ({ userId, assetId }) => {
      const sure = window.confirm('Grant this asset to the user? Points will be deducted.');
      if (!sure) return;
      const overdraft = window.confirm('Allow overdraft if user points are insufficient? OK=Allow, Cancel=Disallow');
      await grantAssetToUser({ userId, assetId, allowOverdraft: overdraft });
    },
    [grantAssetToUser]
  );

  const promptBulkGrantAssets = useCallback(
    async ({ userId, assetIds }) => {
      const sure = window.confirm(`Grant ${assetIds.length} assets? Points will be deducted per asset.`);
      if (!sure) return;
      const overdraft = window.confirm('Allow overdraft if user points are insufficient? OK=Allow, Cancel=Disallow');
      await bulkGrantAssets({ userId, assetIds, allowOverdraft: overdraft });
    },
    [bulkGrantAssets]
  );

  const promptRevokePurchase = useCallback(
    async ({ purchaseId, userId }) => {
      const sure = window.confirm('Revoke this ownership?');
      if (!sure) return;
      const refund = window.confirm('Refund points to the user? OK=Refund, Cancel=Do not refund');
      await revokePurchase({ purchaseId, userId, refundPoints: refund });
    },
    [revokePurchase]
  );

  const promptBulkRevokePurchases = useCallback(
    async ({ purchaseIds, userId }) => {
      const sure = window.confirm(`Revoke ${purchaseIds.length} ownerships?`);
      if (!sure) return;
      const refund = window.confirm('Refund points to users? OK=Refund, Cancel=Do not refund');
      await bulkRevokePurchases({ purchaseIds, refundPoints: refund, userId });
    },
    [bulkRevokePurchases]
  );

  // Actions exposed to children (both raw + prompted)
  const actions = {
    // raw
    grantAssetToUser,
    revokePurchase,
    unrevokePurchase,
    bulkGrantAssets,
    bulkRevokePurchases,
    refreshUserRow,
    // prompts
    promptGrantAsset,
    promptBulkGrantAssets,
    promptRevokePurchase,
    promptBulkRevokePurchases,
  };

  const renderMainView = () => (
    <div className="space-y-6 text-gray-700 max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">USER MANAGEMENT</h1>
      </div>

      <div className={`bg-gray-200 p-6 rounded-xl ${neuShadow}`}>
        <div className="text-center space-y-6">
          <h2 className="text-xl font-semibold text-gray-700">Choose an Action</h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setCurrentView('list')}
              className={`px-8 py-4 rounded-xl font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors ${neuShadow}`}
            >
              VIEW USER LIST
            </button>

            <button
              onClick={handleAddUser}
              className={`px-8 py-4 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 transition-colors ${neuShadow}`}
            >
              USER MANAGEMENT
            </button>
          </div>

          <div className="text-sm text-gray-600 max-w-md mx-auto">
            <p><strong>User List:</strong> View all users, search, and select users to manage</p>
            <p><strong>User Management:</strong> Create new users or manage existing ones</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      {(notice || error || busy) && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          {busy && <div className="mb-2 text-sm text-gray-500">Processing…</div>}
          {notice && <div className="mb-2 px-3 py-2 rounded bg-emerald-50 text-emerald-700 text-sm">{notice}</div>}
          {error && <div className="mb-2 px-3 py-2 rounded bg-rose-50 text-rose-700 text-sm">{error}</div>}
        </div>
      )}

      {currentView === null && renderMainView()}

      {currentView === 'list' && (
        <div className="space-y-6 text-gray-700 max-w-6xl mx-auto p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">USER LIST</h1>
            <button
              onClick={handleBackToMain}
              className={`px-5 py-2 rounded-full font-bold bg-gray-500 text-white hover:bg-gray-600 transition-colors ${neuShadow}`}
            >
              Back to Main
            </button>
          </div>

          {/* FREE REGISTRATION POINTS / Edit-Save-Cancel */}
          <div className="flex flex-wrap items-center gap-3 text-gray-700">
            <label className="text-sm font-semibold tracking-wide">FREE REGISTRATION POINTS:</label>

            <input
              type="number"
              min={0}
              value={freeRegPoints}
              onChange={(e) => setFreeRegPoints(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 100"
              disabled={!isEditingFRP}
              className={`px-3 py-1 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-500 ${neuShadow}`}
              style={{ width: 140 }}
            />

            {!isEditingFRP ? (
              <button
                onClick={handleEditFRP}
                className={`px-3 py-1 rounded-md font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors ${neuShadow}`}
              >
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveFRP}
                  className={`px-3 py-1 rounded-md font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors ${neuShadow}`}
                >
                  Save
                </button>
                <button
                  onClick={handleCancelFRP}
                  className={`px-3 py-1 rounded-md font-semibold bg-gray-500 text-white hover:bg-gray-600 transition-colors ${neuShadow}`}
                >
                  Cancel
                </button>
              </div>
            )}

            <span className="text-xs text-gray-500 ml-1">
              saved: <strong>{savedFreeRegPoints}</strong>
            </span>
          </div>

          <UserList
            users={formattedUsers}
            onSelect={handleUserSelect}
            onAddUser={handleAddUser}
            defaultFreeRegPoints={savedFreeRegPoints}
            actions={actions}   // includes prompt* helpers
            busy={busy}
          />
        </div>
      )}

      {currentView === 'management' && (
        <div className="space-y-6 text-gray-700 max-w-6xl mx-auto p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              {selectedUser ? 'EDIT USER' : 'ADD USER'}
            </h1>
            <button
              onClick={handleBackToMain}
              className={`px-5 py-2 rounded-full font-bold bg-gray-500 text-white hover:bg-gray-600 transition-colors ${neuShadow}`}
            >
              Back to Main
            </button>
          </div>

          <UserManagement
            selectedUser={selectedUser}
            onBack={handleBackToMain}
            defaultFreeRegPoints={savedFreeRegPoints}
            actions={actions}   // includes prompt* helpers
            busy={busy}
          />
        </div>
      )}
    </AdminLayout>
  );
}
