import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Edit, Trash2, Search, Eye, Headphones, X, PlusCircle,
  CheckCircle2, Loader2, Music, AlertCircle, PlayCircle,
  Keyboard, FileText, AudioLines, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../../services/api";
import { useSelector } from "react-redux";
import AdminLayout from "../../../../components/Admin/AdminLayout";

const ManageWriteFromDictation = () => {
  const { user } = useSelector((state) => state.auth);

  // Data States
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewData, setViewData] = useState(null);

  // Form State
  const initialForm = {
    title: "",
    transcript: "", // The correct sentence
    difficulty: "Medium",
    audio: null,
    isPredictive: false
  };
  const [form, setForm] = useState(initialForm);

  /* ------------------- API HANDLERS ------------------- */

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Endpoint based on your controller
      const { data } = await api.get(`/write-from-dictation/questions/${user._id}`);
      setQuestions(data.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("difficulty", form.difficulty);
    fd.append("transcript", form.transcript);
    fd.append("isPredictive", form.isPredictive);
    if (form.audio) fd.append("audio", form.audio);

    try {
      if (editingId) {
        await api.put(`/write-from-dictation/${editingId}`, fd);
      } else {
        await api.post("/write-from-dictation/create", fd);
      }
      setIsModalOpen(false);
      fetchQuestions();
    } catch (err) {
      console.error("Save Error:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this dictation question?")) return;
    try {
      await api.delete(`/write-from-dictation/${id}`);
      setQuestions(questions.filter(q => q._id !== id));
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const handleEditClick = (q) => {
    setEditingId(q._id);
    setForm({
      title: q.title || "",
      transcript: q.transcript || "",
      difficulty: q.difficulty || "Medium",
      isPredictive: q.isPredictive || false,
      audio: null
    });
    setIsModalOpen(true);
  };

  /* ------------------- UI HELPERS ------------------- */

  const filteredQuestions = useMemo(() => {
    return questions.filter(q =>
      q.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.transcript?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [questions, searchTerm]);

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Write From <span className="text-indigo-600">Dictation</span>
            </h2>
            <p className="text-slate-500 font-medium">Manage sentence-based listening and typing tasks</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setEditingId(null); setForm(initialForm); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100"
          >
            <PlusCircle size={22} />
            <span>Add New WFD</span>
          </motion.button>
        </div>

        {/* TOOLBAR */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title or sentence content..."
            className="w-full pl-16 pr-4 py-5 rounded-3xl border border-slate-200 bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm font-medium"
          />
        </div>

        {/* LIST TABLE */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed">
              <Loader2 className="animate-spin text-indigo-500 mx-auto" size={40} />
              <p className="text-slate-400 mt-4 font-medium tracking-wide">Loading WFD Questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border">
              <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-500 font-bold tracking-tight">No questions found.</p>
            </div>
          ) : (
            filteredQuestions.map(q => (
              <motion.div
                key={q._id}
                whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.05)" }}
                className="grid grid-cols-12 items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group"
              >
                <div className="col-span-7 flex items-center gap-5">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Keyboard size={24} />
                  </div>
                  <div className="max-w-[80%]">
                    <h3 className="font-bold text-slate-800 text-lg truncate">{q.title || "Untitled Sentence"}</h3>
                    <p className="text-slate-400 text-sm line-clamp-1 italic">"{q.transcript}"</p>
                    {q.isPredictive && (
                      <span className="inline-block mt-1 text-[8px] font-bold text-white bg-purple-500 px-1.5 py-0.5 rounded uppercase">Prediction</span>
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-center">
                  <span className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${q.difficulty === 'Hard' ? 'bg-rose-50 text-rose-600' :
                    q.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                    {q.difficulty}
                  </span>
                </div>
                <div className="col-span-3 flex justify-end gap-2">
                  <button onClick={() => { setViewData(q); setIsViewModalOpen(true); }} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Eye size={20} /></button>
                  <button onClick={() => handleEditClick(q)} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit size={20} /></button>
                  <button onClick={() => handleDelete(q._id)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={20} /></button>
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
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100"><AudioLines size={24} /></div>
                    <h2 className="text-2xl font-black text-slate-800">{editingId ? "Update WFD" : "New WFD Question"}</h2>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"><X /></button>
                </div>

                <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Question Title</label>
                        <input placeholder="e.g. Academic Lecture Sentence 4" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white transition-all font-medium" required />
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Difficulty</label>
                        <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700">
                          <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                        </select>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-600 mt-2">
                          <input type="checkbox" checked={form.isPredictive} onChange={(e) => setForm({ ...form, isPredictive: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                          Predictive Question
                        </label>
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Audio File</label>
                        <div className="mt-2 relative">
                          <input type="file" onChange={e => setForm({ ...form, audio: e.target.files[0] })} accept="audio/*" className="hidden" id="audio-wfd" />
                          <label htmlFor="audio-wfd" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-8 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer transition-all">
                            <Music className="text-indigo-400 mb-2" size={32} />
                            <span className="text-sm font-bold text-slate-600">{form.audio ? form.audio.name : "Choose Dictation Audio"}</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                          <FileText size={14} /> Correct Transcript
                        </label>
                        <textarea
                          placeholder="Type the exact sentence here..."
                          value={form.transcript}
                          onChange={e => setForm({ ...form, transcript: e.target.value })}
                          rows={6}
                          className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium resize-none leading-relaxed"
                          required
                        />
                        <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                          <p className="text-[10px] text-amber-700 leading-normal font-bold">
                            Note: WFD scoring is based on exact word matches. Ensure there are no extra spaces or typos in the transcript above.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button disabled={submitLoading} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                    {submitLoading ? <Loader2 className="animate-spin" /> : editingId ? "Update Dictation" : "Publish Dictation Question"}
                  </button>
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
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <button onClick={() => setIsViewModalOpen(false)} className="absolute top-8 right-8 p-3 bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all z-10"><X /></button>

                <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-tighter">WFD Preview</span>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">{viewData.title}</h2>
                  </div>

                  {/* Audio Player */}
                  <div className="bg-slate-900 rounded-[2.5rem] p-8 border-4 border-slate-800 shadow-2xl">
                    <div className="flex items-center gap-4 mb-4">
                      <PlayCircle className="text-indigo-400" size={24} />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dictation Audio</span>
                    </div>
                    <audio controls className="w-full accent-indigo-500">
                      <source src={viewData.audioUrl} />
                    </audio>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                      <CheckCircle2 size={16} /> Correct Sentence (Transcript)
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 leading-relaxed text-slate-800 text-xl font-bold italic shadow-inner">
                      "{viewData.transcript}"
                    </div>
                  </div>

                  {/* Visual Analysis Simulation (Matches your attempt logic) */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                      <Sparkles size={14} /> Word Count: {viewData.transcript.split(/\s+/).length} Words
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {viewData.transcript.split(/\s+/).map((word, idx) => (
                        <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </AdminLayout>
  );
};

export default ManageWriteFromDictation;