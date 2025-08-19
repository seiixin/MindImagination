import React, { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import axios from 'axios';

export default function Dashboard() {
  const [topUsers, setTopUsers] = useState([]);
  const [totalPurchasePoints, setTotalPurchasePoints] = useState(0);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await axios.get('/admin/dashboard-stats');
      setTopUsers(res.data.topUsers || []);
      setTotalPurchasePoints(res.data.totalPurchasePoints || 0);
      setTotalDownloads(res.data.totalDownloads || 0);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // transform for chart
  const chartData = topUsers.map((user) => ({
    name: user.name,
    points: user.points,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-700">Admin Dashboard</h1>

        {loading ? (
          <p>Loading data...</p>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-xl shadow text-center">
                <h2 className="text-gray-600 text-sm mb-2">Total Purchase Points</h2>
                <p className="text-3xl font-semibold text-gray-800">
                  {totalPurchasePoints}
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow text-center">
                <h2 className="text-gray-600 text-sm mb-2">Total Downloads</h2>
                <p className="text-3xl font-semibold text-gray-800">
                  {totalDownloads}
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Points per Top User</h2>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Bar dataKey="points" fill="#1e293b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Users List */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Top Users</h2>
              <div className="space-y-3">
                {topUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between border-b last:border-b-0 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="text-gray-800">{user.name}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-sm text-gray-500">
                        Points:{' '}
                        <span className="font-medium text-gray-700">{user.points}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Downloads:{' '}
                        <span className="font-medium text-gray-700">{user.downloads}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
