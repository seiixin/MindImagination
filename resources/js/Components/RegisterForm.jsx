// resources/js/Components/RegisterForm.jsx
import React, { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterForm() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    username: '',
    email: '',
    mobile_number: '',          // <-- TAMA: mobile_number
    address: '',
    password: '',
    password_confirmation: '',  // <-- TAMA: kailangan sa confirmed rule
    terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setData(name, type === 'checkbox' ? checked : value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/register', {
      onSuccess: () => reset('password', 'password_confirmation'),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input name="name" value={data.name} onChange={handleChange} placeholder="Full Name"
             className="w-full px-3 py-2 rounded bg-[#a0d6cd] text-[#113029] text-sm" required />
      {errors.name && <p className="text-red-300 text-xs">{errors.name}</p>}

      <input name="username" value={data.username} onChange={handleChange} placeholder="Username"
             className="w-full px-3 py-2 rounded bg-[#a0d6cd] text-[#113029] text-sm" required />
      {errors.username && <p className="text-red-300 text-xs">{errors.username}</p>}

      <input type="email" name="email" value={data.email} onChange={handleChange} placeholder="Email Address"
             className="w-full px-3 py-2 rounded bg-[#a0d6cd] text-[#113029] text-sm" required />
      {errors.email && <p className="text-red-300 text-xs">{errors.email}</p>}

      <input name="mobile_number" value={data.mobile_number} onChange={handleChange} placeholder="Mobile Number"
             className="w-full px-3 py-2 rounded bg-[#a0d6cd] text-[#113029] text-sm" required />
      {errors.mobile_number && <p className="text-red-300 text-xs">{errors.mobile_number}</p>}

      <input name="address" value={data.address} onChange={handleChange} placeholder="Address"
             className="w-full px-3 py-2 rounded bg-[#a0d6cd] text-[#113029] text-sm" />
      {errors.address && <p className="text-red-300 text-xs">{errors.address}</p>}

      <div className="relative">
        <input type={showPassword ? 'text' : 'password'} name="password" value={data.password}
               onChange={handleChange} placeholder="Password"
               className="w-full px-3 py-2 pr-10 rounded bg-[#a0d6cd] text-[#113029] text-sm" required />
        <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 right-2 text-[#113029]">
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {errors.password && <p className="text-red-300 text-xs">{errors.password}</p>}

      <input type="password" name="password_confirmation" value={data.password_confirmation}
             onChange={handleChange} placeholder="Confirm Password"
             className="w-full px-3 py-2 rounded bg-[#a0d6cd] text-[#113029] text-sm" required />
      {errors.password_confirmation && <p className="text-red-300 text-xs">{errors.password_confirmation}</p>}

      <label className="flex items-center text-sm">
        <input type="checkbox" name="terms" checked={data.terms} onChange={handleChange}
               className="mr-2 accent-[#cea76d]" required />
        I agree to the&nbsp;<Link href="/privacy-policy" className="underline text-[#ffd38c]">terms</Link>
      </label>
      {errors.terms && <p className="text-red-300 text-xs">{errors.terms}</p>}

      <button type="submit" disabled={processing}
              className="w-full bg-[#cea76d] text-[#2f2714] py-2 rounded font-semibold text-sm hover:bg-[#b88b3a]">
        {processing ? 'Creating account…' : 'Register'}
      </button>

      <p className="text-center text-xs text-white/80 mt-2">
        Already have an account? <Link href="/login" className="text-[#cce5ff] underline">Login</Link>
      </p>
    </form>
  );
}
