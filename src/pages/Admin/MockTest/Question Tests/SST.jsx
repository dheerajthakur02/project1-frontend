import React, { useState, useEffect, useMemo } from "react";
import {
    Plus, Edit, Trash2, Search, Eye, Loader2, PlusCircle, X,
    Headphones // Icon for SST (Listening)
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useSelector } from "react-redux";
import AdminLayout from "../../../../components/Admin/AdminLayout";

const ManageSSTs = () => {
    const { user } = useSelector((state) => state.auth);
    const [sstGroups, setSSTGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewData, setViewData] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [availableQuestions, setAvailableQuestions] = useState({});
    const [unusedLoading, setUnusedLoading] = useState(true);

    // State for form fields
    const initialForm = {
        title: "",
        summarizeSpokenTextQuestion: [], // Matches backend schema field for SSTGroup
    };
    const [form, setForm] = useState(initialForm);

    // --- API Calls ---
    const fetchSSTGroups = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/question/sst-group"); // Backend route
            setSSTGroups(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch SST groups:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnusedQuestions = async () => {
        setUnusedLoading(true);
        try {
            const res = await axios.get("/api/question/sst-group/get/unused");
            setAvailableQuestions(res.data.data || {});
        } catch (err) {
            console.error("Failed to fetch unused SST questions:", err);
        } finally {
            setUnusedLoading(false);
        }
    };

    useEffect(() => {
        fetchSSTGroups();
    }, []);

    const filteredSSTGroups = useMemo(() => {
        return sstGroups.filter(q => q.title?.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [sstGroups, searchTerm]);

    const getAvailableQuestionsKey = (formQuestionType) => {
        if (formQuestionType === "summarizeSpokenTextQuestion") {
            return "summarizeSpokenTextQuestion"; // Key returned by backend
        }
        return formQuestionType;
    };

    // --- Handlers ---
    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const payload = {
                title: form.title,
                summarizeSpokenTextQuestion: form.summarizeSpokenTextQuestion.map(q => q._id || q),
            };

            if (editingId) {
                await axios.put(`/api/question/sst-group/${editingId}`, payload);
            } else {
                await axios.post("/api/question/sst-group", payload);
            }
            setIsModalOpen(false);
            await fetchSSTGroups();
            handleCloseModal();
        } catch (err) {
            console.error("Error saving SST group:", err);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleAddQuestionToForm = (questionType, question) => {
        if (form[questionType].length >= 1) { // Backend limit is 1 for SST Group
            alert("SST groups can only have 1 question.");
            return;
        }
        setForm(prevForm => ({
            ...prevForm,
            [questionType]: [...prevForm[questionType], question]
        }));
        const key = getAvailableQuestionsKey(questionType);
        setAvailableQuestions(prevAvailable => ({
            ...prevAvailable,
            [key]: prevAvailable[key].filter(q => q._id !== question._id)
        }));
    };

    const handleRemoveQuestionFromForm = (questionType, questionId) => {
        const removedQuestion = form[questionType].find(q => (q._id || q) === questionId);
        setForm(prevForm => ({
            ...prevForm,
            [questionType]: prevForm[questionType].filter(q => (q._id || q) !== questionId)
        }));
        if (removedQuestion) {
            const key = getAvailableQuestionsKey(questionType);
            setAvailableQuestions(prevAvailable => ({
                ...prevAvailable,
                [key]: [...(prevAvailable[key] || []), removedQuestion]
            }));
        }
    };

    const handleEditClick = async (section) => {
        setEditingId(section._id);
        setIsModalOpen(true);
        setSubmitLoading(true);
        try {
            const res = await axios.get(`/api/question/sst-group/${section._id}`);
            const detailedSection = res.data.data;
            setForm({
                title: detailedSection.title,
                summarizeSpokenTextQuestion: detailedSection.summarizeSpokenTextQuestion || [],
            });

            const unusedRes = await axios.get("/api/question/sst-group/get/unused");
            const fetchedUnusedQuestions = unusedRes.data.data || {};

            const filteredAvailableQuestions = {};
            const formQuestionType = "summarizeSpokenTextQuestion";
            const availableKey = getAvailableQuestionsKey(formQuestionType);

            if (fetchedUnusedQuestions[availableKey]) {
                const sectionQuestionIds = new Set(detailedSection[formQuestionType]?.map(q => q._id.toString()));
                filteredAvailableQuestions[availableKey] = fetchedUnusedQuestions[availableKey].filter(
                    q => !sectionQuestionIds.has(q._id.toString())
                );
            }
            setAvailableQuestions(filteredAvailableQuestions);
        } catch (err) {
            console.error("Failed to fetch SST group details for editing:", err);
            setIsModalOpen(false);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this SST group?")) {
            try {
                await axios.delete(`/api/question/sst-group/${id}`);
                fetchSSTGroups();
            } catch (err) {
                console.error("Error deleting SST group:", err);
            }
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setForm(initialForm);
        setAvailableQuestions({});
    };

    // --- Render Helper ---
    const renderQuestionSelection = (questionType, Icon) => {
        const availableKey = getAvailableQuestionsKey(questionType);
        const questionsToDisplay = availableQuestions[availableKey] || [];

        return (
            <div className="space-y-4 border p-4 rounded-xl bg-slate-50">
                <h3 className="flex items-center gap-2 font-bold text-slate-700">
                    <Icon size={20} className="text-blue-500" />
                    {questionType.replace('summarizeSpokenTextQuestion', 'SST Question')}
                    <span className="text-sm text-slate-500 font-normal">({form[questionType].length} selected)</span>
                </h3>
                <div className="flex flex-wrap gap-2 mb-4 min-h-[40px] border-b pb-2">
                    {form[questionType].length === 0 ? (
                        <span className="text-sm text-slate-400 italic">No question selected.</span>
                    ) : (
                        form[questionType].map((q) => (
                            <span key={q._id || q} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                {q.title || `ID: ${q._id || q}`}
                                <button type="button" onClick={() => handleRemoveQuestionFromForm(questionType, q._id || q)} className="ml-1 text-blue-500 hover:text-blue-800"><X size={14} /></button>
                            </span>
                        ))
                    )}
                </div>
                {unusedLoading && !editingId ? (
                    <Loader2 className="animate-spin mx-auto text-blue-400" size={24} />
                ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-white">
                        {questionsToDisplay.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-2">No more available questions.</p>
                        ) : (
                            questionsToDisplay.map((q) => (
                                <button
                                    type="button"
                                    key={q._id}
                                    onClick={() => handleAddQuestionToForm(questionType, q)}
                                    className="w-full text-left p-2 border rounded-lg hover:bg-blue-50 transition-colors text-sm text-slate-700"
                                >
                                    {q.title || `ID: ${q._id}`}
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manage SST Groups</h2>
                        <p className="text-slate-500 font-medium">Create and organize PTE Summarize Spoken Text groups</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setEditingId(null);
                            setForm(initialForm);
                            fetchUnusedQuestions();
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100"
                    >
                        <PlusCircle size={22} /> <span>Create New SST Group</span>
                    </motion.button>
                </div>

                {/* SEARCH */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={20} />
                    <input
                        type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by group title..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                    />
                </div>

                {/* LIST */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={40} /></div>
                    ) : filteredSSTGroups.length === 0 ? (
                        <div className="py-20 text-center text-slate-500">No SST groups found.</div>
                    ) : (
                        filteredSSTGroups.map((section) => (
                            <motion.div key={section._id} whileHover={{ y: -4 }} className="grid grid-cols-1 md:grid-cols-12 items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
                                <div className="col-span-6 flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <Headphones size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{section.title}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Listening Module - SST</p>
                                    </div>
                                </div>
                                <div className="col-span-3 text-center text-slate-600 text-sm">
                                    <p>Question: {section.summarizeSpokenTextQuestion?.length || 0}</p>
                                </div>
                                <div className="col-span-3 flex justify-end gap-2">
                                    <button onClick={() => { setViewData(section); setIsViewModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={18} /></button>
                                    <button onClick={() => handleEditClick(section)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(section._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={18} /></button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* ADD/EDIT MODAL */}
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                                    <h2 className="text-2xl font-black text-slate-800">{editingId ? "Edit SST Group" : "New SST Group"}</h2>
                                    <button onClick={handleCloseModal} className="p-2 hover:bg-white rounded-xl shadow-sm"><X size={20} /></button>
                                </div>
                                <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-6">
                                    <input
                                        placeholder="Group Title"
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:bg-white"
                                        required
                                    />

                                    {submitLoading ? (
                                        <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32} /></div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                                            {renderQuestionSelection("summarizeSpokenTextQuestion", Headphones)}
                                        </div>
                                    )}

                                    <button disabled={submitLoading || form.summarizeSpokenTextQuestion.length > 1} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl">
                                        {submitLoading ? <Loader2 className="animate-spin mx-auto" /> : "Save SST Group"}
                                    </button>
                                    {form.summarizeSpokenTextQuestion.length > 1 && (
                                        <p className="text-red-500 text-sm mt-2">Maximum 1 question allowed.</p>
                                    )}
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* VIEW MODAL */}
                <AnimatePresence>
                    {isViewModalOpen && viewData && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsViewModalOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
                                <div className="p-10 space-y-8">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">SST Group</span>
                                            <h2 className="text-3xl font-black text-slate-900">{viewData.title}</h2>
                                        </div>
                                        <button onClick={() => setIsViewModalOpen(false)} className="p-3 bg-slate-100 rounded-full"><X /></button>
                                    </div>

                                    {[
                                        { type: "summarizeSpokenTextQuestion", label: "SST Question", icon: Headphones },
                                    ].map(({ type, label, icon: Icon }, index) => (
                                        viewData[type] && viewData[type].length > 0 && (
                                            <div key={index} className="space-y-4">
                                                <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800 border-b pb-2">
                                                    <Icon className="text-blue-500" size={24} /> {label} ({viewData[type].length})
                                                </h3>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {viewData[type].map(q => (
                                                        <div key={q._id || q} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                                            <p className="font-semibold text-slate-700 mb-2">{q.title || `Question ID: ${q._id || q}`}</p>
                                                            {q.audioUrl && (
                                                                <div className="mt-2">
                                                                    <audio controls src={q.audioUrl} className="w-full" />
                                                                </div>
                                                            )}
                                                            {q.transcript && <p className="text-sm text-slate-600 mt-2 italic">"{q.transcript.substring(0, 100)}..."</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
};

export default ManageSSTs;
