import { Link } from '@inertiajs/react';

export default function SignInPanel() {
  return (
    <aside className="relative backdrop-blur-md bg-[#14628dcc]/80 border-[5px] border-[#0e6ba0] shadow-inner rounded-xl p-6 max-w-sm w-full text-white overflow-hidden">
      {/* Decorative glowing outline */}
      <div className="absolute inset-0 pointer-events-none rounded-xl border border-[#29b4e2]/40 blur-sm"></div>

      <h2 className="text-center text-2xl font-extrabold mb-6 tracking-wider">SIGN IN</h2>

      <form>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-1 text-sm font-semibold text-white">
            Email Address:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-3 py-2 rounded bg-gradient-to-br from-[#82bbbe] to-[#a0d6cd] text-[#113029] font-semibold focus:ring-2 focus:ring-[#29b4e2] focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block mb-1 text-sm font-semibold text-white">
            Password:
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="w-full px-3 py-2 rounded bg-gradient-to-br from-[#82bbbe] to-[#a0d6cd] text-[#113029] font-semibold focus:ring-2 focus:ring-[#29b4e2] focus:outline-none"
          />
        </div>

        <Link
          href="/forgot-password"
          className="block mb-4 text-sm text-[#ccc] hover:underline text-right"
        >
          Forgot Password?
        </Link>

        <button
          type="submit"
          className="w-full mb-3 bg-[#cea76d] text-[#2f2714] py-2 rounded font-bold hover:bg-[#b88b3a] transition"
        >
          Login
        </button>

        <Link
          href="/register"
          className="block w-full text-center bg-[#98be5d] text-[#213008] py-2 rounded font-bold hover:bg-[#7ca233] transition"
        >
          Create Account
        </Link>
      </form>
    </aside>
  );
}
