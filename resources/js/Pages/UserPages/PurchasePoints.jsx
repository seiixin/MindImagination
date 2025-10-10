// resources/js/Pages/BuyPoints.jsx
import { useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// Inline SVG placeholder (avoids 404s if no static file)
const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="96" viewBox="0 0 160 96">
      <rect width="100%" height="100%" fill="#2f4a50"/>
      <g fill="none" stroke="#5f7f84" stroke-width="2">
        <rect x="6" y="6" width="148" height="84" rx="8"/>
        <path d="M20 72l26-26 18 18 20-20 36 36"/>
        <circle cx="54" cy="38" r="8"/>
      </g>
      <text x="50%" y="50%" dy="28" text-anchor="middle" fill="#9bb3b7" font-family="sans-serif" font-size="12">
        No Image
      </text>
    </svg>`
  );

// Helpers
function peso(n) {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return '0.00 PHP';
  return `${v.toFixed(2)} PHP`;
}

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
  const xsrfCookie = getCookie('XSRF-TOKEN');
  const headers = { 'X-Requested-With': 'XMLHttpRequest' };
  if (meta) headers['X-CSRF-TOKEN'] = meta;
  if (xsrfCookie) headers['X-XSRF-TOKEN'] = xsrfCookie;
  return headers;
}
function resolveRoute(name, fallbackPath) {
  try { if (typeof route === 'function') return route(name); } catch {}
  return fallbackPath;
}

// LocalStorage keys
const LS_SOURCE_KEY = 'paymongo_source_id';
const LS_PLAN_KEY   = 'paymongo_plan_id';

export default function PurchasePoints() {
  const { auth, plans: plansProp = [] } = usePage().props;

  // Normalize labels but keep original backend fields (including computed image_url)
  const plans = useMemo(() => {
    const list = Array.isArray(plansProp) ? plansProp : [];
    return list.map((p) => {
      const title = p.title ?? p.name ?? 'POINTS PLAN';
      const points = Number(p.points || 0);
      const priceNum = Number(p.price || 0);
      return {
        ...p,
        title,
        description: `PURCHASE ${points} POINTS`,
        priceLabel: peso(priceNum),
        priceNum,
      };
    });
  }, [plansProp]);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Start payment (create PayMongo Source) and redirect to checkout
  const handleConfirmPurchase = async () => {
    if (!selectedPlan || submitting) return;

    try {
      setSubmitting(true);
      const url = resolveRoute('paymongo.source', '/paymongo/source');

      const resp = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...buildCsrfHeaders(),
        },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          type: 'gcash', // adjust if you expose other types on UI
        }),
      });

      const raw = await resp.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { message: raw?.slice(0, 300) || 'Unexpected response' };
      }

      if (!resp.ok) {
        const msg = data?.errors?.[0]?.detail || data?.message || 'Failed to create payment source.';
        throw new Error(msg);
      }

      const sourceId = data?.data?.id;
      if (sourceId) localStorage.setItem(LS_SOURCE_KEY, sourceId);
      if (selectedPlan?.id) localStorage.setItem(LS_PLAN_KEY, String(selectedPlan.id));

      const checkoutUrl = data?.data?.attributes?.redirect?.checkout_url;
      if (!checkoutUrl) throw new Error('Missing PayMongo checkout URL.');

      window.location.href = checkoutUrl;
    } catch (e) {
      alert(e.message || 'Unable to start payment.');
      setSelectedPlan(null);
    } finally {
      setSubmitting(false);
    }
  };

  const PlanImage = ({ src, alt }) => (
    <img
      src={src || PLACEHOLDER}
      alt={alt}
      className="w-40 h-24 rounded-md object-cover flex-shrink-0 shadow-inner shadow-black/40"
      onError={(e) => {
        if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER;
      }}
    />
  );

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

        {/* Plans list */}
        <section className="relative border border-[#18504b] rounded-md bg-[#285360] p-4">
          <div
            className="flex flex-col gap-4 max-h-[250px] md:max-h-[350px] overflow-y-auto pr-2"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#7FE5DD #285360' }}
          >
            {plans.map((plan) => (
              <article key={plan.id} className="flex border-b border-[#1f4341] pb-4 last:border-b-0">
                {/* ✅ Use computed plan.image_url (from backend accessor) */}
                <PlanImage src={plan.image_url} alt={plan.title} />

                <div className="flex flex-col justify-center flex-grow ml-4">
                  <p className="font-semibold text-lg mb-1">{plan.title}</p>
                  <p className="font-medium text-base">{plan.description}</p>
                </div>

                <div className="ml-auto flex items-center">
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className="bg-[#d6b88e] text-lg font-mono px-8 py-2 rounded shadow-inner shadow-black/20 border border-black hover:bg-[#c5a672] transition"
                    aria-label={`Buy ${plan.title} for ${plan.priceLabel}`}
                  >
                    {plan.priceLabel}
                  </button>
                </div>
              </article>
            ))}

            {plans.length === 0 && (
              <p className="text-white/70 text-sm">No active plans available.</p>
            )}
          </div>

          {/* Decorative vertical track */}
          <div aria-hidden="true" className="pointer-events-none absolute top-4 bottom-4 right-0 w-3 rounded-l-md bg-black/20"></div>
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
                src={selectedPlan.image_url || PLACEHOLDER}
                alt={selectedPlan.title}
                className="w-24 h-16 object-cover rounded"
                onError={(e) => {
                  if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER;
                }}
              />
              <div className="flex flex-col justify-center">
                <p className="font-semibold">{selectedPlan.title}</p>
                <p>{selectedPlan.description}</p>
                <p className="mt-1 font-mono text-lg text-[#d6b88e]">
                  {peso(selectedPlan.price)}
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
