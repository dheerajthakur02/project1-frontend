import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    ChevronDown,
    User,
    FileText,
    MessageSquare,
    Bell, // Added
    Search, // Added
    Home, // Added
    ChevronRight, // Added
    BookOpen,
    Mic,
    PenTool,
    Headphones,
    ClipboardList,
    Layers,
    PlayCircle
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';

const AdminLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [openMenus, setOpenMenus] = useState({});

    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    // FIX 1: Define pathnames for breadcrumbs and title
    const pathnames = location.pathname.split("/").filter((x) => x);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/signin');
    };

    const toggleMenu = (menuLabel) => {
        setOpenMenus(prev => ({
            ...prev,
            [menuLabel]: !prev[menuLabel]
        }));
    };

    const menuItems = [
        { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
        { path: '/admin/videos', icon: <PlayCircle size={20} />, label: 'Manage Videos' },
        { path: '/admin/banners', icon: <MessageSquare size={20} />, label: 'Manage Banners' },
        { path: '/admin/orders', icon: <Bell size={20} />, label: 'Voucher Orders' },

        {
            label: 'Practice',
            icon: <Mic size={20} />,
            isDropdown: true,
            subItems: [
                {
                    label: 'Speaking',
                    icon: <Mic size={18} />,
                    items: [
                        { label: 'Read Aloud', path: '/admin/practice/speaking/ra' },
                        { label: 'Repeat Sentence', path: '/admin/practice/speaking/rs' },
                        { label: 'Describe Image', path: '/admin/practice/speaking/di' },
                        { label: 'Retell Lecture', path: '/admin/practice/speaking/rl' },
                        { label: 'Answer Short Question', path: '/admin/practice/speaking/asq' },
                        { label: 'Summarize Group Discussion', path: '/admin/practice/speaking/sgd' },
                        { label: 'Respond To Situation', path: '/admin/practice/speaking/rts' },
                    ]
                },
                {
                    label: 'Writing',
                    icon: <PenTool size={18} />,
                    items: [
                        { label: 'Summarize Text', path: '/admin/practice/writing/swt' },
                        { label: 'Write Essay', path: '/admin/practice/writing/we' },
                    ]
                },
                {
                    label: 'Reading',
                    icon: <BookOpen size={18} />,
                    items: [
                        { label: 'Fill in the Blanks(DropDown)', path: '/admin/practice/reading/fibrw' },
                        { label: 'Multiple Choice, Choose Multiple Answer', path: '/admin/practice/reading/mcma' },
                        { label: 'Multiple Choice, Choose Single Answer', path: '/admin/practice/reading/mcsa' },
                        { label: 'Fill in the Blanks(DragDrop)', path: '/admin/practice/reading/fibd' },
                        { label: 'Re-order Paragraph', path: '/admin/practice/reading/reorder' },
                    ]
                },
                {
                    label: 'Listening',
                    icon: <Headphones size={18} />,
                    items: [
                        { label: 'Summarize Spoken Text', path: '/admin/practice/listening/sst' },
                        { label: 'Listening: Multiple Choice, Choose Multiple Answer', path: '/admin/practice/listening/mcma' },
                        { label: 'Listening: Multiple Choice, Choose Single Answer', path: '/admin/practice/listening/mcsa' },
                        { label: 'Fill in the blanks (TypeIn)', path: '/admin/practice/listening/fibl' },
                        { label: 'Highlight Correct Summary', path: '/admin/practice/listening/hcs' },
                        { label: 'Select Missing Words', path: '/admin/practice/listening/smw' },
                        { label: 'Highlight Incorrect Words', path: '/admin/practice/listening/hiw' },
                        { label: 'Write From Dictation (WFD)', path: '/admin/practice/listening/wfd' },
                    ]
                }
            ]
        },
        {
            label: 'Mock Tests',
            icon: <ClipboardList size={20} />,
            isDropdown: true,
            subItems: [
                { label: 'Full Mock Test', path: '/admin/mock/full/manage' },
                {
                    label: 'Sectional Tests',
                    icon: <Layers size={18} />,
                    items: [
                        { label: 'Speaking Section', path: '/admin/mock/sectional/speaking' },
                        { label: 'Writing Section', path: '/admin/mock/sectional/writing' },
                        { label: 'Reading Section', path: '/admin/mock/sectional/reading' },
                        { label: 'Listening Section', path: '/admin/mock/sectional/listening' },
                    ]
                },
                {
                    label: 'Question Tests',
                    icon: <FileText size={18} />,
                    items: [
                        { label: 'RA Test', path: '/admin/mock/qtest/ra' },
                        { label: 'RS Test', path: '/admin/mock/qtest/rs' },
                        { label: 'DI Test', path: '/admin/mock/qtest/di' },
                        { label: 'RL Test', path: '/admin/mock/qtest/rl' },
                        { label: 'SGD Test', path: '/admin/mock/qtest/sgd' },
                        { label: 'RTS Test', path: '/admin/mock/qtest/rts' },
                        { label: 'WE Test', path: '/admin/mock/qtest/we' },
                        { label: 'SWT Test', path: '/admin/mock/qtest/swt' },
                        { label: 'FIB Test', path: '/admin/mock/qtest/fib' },
                        { label: 'FIB&D Test', path: '/admin/mock/qtest/fibd' },
                        { label: 'RO Test', path: '/admin/mock/qtest/ro' },
                        { label: 'WFD Test', path: '/admin/mock/qtest/wfd' },
                        { label: 'SST Test', path: '/admin/mock/qtest/sst' },
                        { label: 'FIBL Test', path: '/admin/mock/qtest/fibl' },
                        { label: 'HIW Test', path: '/admin/mock/qtest/hiw' },
                    ]
                }
            ]
        }
    ];

    // Logic to auto-expand menus based on URL
    useEffect(() => {
        const newOpenMenus = {};
        menuItems.forEach((menu) => {
            if (!menu.subItems) return;
            menu.subItems.forEach((sub) => {
                if (sub.items) {
                    sub.items.forEach((item) => {
                        if (location.pathname === item.path) {
                            newOpenMenus[menu.label] = true;
                            newOpenMenus[sub.label] = true;
                        }
                    });
                } else if (location.pathname === sub.path) {
                    newOpenMenus[menu.label] = true;
                }
            });
        });
        setOpenMenus((prev) => ({ ...prev, ...newOpenMenus }));
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
            {/* SIDEBAR - STAYS THE SAME */}
            <aside className={`fixed inset-y-0 left-0 z-50 bg-[#1A1F3D] text-white transition-all duration-300 ease-in-out shadow-2xl ${isSidebarOpen ? 'w-72' : 'w-20'} lg:relative flex flex-col`}>
                <div className={`p-6 flex flex-col items-center border-b border-slate-700/50 ${!isSidebarOpen && 'px-2'}`}>
                    <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mb-4 shadow-lg">
                        <User size={30} className="text-white" />
                    </div>
                    {isSidebarOpen && (
                        <div className="text-center">
                            <h3 className="font-bold text-sm tracking-wide uppercase truncate w-56">{user?.name || 'Admin User'}</h3>
                            <p className="text-[10px] text-slate-400 mt-1">{user?.email || 'admin@company.com'}</p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {menuItems.map((menu) => {
                        const isL1Open = openMenus[menu.label];
                        if (!menu.isDropdown) {
                            return (
                                <Link key={menu.label} to={menu.path} className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${location.pathname === menu.path ? 'bg-white/10 text-blue-400 border-l-4 border-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                                    {menu.icon}
                                    {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-wider">{menu.label}</span>}
                                </Link>
                            );
                        }
                        return (
                            <div key={menu.label} className="space-y-1">
                                <button onClick={() => toggleMenu(menu.label)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-slate-400 hover:bg-white/5 hover:text-white`}>
                                    <div className="flex items-center gap-4">
                                        {menu.icon}
                                        {isSidebarOpen && <span className="text-xs font-bold uppercase tracking-wider">{menu.label}</span>}
                                    </div>
                                    {isSidebarOpen && <ChevronDown size={14} className={`transition-transform ${isL1Open ? 'rotate-180' : ''}`} />}
                                </button>
                                {isL1Open && isSidebarOpen && (
                                    <div className="ml-4 pl-2 border-l border-slate-700 space-y-1">
                                        {menu.subItems.map((sub) => {
                                            const isL2Open = openMenus[sub.label];
                                            if (!sub.items) {
                                                return (
                                                    <Link key={sub.label} to={sub.path} className={`block px-4 py-2 text-[11px] uppercase transition-colors ${location.pathname === sub.path ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
                                                        {sub.label}
                                                    </Link>
                                                );
                                            }
                                            return (
                                                <div key={sub.label}>
                                                    <button onClick={() => toggleMenu(sub.label)} className="w-full flex items-center justify-between px-4 py-2 text-[11px] uppercase text-slate-400 hover:text-white">
                                                        <span>{sub.label}</span>
                                                        <ChevronDown size={12} className={`transition-transform ${isL2Open ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    {isL2Open && (
                                                        <div className="ml-4 space-y-1 border-l border-slate-800">
                                                            {sub.items.map(item => (
                                                                <Link key={item.label} to={item.path} className={`block px-6 py-1.5 text-[10px] uppercase transition-colors ${location.pathname === item.path ? 'text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`}>
                                                                    {item.label}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700/50">
                    <button onClick={handleLogout} className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="font-bold uppercase text-xs">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT - IMPROVED UI */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

                {/* MODERN HEADER */}
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-8 sticky top-0 z-40 transition-all">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-xl transition-all shadow-sm border border-slate-100"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        {/* Breadcrumbs */}
                        <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
                            <Home size={16} className="text-slate-400" />
                            <ChevronRight size={14} className="text-slate-300" />
                            <span className="text-slate-400">Admin</span>
                            {pathnames.map((name, index) => (
                                <React.Fragment key={index}>
                                    <ChevronRight size={14} className="text-slate-300" />
                                    <span className="capitalize text-slate-700">
                                        {name.replace(/-/g, ' ')}
                                    </span>
                                </React.Fragment>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex items-center gap-2 mr-4">
                            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                                <Search size={20} />
                            </button>
                            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors relative">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                            </button>
                        </div>

                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-800 leading-none">{user?.name || 'Admin'}</p>
                                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter mt-1">Super Admin</p>
                            </div>
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 ring-2 ring-white">
                                <User size={20} className="text-white" />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC]">
                    <div className="max-w-7xl mx-auto p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

                        {/* <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                    {pathnames[pathnames.length - 1]?.replace(/-/g, ' ').toUpperCase() || 'DASHBOARD'}
                                </h1>
                                <p className="text-slate-500 text-sm mt-1">
                                    Welcome back, here is what's happening with your platform today.
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="hidden md:flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Server Status</span>
                                    <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                        Operational
                                    </span>
                                </div>
                            </div>
                        </div> */}

                        <div className="bg-transparent">
                            {children}
                        </div>
                    </div>
                </main>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                * { transition-property: background-color, border-color, color, fill, stroke; transition-duration: 200ms; }
            `}</style>
        </div>
    );
};

export default AdminLayout;