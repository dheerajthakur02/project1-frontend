import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
    { name: 'Dashboard', icon: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />, path: '/dashboard' },
    { name: 'Practice', icon: <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />, path: '/practice' },
    { name: 'Section Test', icon: <path d="M21 12H3M21 6H3M21 18H3" />, path: '/section-test' },
    { name: 'Mock Test', icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />, path: '/mock-test' },
    { name: 'Pricing', icon: <path d="M3 6h18M3 12h18M3 18h18" />, path: '/pricing', isNew: true },
    { name: 'Buy Vouchers', icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />, path: '/vouchers' },
    { name: 'Vocab Book', icon: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />, path: '/vocab' },
    { name: 'Materials', icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />, path: '/materials' },
];

const DashboardSidebar = () => {
    return (
        <div className="w-64 bg-white border-r border-slate-100 min-h-screen p-4 flex flex-col fixed top-0 left-0 bottom-0 z-50">
            {/* Logo */}
            <div className="flex items-center gap-2 px-4 mb-8">
                <div className="w-8 h-8 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary-600">&lt;</span>
                </div>
                <span className="text-2xl font-bold text-slate-800">PTE practice</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative
                            ${isActive
                                ? 'bg-primary-50 text-primary-600 font-medium'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                        `}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            {item.icon}
                        </svg>
                        <span>{item.name}</span>
                        {item.isNew && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                Offer
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default DashboardSidebar;
