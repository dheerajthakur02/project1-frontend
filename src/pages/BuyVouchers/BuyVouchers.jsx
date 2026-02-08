import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { Shield, CheckCircle, Ticket, X, Calendar, User, Mail, Phone, Clock, CreditCard } from 'lucide-react'; // Using Ticket as icon for voucher
import api from '../../services/api';
import { useSelector } from 'react-redux';

const BuyVouchers = () => {
    const { user } = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'history'
    const [history, setHistory] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null); // For the modal

    // Purchase State
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Pricing Constants
    // Pricing Constants
    const UNIT_TOTAL = 15999;
    const UNIT_BASE = 13558;
    const UNIT_GST = 2441;

    const baseAmount = UNIT_BASE * quantity;
    const gstAmount = UNIT_GST * quantity;
    const totalAmount = UNIT_TOTAL * quantity;

    // Fetch History
    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            console.log("Fetching history...");
            const { data } = await api.get('/voucher/history');
            console.log("History response:", data);
            if (data.success) {
                setHistory(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setLoading(true);
        const res = await loadRazorpay();

        if (!res) {
            alert('Razorpay SDK failed to load. Are you online?');
            setLoading(false);
            return;
        }

        try {
            // 1. Create Order
            const { data } = await api.post('/voucher/create-order', {
                quantity
            });

            if (!data.success) throw new Error(data.message);

            const options = {
                key: data.key,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "Gurully PTE",
                description: `PTE Voucher x${quantity}`,
                image: "https://gurully.com/assets/images/logo.png",
                order_id: data.order.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/voucher/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.data.success) {
                            alert("Voucher purchased successfully!");
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
                    color: "#008199"
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (error) {
            console.error("Payment Error:", error);
            alert("Failed to initiate payment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="bg-white min-h-screen relative">
                {/* Banner Section */}
                <div className="bg-blue-50 py-10 text-center px-4">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Get Your <span className="text-white bg-[#008199] px-2 py-1 transform -rotate-2 inline-block shadow-sm">PTE Vouchers</span> & Save on Exam Fees!
                    </h1>
                    <p className="text-gray-500 text-sm mt-3">Get official PTE vouchers at discounted rates and book your exam stress-free.</p>

                    <div className="flex items-center justify-center gap-4 mt-6 text-2xl font-bold">
                        <span className="text-gray-400 line-through decoration-red-500 decoration-2">₹18000</span>
                        <span className="text-gray-500 text-sm font-normal items-center flex">Now at &rarr;</span>
                        <span className="text-[#008199] text-4xl">₹{UNIT_TOTAL}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mt-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('buy')}
                        className={`px-8 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'buy' ? 'border-[#008199] text-[#008199]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Ticket size={18} />
                        Buy Vouchers
                    </button>
                    <button
                        onClick={() => { setActiveTab('history'); fetchHistory(); }}
                        className={`px-8 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-[#008199] text-[#008199]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Shield size={18} />
                        Purchase History
                    </button>
                </div>

                {/* Content Area */}
                {activeTab === 'buy' ? (
                    <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-8 items-start justify-center">
                        {/* Order Summary Form */}
                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden w-full md:w-1/2 max-w-lg z-10 relative">
                            {/* Decorative background shapes */}
                            <div className="absolute top-0 left-0 w-20 h-20 bg-blue-50 rounded-br-full -z-10 opacity-50"></div>

                            <div className="bg-blue-600 text-white px-6 py-4 flex justify-between font-bold text-sm">
                                <span>Item Name</span>
                                <div className="flex gap-12 mr-4">
                                    <span>Quantity</span>
                                    <span>Amount</span>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="flex justify-between items-center py-4 border-b border-gray-100">
                                    <span className="font-semibold text-gray-700">PTE Test Voucher</span>
                                    <div className="flex items-center gap-8">
                                        <select
                                            className="border rounded px-2 py-1 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                        >
                                            {[...Array(10)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                        <span className="font-medium text-gray-600 w-20 text-right">INR {baseAmount}</span>
                                    </div>
                                </div>

                                <div className="py-4 space-y-3">
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Sub Total</span>
                                        <span>INR {baseAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>GST (18%)</span>
                                        <span>INR {gstAmount}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center py-4 border-t border-gray-200 mt-2">
                                    <span className="font-bold text-gray-800">Grand Total</span>
                                    <span className="font-bold text-xl text-gray-800">INR {totalAmount}</span>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-6 shadow-lg shadow-blue-200 transition-all active:scale-95 flex justify-center items-center"
                                >
                                    {loading ? "Processing..." : "Pay Now"}
                                </button>
                            </div>
                        </div>

                        {/* Benefits Card */}
                        <div className="bg-[#008199] text-white rounded-3xl p-8 w-full md:w-1/2 max-w-sm relative overflow-hidden shadow-xl min-h-[400px]">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full"></div>
                            <div className="absolute bottom-10 -left-10 w-20 h-20 bg-white opacity-10 rounded-full"></div>

                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center gap-2">
                                    <div className="bg-white text-[#008199] font-bold text-3xl w-12 h-12 rounded-full flex items-center justify-center">?</div>
                                    <div>
                                        <h3 className="font-bold text-xl leading-none">Pearson</h3>
                                        <p className="text-xs opacity-80">Authorized Partner</p>
                                    </div>
                                </div>
                                <div className="bg-red-600 text-white text-[10px] uppercase font-bold px-2 py-1 rounded rotate-12 shadow-sm border border-white">
                                    Authorized
                                </div>
                            </div>

                            <h4 className="font-bold text-lg mb-6">Benefits</h4>
                            <ul className="space-y-4">
                                {['Get code instantly via email', 'Valid only for India', 'Expires in 11 months', 'Authorized and genuine voucher'].map((benefit, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="mt-1"><CheckCircle size={18} className="text-white" fill="white" stroke="#008199" /></div>
                                        <span className="text-sm font-medium">{benefit}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-12 flex justify-center">
                                <div className="flex gap-2 opacity-80">
                                    <Ticket size={40} className="transform -rotate-12" />
                                    <Ticket size={40} className="transform rotate-12 text-yellow-300" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // History Tab Content
                    <div className="max-w-4xl mx-auto px-4 py-12">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800">Your Purchase History</h3>
                                <div className="text-xs text-gray-500">Total Orders: {history.length}</div>
                            </div>

                            {historyLoading ? (
                                <div className="p-12 text-center text-gray-500">Loading...</div>
                            ) : history.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <Ticket size={48} className="mx-auto mb-4 text-gray-300" />
                                    <p>No purchase history found.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3">Order Date</th>
                                                <th className="px-6 py-3">Order ID</th>
                                                <th className="px-6 py-3">Quantity</th>
                                                <th className="px-6 py-3">Amount</th>
                                                <th className="px-6 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.map((item) => (
                                                <tr
                                                    key={item._id}
                                                    onClick={() => setSelectedOrder(item)}
                                                    className="bg-white border-b hover:bg-blue-50 cursor-pointer transition-colors"
                                                >
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                        {item.razorpay_order_id}
                                                    </td>
                                                    <td className="px-6 py-4">x{item.quantity}</td>
                                                    <td className="px-6 py-4">₹{item.amount.toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                            ${item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                item.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                                    'bg-yellow-100 text-yellow-700'}`}>
                                                            {item.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- ORDER DETAILS MODAL --- */}
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="bg-[#008199] text-white p-6 flex justify-between items-start relative">
                                <div className="absolute top-0 right-0 p-4">
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="bg-black/20 hover:bg-black/40 text-white rounded-full p-1 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Order Details</h2>
                                    <p className="text-blue-100 text-xs mt-1 font-mono opacity-80">{selectedOrder.razorpay_order_id}</p>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6">
                                {/* Amount & Status */}
                                <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Amount</p>
                                        <p className="text-2xl font-bold text-[#008199]">₹{selectedOrder.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                                            ${selectedOrder.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                selectedOrder.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'}`}>
                                            {selectedOrder.status}
                                        </span>
                                    </div>
                                </div>

                                {/* User Details */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Customer Name</p>
                                            <p className="font-medium text-gray-800">{user?.name || "N/A"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Mail size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Email Address</p>
                                            <p className="font-medium text-gray-800">{user?.email || "N/A"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Phone size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Phone Number</p>
                                            <p className="font-medium text-gray-800">{user?.phone || user?.phoneNumber || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Meta */}
                                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <p className="text-gray-400 mb-1 flex items-center gap-1"><Calendar size={12} /> Date</p>
                                        <p className="font-semibold text-gray-700">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 mb-1 flex items-center gap-1"><Clock size={12} /> Time</p>
                                        <p className="font-semibold text-gray-700">{new Date(selectedOrder.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 mb-1 flex items-center gap-1"><Ticket size={12} /> Quantity</p>
                                        <p className="font-semibold text-gray-700">{selectedOrder.quantity}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 mb-1 flex items-center gap-1"><CreditCard size={12} /> Payment ID</p>
                                        <p className="font-semibold text-gray-700 truncate overflow-hidden max-w-full" title={selectedOrder.razorpay_payment_id}>
                                            {selectedOrder.razorpay_payment_id || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default BuyVouchers;
