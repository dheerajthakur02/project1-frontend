import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { Check, Star, Zap, Clock, Shield } from 'lucide-react';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const PlanCard = ({ title, price, days, features, popular, color, onCheckout }) => {
    return (
        <div className={`relative bg-white rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl border ${popular ? 'border-green-500 shadow-lg' : 'border-slate-100 shadow-sm'}`}>
            {popular && (
                <div className="absolute -top-3 right-6 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={12} fill="currentColor" /> Most Popular
                </div>
            )}

            <div className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold mb-4 ${color}`}>
                {days} Days
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>

            <div className="flex items-baseline gap-1 mb-1">
                <span className="text-sm font-medium text-slate-400">INR</span>
                <span className="text-4xl font-bold text-slate-800">{price}</span>
                <span className="text-xl text-slate-800 font-bold">*</span>
            </div>

            <div className="text-sm text-primary-600 font-medium mb-6">Prime Membership</div>

            <div className="space-y-3 mb-8">
                {features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                        {feature.icon}
                        <span>{feature.text}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={() => onCheckout(price, `${days} Days`)}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${popular
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : color.includes('purple')
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : color.includes('blue')
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
            >
                <Zap size={18} />
                Checkout
            </button>
        </div>
    );
};

const Pricing = () => {
    const { user } = useSelector((state) => state.auth);
    const benefitsRef = React.useRef(null);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleCheckout = async (amount, planType) => {
        const res = await loadRazorpay();

        if (!res) {
            alert('Razorpay SDK failed to load. Are you online?');
            return;
        }

        try {
            const { data: { key } } = await api.get('/payment/get-key');

            // Create Order
            const { data: { order } } = await api.post('/payment/create-order', {
                amount,
            });

            const options = {
                key: key,
                amount: order.amount,
                currency: order.currency,
                name: "PTE Practice",
                description: `${planType} Subscription`,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/payment/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planType,
                            amount
                        });

                        if (verifyRes.data.success) {
                            alert("Payment Successful! Membership Activated.");
                            // Maybe redirect or refresh user state
                        }
                    } catch (error) {
                        console.error('Payment verification failed', error);
                        alert("Payment verification failed");
                    }
                },
                prefill: {
                    name: user?.name,
                    email: user?.email,
                    contact: user?.phone
                },
                theme: {
                    color: "#3399cc"
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error('Error in payment flow', error);
            alert("Something went wrong with the payment request.");
        }
    };

    const scrollToBenefits = () => {
        benefitsRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const plans = [
        {
            title: "Get Started",
            days: 7,
            price: 600,
            color: "bg-blue-100 text-blue-600",
            features: [
                { icon: <Zap size={16} className="text-orange-400 fill-orange-400" />, text: "Seven days of prep to master strong basics." }
            ]
        },
        {
            title: "Stay Focused",
            days: 15,
            price: 1000,
            color: "bg-orange-100 text-orange-600",
            features: [
                { icon: <Zap size={16} className="text-pink-400 fill-pink-400" />, text: "Fifteen days of practice to boost your clarity." }
            ]
        },
        {
            title: "Go Strong",
            days: 30,
            price: 1300,
            popular: true,
            color: "bg-green-100 text-green-600",
            features: [
                { icon: <Clock size={16} className="text-orange-500 fill-orange-500" />, text: "One month of learning to sharpen your skills." }
            ]
        },
        {
            title: "Long Prep",
            days: 60,
            price: 1890,
            color: "bg-purple-100 text-purple-600",
            features: [
                { icon: <Shield size={16} className="text-yellow-400 fill-yellow-400" />, text: "Comprehensive plan for strong and steady progress." }
            ]
        }
    ];

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Unlock Full Access
                        <span className="bg-purple-200 text-purple-700 rounded p-0.5 ml-1">🔓</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
                        Clear Pricing , Easy Preparation !
                    </h1>
                    <p className="text-slate-500 max-w-2xl mx-auto">
                        Get Unlimited AI Scored Mocks, Sectionals and Practice Questions with Vocab Books, Template and Prediction Files
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {plans.map((plan, index) => (
                        <PlanCard
                            key={index}
                            {...plan}
                            onCheckout={handleCheckout}
                        />
                    ))}
                </div>

                <div className="flex justify-center mt-12 mb-20">
                    <button
                        onClick={scrollToBenefits}
                        className="text-purple-500 font-semibold flex items-center gap-1 hover:underline group"
                    >
                        See Benefits <span className="text-xl group-hover:translate-y-1 transition-transform">↓</span>
                    </button>
                </div>

                <div ref={benefitsRef} className="py-12 border-t border-slate-100">
                    <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">Why User Love Our Platform</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-6 bg-slate-50 rounded-2xl">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Real Exam Interface</h3>
                            <p className="text-slate-600">Practice in an environment that exactly mimics the real PTE exam to build confidence.</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">AI Scoring</h3>
                            <p className="text-slate-600">Get instant, accurate AI scoring and detailed feedback/analysis for every question type.</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                                <Star size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Prediction Files</h3>
                            <p className="text-slate-600">Access our curated prediction files and templates to boost your preparation efficiency.</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Pricing;
