import React, { useState, useEffect, useMemo } from "react";
import {
    Plus, Edit, Trash2, Search, Eye,
    Layers, Loader2, Sparkles, CheckCircle2,
    X, PlusCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../../services/api";
import { useSelector } from "react-redux";
import AdminLayout from "../../../../components/Admin/AdminLayout";

const ManageReadingMCSA = () => {
    const { user } = useSelector((state) => state.auth);

    // States
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewData, setViewData] = useState(null);

    // Form State
    const initialForm = {
        title: "",
        text: "",
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        difficulty: "Medium",
        isPredictive: false,
    };
    const [form, setForm] = useState(initialForm);

    /* ------------------- API CALLS ------------------- */
    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/reading-multi-choice-single-answer/get/${user._id}`);
            setQuestions(data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchQuestions(); }, []);

    const filteredQuestions = useMemo(() => {
        return questions.filter(q =>
            q.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [questions, searchTerm]);

    /* ------------------- HANDLERS ------------------- */
    const handleView = (q) => {
        setViewData(q);
        setIsViewModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this question?")) return;
        try {
            await api.delete(`/reading-multi-choice-single-answer/${id}`);
            fetchQuestions();
        } catch (err) { console.error(err); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/reading-multi-choice-single-answer/${editingId}`, form);
            } else {
                await api.post("/reading-multi-choice-single-answer/add", form);
            }
            setIsModalOpen(false);
            fetchQuestions();
        } catch (err) { console.error(err); }
    };

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            Reading <span className="text-indigo-600">Multiple Choice (Single)</span>
                        </h2>
                        <p className="text-slate-500 font-medium">Manage your Reading MCSA question bank</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setEditingId(null); setForm(initialForm); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all"
                    >
                        <PlusCircle size={22} />
                        <span>Add New Question</span>
                    </motion.button>
                </div>

                {/* TOOLBAR */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by title..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm"
                    />
                </div>

                {/* LIST TABLE */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={40} /></div>
                    ) : (
                        filteredQuestions.map((q) => (
                            <motion.div key={q._id} className="grid grid-cols-1 md:grid-cols-12 items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
                                <div className="col-span-6 flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        {q.isPredictive ? <Sparkles size={20} /> : <Layers size={20} />}
                                    </div>
                                    <h3 className="font-bold text-slate-800">{q.title}</h3>
                                </div>
                                <div className="col-span-2 text-center text-xs font-bold text-slate-500">{q.options?.length} Options</div>
                                <div className="col-span-2 text-center">
                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${q.difficulty === 'Hard' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{q.difficulty}</span>
                                </div>
                                <div className="col-span-2 flex justify-end gap-2">
                                    <button onClick={() => handleView(q)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye size={18} /></button>
                                    <button onClick={() => handleDelete(q._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={18} /></button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* --- ADD/EDIT MODAL --- */}
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                                    <h2 className="text-2xl font-black text-slate-800">{editingId ? "Edit Question" : "New Reading MCSA"}</h2>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl shadow-sm"><X size={20} /></button>
                                </div>
                                <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Title</label>
                                                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white" required placeholder="e.g. Climate Change" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Main Question</label>
                                                <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white" required placeholder="e.g. What is the main idea?" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passage Text</label>
                                                <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={6} className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white" required placeholder="Full reading passage..." />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Difficulty</label>
                                                    <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none">
                                                        <option value="Easy">Easy</option>
                                                        <option value="Medium">Medium</option>
                                                        <option value="Hard">Hard</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-end pb-4">
                                                    <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-600">
                                                        <input type="checkbox" checked={form.isPredictive} onChange={(e) => setForm({ ...form, isPredictive: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                                                        Prediction Question
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 overflow-y-auto max-h-[500px]">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Manage Options</span>
                                                <button type="button" onClick={() => setForm({ ...form, options: [...form.options, ""] })} className="text-xs font-bold text-indigo-600">+ Add Option</button>
                                            </div>
                                            {form.options.map((opt, idx) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <input
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOpts = [...form.options];
                                                            newOpts[idx] = e.target.value;
                                                            setForm({ ...form, options: newOpts });
                                                        }}
                                                        placeholder={`Option ${idx + 1}`}
                                                        className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-sm"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm({ ...form, correctAnswer: opt })}
                                                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${form.correctAnswer === opt && opt !== "" ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}
                                                        disabled={!opt}
                                                    >
                                                        {form.correctAnswer === opt ? "Correct" : "Mark Correct"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newOpts = form.options.filter((_, i) => i !== idx);
                                                            // If deleted option was correct answer, reset logic could go here
                                                            setForm({ ...form, options: newOpts });
                                                        }}
                                                        className="p-2 text-slate-300 hover:text-rose-500"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="mt-4 p-4 bg-indigo-50 rounded-xl">
                                                <h4 className="text-xs font-bold text-indigo-800 mb-2">Selected Correct Answer:</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {form.correctAnswer ? (
                                                        <span className="px-2 py-1 bg-emerald-200 text-emerald-800 text-[10px] rounded-md font-bold">{form.correctAnswer}</span>
                                                    ) : (
                                                        <span className="text-xs text-indigo-400 italic">None selected</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold">Save Question</button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- VIEW MODAL --- */}
                <AnimatePresence>
                    {isViewModalOpen && viewData && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsViewModalOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden">
                                <div className="p-10 space-y-8">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${viewData.difficulty === 'Hard' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{viewData.difficulty}</span>
                                            <h2 className="text-3xl font-black text-slate-900">{viewData.title}</h2>
                                        </div>
                                        <button onClick={() => setIsViewModalOpen(false)} className="p-4 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all"><X size={24} /></button>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-slate-700 leading-relaxed max-h-60 overflow-y-auto">
                                        <h4 className="font-bold text-indigo-600 mb-2">Passage:</h4>
                                        {viewData.text}
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-2">{viewData.question}</h4>
                                        <div className="space-y-2">
                                            {viewData.options.map((opt, i) => (
                                                <div key={i} className={`p-3 rounded-xl border ${viewData.correctAnswer === opt ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-white border-slate-100 text-slate-500'}`}>
                                                    {opt} {viewData.correctAnswer === opt && "(Correct)"}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </AdminLayout>
    );
};

export default ManageReadingMCSA;
