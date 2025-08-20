import React, { useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';

export default function PaymentSuccess(props) {
  const { auth } = usePage().props;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sourceId = params.get("source_id");
    const amount = params.get("amount");

    // auto-confirm the payment to PayMongo
    if (sourceId && amount) {
      axios.post('/admin/store-points/payment', {
        source_id: sourceId,
        amount: parseInt(amount),
      }).then(res => {
        console.log('Payment confirm response:', res.data);
      }).catch(e => {
        console.error('Error confirming payment:', e.response?.data || e);
      });
    }
  }, []);

  return (

      <div className="py-20 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          Payment Successful ✅
        </h1>
        <p>Your transaction has been processed.</p>

        <button
          onClick={() => router.visit('/admin/store-points')}
          className="mt-8 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          Back to Store Points
        </button>
      </div>
  );
}
