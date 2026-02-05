import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Edit, Trash2, Search, Eye, Headphones, X, PlusCircle,
  CheckCircle2, Loader2, Music, AlertCircle, PlayCircle,
  Type, MousePointer2, Highlighter, FileText, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useSelector } from "react-redux";
import AdminLayout from "../../../../components/Admin/AdminLayout";

const ManageHIW = () => {
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
    content: "", // The full paragraph
    mistakes: [], // Array of { index, word }
    difficulty: "Medium",
    audio: null,
    difficulty: "Medium",
    audio: null,
    transcript: "",
    isPrediction: false
  };
  const [form, setForm] = useState(initialForm);

  /* ------------------- API HANDLERS ------------------- */

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/hiw/${user._id}`);
      setQuestions(res.data.data || []);
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
    if (form.mistakes.length === 0) {
      alert("Please select at least one word as a mistake.");
      return;
    }

    setSubmitLoading(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("content", form.content);
    fd.append("difficulty", form.difficulty);
    fd.append("transcript", form.transcript);
    fd.append("mistakes", JSON.stringify(form.mistakes));
    fd.append("isPrediction", form.isPrediction);
    if (form.audio) fd.append("audio", form.audio);

    try {
      if (editingId) {
        await axios.put(`/api/hiw/${editingId}`, fd);
      } else {
        await axios.post("/api/hiw/add", fd);
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
    if (!window.confirm("Permanent delete this question?")) return;
    try {
      await axios.delete(`/api/hiw/${id}`);
      setQuestions(questions.filter(q => q._id !== id));
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  /* ------------------- WORD SELECTION LOGIC ------------------- */

  // Splits content into words and toggles them as mistakes
  const toggleWordAsMistake = (word, index) => {
    const currentMistakes = [...form.mistakes];
    const existingIndex = currentMistakes.findIndex(m => m.index === index);

    if (existingIndex > -1) {
      currentMistakes.splice(existingIndex, 1);
    } else {
      currentMistakes.push({ index, word: word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") });
    }
    setForm({ ...form, mistakes: currentMistakes });
  };

  const isMistake = (index) => form.mistakes.some(m => m.index === index);

  /* ------------------- UI HELPERS ------------------- */

  const filteredQuestions = useMemo(() => {
    return questions.filter(q =>
      q.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [questions, searchTerm]);

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Highlight <span className="text-indigo-600">Incorrect Words</span>
            </h2>
            <p className="text-slate-500 font-medium">Manage listening tasks where students find transcript errors</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setEditingId(null); setForm(initialForm); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100"
          >
            <PlusCircle size={22} />
            <span>Add New HIW</span>
          </motion.button>
        </div>

        {/* SEARCH */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title..."
            className="w-full pl-16 pr-4 py-5 rounded-3xl border border-slate-200 bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm font-medium"
          />
        </div>

        {/* LIST TABLE */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed">
              <Loader2 className="animate-spin text-indigo-500 mx-auto" size={40} />
              <p className="text-slate-400 mt-4 font-medium tracking-wide">Loading HIW Questions...</p>
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
                whileHover={{ y: -4 }}
                className="grid grid-cols-12 items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group"
              >
                <div className="col-span-6 flex items-center gap-5">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Highlighter size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      {q.title}
                      {q.isPrediction && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Sparkles size={10} /> Prediction
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      {q.mistakes?.length || 0} Mistakes Marked • {q.attemptCount || 0} Attempts
                    </p>
                  </div>
                </div>
                <div className="col-span-3 text-center">
                  <span className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${q.difficulty === 'Hard' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                    {q.difficulty}
                  </span>
                </div>
                <div className="col-span-3 flex justify-end gap-2">
                  <button onClick={() => { setViewData(q); setIsViewModalOpen(true); }} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Eye size={20} /></button>
                  <button onClick={() => {
                    setEditingId(q._id);
                    setForm({ ...q, audio: null, mistakes: q.mistakes || [], transcript: q.transcript || "", isPrediction: q.isPrediction || false });
                    setIsModalOpen(true);
                  }} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit size={20} /></button>
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
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100"><Type size={24} /></div>
                    <h2 className="text-2xl font-black text-slate-800">{editingId ? "Update HIW" : "New HIW Question"}</h2>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"><X /></button>
                </div>

                <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left: Metadata */}
                    <div className="lg:col-span-4 space-y-6">
                      <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Title</label>
                        <input placeholder="e.g. Science Lecture 1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white transition-all font-medium" required />
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Difficulty</label>
                        <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700">
                          <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <input
                          type="checkbox"
                          checked={form.isPrediction}
                          onChange={(e) => setForm({ ...form, isPrediction: e.target.checked })}
                          className="w-5 h-5 accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-indigo-500" />
                          <span className="text-sm font-bold text-slate-700">Mark as Prediction Question</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Audio Upload</label>
                        <div className="mt-2 relative">
                          <input type="file" onChange={e => setForm({ ...form, audio: e.target.files[0] })} accept="audio/*" className="hidden" id="audio-hiw" />
                          <label htmlFor="audio-hiw" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-8 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer transition-all">
                            <Music className="text-indigo-400 mb-2" size={32} />
                            <span className="text-xs font-bold text-slate-500">{form.audio ? form.audio.name : "Choose Audio File"}</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Audio Transcript (Required)</label>
                        <textarea
                          value={form.transcript}
                          onChange={e => setForm({ ...form, transcript: e.target.value })}
                          className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white transition-all font-medium h-32 resize-none"
                          placeholder="Paste the full audio transcript here..."
                          required
                        />
                      </div>
                    </div>

                    {/* Right: Text Editor & Word Picker */}
                    <div className="lg:col-span-8 space-y-6">
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                        <label className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                          <MousePointer2 size={14} /> Step 1: Paste Paragraph
                        </label>
                        <textarea
                          placeholder="Paste your paragraph here..."
                          value={form.content}
                          onChange={e => setForm({ ...form, content: e.target.value, mistakes: [] })}
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all resize-none min-h-[120px]"
                          required
                        />
                      </div>

                      {form.content && (
                        <div className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-indigo-100">
                          <label className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                            <Highlighter size={14} /> Step 2: Click words that should be "Incorrect"
                          </label>
                          <div className="flex flex-wrap gap-x-2 gap-y-3 p-4 bg-slate-50/50 rounded-2xl leading-relaxed">
                            {form.content.split(/\s+/).map((word, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => toggleWordAsMistake(word, idx + 1)}
                                className={`px-2 py-1 rounded-lg text-sm transition-all duration-200 font-medium ${isMistake(idx + 1)
                                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-110'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-400'
                                  }`}
                              >
                                {word}
                              </button>
                            ))}
                          </div>
                          <p className="mt-4 text-[10px] text-slate-400 font-bold italic">
                            * {form.mistakes.length} words selected as mistakes. These words should be replaced with different words in your audio recording.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button disabled={submitLoading} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                    {submitLoading ? <Loader2 className="animate-spin" /> : editingId ? "Save HIW Changes" : "Publish HIW Question"}
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
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
                <button onClick={() => setIsViewModalOpen(false)} className="absolute top-8 right-8 p-3 bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 z-10"><X /></button>

                <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-tighter">HIW Preview</span>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">{viewData.title}</h2>
                  </div>

                  <div className="bg-slate-900 rounded-[2.5rem] p-8 border-4 border-slate-800">
                    <audio controls className="w-full accent-indigo-500">
                      <source src={viewData.audioUrl} />
                    </audio>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                      <FileText size={16} /> Audio Transcript
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 leading-loose text-slate-700 text-lg">
                      {viewData.transcript || "No transcript available"}
                    </div>
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mt-6">
                      <FileText size={16} /> Transcript with Mistakes Highlighted
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 leading-loose text-slate-700 text-lg">
                      {viewData.content.split(/\s+/).map((word, idx) => {
                        const isWordMistake = viewData.mistakes.some(m => m.index === idx + 1);
                        return (
                          <span key={idx} className={`mr-2 ${isWordMistake ? 'bg-rose-100 text-rose-700 font-bold px-1 rounded border-b-2 border-rose-400' : ''}`}>
                            {word}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-start gap-4">
                    <div className="p-2 bg-amber-200 text-amber-700 rounded-lg"><AlertCircle size={20} /></div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-amber-900 uppercase tracking-tight">Scoring Info</p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Students will listen to the audio and click on the words that differ from the text above.
                        <strong> +1 for correct click, -1 for incorrect click.</strong>
                      </p>
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

export default ManageHIW;