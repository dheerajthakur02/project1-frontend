import React, { useEffect, useState, useMemo } from "react";
import api from "../../../services/api";
import {
  Plus, Edit, Trash2, X, Eye, Upload,
  Search, Headphones, Clock, BarChart,
  FileAudio, AlertCircle, Loader2
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
  isPredictive: false
};


const ManageRetellLecture = () => {
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

  /* ---------------- FETCH ---------------- */
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/retell-lecture/get/${user._id}`);
      setQuestions(data.data || []);
    } catch (err) {
      console.error(err);
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
      q.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [questions, searchTerm]);

  /* ---------------- FORM HANDLERS ---------------- */
  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : type === 'checkbox' ? checked : value,
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
      isPredictive: q.isPredictive || false,
    });
    setEditingId(q._id);
    setOpenModal(true);
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
        await api.put(`/retell-lecture/${editingId}`, fd);
      } else {
        await api.post("/retell-lecture/add", fd);
      }
      setOpenModal(false);
      fetchQuestions();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lecture?")) return;
    try {
      await api.delete(`/retell-lecture/${id}`);
      setQuestions(questions.filter(q => q._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleView = async (id) => {
    try {
      const res = await api.get(`/retell-lecture/${id}`);
      setViewData(res.data.data);
      setViewModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------- UI HELPERS ---------------- */
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

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Retell Lecture</h1>
            <p className="text-slate-500 mt-1">Manage and organize your PTE listening practice content</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            <Plus size={20} /> Add New Lecture
          </motion.button>
        </div>

        {/* SEARCH & STATS BAR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-3 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by title..."
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
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Lecture Details</th>
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
                      <Loader2 className="animate-spin mx-auto text-indigo-500 mb-2" size={32} />
                      <p className="text-slate-400">Loading your lectures...</p>
                    </td>
                  </tr>
                ) : filteredQuestions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="text-slate-300" size={32} />
                      </div>
                      <p className="text-slate-500 font-medium">No lectures found.</p>
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
                          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Headphones size={20} />
                          </div>
                          <span className="font-semibold text-slate-700">{q.title}</span>
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
                          <ActionButton onClick={() => handleView(q._id)} icon={<Eye size={18} />} color="text-slate-400 hover:text-indigo-600" />
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
                className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h2 className="text-xl font-bold text-slate-800">{editingId ? "Edit Lecture" : "Add New Lecture"}</h2>
                  <button onClick={() => setOpenModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Lecture Title</label>
                    <input
                      name="title" value={form.title} onChange={handleChange}
                      placeholder="e.g. Environmental Impact of Plastics"
                      className="w-full border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-indigo-50 outline-none"
                      required
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
                    <input type="file" name="audio" onChange={handleChange} id="audio-upload" hidden />
                    <label
                      htmlFor="audio-upload"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all"
                    >
                      <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 mb-2">
                        <Upload size={24} />
                      </div>
                      <span className="text-sm font-medium text-slate-600">
                        {form.audio ? form.audio.name : "Click to upload audio lecture"}
                      </span>
                      <span className="text-xs text-slate-400 mt-1">MP3, WAV up to 10MB</span>
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
                    type="submit"
                    disabled={submitLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                  >
                    {submitLoading ? <Loader2 className="animate-spin" /> : editingId ? "Save Changes" : "Create Lecture"}
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
                    <span className="text-indigo-400 text-sm font-bold tracking-widest uppercase">Preview Lecture</span>
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
                  </div>

                  {viewData.audioUrl && (
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-xs text-slate-400 mb-3 flex items-center gap-2"><FileAudio size={14} /> Audio Source</p>
                      <audio controls className="w-full accent-indigo-500">
                        <source src={viewData.audioUrl} />
                      </audio>
                    </div>
                  )}

                  {viewData.transcript && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-300">Transcript</h4>
                      <div className="bg-white/5 p-6 rounded-2xl max-h-48 overflow-y-auto text-slate-400 leading-relaxed text-sm scrollbar-hide border border-white/10">
                        {viewData.transcript}
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

export default ManageRetellLecture;