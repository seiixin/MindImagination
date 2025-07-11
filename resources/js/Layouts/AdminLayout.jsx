import React from 'react';
import Sidebar from '@/Components/Admin/Sidebar';

export default function AdminLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-[#f0f2f5]">
            {/* Left: Sidebar */}
            <Sidebar />

            {/* Right: Page content */}
            <main className="flex-1 p-6 overflow-auto">
                {children}
            </main>
        </div>
    );
}
