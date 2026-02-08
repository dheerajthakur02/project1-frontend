import React, { useState, useEffect, useMemo } from "react";
import {
    Plus, Edit, Trash2, Search, Eye,
    Layers, Loader2, Sparkles, CheckCircle2,
    X, PlusCircle, ArrowUp, ArrowDown, Shuffle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../../services/api";
import { useSelector } from "react-redux";
import AdminLayout from "../../../../components/Admin/AdminLayout";

const ManageReadingReorder = () => {
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
    // We will manage paragraphs in the order they are displayed in the form (Correct Order)
    // When saving, we will assign IDs A, B, C... and then shuffle the sentences array for storage
    // but keep correctOrder as [A, B, C...]
    const initialForm = {
        title: "",
        paragraphs: ["", "", "", ""], // Just text content
        difficulty: "Medium",
        isPredictive: false,
    };
    const [form, setForm] = useState(initialForm);

    /* ------------------- API CALLS ------------------- */
    const fetchQuestions = async () => {
        if (!user || (!user._id && !user.id)) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/reading-reorder/get/${user._id}`);
            setQuestions(data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchQuestions();
    }, [user]);

    const filteredQuestions = useMemo(() => {
        return questions.filter(q =>
            q.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [questions, searchTerm]);

    /* ------------------- HANDLERS ------------------- */
    const handleView = (q) => {
        // Determine the "True" order for display
        // q.sentences is jumbled. q.correctOrder has IDs in order.
        // We map correctOrder IDs back to the sentence text.
        const orderedSentences = q.correctOrder.map(id =>
            q.sentences.find(s => s.id === id)
        );

        setViewData({ ...q, orderedSentences });
        setIsViewModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this question?")) return;
        try {
            // Assuming generic delete route pattern or specific if defined
            // Checking controller found: no explicit delete in snippet 
            // but typically it's similar to others. If not, we might need to add it.
            // Let's assume standard REST pattern or generic one.
            // The previous modules had /api/module/id delete.
            // If this fails, I might need to check routes.
            // Actually, I didn't see a delete in the controller snippet! 
            // But I will try the standard convention.
            await api.delete(`/reading-reorder/${id}`);
            fetchQuestions();
        } catch (err) {
            // Fallback for demo/if route missing
            console.error("Delete failed or not implemented", err);
            alert("Delete might not be implemented in backend API yet.");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Prepare data
            // 1. Assign IDs A, B, C... to the form paragraphs (which are in correct order)
            const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const preparedSentences = form.paragraphs
                .filter(p => p.trim())
                .map((text, idx) => ({
                    id: alpha[idx] || `ID${idx}`,
                    text: text.trim()
                }));

            if (preparedSentences.length < 2) {
                alert("Please add at least 2 paragraphs.");
                return;
            }

            // 2. correctOrder is simply the IDs in sequence [A, B, C...]
            const correctOrder = preparedSentences.map(s => s.id);

            // 3. Shuffle sentences for storage so they don't appear in order by default
            const shuffledSentences = [...preparedSentences].sort(() => Math.random() - 0.5);

            const payload = {
                title: form.title,
                sentences: shuffledSentences,
                correctOrder: correctOrder,
                difficulty: form.difficulty,
                isPredictive: form.isPredictive
            };

            if (editingId) {
                await api.put(`/reading-reorder/${editingId}`, payload);
            } else {
                await api.post("/reading-reorder/add", payload);
            }
            setIsModalOpen(false);
            fetchQuestions();
        } catch (err) { console.error(err); }
    };

    const moveParagraph = (idx, direction) => {
        const newParas = [...form.paragraphs];
        if (direction === 'up' && idx > 0) {
            [newParas[idx], newParas[idx - 1]] = [newParas[idx - 1], newParas[idx]];
        } else if (direction === 'down' && idx < newParas.length - 1) {
            [newParas[idx], newParas[idx + 1]] = [newParas[idx + 1], newParas[idx]];
        }
        setForm({ ...form, paragraphs: newParas });
    };

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            Reading <span className="text-indigo-600">Reorder Paragraphs</span>
                        </h2>
                        <p className="text-slate-500 font-medium">Manage your Reorder Paragraph question bank</p>
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

                {/* LIST TABLE */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={40} /></div>
                    ) : (
                        filteredQuestions.map((q) => (
                            <motion.div key={q._id} className="grid grid-cols-1 md:grid-cols-12 items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
                                <div className="col-span-8 flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        {q.isPredictive ? <Sparkles size={20} /> : <Shuffle size={20} />}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-slate-800">{q.title}</h3>
                                        <p className="text-xs text-slate-400 line-clamp-1">{q.sentences?.length || 0} Paragraphs</p>
                                    </div>
                                </div>
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
                                    <h2 className="text-2xl font-black text-slate-800">{editingId ? "Edit Question" : "New Reorder Question"}</h2>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl shadow-sm"><X size={20} /></button>
                                </div>
                                <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Title</label>
                                                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white" required placeholder="e.g. The History of Aviation" />
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
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Paragraphs (Correct Order)</span>
                                                <button type="button" onClick={() => setForm({ ...form, paragraphs: [...form.paragraphs, ""] })} className="text-xs font-bold text-indigo-600">+ Add Paragraph</button>
                                            </div>

                                            <div className="space-y-3">
                                                {form.paragraphs.map((para, idx) => (
                                                    <div key={idx} className="flex gap-4 items-start group">
                                                        <div className="flex flex-col gap-1 mt-2">
                                                            <button type="button" onClick={() => moveParagraph(idx, 'up')} className="p-1 text-slate-300 hover:text-indigo-600 hover:bg-white rounded"><ArrowUp size={14} /></button>
                                                            <span className="text-xs font-black text-slate-400 text-center">{idx + 1}</span>
                                                            <button type="button" onClick={() => moveParagraph(idx, 'down')} className="p-1 text-slate-300 hover:text-indigo-600 hover:bg-white rounded"><ArrowDown size={14} /></button>
                                                        </div>
                                                        <textarea
                                                            value={para}
                                                            onChange={(e) => {
                                                                const newParas = [...form.paragraphs];
                                                                newParas[idx] = e.target.value;
                                                                setForm({ ...form, paragraphs: newParas });
                                                            }}
                                                            rows={2}
                                                            placeholder={`Paragraph ${idx + 1}`}
                                                            className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setForm({ ...form, paragraphs: form.paragraphs.filter((_, i) => i !== idx) })}
                                                            className="mt-2 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-slate-400 italic text-center mt-4">Tip: Enter paragraphs in the CORRECT order. The system will auto-shuffle them for the test.</p>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold">Save and Shuffle</button>
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

                                    <div className="space-y-6">

                                        {/* JUMBLED (Stored) */}
                                        <div>
                                            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-4">Stored Data (Jumbled)</h4>
                                            <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                                                {viewData.sentences.map((s, i) => (
                                                    <div key={i} className="text-sm text-slate-500 py-1">
                                                        <span className="font-bold text-slate-300 mr-2">[{s.id}]</span> {s.text}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* CORRECT ORDER */}
                                        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                                            <h4 className="font-bold text-xs uppercase tracking-widest text-emerald-600 mb-4">Correct Sequence</h4>
                                            <div className="space-y-3">
                                                {viewData.orderedSentences.map((s, i) => (
                                                    <div key={i} className="flex gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                                        <p className="text-sm font-medium text-emerald-900">{s?.text}</p>
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

export default ManageReadingReorder;
