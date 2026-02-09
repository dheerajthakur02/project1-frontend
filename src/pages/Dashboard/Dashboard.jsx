import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api, { fetchUserProfile } from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import PracticedHistory from '../../components/Dashboard/PracticedHistory';
import AverageMockScore from '../../components/Dashboard/AverageMockScore';
import VideoSection from '../../components/Dashboard/VideoSection';
import BannerSlider from '../../components/Dashboard/BannerSlider';
import { setCredentials } from '../../redux/slices/authSlice';

const PracticeCard = ({ title, icon, color, count, total, onClick }) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        green: 'bg-green-100 text-green-600',
        red: 'bg-red-100 text-red-600',
    };

    const bgClasses = {
        blue: 'bg-blue-50',
        yellow: 'bg-yellow-50',
        green: 'bg-green-50',
        red: 'bg-red-50',
    };

    return (
        <div onClick={onClick} className={`${bgClasses[color]} p-6 rounded-2xl transition-transform hover:scale-[1.02] cursor-pointer`}>
            <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center`}>
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            </div>

            <div className="mb-2">
                <div className="text-sm font-semibold text-slate-700 mb-1">Practiced Ques : {count}</div>
                <div className="w-full bg-white/50 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-300 h-full w-0" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
                </div>
            </div>

            <div className="flex justify-between items-end text-sm">
                <div>
                    <span className="font-bold text-slate-700">{total ? Math.round((count / total) * 100) : 0}%</span>
                    <div className="text-slate-500 text-xs">Completed</div>
                </div>
                <div className="text-right">
                    <span className="font-bold text-slate-700">Total:</span>
                    <div className="font-bold text-slate-800">{total}</div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const dispatch =  useDispatch();
    
    const { user, token } = useSelector((state) => state.auth);
    const displayName = user?.name || "Student";
  const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
     useEffect(() => {
            const loadProfile = async () => {
                setLoading(true)
                try {
                    const res = await fetchUserProfile();
                    if (res.success && res.data) {
                        dispatch(setCredentials({ user: res.data, token }));
                    }
                } catch (error) {
                    console.error("Failed to load profile", error);
                } finally {
                    setLoading(false);
                }
            };
            loadProfile();
        }, [dispatch, token]);

    const [dashboardData, setDashboardData] = useState({
        history: [],
        mockScore: 0
    });
  

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/dashboard/data');
                if (data.success) {
                    setDashboardData(data.data);
                }
            } catch (error) {
                console.error("Dashboard data fetch failed", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
  return (
    <DashboardLayout>
      <Spinner />
    </DashboardLayout>
  );
}


    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8">
                {/* Main Content (Top Section) */}
                <div className="w-full">
                    {/* Welcome Banner Redesigned */}
                    <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 md:p-12 text-white shadow-2xl mb-8">
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-purple-500/30 blur-3xl" />
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

                        <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                            {/* Left: Text & Welcome */}
                            <div className="space-y-6 max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm backdrop-blur-md border border-white/10 font-medium text-purple-200">
                                    <span className="animate-wave">👋</span> <span>Welcome back, {displayName}</span>
                                </div>
                                <h1 className="text-4xl font-extrabold leading-tight md:text-5xl tracking-tight">
                                    Ready to crush your <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-300">PTE Score?</span>
                                </h1>
                                <p className="text-lg text-slate-300 max-w-md leading-relaxed">
                                    Start your practice session now and get one step closer to your dream score. Consistency is key!
                                </p>

                                <div className="flex flex-wrap gap-4 pt-2">
                                    <button
                                        onClick={() => navigate('/practice')}
                                        className="bg-white text-slate-900 px-8 py-3.5 rounded-xl font-bold hover:bg-purple-50 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] active:scale-95"
                                    >
                                        Start Practice Now
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                                    </button>
                                    <button className="px-6 py-3.5 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-colors flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
                                        Check Mic
                                    </button>
                                </div>
                            </div>

                            {/* Right: Target Score / Info Card */}
                            <div className="relative mt-8 md:mt-0">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 blur-xl rounded-full" />
                                <div className="relative glass-card p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col items-center gap-2 min-w-[200px] hover:bg-white/10 transition-colors cursor-pointer group">
                                    <div className="text-sm font-medium text-purple-200 uppercase tracking-widest">Target Score</div>
                                    <div className="text-6xl font-black text-white group-hover:scale-110 transition-transform duration-300">
                                        65<span className="text-3xl align-top text-yellow-400">+</span>
                                    </div>
                                    <button className="text-xs text-white/50 group-hover:text-white mt-2 flex items-center gap-1.5 transition-colors bg-white/5 px-3 py-1 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                        Edit Goal
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Practice Section */}
                    <div className="mb-0">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Practice</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            <PracticeCard
                                title="Speaking"
                                color="blue"
                                count={dashboardData.stats?.speaking?.practiced || 0}
                                total={dashboardData.stats?.speaking?.total || 0}
                                onClick={() => navigate('/practice', { state: { activeTab: 'Speaking' } })}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>}
                            />
                            <PracticeCard
                                title="Writing"
                                color="yellow"
                                count={dashboardData.stats?.writing?.practiced || 0}
                                total={dashboardData.stats?.writing?.total || 0}
                                onClick={() => navigate('/practice', { state: { activeTab: 'Writing' } })}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
                            />
                            <PracticeCard
                                title="Reading"
                                color="green"
                                count={dashboardData.stats?.reading?.practiced || 0}
                                total={dashboardData.stats?.reading?.total || 0}
                                onClick={() => navigate('/practice', { state: { activeTab: 'Reading' } })}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>}
                            />
                            <PracticeCard
                                title="Listening"
                                color="red"
                                count={dashboardData.stats?.listening?.practiced || 0}
                                total={dashboardData.stats?.listening?.total || 0}
                                onClick={() => navigate('/practice', { state: { activeTab: 'Listening' } })}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>}
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Section (Stats Metrics) */}
                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <PracticedHistory history={dashboardData.history} onShowAll={() => navigate('/practice-history')} />
                    </div>
                    <div className="md:col-span-1">
                        <AverageMockScore score={dashboardData.mockScore} />
                    </div>
                </div>

                {/* Video Section */}
                <BannerSlider />
                <VideoSection />
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;


const Spinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
  </div>
);
