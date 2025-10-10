import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function Downloads() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [err, setErr] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('any'); // any | email | name | asset
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [perPage, setPerPage] = useState(50);

  const params = useMemo(
    () => ({
      page: 1,
      per_page: perPage,
      ...(search ? { search } : {}),
      ...(searchBy ? { search_by: searchBy } : {}),
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
    }),
    [search, searchBy, dateFrom, dateTo, perPage]
  );

  const formatDateTime = (isoString) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString ?? '';
      return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString ?? '';
    }
  };

  const safeInt = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const getDownloads = (item) =>
    safeInt(item?.downloads ?? item?.download_count ?? item?.points_used ?? 0);

  const getPointsUsed = (item) =>
    safeInt(item?.points_used ?? 0);

  const fetchPage = async (page = 1, extra = {}) => {
    const res = await axios.get('/admin/logs/downloads', {
      params: { ...params, ...extra, page },
    });
    return res.data;
  };

  const fetchData = async (page = 1) => {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchPage(page);
      setRows(Array.isArray(data?.data) ? data.data : []);
      setPagination(data?.pagination ?? null);
    } catch (e) {
      console.error(e);
      setErr('Failed to load download logs.');
      setRows([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllFiltered = async () => {
    const first = await fetchPage(1, { per_page: 100 });
    const items = [...(first?.data ?? [])];
    const last = first?.pagination?.last_page ?? 1;
    for (let p = 2; p <= last; p++) {
      const next = await fetchPage(p, { per_page: 100 });
      if (Array.isArray(next?.data)) items.push(...next.data);
    }
    return items;
  };

  const buildExportRows = (arr) =>
    arr.map((item) => ({
      Date: formatDateTime(item?.created_at),
      Email: item?.user?.email ?? '',
      Name: item?.user?.name ?? '',
      Asset: item?.asset?.title ?? '',
      Category: item?.asset?.category?.name ?? '',
      Downloads: getDownloads(item),
      'Points Used': getPointsUsed(item),
    }));

  const exportExcel = async () => {
    try {
      setExporting(true);
      const all = await fetchAllFiltered();
      const data = buildExportRows(all);
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };
      XLSX.utils.book_append_sheet(wb, ws, 'Downloads');
      XLSX.writeFile(wb, `downloads_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      console.error('Excel export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  const exportPDF = async () => {
    try {
      setExporting(true);
      const all = await fetchAllFiltered();
      const data = buildExportRows(all);
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      doc.setFontSize(14);
      doc.text('Downloads Report', 40, 36);
      autoTable(doc, {
        startY: 50,
        head: [['Date', 'Email', 'Name', 'Asset', 'Category', 'Downloads', 'Points Used']],
        body: data.map((r) => [r.Date, r.Email, r.Name, r.Asset, r.Category, r.Downloads, r['Points Used']]),
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [240, 240, 240] },
        margin: { left: 40, right: 40 },
        didDrawPage: () => {
          const pageW = doc.internal.pageSize.getWidth();
          const pageH = doc.internal.pageSize.getHeight();
          doc.setFontSize(9);
          doc.text(`Generated: ${new Date().toLocaleString('en-PH')}`, 40, pageH - 12);
          doc.text(`Page ${doc.getNumberOfPages()}`, pageW - 80, pageH - 12);
        },
      });
      doc.save(`downloads_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  const applyFilters = () => fetchData(1);
  const resetFilters = () => {
    setSearch('');
    setSearchBy('any');
    setDateFrom('');
    setDateTo('');
    setPerPage(50);
  };

  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
        <div className="md:col-span-3">
          <label className="block text-xs text-gray-600 mb-1">Search term</label>
          <input
            type="text"
            value={search}
            placeholder="e.g. maria@example.com / Maria / Asset name"
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Search by</label>
          <select
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="any">Any (email/name/asset)</option>
            <option value="email">Email</option>
            <option value="name">Name</option>
            <option value="asset">Asset</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-xs text-gray-600 mb-1">Per page</label>
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button
            onClick={applyFilters}
            className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Apply
          </button>
          <button onClick={resetFilters} className="px-3 py-2 rounded-lg border hover:bg-gray-50">
            Reset
          </button>
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button
            onClick={exportExcel}
            disabled={exporting}
            className="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
            title="Export filtered results to Excel"
          >
            Export Excel
          </button>
          <button
            onClick={exportPDF}
            disabled={exporting}
            className="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
            title="Export filtered results to PDF"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[65vh] border rounded-lg">
        {loading ? (
          <p className="p-3 text-sm text-gray-500">Loading…</p>
        ) : err ? (
          <p className="p-3 text-sm text-red-600">{err}</p>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">DATE</th>
                <th className="p-2 border">EMAIL ADDRESS</th>
                <th className="p-2 border">FULL NAME</th>
                <th className="p-2 border">ASSET</th>
                <th className="p-2 border">CATEGORY</th>
                <th className="p-2 border text-right">DOWNLOADS</th>
                <th className="p-2 border text-right">POINTS USED</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((item, i) => (
                  <tr key={item?.id ?? i} className="hover:bg-gray-50">
                    <td className="p-2 border">{formatDateTime(item?.created_at)}</td>
                    <td className="p-2 border">{item?.user?.email ?? '—'}</td>
                    <td className="p-2 border">{item?.user?.name ?? '—'}</td>
                    <td className="p-2 border">{item?.asset?.title ?? '—'}</td>
                    <td className="p-2 border">{item?.asset?.category?.name ?? '—'}</td>
                    <td className="p-2 border text-right">{getDownloads(item)}</td>
                    <td className="p-2 border text-right">{getPointsUsed(item)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-3 text-sm text-gray-500 text-center">
                    No results
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="mt-3 flex items-center gap-2">
          <button
            disabled={pagination.current_page === 1}
            onClick={() => fetchData(pagination.current_page - 1)}
            className="px-3 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.current_page} of {pagination.last_page}
          </span>
          <button
            disabled={pagination.current_page === pagination.last_page}
            onClick={() => fetchData(pagination.current_page + 1)}
            className="px-3 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
