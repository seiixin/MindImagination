import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';


export default function PaymentFailed() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Failed ❌</h1>
      <p>Unfortunately, your payment was not completed.</p>
      <p className="mt-2 text-gray-500">Please try again or contact support if the issue continues.</p>
    </div>
  );
}
