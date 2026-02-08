import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/Admin/AdminLayout';
import api from '../../services/api';
import { CheckCircle, XCircle, Clock, Calendar, User, Mail, Phone, CreditCard, Ticket, X } from 'lucide-react';

const VoucherOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/voucher/all-orders');
            if (data.success) {
                setOrders(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="bg-white p-6 rounded-2xl shadow-sm min-h-screen">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-bold text-slate-800">Voucher Orders</h2>
                    <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Total Orders: {orders.length}</div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading orders...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <Ticket size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>No voucher orders found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Order Date</th>
                                    <th className="px-6 py-3">Order ID</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Quantity</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.map((order) => (
                                    <tr
                                        key={order._id}
                                        onClick={() => setSelectedOrder(order)}
                                        className="bg-white hover:bg-blue-50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                            {order.razorpay_order_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-700">{order.user?.name || "Unknown"}</span>
                                                <span className="text-xs text-gray-400">{order.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">x{order.quantity}</span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-700">₹{order.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1
                                                ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'}`}>
                                                {order.status === 'completed' && <CheckCircle size={12} />}
                                                {order.status === 'failed' && <XCircle size={12} />}
                                                {order.status === 'pending' && <Clock size={12} />}
                                                {order.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

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
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Customer Information</h4>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Customer Name</p>
                                        <p className="font-medium text-gray-800">{selectedOrder.user?.name || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Mail size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Email Address</p>
                                        <p className="font-medium text-gray-800">{selectedOrder.user?.email || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Phone size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Phone Number</p>
                                        <p className="font-medium text-gray-800">{selectedOrder.user?.phone || selectedOrder.user?.phoneNumber || "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Meta */}
                            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs mt-4">
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
        </AdminLayout>
    );
};

export default VoucherOrders;
