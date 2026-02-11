import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../../components/Admin/AdminLayout';
import api from '../../../services/api';
import {
    Plus, Edit, Trash2, X, Eye, Upload,
    Search, ImageIcon, Clock, BarChart,
    AlertCircle, Loader2
} from 'lucide-react'; // Changed ImageIcon from Image
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';

/* ---------------- INITIAL FORM ---------------- */
const initialForm = {
    title: '',
    difficulty: 'Medium',
    prepareTime: 25, // Typical prepare time for Describe Image
    answerTime: 40,  // Typical answer time for Describe Image
    keywords: '',
    modelAnswer: '',
    image: null,
    isPredictive: false // Added isPredictive
};

const ManageDescribeImage = () => {
    const { user } = useSelector((state) => state.auth);

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [openModal, setOpenModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(initialForm);

    const [viewModal, setViewModal] = useState(false);
    const [viewData, setViewData] = useState(null);

    /* ---------------- FETCH ---------------- */
    const fetchQuestions = async () => {
        setLoading(true);
        try {
            // Updated API endpoint for Describe Image
            const { data } = await api.get(`/image/all`);
            setQuestions(data.data || []);
        } catch (err) {
            console.error("Failed to fetch questions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    /* ---------------- FILTERING ---------------- */
    const filteredQuestions = useMemo(() => {
        return questions.filter(q =>
            q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (q.keywords && q.keywords.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [questions, searchTerm]);

    /* ---------------- FORM HANDLERS ---------------- */
    const handleChange = (e) => {
        const { name, value, files, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (files ? files[0] : value),
        }));
    };

    const openAddModal = () => {
        setForm(initialForm);
        setEditingId(null);
        setOpenModal(true);
    };

    const openEditModal = (q) => {
        setForm({
            title: q.title,
            difficulty: q.difficulty,
            prepareTime: q.prepareTime,
            answerTime: q.answerTime,
            keywords: q.keywords ? q.keywords.join(', ') : '', // Convert array to string for input
            modelAnswer: q.modelAnswer,
            image: null, // Image isn't typically edited directly here without re-uploading
            isPredictive: q.isPredictive || false,
        });
        setEditingId(q._id);
        setOpenModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || (!form.image && !editingId)) { // Image not required if editing and not changing
            alert("Question Title and Image file are required for new questions.");
            return;
        }

        setSubmitLoading(true);
        const fd = new FormData();
        Object.entries(form).forEach(([key, val]) => {
            if (key === 'keywords' && typeof val === 'string') {
                fd.append(key, val.split(',').map(k => k.trim()).filter(k => k)); // Convert string to array
            } else if (val !== null) {
                fd.append(key, val);
            }
        });
        fd.append('user', user._id); // Assuming user ID is needed for associating questions

        try {
            if (editingId) {
                // Updated API endpoint for Describe Image
                await api.put(`/image/questions/${editingId}`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true
                });
            } else {
                // Updated API endpoint for Describe Image
                await api.post('/image/questions', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true
                });
            }
            setOpenModal(false);
            fetchQuestions();
        } catch (err) {
            console.error("Error adding/updating question", err);
            alert('Failed to add/update question');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;
        try {
            // Updated API endpoint for Describe Image
            await api.delete(`/image/questions/${id}`, { withCredentials: true });
            setQuestions(questions.filter(q => q._id !== id));
            alert("Deleted successfully");
        } catch (err) {
            console.error("Delete failed", err);
            alert("Failed to delete question");
        }
    };

    const handleView = (question) => {
        setViewData(question);
        setViewModal(true);
    };

    /* ---------------- UI HELPERS ---------------- */
    const getDifficultyColor = (level) => {
        switch (level) {
            case 'Easy': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Hard': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <AdminLayout>
            <div className="p-8 bg-[#f8fafc] min-h-screen">

                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Manage Describe Image</h1>
                        <p className="text-slate-500 mt-1">Upload and manage image description practice questions</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={openAddModal}
                        className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                    >
                        <Plus size={20} /> Add New Question
                    </motion.button>
                </div>

                {/* SEARCH & STATS BAR */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="md:col-span-3 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by title or keywords..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                        />
                    </div>
                    <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Total:</span>
                        <span className="text-indigo-600 font-bold text-lg">{questions.length}</span>
                    </div>
                </div>

                {/* TABLE CONTAINER */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Image Details</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Timing</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Predictive</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <Loader2 className="animate-spin mx-auto text-indigo-500 mb-2" size={32} />
                                            <p className="text-slate-400">Loading your questions...</p>
                                        </td>
                                    </tr>
                                ) : filteredQuestions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <AlertCircle className="text-slate-300" size={32} />
                                            </div>
                                            <p className="text-slate-500 font-medium">No questions found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredQuestions.map((q) => (
                                        <motion.tr
                                            layout
                                            key={q._id}
                                            className="hover:bg-indigo-50/30 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200">
                                                        {q.imageUrl ? (
                                                            <img src={q.imageUrl} alt={q.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon className="w-full h-full p-2 text-slate-400 bg-slate-100" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-slate-700 block">{q.title}</span>
                                                        {q.keywords && q.keywords.length > 0 && (
                                                            <span className="text-xs text-slate-500 line-clamp-1">{q.keywords.join(', ')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center text-xs space-y-1">
                                                    <span className="flex items-center gap-1 text-slate-500"><Clock size={12} /> Prep: {q.prepareTime}s</span>
                                                    <span className="flex items-center gap-1 text-indigo-600 font-medium"><BarChart size={12} /> Resp: {q.answerTime}s</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(q.difficulty)}`}>
                                                    {q.difficulty}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${q.isPredictive ? "bg-blue-400 text-white" : "bg-slate-100 text-slate-500"}`}>
                                                    {q.isPredictive ? "Yes" : "No"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <ActionButton onClick={() => handleView(q)} icon={<Eye size={18} />} color="text-slate-400 hover:text-indigo-600" />
                                                    <ActionButton onClick={() => openEditModal(q)} icon={<Edit size={18} />} color="text-slate-400 hover:text-emerald-600" />
                                                    <ActionButton onClick={() => handleDelete(q._id)} icon={<Trash2 size={18} />} color="text-slate-400 hover:text-rose-600" />
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL - ADD/EDIT */}
                <AnimatePresence>
                    {openModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setOpenModal(false)}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                                    <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Question' : 'Add New Question'}</h2>
                                    <button onClick={() => setOpenModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Question Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            required
                                            placeholder="e.g. DI-Map-01"
                                            value={form.title}
                                            onChange={handleChange}
                                            className="w-full border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Keywords (comma separated)</label>
                                        <input
                                            type="text"
                                            name="keywords"
                                            placeholder="e.g. map, population, growth, 2020"
                                            value={form.keywords}
                                            onChange={handleChange}
                                            className="w-full border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Model Answer</label>
                                        <textarea
                                            name="modelAnswer"
                                            rows={4}
                                            placeholder="The image describes..."
                                            value={form.modelAnswer}
                                            onChange={handleChange}
                                            className="w-full border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Prepare Time (s)</label>
                                            <input
                                                type="number" name="prepareTime" value={form.prepareTime} onChange={handleChange}
                                                className="w-full border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Answer Time (s)</label>
                                            <input
                                                type="number" name="answerTime" value={form.answerTime} onChange={handleChange}
                                                className="w-full border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Difficulty Level</label>
                                        <select
                                            name="difficulty" value={form.difficulty} onChange={handleChange}
                                            className="w-full border border-slate-200 px-4 py-2.5 rounded-xl outline-none bg-white"
                                        >
                                            <option>Easy</option>
                                            <option>Medium</option>
                                            <option>Hard</option>
                                        </select>
                                    </div>

                                    <div className="relative group">
                                        <input type="file" name="image" onChange={handleChange} id="image-upload" hidden />
                                        <label
                                            htmlFor="image-upload"
                                            className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all"
                                        >
                                            <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 mb-2">
                                                <Upload size={24} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600">
                                                {form.image ? form.image.name : (editingId ? "Click to change image (optional)" : "Click to upload image")}
                                            </span>
                                            <span className="text-xs text-slate-400 mt-1">JPG, PNG up to 5MB</span>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Is Predictive?
                                        </label>

                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        isPredictive: !prev.isPredictive,
                                                    }))
                                                }
                                                className={`relative w-12 h-6 rounded-full transition-colors duration-300
                                                    ${form.isPredictive ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                            >
                                                <span
                                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300
                                                        ${form.isPredictive ? 'translate-x-6' : 'translate-x-0'}`}
                                                />
                                            </button>

                                            <span className="text-sm text-slate-600">
                                                {form.isPredictive ? 'ON' : 'OFF'}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitLoading}
                                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                                    >
                                        {submitLoading ? <Loader2 className="animate-spin" /> : editingId ? 'Save Changes' : 'Create Question'}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* MODAL - VIEW */}
                <AnimatePresence>
                    {viewModal && viewData && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setViewModal(false)}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-slate-900 text-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative"
                            >
                                <button
                                    onClick={() => setViewModal(false)}
                                    className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
                                >
                                    <X />
                                </button>

                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <span className="text-indigo-400 text-sm font-bold tracking-widest uppercase">Preview Describe Image Question</span>
                                        <h2 className="text-3xl font-bold tracking-tight">{viewData.title}</h2>
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                                            <BarChart size={16} className="text-indigo-400" />
                                            <span className="text-sm">{viewData.difficulty}</span>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                                            <Clock size={16} className="text-emerald-400" />
                                            <span className="text-sm">Prep: {viewData.prepareTime}s / Ans: {viewData.answerTime}s</span>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                                            {viewData.isPredictive ?
                                                <span className="text-sm text-blue-400 font-bold">Predictive</span> :
                                                <span className="text-sm text-slate-400">Not Predictive</span>
                                            }
                                        </div>
                                    </div>

                                    {viewData.imageUrl && (
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                            <p className="text-xs text-slate-400 mb-3 flex items-center gap-2"><ImageIcon size={14} /> Image Source</p>
                                            <img src={viewData.imageUrl} alt={viewData.title} className="w-full h-auto rounded-xl max-h-96 object-contain" />
                                        </div>
                                    )}

                                    {viewData.keywords && viewData.keywords.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-slate-300">Keywords</h4>
                                            <div className="bg-white/5 p-4 rounded-2xl text-slate-400 leading-relaxed text-sm border border-white/10">
                                                {viewData.keywords.join(', ')}
                                            </div>
                                        </div>
                                    )}

                                    {viewData.modelAnswer && (
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-slate-300">Model Answer</h4>
                                            <div className="bg-white/5 p-6 rounded-2xl max-h-48 overflow-y-auto text-slate-400 leading-relaxed text-sm scrollbar-hide border border-white/10">
                                                {viewData.modelAnswer}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
};

/* Sub-component for clean action buttons */
const ActionButton = ({ onClick, icon, color }) => (
    <button
        onClick={onClick}
        className={`p-2 rounded-lg bg-slate-50 hover:bg-white hover:shadow-md transition-all ${color}`}
    >
        {icon}
    </button>
);

export default ManageDescribeImage;