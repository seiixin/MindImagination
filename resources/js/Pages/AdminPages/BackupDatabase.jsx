// resources/js/Pages/AdminPages/BackupDatabase.jsx

import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function BackupDatabase() {
  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  const [quickUrl, setQuickUrl] = useState('');
  const [scheduledUrl, setScheduledUrl] = useState('');
  const [testing, setTesting] = useState({ quick: false, scheduled: false });

  const [days, setDays] = useState(3);
  const [customDays, setCustomDays] = useState(days);
  const [isEditingDays, setIsEditingDays] = useState(false);

  const validateUrl = (url) => {
    if (!url.trim()) return 'URL cannot be empty';
    if (!/^https?:\/\//.test(url)) return 'URL must start with http:// or https://';
    return null;
  };

  const testStorageLocation = async (url, type) => {
    const error = validateUrl(url);
    if (error) return alert(error);

    setTesting((prev) => ({ ...prev, [type]: true }));
    setTimeout(() => {
      alert('Storage location is reachable and valid.');
      setTesting((prev) => ({ ...prev, [type]: false }));
    }, 800);
  };

  const handleQuickBackup = () => {
    const error = validateUrl(quickUrl);
    if (error) return alert(error);
    alert(`Quick backup started for URL:\n${quickUrl}`);
  };

  const handleSetSchedule = () => {
    const error = validateUrl(scheduledUrl);
    if (error) return alert(error);
    alert(`Scheduled backup set for URL:\n${scheduledUrl}\nFrequency: ${days} days`);
  };

  const handleSaveDays = () => {
    const parsed = parseInt(customDays, 10);
    if (isNaN(parsed) || parsed <= 0) {
      return alert('Please enter a valid number of days');
    }
    setDays(parsed);
    setIsEditingDays(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-5xl mx-auto px-6 py-8 bg-gray-200 rounded-xl">
        <h1 className="text-2xl font-bold text-gray-700 uppercase tracking-wider">
          Backup Database Settings
        </h1>

        {/* Quick Backup Section */}
        <div className={`p-6 rounded-xl bg-gray-200 ${neuShadow} space-y-6`}>
          <h2 className="text-lg font-semibold text-gray-800 uppercase">Quick Database Backup</h2>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Storage URL:</label>
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="text"
                placeholder="Enter storage URL here"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                className="flex-1 min-w-[200px] px-4 py-2 rounded bg-white border border-gray-400 text-sm outline-none"
              />
              <button
                onClick={() => testStorageLocation(quickUrl, 'quick')}
                disabled={testing.quick}
                className={`px-4 py-2 text-sm font-semibold uppercase bg-gray-300 rounded-full ${neuShadow} hover:brightness-95 transition`}
              >
                {testing.quick ? 'Testing...' : 'Test Location'}
              </button>
            </div>
          </div>

          <div>
            <button
              onClick={handleQuickBackup}
              className={`px-6 py-2 rounded-full font-semibold uppercase bg-blue-200 text-blue-800 hover:bg-blue-300 transition ${neuShadow}`}
            >
              Backup Database
            </button>
          </div>
        </div>

        {/* Scheduled Backup Section */}
        <div className={`p-6 rounded-xl bg-gray-200 ${neuShadow} space-y-6`}>
          <h2 className="text-lg font-semibold text-gray-800 uppercase">Scheduled Database Backup</h2>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Storage URL:</label>
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="text"
                placeholder="Enter storage URL here"
                value={scheduledUrl}
                onChange={(e) => setScheduledUrl(e.target.value)}
                className="flex-1 min-w-[200px] px-4 py-2 rounded bg-white border border-gray-400 text-sm outline-none"
              />
              <button
                onClick={() => testStorageLocation(scheduledUrl, 'scheduled')}
                disabled={testing.scheduled}
                className={`px-4 py-2 text-sm font-semibold uppercase bg-gray-300 rounded-full ${neuShadow} hover:brightness-95 transition`}
              >
                {testing.scheduled ? 'Testing...' : 'Test Location'}
              </button>
            </div>
          </div>

          {/* Editable Frequency */}
          <div className="flex items-center gap-4">
            {isEditingDays ? (
              <>
                <input
                  type="number"
                  min="1"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="px-4 py-2 rounded bg-white border border-gray-400 text-sm outline-none w-24"
                />
                <span className="text-sm font-medium">DAYS — CUSTOMIZE DAYS</span>
                <button
                  onClick={handleSaveDays}
                  className="bg-green-500 text-white text-sm px-4 py-1 rounded-full hover:bg-green-600 transition"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <div className="bg-gray-300 px-4 py-2 rounded text-sm font-semibold">
                  {days} DAYS — CUSTOMIZE DAYS
                </div>
                <button
                  onClick={() => setIsEditingDays(true)}
                  className="bg-blue-500 text-white text-sm px-4 py-1 rounded-full hover:bg-blue-600 transition"
                >
                  Edit
                </button>
              </>
            )}
          </div>

          <div>
            <button
              onClick={handleSetSchedule}
              className={`px-6 py-2 rounded-full font-semibold uppercase bg-green-200 text-green-800 hover:bg-green-300 transition ${neuShadow}`}
            >
              Set Backup Schedule
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
