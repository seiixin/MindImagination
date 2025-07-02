import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function PurchasePoints() {
  const { auth } = usePage().props;

  const [selectedPlan, setSelectedPlan] = useState(null); // store clicked plan

  const pointsPlans = [
    {
      id: 1,
      title: 'POINTS TITLE',
      description: 'PURCHASE 120 POINTS',
      price: '100 PHP',
      image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/5fb4feec-2047-44d2-884c-2d0f5dc039f5.png'
    },
    {
      id: 2,
      title: 'POINTS TITLE',
      description: 'PURCHASE 450 POINTS',
      price: '300 PHP',
      image: 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/5fb4feec-2047-44d2-884c-2d0f5dc039f5.png'
    },
    // add more if needed
  ];

  const handleConfirmPurchase = () => {
    // TODO: replace with real purchase logic (e.g., Inertia.post)
    alert(`Purchased: ${selectedPlan.description} for ${selectedPlan.price}`);
    setSelectedPlan(null); // close modal
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 text-white">
        {/* Header */}
        <header className="mb-4">
          <h1 className="text-center text-3xl font-semibold mb-2">POINTS PLAN</h1>
          <p className="text-left text-lg font-medium">
            AVAILABLE POINTS:{' '}
            <span className="font-bold text-[#0ff]">{auth?.user?.points ?? '0'}</span>
            <span className="ml-1 text-sm text-white/60">(Max Points)</span>
          </p>
        </header>

        {/* Points plans list */}
        <section className="relative border border-[#18504b] rounded-md bg-[#285360] p-4">
          <div
            className="flex flex-col gap-4 max-h-[250px] overflow-y-auto pr-2"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#7FE5DD #285360'
            }}
          >
            {pointsPlans.map(plan => (
              <article key={plan.id} className="flex border-b border-[#1f4341] pb-4 last:border-b-0">
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
              <img src={selectedPlan.image} alt={selectedPlan.title} className="w-24 h-16 object-cover rounded" />
              <div className="flex flex-col justify-center">
                <p className="font-semibold">{selectedPlan.title}</p>
                <p>{selectedPlan.description}</p>
                <p className="mt-1 font-mono text-lg text-[#d6b88e]">{selectedPlan.price}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedPlan(null)}
                className="px-4 py-1 rounded border border-[#b5946f] bg-[#c7ad88] text-black hover:bg-[#b5946f] hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="px-4 py-1 rounded border border-[#b5946f] bg-[#b5946f] text-white hover:bg-[#a77d56] transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
