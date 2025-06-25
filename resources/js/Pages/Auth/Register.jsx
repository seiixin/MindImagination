import GuestLayout from '@/Layouts/GuestLayout';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    mobile: '',
    address: '',
    password: '',
    terms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: handle submission with Inertia
  };

  return (
    <GuestLayout>
      <div className="max-w-md w-full mx-auto mt-10 bg-[#14628d]/70 border border-[#0e6ba0] shadow-md rounded-lg p-6 text-white backdrop-blur-md">
        <h2 className="text-xl font-bold text-center mb-4">Create Account</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-[#a0d6cd] text-[#113029] placeholder:text-[#113029] text-sm"
            required
          />
          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-[#a0d6cd] text-[#113029] placeholder:text-[#113029] text-sm"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-[#a0d6cd] text-[#113029] placeholder:text-[#113029] text-sm"
            required
          />
          <input
            name="mobile"
            placeholder="Mobile Number"
            value={form.mobile}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-[#a0d6cd] text-[#113029] placeholder:text-[#113029] text-sm"
            required
          />
          <input
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-[#a0d6cd] text-[#113029] placeholder:text-[#113029] text-sm"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-[#a0d6cd] text-[#113029] placeholder:text-[#113029] text-sm"
            required
          />

          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              name="terms"
              checked={form.terms}
              onChange={handleChange}
              className="mr-2 accent-[#cea76d]"
              required
            />
            I agree to the&nbsp;
            <Link href="/privacy-policy" className="underline text-[#ffd38c]">terms</Link>
          </label>

          <button
            type="submit"
            className="w-full bg-[#cea76d] text-[#2f2714] py-2 rounded font-semibold text-sm hover:bg-[#b88b3a]"
          >
            Register
          </button>

          <p className="text-center text-xs text-white/80 mt-2">
            Already have an account?{' '}
            <Link href="/login" className="text-[#cce5ff] underline">Login</Link>
          </p>
        </form>
      </div>
    </GuestLayout>
  );
}
