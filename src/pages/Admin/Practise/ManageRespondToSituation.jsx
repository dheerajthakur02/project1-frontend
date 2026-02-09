import React, { useEffect, useState, useMemo } from "react";
import api from "../../../services/api";
import {
  Plus, Edit, Trash2, X, Upload,
  Search, Mic2, Clock, Tag,
  AlertCircle, Loader2, Play, Eye, AudioLines,
  FileText, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../../../components/Admin/AdminLayout";
import { useSelector } from "react-redux";

/* ---------------- INITIAL FORM ---------------- */
const initialForm = {
  title: "",
  prepareTime: 10,
  answerTime: 40,
  difficulty: "Medium",
  audio: null,
  answer: "",
  keywords: "",
  transcript: "",
  isPredictive: false,
};

const ManageRespondSituation = () => {
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
      const { data } = await api.get(`/respond-situation/get/${user._id}`);
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
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [questions, searchTerm]);

  /* ---------------- HANDLERS ---------------- */
  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : type === "checkbox" ? checked : value,
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
      prepareTime: q.prepareTime,
      answerTime: q.answerTime,
      difficulty: q.difficulty,
      audio: null,
      answer: q.answer || "",
      keywords: q.keywords?.join(", ") || "",
      transcript: q.transcript || "",
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

    const fd = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (key === "keywords") {
        // Convert comma string to array for backend
        const kwArray = val.split(",").map(k => k.trim()).filter(k => k !== "");
        fd.append(key, JSON.stringify(kwArray));
      } else if (val !== null) {
        fd.append(key, val);
      }
    });

    try {
      if (editingId) {
        await api.put(`/respond-situation/${editingId}`, fd);
      } else {
        await api.post("/respond-situation/add", fd);
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
    if (!window.confirm("Are you sure you want to delete this RTS question?")) return;
    try {
      await api.delete(`/respond-situation/${id}`);
      setQuestions(questions.filter(q => q._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case "Easy": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Medium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "Hard": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 bg-[#f8fafc] min-h-screen">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Respond to Situation</h1>
            <p className="text-slate-500 mt-1">Configure audio situations and reference responses</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all"
          >
            <Plus size={20} /> Add Situation
          </motion.button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search situations or answers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-rose-50 outline-none transition-all shadow-sm"
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Situation Title</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Timing</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Predictive</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <Loader2 className="animate-spin mx-auto text-rose-500 mb-2" size={32} />
                      <p className="text-slate-400">Loading situations...</p>
                    </td>
                  </tr>
                ) : filteredQuestions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-20 text-center text-slate-400">
                      <AlertCircle className="mx-auto mb-2 opacity-20" size={48} />
                      No situations found.
                    </td>
                  </tr>
                ) : (
                  filteredQuestions.map((q) => (
                    <motion.tr layout key={q._id} className="hover:bg-rose-50/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                            <Mic2 size={18} />
                          </div>
                          <span className="font-bold text-slate-800">{q.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="flex items-center gap-1 text-xs text-slate-500"><Clock size={12} /> Prep: {q.prepareTime}s</span>
                          <span className="flex items-center gap-1 text-xs font-medium text-rose-600"><Play size={10} /> Ans: {q.answerTime}s</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(q.difficulty)}`}>
                          {q.difficulty}
                        </span>
                        {q.isPredictive && (
                          <span className="block mt-1 text-[10px] font-bold text-white bg-purple-500 px-2 py-0.5 rounded uppercase">Prediction</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${q.isPredictive ? "bg-blue-400" : ""}`}>
                          {q.isPredictive}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton onClick={() => handleView(q)} icon={<Eye size={18} />} color="text-slate-400 hover:text-rose-600" />
                          <ActionButton onClick={() => openEditModal(q)} icon={<Edit size={18} />} color="text-slate-400 hover:text-emerald-600" />
                          <ActionButton onClick={() => handleDelete(q._id)} icon={<Trash2 size={18} />} color="text-slate-400 hover:text-red-600" />
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
                  <h2 className="text-xl font-bold text-slate-800">{editingId ? "Edit Situation" : "Add Situation"}</h2>
                  <button onClick={() => setOpenModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Situation Title</label>
                    <input
                      name="title" value={form.title} onChange={handleChange}
                      placeholder="e.g. Late for a Meeting"
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-rose-50 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Prep Time (s)</label>
                      <input type="number" name="prepareTime" value={form.prepareTime} onChange={handleChange} className="w-full border px-4 py-2.5 rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Ans Time (s)</label>
                      <input type="number" name="answerTime" value={form.answerTime} onChange={handleChange} className="w-full border px-4 py-2.5 rounded-xl outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Difficulty</label>
                    <select name="difficulty" value={form.difficulty} onChange={handleChange} className="w-full border border-slate-200 px-4 py-2.5 rounded-xl bg-white">
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>



                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Transcript (Situation Text)</label>
                    <textarea
                      name="transcript" value={form.transcript} onChange={handleChange}
                      placeholder="What is being said in the audio?"
                      rows={2}
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-rose-50 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Expected Answer</label>
                    <textarea
                      name="answer" value={form.answer} onChange={handleChange}
                      placeholder="The correct way to respond..."
                      rows={3}
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-rose-50 outline-none resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                      <Tag size={14} /> Keywords (Comma separated)
                    </label>
                    <input
                      name="keywords" value={form.keywords} onChange={handleChange}
                      placeholder="apologize, traffic, reschedule"
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl outline-none"
                    />
                  </div>

                  <div className="relative group">
                    <input type="file" name="audio" accept="audio/*" onChange={handleChange} id="audio-rts" hidden />
                    <label
                      htmlFor="audio-rts"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-rose-400 hover:bg-rose-50 cursor-pointer transition-all"
                    >
                      <Upload className="text-rose-500 mb-2" size={24} />
                      <span className="text-sm font-medium text-slate-600">
                        {form.audio ? form.audio.name : "Upload Situation Audio"}
                      </span>
                    </label>
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
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-100 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {submitLoading ? <Loader2 className="animate-spin" /> : editingId ? "Update Situation" : "Create Situation"}
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
                className="bg-slate-900 text-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative"
              >
                <button onClick={() => setViewModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors z-10"><X /></button>

                <div className="p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                  <div className="space-y-2">
                    <span className="text-rose-400 text-xs font-bold tracking-[0.2em] uppercase">RTS Preview</span>
                    <h2 className="text-3xl font-bold tracking-tight">{viewData.title}</h2>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                      <Clock size={16} className="text-rose-400" />
                      <span className="text-sm font-medium text-slate-300">Prep {viewData.prepareTime}s / Ans {viewData.answerTime}s</span>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border ${getDifficultyColor(viewData.difficulty)} bg-transparent`}>
                      <span className="text-sm font-bold uppercase">{viewData.difficulty}</span>
                    </div>
                  </div>

                  {/* AUDIO SECTION */}
                  <div className="bg-rose-500/10 p-6 rounded-2xl border border-rose-500/20 space-y-4">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-widest">
                      <AudioLines size={16} /> Audio Situation
                    </div>
                    {viewData.audioUrl ? (
                      <audio controls className="w-full accent-rose-500">
                        <source src={viewData.audioUrl} />
                      </audio>
                    ) : (
                      <p className="text-slate-500 text-sm italic">No audio file available</p>
                    )}
                  </div>

                  {/* TRANSCRIPT */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                      <FileText size={16} /> Situation Transcript
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 italic text-slate-400 text-sm leading-relaxed">
                      "{viewData.transcript || "No transcript provided"}"
                    </div>
                  </div>

                  {/* KEYWORDS */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                      <Tag size={16} /> Scoring Keywords
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {viewData.keywords?.map((kw, i) => (
                        <span key={i} className="px-3 py-1 bg-white/10 rounded-lg text-xs text-rose-300 border border-white/5">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* ANSWER */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                      <MessageSquare size={16} /> Reference Answer
                    </div>
                    <div className="bg-white/10 p-6 rounded-2xl border border-white/20 leading-relaxed text-slate-200 text-sm">
                      {viewData.answer}
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

export default ManageRespondSituation;