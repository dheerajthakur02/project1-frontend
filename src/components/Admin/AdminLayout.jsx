import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Video,
    Image as ImageIcon,
    ShoppingCart,
    LogOut,
    Menu,
    X,
    ChevronRight,
    User,
    FileText,
    MessageSquare,
    Bell,
    MapPin,
    PieChart,
    BookOpen,
    Volume2
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';

const AdminLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/signin');
    };

    const menuItems = [
        { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
        { path: '/admin/videos', icon: <FileText size={20} />, label: 'Manage Videos' },
        { path: '/admin/banners', icon: <MessageSquare size={20} />, label: 'Manage Banners' },
        { path: '/admin/orders', icon: <Bell size={20} />, label: 'Voucher Orders' },
        { path: '/admin/questions/read-aloud', icon: <BookOpen size={20} />, label: 'Read Aloud' },
        { path: '/admin/questions/repeat-sentence', icon: <Volume2 size={20} />, label: 'Repeat Sentence' },
        { path: '/admin/questions/describe-image', icon: <ImageIcon size={20} />, label: 'Describe Image' },
        { path: '#', icon: <MapPin size={20} />, label: 'Location' },
        { path: '#', icon: <PieChart size={20} />, label: 'Graph' },
    ];

    return (
        <div className="min-h-screen bg-slate-100 flex font-sans">
            {/* Sidebar - Dark Blue #1A1F3D based on reference */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 bg-[#1A1F3D] text-white transition-all duration-300 ease-in-out shadow-2xl
        ${isSidebarOpen ? 'w-64' : 'w-20'} lg:relative flex flex-col`}
            >
                {/* User Profile Section (Top of Sidebar) */}
                <div className={`p-8 flex flex-col items-center border-b border-slate-700/50 ${!isSidebarOpen && 'px-2'}`}>
                    <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-900/50">
                        <User size={40} className="text-white" /> {/* Placeholder for user image */}
                    </div>
                    {isSidebarOpen && (
                        <div className="text-center animate-in fade-in duration-300">
                            <h3 className="font-bold text-lg tracking-wide uppercase">{user?.name || 'Admin User'}</h3>
                            <p className="text-xs text-slate-400 mt-1">{user?.email || 'admin@company.com'}</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                                        ? 'text-white bg-white/10 border-l-4 border-blue-400 shadow-inner'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <div className={`${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400 transition-colors'}`}>
                                    {item.icon}
                                </div>
                                {isSidebarOpen && (
                                    <span className="font-medium tracking-wide text-sm uppercase">{item.label}</span>
                                )}
                                {!isSidebarOpen && (
                                    <div className="absolute left-20 bg-[#1A1F3D] text-white text-xs px-3 py-2 rounded-md shadow-xl z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-slate-700">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-slate-700/50">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all
              ${!isSidebarOpen ? 'justify-center' : ''}`}
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="font-medium uppercase text-sm tracking-wide">Logout</span>}
                    </button>
                </div>

            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-[#F0F2F5]">
                {/* Mobile Header */}
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:hidden sticky top-0 z-40">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <span className="font-bold text-slate-800">Admin Panel</span>
                    <div className="w-8" />
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-10">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header Section from Reference Image */}
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-2xl font-medium text-slate-700">Dashboard User</h1>
                            <button className="lg:hidden p-2"><Menu size={24} className="text-slate-400" /></button>
                        </div>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
