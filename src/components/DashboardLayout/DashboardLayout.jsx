import React from 'react';
import DashboardSidebar from './DashboardSidebar';

const DashboardLayout = ({ children }) => {
    return (
        <div className="flex bg-slate-50 min-h-screen">
            <DashboardSidebar />

            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8">
                    {/* Left: Exam Type */}
                    <div className="flex items-center gap-4">
                        <button className="bg-primary-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                            PTE Academic
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        </button>
                        <button className="flex items-center gap-1 text-primary-600 font-medium">
                            Practice
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </button>
                    </div>

                    {/* Right: User Profile & Upgrade */}
                    <div className="flex items-center gap-6">
                        <button className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
                            <span className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center text-white text-xs">
                                &lt;
                            </span>
                            Upgrade to Prime
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center text-pink-600 font-bold">
                                D
                            </div>
                            <div className="hidden lg:block">
                                <div className="text-sm font-bold text-slate-700">Dheeraj</div>
                                <div className="text-xs text-slate-500">Free User</div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6" /></svg>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
