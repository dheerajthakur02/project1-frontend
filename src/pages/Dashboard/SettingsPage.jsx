import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Mail, Phone, Lock, Save, Loader2, Award, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { fetchUserProfile, updateProfile, changePassword } from '../../services/api';
import { setCredentials } from '../../redux/slices/authSlice';

const SettingsPage = () => {
    const { user, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'

    // Form States
    const [profileForm, setProfileForm] = useState({
        name: '',
        phone: '',
        exam: ''
    });
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [updateLoading, setUpdateLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Fetch latest data
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const res = await fetchUserProfile();
                if (res.success && res.data) {
                    dispatch(setCredentials({ user: res.data, token }));
                    setProfileForm({
                        name: res.data.name || '',
                        phone: res.data.phone || '',
                        exam: res.data.exam || 'pte-academic'
                    });
                }
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [dispatch, token]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setUpdateLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await updateProfile(profileForm);
            if (res.success) {
                dispatch(setCredentials({ user: res.data, token }));
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        setUpdateLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await changePassword({
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            });
            if (res.success) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to change password' });
        } finally {
            setUpdateLoading(false);
        }
    };

    const calculateDaysLeft = (expiryDate) => {
        if (!expiryDate) return 0;
        const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return Math.max(0, days);
    };

    if (loading && !user) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <User size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Account Settings</h1>
                        <p className="text-slate-500">Manage your profile details and security</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN - TABS & STATS (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Navigation Tabs */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <User size={20} /> Edit Profile
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'password' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Lock size={20} /> Change Password
                            </button>
                        </div>

                    </div>

                    {/* RIGHT COLUMN - CONTENT (8 cols) */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 min-h-[500px]">

                            {/* Message Alert */}
                            {message.text && (
                                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                    <p className="font-medium text-sm">{message.text}</p>
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="border-b border-slate-100 pb-4 mb-4">
                                        <h2 className="text-xl font-bold text-slate-800">Edit Profile Information</h2>
                                        <p className="text-slate-400 text-sm">Update your personal details</p>
                                    </div>

                                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700">Full Name</label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                    <input
                                                        type="text"
                                                        value={profileForm.name}
                                                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                                                        placeholder="John Doe"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700">Phone Number</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                    <input
                                                        type="text"
                                                        value={profileForm.phone}
                                                        disabled
                                                        className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-400 ml-1">Phone number cannot be changed</p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700">Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                    <input
                                                        type="email"
                                                        value={user?.email || ''}
                                                        disabled
                                                        className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-400 ml-1">Email cannot be changed</p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700">Exam Type</label>
                                                <div className="relative">
                                                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                    <select
                                                        value={profileForm.exam}
                                                        onChange={e => setProfileForm({ ...profileForm, exam: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium appearance-none"
                                                    >
                                                        <option value="pte-academic">PTE Academic</option>
                                                        <option value="pte-core">PTE Core</option>
                                                        <option value="ielts-academic">IELTS Academic</option>
                                                        <option value="ielts-general">IELTS General</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={updateLoading}
                                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70"
                                            >
                                                {updateLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                                Save Changes
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'password' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="border-b border-slate-100 pb-4 mb-4">
                                        <h2 className="text-xl font-bold text-slate-800">Change Password</h2>
                                        <p className="text-slate-400 text-sm">Ensure your account uses a strong password</p>
                                    </div>

                                    <form onSubmit={handleChangePassword} className="max-w-md space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Current Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordForm.oldPassword}
                                                    onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">New Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordForm.newPassword}
                                                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="password"
                                                    required
                                                    value={passwordForm.confirmPassword}
                                                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={updateLoading}
                                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70"
                                            >
                                                {updateLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                                Update Password
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SettingsPage;
