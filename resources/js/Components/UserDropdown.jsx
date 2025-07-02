import { Link } from '@inertiajs/react';

export default function UserDropdown({ show }) {
  if (!show) return null;

  return (
    <div className="absolute right-0 mt-2 bg-[#003153] border border-white/10 rounded shadow-md z-50">
      <Link
        href="/dashboard"
        className="block px-4 py-2 text-sm text-white hover:bg-white/10"
      >
        Dashboard
      </Link>
      <Link
        href="/profile"
        className="block px-4 py-2 text-sm text-white hover:bg-white/10"
      >
        Profile
      </Link>
      <Link
        href={route('buy-points')}
        className="block px-4 py-2 text-sm text-white hover:bg-white/10"
      >
        Purchase Points
      </Link>
      <Link
        href="/logout"
        method="post"
        as="button"
        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
      >
        Logout
      </Link>
    </div>
  );
}
