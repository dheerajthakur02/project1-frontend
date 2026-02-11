import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';
import { User, Settings, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
import DashboardSidebar from './DashboardSidebar';

const DashboardLayout = ({ children }) => {
    const { user, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch latest user profile when dropdown opens to show updated stats
    useEffect(() => {
        if (showDropdown) {
            const refreshProfile = async () => {
                try {
                    const { fetchUserProfile } = await import('../../services/api');
                    const res = await fetchUserProfile();
                    if (res.success && res.data) {
                        // Update redux state with fresh user data. 
                        // We reuse setCredentials, assuming token hasn't changed.
                        const { setCredentials } = await import('../../redux/slices/authSlice');
                        dispatch(setCredentials({ user: res.data, token }));
                    }
                } catch (error) {
                    console.error("Failed to refresh profile stats", error);
                }
            };
            refreshProfile();
        }
    }, [showDropdown]);

    const displayName = user?.name || "Guest";
    const initial = displayName.charAt(0).toUpperCase();

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/signin');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <DashboardSidebar />

            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 z-40 relative">
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
                        {!user?.isPremium && (
                            <button
                                onClick={() => navigate('/pricing')}
                                className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors hover:bg-purple-200"
                            >
                                <span className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center text-white text-xs">
                                    &lt;
                                </span>
                                Upgrade to Prime
                            </button>
                        )}

                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors"
                            >
                                <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center text-pink-600 font-bold text-lg border-2 border-white shadow-sm">
                                    {initial}
                                </div>
                                <div className="hidden lg:block text-left">
                                    <div className="text-sm font-bold text-slate-700">{displayName}</div>
                                    <div className="text-xs text-slate-500">{user?.isPremium ? "Premium User" : "Free User"}</div>
                                </div>
                                <ChevronDown
                                    size={16}
                                    className={`text-slate-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 border-b border-slate-100 mb-2">
                                        <div className="font-bold text-slate-800">{displayName}</div>
                                        <div className="text-xs text-slate-500 mb-3">{user?.email || "user@example.com"}</div>
                                    </div>

                                    <div className="px-2">
                                        {user?.role === 'admin' && (
                                            <button
                                                onClick={() => {
                                                    navigate('/admin/dashboard');
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-primary-600 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                <LayoutDashboard size={18} />
                                                Admin Panel
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                navigate('/profile');
                                                setShowDropdown(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-primary-600 rounded-lg transition-colors text-sm font-medium"
                                        >
                                            <User size={18} />
                                            Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigate('/settings');
                                                setShowDropdown(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-primary-600 rounded-lg transition-colors text-sm font-medium"
                                        >
                                            <Settings size={18} />
                                            Settings
                                        </button>
                                    </div>

                                    <div className="h-px bg-slate-100 my-2 mx-2" />

                                    <div className="px-2">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                                        >
                                            <LogOut size={18} />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
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
