import React from 'react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';

const PracticeCard = ({ title, icon, color, count, total }) => {
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
        <div className={`${bgClasses[color]} p-6 rounded-2xl transition-transform hover:scale-[1.02] cursor-pointer`}>
            <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center`}>
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            </div>

            <div className="mb-2">
                <div className="text-sm font-semibold text-slate-700 mb-1">Practiced Ques : {count}</div>
                <div className="w-full bg-white/50 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-300 h-full w-0" />
                </div>
            </div>

            <div className="flex justify-between items-end text-sm">
                <div>
                    <span className="font-bold text-slate-700">0%</span>
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
    return (
        <DashboardLayout>
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Content */}
                <div className="flex-1">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-primary-600 to-orange-400 rounded-3xl p-8 text-white relative overflow-hidden mb-12 shadow-xl shadow-orange-200">
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h1 className="text-2xl font-bold">Hi Dheeraj, 👋</h1>
                                    </div>
                                    <div className="text-4xl font-bold mb-4">
                                        Let’s Target <span className="text-yellow-300">65+</span> Score
                                    </div>
                                </div>
                                <div className="hidden md:flex gap-4">
                                    <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm transition-colors">
                                        <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs">🎯</span>
                                        Set Target Score
                                    </button>
                                    <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm transition-colors">
                                        <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs">🎤</span>
                                        Check Microphone
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                                <div>
                                    <h2 className="text-xl font-bold mb-1">Start strong and stay consistent!</h2>
                                    <p className="text-orange-100">Practice regularly and watch your skills improve.</p>
                                </div>
                                <button className="bg-white text-primary-600 px-6 py-3 rounded-xl font-bold hover:bg-orange-50 transition-colors flex items-center gap-2 shadow-lg">
                                    Start Practice Now
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Practice Section */}
                    <div className="mb-8">
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
                                count={0}
                                total={7761}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>}
                            />
                            <PracticeCard
                                title="Writing"
                                color="yellow"
                                count={0}
                                total={840}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
                            />
                            <PracticeCard
                                title="Reading"
                                color="green"
                                count={0}
                                total={2766}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>}
                            />
                            <PracticeCard
                                title="Listening"
                                color="red"
                                count={0}
                                total={4877}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
