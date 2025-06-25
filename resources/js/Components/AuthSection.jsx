import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import UserDropdown from './UserDropdown';

export default function AuthSection({ desktop = false, mobile = false, closeMenu = () => {} }) {
  const { auth, url } = usePage().props;
  const [showDropdown, setShowDropdown] = useState(false);
  const currentPath = url;

  if (desktop) {
    return (
      <li className="relative">
        {auth?.user ? (
          <div
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
            className={`px-4 py-2 cursor-pointer font-semibold transition-all duration-200 ${
              currentPath === '/dashboard'
                ? 'text-[#0ff] bg-white/5'
                : 'hover:text-[#0ff] hover:bg-white/5'
            }`}
          >
            <Link href="/dashboard" className="inline-block w-full h-full">
              {auth.user.name}
            </Link>
            <UserDropdown show={showDropdown} />
          </div>
        ) : (
          <Link
            href="/login"
            className={`px-4 py-2 inline-block transition-all duration-200 ${
              currentPath === '/login'
                ? 'text-[#0ff] bg-white/5'
                : 'hover:text-[#0ff] hover:bg-white/5'
            }`}
          >
            Login
          </Link>
        )}
      </li>
    );
  }

  if (mobile) {
    return (
      <>
        {auth?.user ? (
          <>
            <li>
              <Link
                href="/dashboard"
                className={`block px-4 py-3 text-sm text-white transition ${
                  currentPath === '/dashboard'
                    ? 'text-[#0ff] bg-white/5'
                    : 'hover:text-[#0ff] hover:bg-white/5'
                }`}
                onClick={closeMenu}
              >
                {auth.user.name}
              </Link>
            </li>
            <li>
              <Link
                href="/profile"
                className={`block px-4 py-3 text-sm text-white transition ${
                  currentPath === '/profile'
                    ? 'text-[#0ff] bg-white/5'
                    : 'hover:text-[#0ff] hover:bg-white/5'
                }`}
                onClick={closeMenu}
              >
                Profile
              </Link>
            </li>
            <li>
            <Link
            href="/logout"
            method="post"
            as="button"
            type="button"
            className="block w-full text-left px-4 py-3 text-sm text-white hover:text-[#0ff] hover:bg-white/5"
            >
            Logout
            </Link>

            </li>
          </>
        ) : (
          <li>
            <Link
              href="/login"
              className={`block px-4 py-3 text-sm text-white transition ${
                currentPath === '/login'
                  ? 'text-[#0ff] bg-white/5'
                  : 'hover:text-[#0ff] hover:bg-white/5'
              }`}
              onClick={closeMenu}
            >
              Login
            </Link>
          </li>
        )}
      </>
    );
  }

  return null;
}
