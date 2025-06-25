import Navigation from '@/Components/Navigation';
import BackgroundEffect from '@/Components/BackgroundEffect';

export default function AuthenticatedLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#001f35]/40 to-[#001f35]/60 overflow-x-hidden">
      <BackgroundEffect />
      <Navigation />
      <div className="relative z-10 pt-12">
        {children}
      </div>
    </div>
  );
}
