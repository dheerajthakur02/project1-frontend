import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import logo from '../../assets/logo.png';


// Icons
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);
const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);

import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/slices/authSlice';

const PersonalDetails = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const selectedProduct = location.state?.selectedProduct || 'Unknown Product';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data } = await api.post('/auth/register', { ...formData, exam: selectedProduct });
            // const data = await response.json(); // API returns data directly in axios response.data

            if (!data.success) {
                throw new Error(data.message || 'Registration failed');
            }

            console.log('Registration success:', data);

            // Auto-login logic
            const user = data.data;
            const token = data.token; // From backend response

            dispatch(setCredentials({ user, token }));
            localStorage.setItem("user", JSON.stringify(user));
            if (token) localStorage.setItem("token", token);

            if (token) localStorage.setItem("token", token);

            const searchParams = new URLSearchParams(location.search);
            const redirectPath = searchParams.get('redirect') || "/dashboard";

            navigate(redirectPath);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto flex flex-col items-center pt-8">
            {/* Simple Header */}
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                    <img src={logo} alt="Pawan PTE Logo" className="h-16 w-16 rounded-full object-cover shadow-md" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Personal <span className="text-primary-600">Details</span>
                </h1>
                <p className="text-slate-500">Enter your basic information</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full px-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        placeholder="Enter your name"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        placeholder="name@example.com"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <div className="flex gap-2">
                        <div className="w-24 flex-shrink-0 border border-slate-300 rounded-lg px-3 py-3 flex items-center justify-center gap-2 bg-slate-50 text-slate-700">
                            <span className="text-sm font-medium">+91</span>
                        </div>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="flex-1 w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            placeholder="WhatsApp Number"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        placeholder="Create a password"
                    />
                </div>

                <div className="flex justify-between items-center mt-8">
                    <button
                        type="button"
                        onClick={() => navigate('/select-product')}
                        className="px-8 py-3 rounded-lg border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary min-w-[140px] flex items-center justify-center"
                    >
                        {loading ? 'Processing...' : 'Next'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PersonalDetails;
