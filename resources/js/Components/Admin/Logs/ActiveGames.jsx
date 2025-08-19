import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ActiveGames() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/logs/active-games', { params: { page } });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="overflow-auto max-h-[70vh]">
      {loading ? (<p>Loading...</p>) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">DATE</th>
              <th className="p-2 border">EMAIL ADDRESS</th>
              <th className="p-2 border">FULL NAME</th>
              <th className="p-2 border">ASSET</th>
              <th className="p-2 border">CATEGORY</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item,i)=>(
              <tr key={i} className="hover:bg-gray-50">
                <td className="p-2 border">{item.started_at}</td>
                <td className="p-2 border">{item.user.email}</td>
                <td className="p-2 border">{item.user.name}</td>
                <td className="p-2 border">{item.asset.title}</td>
                <td className="p-2 border">{item.asset.category.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pagination && (
        <div className="mt-4 flex gap-2">
          <button
            disabled={pagination.current_page === 1}
            onClick={() => fetchData(pagination.current_page - 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={pagination.current_page === pagination.last_page}
            onClick={() => fetchData(pagination.current_page + 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
