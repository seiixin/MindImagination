import { Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { label: 'Store', href: '/' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Login', href: '/login' },
  ];

  return (
    <nav className="bg-[#003153] shadow-md backdrop-blur-md fixed top-0 left-0 right-0 z-50">
      {/* Desktop Navigation */}
      <div className="hidden md:flex h-12 px-4 items-center justify-between text-sm text-white">
        {/* Logo section */}
        <div className="flex items-center gap-3 pr-4 border-r-2 border-white/20">
          <img src="/Images/logo.png" alt="Logo" className="h-7" />
          <span className="font-semibold tracking-widest text-sm text-white whitespace-nowrap">
            MIND IMAGINATION
          </span>
        </div>

        {/* Desktop nav links */}
        <ul className="flex items-center gap-0 divide-x divide-white/20">
          {navItems.map(({ label, href }) => (
            <li key={label}>
              <Link
                href={href}
                className="px-4 py-2 inline-block hover:text-[#0ff] hover:bg-white/5 transition-all duration-200"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile header */}
        <div className="flex h-12 px-4 items-center justify-between text-white">
          {/* Mobile logo */}
          <div className="flex items-center gap-2">
            <img src="/Images/logo.png" alt="Logo" className="h-6" />
            <span className="font-semibold text-xs tracking-wide">
              MIND IMAGINATION
            </span>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="p-2 hover:bg-white/10 rounded transition-colors duration-200 text-lg"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {isMenuOpen && (
          <div className="absolute top-12 left-0 right-0 bg-[#003153] border-t border-white/20 shadow-lg z-50">
            <ul className="py-2">
              {navItems.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="block px-4 py-3 text-sm text-white hover:text-[#0ff] hover:bg-white/5 transition-all duration-200 border-b border-white/10 last:border-b-0"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </nav>
  );
}
