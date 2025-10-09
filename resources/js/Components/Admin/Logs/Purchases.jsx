import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function Purchases() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

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
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
      ...(search ? { search } : {}),
      ...(searchBy ? { search_by: searchBy } : {}),
    }),
    [search, searchBy, dateFrom, dateTo, perPage]
  );

  const formatDateTime = (isoOrStr) => {
    try {
      const d = new Date(isoOrStr);
      if (isNaN(d.getTime())) return isoOrStr ?? '';
      return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }).format(d);
    } catch { return isoOrStr ?? ''; }
  };

  const formatPHP = (n) => {
    const num = Number(n ?? 0);
    return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fetchPage = async (page = 1, moreParams = {}) => {
    const res = await axios.get('/admin/logs/purchases', {
      params: { ...params, ...moreParams, page },
    });
    return res.data;
  };

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const data = await fetchPage(page);
      setRows(Array.isArray(data?.data) ? data.data : []);
      setPagination(data?.pagination ?? null);
    } catch (e) {
      console.error(e);
      setRows([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Get ALL filtered rows (for Excel/PDF)
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

  const handleApplyFilters = () => fetchData(1);
  const handleReset = () => {
    setSearch('');
    setSearchBy('any');
    setDateFrom('');
    setDateTo('');
    setPerPage(50);
  };

  const buildExportRows = (arr) =>
    arr.map((item) => ({
      Date: formatDateTime(item?.created_at),
      Email: item?.user?.email ?? '',
      Name: item?.user?.name ?? '',
      Asset: item?.asset?.title ?? '',
      Category: item?.asset?.category?.name ?? '',
      Points: Number(item?.points_spent ?? 0),
      Cost: Number(item?.cost_amount ?? 0),
    }));

  const exportExcel = async () => {
    try {
      setExporting(true);
      const all = await fetchAllFiltered();
      const data = buildExportRows(all);

      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(
        data.map(r => ({ ...r, Cost: r.Cost })) // keep Cost numeric
      );
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };
      XLSX.utils.book_append_sheet(wb, ws, 'Purchases');
      XLSX.writeFile(wb, `purchases_${new Date().toISOString().slice(0,10)}.xlsx`);
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
      doc.text('Purchases Report', 40, 36);
      autoTable(doc, {
        startY: 50,
        head: [['Date', 'Email', 'Name', 'Asset', 'Category', 'Points', 'Cost (PHP)']],
        body: data.map(r => [
          r.Date, r.Email, r.Name, r.Asset, r.Category,
          r.Points,
          r.Cost.toLocaleString('en-PH', { minimumFractionDigits: 2 }),
        ]),
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [240, 240, 240] },
        margin: { left: 40, right: 40 },
        didDrawPage: () => {
          const w = doc.internal.pageSize.getWidth();
          const h = doc.internal.pageSize.getHeight();
          doc.setFontSize(9);
          doc.text(`Generated: ${new Date().toLocaleString('en-PH')}`, 40, h - 12);
          doc.text(`Page ${doc.getNumberOfPages()}`, w - 80, h - 12);
        },
      });

      doc.save(`purchases_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => { fetchData(1); }, []);

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
        <div className="md:col-span-3">
          <label className="block text-xs text-gray-600 mb-1">Search term</label>
          <input
            type="text"
            value={search}
            placeholder="email / name / asset"
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
          <button onClick={handleApplyFilters} className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
            Apply
          </button>
          <button onClick={handleReset} className="px-3 py-2 rounded-lg border hover:bg-gray-50">
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
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">DATE</th>
                <th className="p-2 border">EMAIL ADDRESS</th>
                <th className="p-2 border">FULL NAME</th>
                <th className="p-2 border">ASSET</th>
                <th className="p-2 border">CATEGORY</th>
                <th className="p-2 border text-right">POINTS</th>
                <th className="p-2 border text-right">COST</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((item, i) => (
                <tr key={item?.id ?? i} className="hover:bg-gray-50">
                  <td className="p-2 border">{formatDateTime(item?.created_at)}</td>
                  <td className="p-2 border">{item?.user?.email ?? '—'}</td>
                  <td className="p-2 border">{item?.user?.name ?? '—'}</td>
                  <td className="p-2 border">{item?.asset?.title ?? '—'}</td>
                  <td className="p-2 border">{item?.asset?.category?.name ?? '—'}</td>
                  <td className="p-2 border text-right">{Number(item?.points_spent ?? 0)}</td>
                  <td className="p-2 border text-right">{formatPHP(item?.cost_amount)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="p-3 text-sm text-gray-500 text-center">No results</td>
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
