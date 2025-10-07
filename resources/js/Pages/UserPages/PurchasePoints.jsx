import { useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

function peso(n) {
  const v = Number(n ?? 0);
  return `${v.toFixed(2)} PHP`;
}

// --- CSRF helpers (meta first, cookie fallback) ---
function getCsrfFromMeta() {
  const el = document.querySelector('meta[name="csrf-token"]');
  return el ? el.getAttribute('content') : '';
}
function getCookie(name) {
  const m = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[2]) : null;
}
function buildCsrfHeaders() {
  const meta = getCsrfFromMeta();
  const xsrfCookie = getCookie('XSRF-TOKEN'); // Laravel’s SPA cookie
  const headers = { 'X-Requested-With': 'XMLHttpRequest' };
  if (meta) headers['X-CSRF-TOKEN'] = meta;
  if (xsrfCookie) headers['X-XSRF-TOKEN'] = xsrfCookie; // optional fallback
  return headers;
}
// Safe route resolver (fallback to path if Ziggy route() is not available)
function resolveRoute(name, fallbackPath) {
  try { if (typeof route === 'function') return route(name); } catch {}
  return fallbackPath;
}

const LS_SOURCE_KEY = 'paymongo_source_id'; // stash for success page fallback
const LS_PLAN_KEY   = 'paymongo_plan_id';   // optional: stash plan for reference

export default function PurchasePoints() {
  const { auth, plans = [] } = usePage().props;

  const [selectedPlan, setSelectedPlan] = useState(null); // store clicked plan
  const [submitting, setSubmitting] = useState(false);

  // Map store_plans -> existing UI shape (NO UI CHANGES)
  const pointsPlans = useMemo(() => {
    return plans.map((p) => ({
      id: p.id,
      title: p.title ?? p.name ?? 'POINTS TITLE',
      description: `PURCHASE ${Number(p.points || 0)} POINTS`,
      price: peso(p.price || 0),
      _priceNumber: Number(p.price || 0), // internal helper
      image:
        p.image_url ||
        'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/5fb4feec-2047-44d2-884c-2d0f5dc039f5.png',
    }));
  }, [plans]);

  const handleConfirmPurchase = async () => {
    if (!selectedPlan || submitting) return;

    try {
      setSubmitting(true);

      const url = resolveRoute('paymongo.source', '/paymongo/source');

      // Create PayMongo Source using plan_id (default: gcash)
      const resp = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin', // send session cookie
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...buildCsrfHeaders(), // meta + cookie fallback
        },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          type: 'gcash',
        }),
      });

      // Handle JSON or HTML error (e.g., 419 page)
      const raw = await resp.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { message: raw?.slice(0, 300) || 'Unexpected response' };
      }

      if (!resp.ok) {
        const msg =
          data?.errors?.[0]?.detail ||
          data?.message ||
          'Failed to create payment source.';
        throw new Error(msg);
      }

      // ✅ Stash source id (and plan) for the /payment-success fallback
      const sourceId = data?.data?.id;
      if (sourceId) localStorage.setItem(LS_SOURCE_KEY, sourceId);
      if (selectedPlan?.id) localStorage.setItem(LS_PLAN_KEY, String(selectedPlan.id));

      const checkoutUrl = data?.data?.attributes?.redirect?.checkout_url;
      if (!checkoutUrl) throw new Error('Missing PayMongo checkout URL.');

      // Redirect to PayMongo checkout
      window.location.href = checkoutUrl;
    } catch (e) {
      alert(e.message || 'Unable to start payment.');
      setSelectedPlan(null); // close modal
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 text-white">
        {/* Header */}
        <header className="mb-4">
          <h1 className="text-center text-3xl font-semibold mb-2">POINTS PLAN</h1>
          <p className="text-left text-lg font-medium">
            AVAILABLE POINTS{' '}
            <span className="font-bold text-[#0ff]">{auth?.user?.points ?? '0'}</span>
            <span className="ml-1 text-sm text-white/60">(Max Points)</span>
          </p>
        </header>

        {/* Points plans list */}
        <section className="relative border border-[#18504b] rounded-md bg-[#285360] p-4">
          <div
            className="flex flex-col gap-4 max-h-[250px] overflow-y-auto pr-2"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#7FE5DD #285360' }}
          >
            {pointsPlans.map((plan) => (
              <article
                key={plan.id}
                className="flex border-b border-[#1f4341] pb-4 last:border-b-0"
              >
                <img
                  src={plan.image}
                  alt={plan.title}
                  className="w-40 h-24 rounded-md object-cover flex-shrink-0 shadow-inner shadow-black/40"
                />
                <div className="flex flex-col justify-center flex-grow ml-4">
                  <p className="font-semibold text-lg mb-1">{plan.title}</p>
                  <p className="font-medium text-base">{plan.description}</p>
                </div>
                <div className="ml-auto flex items-center">
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className="bg-[#d6b88e] text-lg font-mono px-8 py-2 rounded shadow-inner shadow-black/20 border border-black hover:bg-[#c5a672] transition"
                  >
                    {plan.price}
                  </button>
                </div>
              </article>
            ))}
            {pointsPlans.length === 0 && (
              <p className="text-white/70 text-sm">No active plans available.</p>
            )}
          </div>

          {/* Decorative vertical track */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-4 bottom-4 right-0 w-3 rounded-l-md bg-black/20"
          ></div>
        </section>

        {/* Footer button */}
        <footer className="mt-6 flex justify-end">
          <Link
            href="/dashboard"
            className="bg-[#7FE5DD] text-black font-bold px-8 py-2 rounded-tl-md border border-black shadow-inner hover:bg-[#64ccc6] transition-colors"
          >
            ACCOUNT
          </Link>
        </footer>
      </div>

      {/* Purchase confirmation modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#285360] text-white p-6 rounded-md shadow-lg max-w-md w-full space-y-4 border border-[#1f4341]">
            <h2 className="text-xl font-bold text-center">Confirm Purchase</h2>
            <div className="flex gap-3">
              <img
                src={selectedPlan.image}
                alt={selectedPlan.title}
                className="w-24 h-16 object-cover rounded"
              />
              <div className="flex flex-col justify-center">
                <p className="font-semibold">{selectedPlan.title}</p>
                <p>{selectedPlan.description}</p>
                <p className="mt-1 font-mono text-lg text-[#d6b88e]">
                  {selectedPlan.price}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedPlan(null)}
                disabled={submitting}
                className="px-4 py-1 rounded border border-[#b5946f] bg-[#c7ad88] text-black hover:bg-[#b5946f] hover:text-white transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={submitting}
                className="px-4 py-1 rounded border border-[#b5946f] bg-[#b5946f] text-white hover:bg-[#a77d56] transition disabled:opacity-60"
              >
                {submitting ? 'Redirecting…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
