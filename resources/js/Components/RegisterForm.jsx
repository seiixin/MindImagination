// resources/js/Components/RegisterForm.jsx
import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterForm() {
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    mobile: '',
    address: '',
    password: '',
    terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: submit using Inertia.post('/register', form)
    console.log('Register data:', form);
  };

  return (
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

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full px-3 py-2 pr-10 rounded bg-[#a0d6cd] text-[#113029] placeholder:text-[#113029] text-sm"
          required
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center text-[#113029] hover:text-[#0e6ba0] focus:outline-none"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

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
  );
}
