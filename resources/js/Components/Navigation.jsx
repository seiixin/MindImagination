import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import UserDropdown from '@/Components/UserDropdown';
import AuthSection from '@/Components/AuthSection';

export default function Navigation() {
  const { url } = usePage().props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentPath = url;

  const navLinks = [
    { label: 'Store', href: '/' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
  ];

  const getItemStyles = (href) => {
    return currentPath === href
      ? 'text-[#0ff] bg-white/5'
      : 'hover:text-[#0ff] hover:bg-white/5';
  };

  return (
    <nav className="bg-[#003153] shadow-md backdrop-blur-md fixed top-0 left-0 right-0 z-50">
      {/* Desktop */}
      <div className="hidden md:flex h-12 px-4 items-center justify-between text-sm text-white">
        <div className="flex items-center gap-3 pr-4 border-r-2 border-white/20">
          <img src="/Images/logo.png" alt="Logo" className="h-7" />
          <span className="font-semibold tracking-widest text-sm whitespace-nowrap">
            MIND IMAGINATION
          </span>
        </div>

        <ul className="flex items-center gap-0 divide-x divide-white/20">
          {navLinks.map(({ label, href }) => (
            <li key={label}>
              <Link
                href={href}
                className={`px-4 py-2 inline-block transition-all duration-200 ${getItemStyles(href)}`}
              >
                {label}
              </Link>
            </li>
          ))}

          <AuthSection desktop />
        </ul>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex h-12 px-4 items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <img src="/Images/logo.png" alt="Logo" className="h-6" />
            <span className="font-semibold text-xs tracking-wide">
              MIND IMAGINATION
            </span>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-white/10 rounded transition-colors duration-200 text-lg"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {isMenuOpen && (
          <div className="bg-[#003153] border-t border-white/20 shadow-lg z-50">
            <ul className="py-2">
              {navLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className={`block px-4 py-3 text-sm text-white transition ${getItemStyles(href)}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}

              <AuthSection mobile closeMenu={() => setIsMenuOpen(false)} />
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
