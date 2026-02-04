import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Mail, Phone, Calendar, Award, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
// import { fetchUserProfile } from '../../services/api'; 
// We can use the one from api service if exported, or just rely on Redux state if updated by layout
import { fetchUserProfile } from '../../services/api';
import { setCredentials } from '../../redux/slices/authSlice';

const ProfilePage = () => {
    const { user, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);

    // Fetch latest data on mount to ensure stats are fresh
    useEffect(() => {
        const loadProfile = async () => {
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


    const calculateDaysLeft = (expiryDate) => {
        if (!expiryDate) return 0;
        const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return Math.max(0, days);
    };

    if (loading && !user) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <User size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
                        <p className="text-slate-500">Manage your account settings and view your progress</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Personal Details */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                    <User size={18} />
                                </span>
                                Personal Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                                    <div className="p-3 bg-slate-50 rounded-xl font-medium text-slate-700 flex items-center gap-3">
                                        <User size={18} className="text-slate-400" />
                                        {user?.name}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                                    <div className="p-3 bg-slate-50 rounded-xl font-medium text-slate-700 flex items-center gap-3">
                                        <Mail size={18} className="text-slate-400" />
                                        {user?.email}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Number</label>
                                    <div className="p-3 bg-slate-50 rounded-xl font-medium text-slate-700 flex items-center gap-3">
                                        <Phone size={18} className="text-slate-400" />
                                        {user?.phone || "Not provided"}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exam Type</label>
                                    <div className="p-3 bg-slate-50 rounded-xl font-medium text-slate-700 flex items-center gap-3">
                                        <Award size={18} className="text-slate-400" />
                                        {user?.exam?.replace("-", " ").toUpperCase() || "PTE ACADEMIC"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Usage Statistics for Free Users (or General Stats) */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                                    <CheckCircle size={18} />
                                </span>
                                Usage Statistics
                            </h2>

                            <div className="bg-slate-50 rounded-2xl p-6">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <p className="text-slate-500 font-medium mb-1">Practice Questions Attempted</p>
                                        <h3 className="text-3xl font-bold text-slate-800">
                                            {user?.practiceAttemptCount || 0}
                                            <span className="text-lg text-slate-400 font-medium ml-1">
                                                {!user?.isPremium ? "/ 10" : " Total"}
                                            </span>
                                        </h3>
                                    </div>
                                    {!user?.isPremium && (
                                        <div className="text-right">
                                            <span className="inline-block px-3 py-1 bg-white text-slate-600 rounded-full text-xs font-bold border border-slate-200">
                                                Free Tier Limit
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden mb-2">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${!user?.isPremium && (user?.practiceAttemptCount || 0) >= 10
                                                ? 'bg-red-500'
                                                : 'bg-gradient-to-r from-blue-500 to-purple-600'
                                            }`}
                                        style={{ width: `${!user?.isPremium ? Math.min(((user?.practiceAttemptCount || 0) / 10) * 100, 100) : 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {!user?.isPremium
                                        ? "Upgrade to Premium for unlimited practice questions and mock tests."
                                        : "You have unlimited access to all practice materials."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Subscription Status */}
                    <div className="space-y-6">
                        <div className={`rounded-2xl p-6 shadow-sm border ${user?.isPremium ? 'bg-gradient-to-br from-indigo-900 to-purple-900 text-white border-transparent' : 'bg-white border-slate-100'}`}>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${user?.isPremium ? 'bg-white/10 text-white' : 'bg-yellow-50 text-yellow-600'}`}>
                                    <Award size={18} />
                                </span>
                                Subscription Status
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <p className={`text-sm font-medium mb-1 ${user?.isPremium ? 'text-indigo-200' : 'text-slate-500'}`}>Current Plan</p>
                                    <h3 className={`text-2xl font-bold ${user?.isPremium ? 'text-white' : 'text-slate-800'}`}>
                                        {user?.isPremium ? "Premium User" : "Free User"}
                                    </h3>
                                    {user?.planType && <p className="text-sm opacity-80 mt-1">{user.planType} Plan</p>}
                                </div>

                                {user?.isPremium ? (
                                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Clock size={20} className="text-yellow-400" />
                                            <span className="font-bold">Time Remaining</span>
                                        </div>
                                        <div className="text-3xl font-black text-white">
                                            {calculateDaysLeft(user?.subscriptionExpiry)}
                                            <span className="text-sm font-normal text-indigo-200 ml-2">Days</span>
                                        </div>
                                        <p className="text-xs text-indigo-200 mt-2">
                                            Expires on {new Date(user?.subscriptionExpiry).toLocaleDateString()}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-bold text-yellow-800 mb-1">Upgrade to Premium</p>
                                                <p className="text-xs text-yellow-700 leading-relaxed">
                                                    Unlock unlimited practice, mock tests, and AI scoring.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!user?.isPremium && (
                                    <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-purple-200">
                                        Upgrade Now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ProfilePage;
