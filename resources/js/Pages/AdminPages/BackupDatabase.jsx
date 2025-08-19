import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { router } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function BackupDatabase() {
  const neuShadow =
    'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  const [quickUrl, setQuickUrl] = useState('');
  const [scheduledUrl, setScheduledUrl] = useState('');
  const [testing, setTesting] = useState({ quick: false, scheduled: false });
  const [days, setDays] = useState(3);
  const [customDays, setCustomDays] = useState(days);
  const [isEditingDays, setIsEditingDays] = useState(false);

  const validateUrl = (url) => {
    if (!url.trim()) return 'URL cannot be empty';
    if (!/^https?:\/\//.test(url))
      return 'URL must start with http:// or https://';
    return null;
  };

  const testStorageLocation = (url, type) => {
    const error = validateUrl(url);
    if (error) return alert(error);
    setTesting((p) => ({ ...p, [type]: true }));
    setTimeout(() => {
      alert('Storage location looks valid.');
      setTesting((p) => ({ ...p, [type]: false }));
    }, 800);
  };

    const handleQuickBackup = () => {
    const error = validateUrl(quickUrl);
    if (error) return Swal.fire('Validation Error', error, 'warning');

    router.post(
        '/admin/backups',
        { url: quickUrl, type: 'quick' },
        {
        preserveScroll: true,
        onSuccess: () => {
            Swal.fire({
            title: 'Success!',
            text: 'Quick backup completed successfully!',
            icon: 'success',
            });
        },
        onError: (errors) => {
            Swal.fire({
            title: 'Error',
            text:
                errors?.url ||
                errors?.type ||
                'Something went wrong',
            icon: 'error',
            });
        },
        }
    );
    };

  const handleSetSchedule = () => {
    const error = validateUrl(scheduledUrl);
    if (error) return alert(error);

    router.post(
      '/admin/backups',
      { url: scheduledUrl, type: 'scheduled', frequency_days: days },
      {
        preserveScroll: true,
        onSuccess: () =>
          alert(`Scheduled backup saved (every ${days} day${days > 1 ? 's' : ''}).`),
        onError: (errors) =>
          alert(
            'Error: ' +
              (errors?.url ||
                errors?.frequency_days ||
                errors?.type ||
                'Something went wrong')
          ),
      }
    );
  };

  const handleSaveDays = () => {
    const val = parseInt(customDays, 10);
    if (isNaN(val) || val <= 0) return alert('Enter valid days');
    setDays(val);
    setIsEditingDays(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-5xl mx-auto px-6 py-8 bg-gray-200 rounded-xl">
        <h1 className="text-2xl font-bold text-gray-700 uppercase tracking-wider">
          Backup Database Settings
        </h1>

        {/* QUICK */}
        <div className={`p-6 rounded-xl bg-gray-200 ${neuShadow} space-y-6`}>
          <h2 className="text-lg font-semibold">Quick Backup</h2>
          <div className="space-y-2">
            <label className="text-sm font-semibold block">
              Drive Folder URL:
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={quickUrl}
                placeholder="https://drive.google.com/drive/folders/..."
                onChange={(e) => setQuickUrl(e.target.value)}
                className="flex-1 px-4 py-2 border rounded"
              />
              <button
                disabled={testing.quick}
                onClick={() => testStorageLocation(quickUrl, 'quick')}
                className="px-4 py-2 bg-gray-300 rounded uppercase text-sm"
              >
                {testing.quick ? 'Testing…' : 'Test'}
              </button>
            </div>
          </div>
          <button
            onClick={handleQuickBackup}
            className="px-6 py-2 bg-blue-200 text-blue-800 rounded-full uppercase font-semibold"
          >
            Run Backup Now
          </button>
        </div>

        {/* SCHEDULED */}
        <div className={`p-6 rounded-xl bg-gray-200 ${neuShadow} space-y-6`}>
          <h2 className="text-lg font-semibold">Scheduled Backup</h2>
          <div className="space-y-2">
            <label className="text-sm font-semibold block">
              Drive Folder URL:
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={scheduledUrl}
                placeholder="https://drive.google.com/drive/folders/..."
                onChange={(e) => setScheduledUrl(e.target.value)}
                className="flex-1 px-4 py-2 border rounded"
              />
              <button
                disabled={testing.scheduled}
                onClick={() => testStorageLocation(scheduledUrl, 'scheduled')}
                className="px-4 py-2 bg-gray-300 rounded uppercase text-sm"
              >
                {testing.scheduled ? 'Testing…' : 'Test'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isEditingDays ? (
              <>
                <input
                  type="number"
                  min="1"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="px-4 py-2 border rounded w-24"
                />
                <button
                  onClick={handleSaveDays}
                  className="bg-green-500 text-white px-4 py-1 rounded-full text-sm"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <div className="px-4 py-2 bg-gray-300 rounded">{days} DAYS</div>
                <button
                  onClick={() => setIsEditingDays(true)}
                  className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm"
                >
                  Edit
                </button>
              </>
            )}
          </div>

          <button
            onClick={handleSetSchedule}
            className="px-6 py-2 bg-green-200 text-green-800 rounded-full uppercase font-semibold"
          >
            Save Schedule
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
