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

const ManageReadingFIBDragDrop = () => {
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
        options: ["", "", "", "", ""],
        correctAnswers: [], // { index: 1, correctAnswer: "word" }
        difficulty: "Medium",
        isPredictive: false,
    };
    const [form, setForm] = useState(initialForm);

    /* ------------------- API CALLS ------------------- */
    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/reading-fib-drag-drop/get/${user._id}`);
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
            await api.delete(`/reading-fib-drag-drop/${id}`);
            fetchQuestions();
        } catch (err) { console.error(err); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Logic to auto-assign indexes based on options or let user map them
            // For simplicity in this UI, we will check if correctAnswers map is valid relative to placeholders in text.
            // But for now we just submit.

            const payload = { ...form };

            if (editingId) {
                await api.put(`/reading-fib-drag-drop/${editingId}`, payload);
            } else {
                await api.post("/reading-fib-drag-drop/add", payload);
            }
            setIsModalOpen(false);
            fetchQuestions();
        } catch (err) { console.error(err); }
    };

    // Helper to sync correct answers based on options
    const updateCorrectAnswer = (index, value) => {
        const existing = form.correctAnswers.find(ca => ca.index === index);
        if (existing) {
            if (value === "") {
                setForm({ ...form, correctAnswers: form.correctAnswers.filter(ca => ca.index !== index) });
            } else {
                setForm({ ...form, correctAnswers: form.correctAnswers.map(ca => ca.index === index ? { ...ca, correctAnswer: value } : ca) });
            }
        } else {
            setForm({ ...form, correctAnswers: [...form.correctAnswers, { index, correctAnswer: value }] });
        }
    };

    // Helper for blank indexes
    const [blankIndexes, setBlankIndexes] = useState([1]);

    // Sync blankIndexes when editing
    useEffect(() => {
        if (editingId && form.correctAnswers.length > 0) {
            const indexes = form.correctAnswers.map(ca => ca.index).sort((a, b) => a - b);
            setBlankIndexes(indexes.length > 0 ? indexes : [1]);
        } else if (!isModalOpen) {
            setBlankIndexes([1]);
        }
    }, [editingId, form.correctAnswers, isModalOpen]);

    const addBlankIndex = () => {
        const nextIndex = blankIndexes.length > 0 ? Math.max(...blankIndexes) + 1 : 1;
        setBlankIndexes([...blankIndexes, nextIndex]);
    };

    const removeBlankIndex = (indexToRemove) => {
        setBlankIndexes(blankIndexes.filter(i => i !== indexToRemove));
        setForm(prev => ({
            ...prev,
            correctAnswers: prev.correctAnswers.filter(ca => ca.index !== indexToRemove)
        }));
    };

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            Reading <span className="text-indigo-600">FIB (Drag & Drop)</span>
                        </h2>
                        <p className="text-slate-500 font-medium">Manage your Reading Drag & Drop question bank</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setEditingId(null); setForm(initialForm); setIsModalOpen(true); setBlankIndexes([1]); }}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all"
                    >
                        <PlusCircle size={22} />
                        <span>Add New Question</span>
                    </motion.button>
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
                                    <h2 className="text-2xl font-black text-slate-800">{editingId ? "Edit Question" : "New FIB Drag & Drop"}</h2>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl shadow-sm"><X size={20} /></button>
                                </div>
                                <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Title</label>
                                                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white" required placeholder="e.g. Artificial Intelligence" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passage Text (Use [n] for blanks)</label>
                                                <textarea
                                                    value={form.text}
                                                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                                                    rows={8}
                                                    className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white font-mono text-sm leading-relaxed"
                                                    required
                                                    placeholder="e.g. The cat sat on the [1] mat. It was a [2] day."
                                                />
                                                <p className="text-xs text-slate-400 mt-2">Use <span className="font-mono bg-slate-100 rounded px-1">[1]</span>, <span className="font-mono bg-slate-100 rounded px-1">[2]</span>, etc. to mark blanks.</p>
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

                                            {/* OPTIONS POOL */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Option Pool</span>
                                                    <button type="button" onClick={() => setForm({ ...form, options: [...form.options, ""] })} className="text-xs font-bold text-indigo-600">+ Add Option</button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {form.options.map((opt, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <input
                                                                value={opt}
                                                                onChange={(e) => {
                                                                    const newOpts = [...form.options];
                                                                    newOpts[idx] = e.target.value;
                                                                    setForm({ ...form, options: newOpts });
                                                                }}
                                                                placeholder={`Option`}
                                                                className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setForm({ ...form, options: form.options.filter((_, i) => i !== idx) })}
                                                                className="p-2 text-slate-300 hover:text-rose-500"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <hr className="border-slate-200 my-4" />

                                            {/* CORRECT ANSWERS MAPPING */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Map Blanks to Answers</span>
                                                    <button type="button" onClick={addBlankIndex} className="text-xs font-bold text-indigo-600">+ Add Mapping</button>
                                                </div>
                                                <div className="space-y-2">
                                                    {blankIndexes.map((num) => (
                                                        <div key={num} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                                                            <span className="w-8 h-8 shrink-0 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">[{num}]</span>
                                                            <select
                                                                value={form.correctAnswers.find(ca => ca.index === num)?.correctAnswer || ""}
                                                                onChange={(e) => updateCorrectAnswer(num, e.target.value)}
                                                                className="flex-1 p-2 bg-slate-50 rounded-lg text-xs outline-none"
                                                            >
                                                                <option value="">Select Correct Option...</option>
                                                                {form.options.filter(o => o).map((o, i) => (
                                                                    <option key={i} value={o}>{o}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeBlankIndex(num)}
                                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <p className="text-[10px] text-slate-400 italic">Map the [n] placeholders in text to the correct option from the pool.</p>
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

                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-slate-700 leading-relaxed max-h-60 overflow-y-auto font-mono text-sm">
                                        {viewData.text}
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider">Option Pool</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {viewData.options.map((o, i) => (
                                                    <span key={i} className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">{o}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-emerald-600 mb-2 text-xs uppercase tracking-wider">Correct Answers</h4>
                                            <div className="space-y-1">
                                                {viewData.correctAnswers.map((ca, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs">
                                                        <span className="font-bold text-slate-400">[{ca.index}]</span>
                                                        <span className="font-bold text-emerald-700">{ca.correctAnswer}</span>
                                                    </div>
                                                ))}
                                            </div>
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

export default ManageReadingFIBDragDrop;
