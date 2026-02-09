import React, { useEffect, useState, useMemo } from "react";
import api from "../../../services/api";
import {
  Plus, Edit, Trash2, X, Upload,
  Search, Headphones, Clock, CheckCircle2,
  AlertCircle, Loader2, Play, Pause, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "../../../components/Admin/AdminLayout";
import { useSelector } from "react-redux";

/* ---------------- INITIAL FORM ---------------- */
const initialForm = {
  title: "",
  answer: "",
  transcript: "",
  prepareTime: 3,
  answerTime: 10,
  difficulty: "Easy",
  audio: null,
  isPredictive: false,
};

const ManageShortAnswer = () => {
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
      const { data } = await api.get(`/short-answer/get/${user._id}`);
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

  /* ---------------- FILTERING ---------------- */
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
      answer: q.answer,
      transcript: q.transcript,
      prepareTime: q.prepareTime,
      answerTime: q.answerTime,
      difficulty: q.difficulty,
      audio: null,
      isPredictive: q.isPredictive,
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
      if (val !== null) fd.append(key, val);
    });

    try {
      if (editingId) {
        await api.put(`/short-answer/${editingId}`, fd);
      } else {
        await api.post(`/short-answer/add`, fd);
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
    if (!window.confirm("Delete this question?")) return;
    try {
      await api.delete(`/short-answer/${id}`);
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
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Short Answer Questions</h1>
            <p className="text-slate-500 mt-1">Manage audio-based questions and target answers</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            <Plus size={20} /> Add New Question
          </motion.button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search questions or answers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm"
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Question Info</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Expected Answer</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Predictive</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <Loader2 className="animate-spin mx-auto text-blue-500 mb-2" size={32} />
                      <p className="text-slate-400">Loading questions...</p>
                    </td>
                  </tr>
                ) : filteredQuestions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-20 text-center text-slate-400">
                      <AlertCircle className="mx-auto mb-2 opacity-20" size={48} />
                      No questions found.
                    </td>
                  </tr>
                ) : (
                  filteredQuestions.map((q) => (
                    <motion.tr layout key={q._id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                            <Headphones size={18} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{q.title}</div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <span className="flex items-center gap-1"><Clock size={12} /> Prep: {q.prepareTime}s</span>
                              <span className="flex items-center gap-1 font-medium text-blue-600"><Play size={10} /> Ans: {q.answerTime}s</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600 italic text-sm">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          {q.answer}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(q.difficulty)}`}>
                          {q.difficulty}
                        </span>

                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${q.isPredictive ? "bg-blue-400" : ""}`}>
                          {q.isPredictive}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton onClick={() => handleView(q)} icon={<Eye size={18} />} color="text-slate-400 hover:text-blue-600" />
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
                className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden"
              >
                <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                  <h2 className="text-xl font-bold text-slate-800">{editingId ? "Update Question" : "Create New Question"}</h2>
                  <button onClick={() => setOpenModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Question Title</label>
                    <input
                      name="title" value={form.title} onChange={handleChange}
                      placeholder="e.g. Science Question #101"
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Correct Answer</label>
                    <input
                      name="answer" value={form.answer} onChange={handleChange}
                      placeholder="The single word or short phrase answer"
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Transcript</label>
                    <textarea
                      name="transcript" value={form.transcript} onChange={handleChange}
                      placeholder="Enter the audio transcript..."
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none h-24 resize-none"
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



                  <div className="relative group">
                    <input type="file" name="audio" accept="audio/*" onChange={handleChange} id="audio-q" hidden />
                    <label
                      htmlFor="audio-q"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all"
                    >
                      <Upload className="text-blue-500 mb-2" size={24} />
                      <span className="text-sm font-medium text-slate-600">
                        {form.audio ? form.audio.name : "Click to upload question audio"}
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
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {submitLoading ? <Loader2 className="animate-spin" /> : editingId ? "Save Changes" : "Publish Question"}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* VIEW MODAL */}
        <AnimatePresence>
          {viewModal && viewData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setViewModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 text-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative p-8"
              >
                <button onClick={() => setViewModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>

                <div className="text-center space-y-6">
                  <div className="inline-block p-4 bg-blue-500/20 rounded-full text-blue-400 mb-2">
                    <Headphones size={32} />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">{viewData.title}</h2>

                  <div className="flex justify-center gap-3">
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">{viewData.difficulty}</span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">Prep: {viewData.prepareTime}s</span>
                  </div>

                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Correct Answer</p>
                    <p className="text-xl font-semibold text-white uppercase tracking-wider">{viewData.answer}</p>
                  </div>

                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-left">
                    <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Transcript</p>
                    <p className="text-sm text-slate-300 leading-relaxed italic">"{viewData.transcript}"</p>
                  </div>

                  {viewData.audioUrl && (
                    <div className="space-y-3 pt-4">
                      <p className="text-xs text-slate-400">Question Audio Preview</p>
                      <audio controls className="w-full accent-blue-500 h-10">
                        <source src={viewData.audioUrl} />
                      </audio>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div >
    </AdminLayout >
  );
};

const ActionButton = ({ onClick, icon, color }) => (
  <button onClick={onClick} className={`p-2 rounded-lg bg-slate-50 hover:bg-white hover:shadow-md transition-all ${color}`}>
    {icon}
  </button>
);

export default ManageShortAnswer;