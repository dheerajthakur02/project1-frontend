import React, { useEffect, useState, useMemo } from "react";
import api from "../../../../services/api";
import {
  Plus, Edit, Trash2, X, Search,
  FileText, Clock, BarChart3,
  AlertCircle, Loader2, Eye,
  WholeWord, AlignLeft, Info,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useSelector } from "react-redux";
import AdminLayout from "../../../../components/Admin/AdminLayout";

/* ---------------- INITIAL FORM ---------------- */
const initialForm = {
  title: "",
  paragraph: "", // The text to be summarized
  maxWords: 75,
  difficulty: "easy",
  answerTime: 600, // 10 minutes (Standard PTE time)
  modelAnswer: "",
  isPredictive: false,
};

const ManageSummarizeText = () => {
  const { user } = useSelector((state) => state.auth);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [viewModal, setViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);

  /* ---------------- FETCH DATA ---------------- */
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Matches the aggregate controller logic provided
      const { data } = await api.get(`/summarize-text/get/${user._id}`);
      setQuestions(data.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  /* ---------------- SEARCH & FILTER ---------------- */
  const filteredQuestions = useMemo(() => {
    return questions.filter(q =>
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.paragraph?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [questions, searchTerm]);

  /* ---------------- FORM HANDLERS ---------------- */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: (name === "maxWords" || name === "answerTime")
        ? Number(value)
        : type === "checkbox" ? checked : value,
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
      paragraph: q.paragraph || "",
      maxWords: q.maxWords,
      difficulty: q.difficulty,
      answerTime: q.answerTime,
      modelAnswer: q.modelAnswer || "",
      isPredictive: q.isPredictive || false,
    });
    setEditingId(q._id);
    setOpenModal(true);
  };

  const handleView = (q) => {
    setViewData(q);
    setViewModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      if (editingId) {
        await api.put(`/summarize-text/${editingId}`, form);
      } else {
        await api.post("/summarize-text/add", form);
      }
      setOpenModal(false);
      fetchQuestions();
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this passage?")) return;
    try {
      await api.delete(`/summarize-text/${id}`);
      setQuestions(questions.filter(q => q._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const getDifficultyColor = (level) => {
    switch (level?.toLowerCase()) {
      case "easy": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "medium": return "bg-blue-100 text-blue-700 border-blue-200";
      case "hard": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 bg-[#f8fafc] min-h-screen">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Summarize Written Text</h1>
            <p className="text-slate-500 mt-1">Manage reading passages and summary constraints</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <Plus size={20} /> Add New Passage
          </motion.button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by title or passage content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm"
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Passage Details</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Constraints</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Predictive</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <Loader2 className="animate-spin mx-auto text-indigo-500 mb-2" size={32} />
                      <p className="text-slate-400">Loading passages...</p>
                    </td>
                  </tr>
                ) : filteredQuestions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-20 text-center text-slate-400">
                      <AlertCircle className="mx-auto mb-2 opacity-20" size={48} />
                      No summarize questions found.
                    </td>
                  </tr>
                ) : (
                  filteredQuestions.map((q) => (
                    <motion.tr layout key={q._id} className="hover:bg-indigo-50/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                            <BookOpen size={18} />
                          </div>
                          <div className="max-w-xs md:max-w-md">
                            <div className="font-bold text-slate-800 truncate">{q.title}</div>
                            <div className="text-xs text-slate-400 truncate mt-0.5">{q.paragraph}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <WholeWord size={12} /> Max {q.maxWords} words
                          </span>
                          <span className="flex items-center gap-1 text-xs font-medium text-indigo-600">
                            <Clock size={12} /> {q.answerTime / 60} mins
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase ${getDifficultyColor(q.difficulty)}`}>
                          {q.difficulty}
                        </span>

                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase ${q.isPredictive ? "bg-blue-400" : ""}`}>
                          {q.isPredictive}
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

        {/* ADD/EDIT MODAL */}
        <AnimatePresence>
          {openModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setOpenModal(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-xl rounded-2xl shadow-2xl relative overflow-hidden"
              >
                <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                  <h2 className="text-xl font-bold text-slate-800">{editingId ? "Edit Summary Passage" : "New Summary Passage"}</h2>
                  <button onClick={() => setOpenModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                    <input
                      name="title" value={form.title} onChange={handleChange}
                      placeholder="e.g. History of the Internet"
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Reading Passage (Paragraph)</label>
                    <textarea
                      name="paragraph" value={form.paragraph} onChange={handleChange}
                      placeholder="Enter the full text that students need to summarize..."
                      rows={6}
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Model Answer / Summary</label>
                    <textarea
                      name="modelAnswer" value={form.modelAnswer} onChange={handleChange}
                      placeholder="Enter the ideal summary (required)..."
                      rows={3}
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Word Limit</label>
                      <input type="number" name="maxWords" value={form.maxWords} onChange={handleChange} className="w-full border border-slate-200 px-4 py-2.5 rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Timer (Seconds)</label>
                      <input type="number" name="answerTime" value={form.answerTime} onChange={handleChange} className="w-full border border-slate-200 px-4 py-2.5 rounded-xl outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Difficulty</label>
                    <select name="difficulty" value={form.difficulty} onChange={handleChange} className="w-full border border-slate-200 px-4 py-2.5 rounded-xl bg-white">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Predictive
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
                        ${form.isPredictive ? "bg-indigo-600" : "bg-slate-300"}`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300
                          ${form.isPredictive ? "translate-x-6" : "translate-x-0"}`}
                        />
                      </button>

                      <span className="text-sm text-slate-600">
                        {form.isPredictive ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>


                  <button
                    disabled={submitLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {submitLoading ? <Loader2 className="animate-spin" /> : editingId ? "Update Passage" : "Create Passage"}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* VIEW PREVIEW MODAL */}
        <AnimatePresence>
          {viewModal && viewData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setViewModal(false)}
                className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 text-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl relative"
              >
                <button onClick={() => setViewModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors z-10"><X /></button>

                <div className="p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    <span className="text-indigo-400 text-xs font-bold tracking-[0.2em] uppercase">Summarize Written Text</span>
                    <h2 className="text-3xl font-bold tracking-tight">{viewData.title}</h2>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                      <Clock size={16} className="text-indigo-400" />
                      <span className="text-sm font-medium text-slate-300">Time: {viewData.answerTime / 60} mins</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                      <WholeWord size={16} className="text-emerald-400" />
                      <span className="text-sm font-medium text-slate-300">Limit: {viewData.maxWords} words</span>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border ${getDifficultyColor(viewData.difficulty)} bg-transparent`}>
                      <BarChart3 size={16} />
                      <span className="text-sm font-bold uppercase">{viewData.difficulty}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                      <AlignLeft size={16} /> Source Passage
                    </div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 leading-relaxed text-slate-300 text-lg">
                      {viewData.paragraph}
                    </div>
                  </div>

                  {viewData.modelAnswer && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                        <Info size={16} /> Model Answer
                      </div>
                      <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20 leading-relaxed text-emerald-100 text-lg">
                        {viewData.modelAnswer}
                      </div>
                    </div>
                  )}

                  <div className="bg-indigo-500/10 p-5 rounded-2xl border border-indigo-500/20 flex items-start gap-4">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                      <Info size={20} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-indigo-100">Scoring Guidelines</p>
                      <p className="text-xs text-indigo-200/60 leading-normal">
                        Students must summarize this text in a **single sentence** between 5 and 75 words.
                        Scores are calculated based on Content (2), Form (1), Grammar (2), and Vocabulary (2).
                      </p>
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

const ActionButton = ({ onClick, icon, color }) => (
  <button onClick={onClick} className={`p-2 rounded-lg bg-slate-50 hover:bg-white hover:shadow-md transition-all ${color}`}>
    {icon}
  </button>
);

export default ManageSummarizeText;