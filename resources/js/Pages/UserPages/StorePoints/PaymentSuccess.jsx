// resources/js/Pages/UserPages/PaymentSuccess.jsx
import React, { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

const LS_KEY = 'paymongo_source_id';

// meta + cookie CSRF
function getMeta(name) {
  const el = document.querySelector(`meta[name="${name}"]`);
  return el ? el.getAttribute('content') : '';
}
function getCookie(name) {
  const m = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[2]) : null;
}
function csrfHeaders() {
  const h = { 'X-Requested-With': 'XMLHttpRequest' };
  const meta = getMeta('csrf-token');
  const xsrf = getCookie('XSRF-TOKEN');
  if (meta) h['X-CSRF-TOKEN'] = meta;
  if (xsrf) h['X-XSRF-TOKEN'] = xsrf;
  return h;
}
function resolveRoute(name, fallback) {
  try { if (typeof route === 'function') return route(name); } catch {}
  return fallback;
}

// Find source id from many places
function resolveSourceId() {
  // 1) query string
  const qs = new URLSearchParams(window.location.search);
  for (const k of ['source_id', 'id', 'source', 'src']) {
    const v = qs.get(k);
    if (v) return v;
  }
  // 2) URL hash (rare, but cheap to check)
  if (window.location.hash) {
    const hs = new URLSearchParams(window.location.hash.slice(1));
    for (const k of ['source_id', 'id', 'source', 'src']) {
      const v = hs.get(k);
      if (v) return v;
    }
  }
  // 3) localStorage fallback
  const ls = localStorage.getItem(LS_KEY);
  if (ls) return ls;
  return null;
}

export default function PaymentSuccess() {
  const [status, setStatus] = useState('Confirming payment…');
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const sourceId = resolveSourceId();

    if (!sourceId) {
      setStatus('Missing source_id from PayMongo redirect.');
      return;
    }

    const url = resolveRoute('paymongo.payment', '/paymongo/payment');

    axios.post(
      url,
      { source_id: sourceId },
      { withCredentials: true, headers: { Accept: 'application/json', ...csrfHeaders() } }
    )
      .then(() => {
        // cleanup any stored id to avoid stale confirmations
        localStorage.removeItem(LS_KEY);
        setStatus('Payment confirmed. Points credited!');
        setTimeout(() => router.visit(resolveRoute('buy-points', '/buy-points')), 1200);
      })
      .catch((e) => {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.errors?.[0]?.detail ||
          'Unable to confirm payment.';
        setStatus(msg);
      });
  }, []);

  return (
    <div className="py-20 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful ✅</h1>
      <p className="text-center max-w-xl">{status}</p>
      <button
        onClick={() => router.visit(resolveRoute('buy-points', '/buy-points'))}
        className="mt-8 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
      >
        Back to Store Points
      </button>
    </div>
  );
}
