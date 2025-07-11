import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, Image, Shield, Mail, Users, Store, List, MessageCircle, History, Database, LogOut } from 'lucide-react';
import { useForm } from '@inertiajs/react';

const Sidebar = () => {
  const { post } = useForm();
  const { url } = usePage();

  const handleLogout = (e) => {
    e.preventDefault();
    post(route('logout'));
  };

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/admin/slides', label: 'Front Page Slides', icon: <Image size={20} /> },
    { href: '/admin/privacy', label: 'Privacy Policy', icon: <Shield size={20} /> },
    { href: '/admin/contact', label: 'Contact Us', icon: <Mail size={20} /> },
    { href: '/admin/users', label: 'Users', icon: <Users size={20} /> },
    { href: '/admin/store-points', label: 'Store Points', icon: <Store size={20} /> },
    { href: '/admin/store-category', label: 'Store Category', icon: <List size={20} /> },
    { href: '/admin/chat', label: 'Chat Support', icon: <MessageCircle size={20} /> },
    { href: '/admin/logs', label: 'Logs', icon: <History size={20} /> },
    { href: '/admin/backup', label: 'Backup Database', icon: <Database size={20} /> },
  ];

  return (
    <div className="w-64 h-screen sticky top-0 bg-[#1e293b] p-6 flex flex-col shadow-inner">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Admin Panel</h2>

      {/* Scrollable area */}
      <div
        className="flex-1 overflow-y-auto space-y-4 pr-1"
        style={{
          scrollbarWidth: 'none',        // Firefox
          msOverflowStyle: 'none'        // IE and Edge
        }}
      >
        {links.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all
              ${
                url.startsWith(href)
                  ? 'bg-[#334155] shadow-inner text-gray-100'
                  : 'bg-[#1e293b] text-gray-300 shadow-[4px_4px_8px_#0f172a,-4px_-4px_8px_#334155]'
              } hover:shadow-inner`}
          >
            {icon}
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </div>

      {/* Logout fixed at bottom */}
      <button
        onClick={handleLogout}
        className="mt-4 flex items-center space-x-3 px-4 py-3 rounded-xl bg-[#1e293b] text-gray-300 shadow-[4px_4px_8px_#0f172a,-4px_-4px_8px_#334155] hover:shadow-inner transition-all"
      >
        <LogOut size={20} />
        <span className="font-medium">Logout</span>
      </button>

      {/* Inline style to hide scrollbar in WebKit browsers */}
      <style>
        {`
          div::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </div>
  );
};

export default Sidebar;
