import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Edit, Trash2, Search, Eye, Headphones, X, PlusCircle,
  CheckCircle2, Loader2, Music, AlertCircle, PlayCircle,
  FileText, AudioLines, FileSearch, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../../services/api";
import { useSelector } from "react-redux";
import AdminLayout from "../../../../components/Admin/AdminLayout";

const ManageHighlightSummary = () => {
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

  // Form State - Controller expects exactly 3 summaries
  const initialForm = {
    title: "",
    transcript: "",
    summaries: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false }
    ],
    difficulty: "Medium",
    audio: null,
    isPredictive: false
  };
  const [form, setForm] = useState(initialForm);

  /* ------------------- API HANDLERS ------------------- */

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/hcs/attempts/${user._id}`);
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

    // Check if exactly one is correct
    const correctCount = form.summaries.filter(s => s.isCorrect).length;
    if (correctCount !== 1) {
      alert("Please mark exactly one summary as correct.");
      return;
    }

    setSubmitLoading(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("transcript", form.transcript);
    fd.append("difficulty", form.difficulty);
    fd.append("summaries", JSON.stringify(form.summaries));
    fd.append("isPredictive", form.isPredictive);
    if (form.audio) fd.append("audio", form.audio);

    try {
      if (editingId) {
        await api.put(`/hcs/questions/${editingId}`, fd);
      } else {
        await api.post("/hcs/add", fd);
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
      await api.delete(`/hcs/${id}`);
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
      summaries: q.summaries.map(s => ({ text: s.text, isCorrect: s.isCorrect })),
      difficulty: q.difficulty || "Medium",
      audio: null,
      isPredictive: q.isPredictive || false
    });
    setIsModalOpen(true);
  };

  /* ------------------- UI HELPERS ------------------- */

  const filteredQuestions = useMemo(() => {
    return questions.filter(q =>
      q.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [questions, searchTerm]);

  const setCorrectSummary = (idx) => {
    const updated = form.summaries.map((s, i) => ({ ...s, isCorrect: i === idx }));
    setForm({ ...form, summaries: updated });
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Highlight <span className="text-indigo-600">Correct Summary</span>
            </h2>
            <p className="text-slate-500 font-medium">Manage HCS listening-to-reading tasks</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setEditingId(null); setForm(initialForm); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100"
          >
            <PlusCircle size={22} />
            <span>Add New Question</span>
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
              <p className="text-slate-400 mt-4 font-medium tracking-wide">Retrieving HCS bank...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border">
              <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-500 font-bold tracking-tight">No HCS questions found.</p>
            </div>
          ) : (
            filteredQuestions.map(q => (
              <motion.div
                key={q._id}
                whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.05)" }}
                className="grid grid-cols-12 items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group"
              >
                <div className="col-span-6 flex items-center gap-5">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <FileSearch size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      {q.title || "Untitled Summary"}
                      {q.isPredictive && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Sparkles size={10} /> Prediction
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">HCS Module • 4 Summaries</p>
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
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl"><AudioLines size={24} /></div>
                    <h2 className="text-2xl font-black text-slate-800">{editingId ? "Update HCS" : "New HCS Question"}</h2>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"><X /></button>
                </div>

                <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Question Title</label>
                        <input placeholder="e.g. Economics Lecture Summary" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white transition-all font-medium" required />
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
                          checked={form.isPredictive}
                          onChange={(e) => setForm({ ...form, isPredictive: e.target.checked })}
                          className="w-5 h-5 accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-indigo-500" />
                          <span className="text-sm font-bold text-slate-700">Mark as Prediction Question</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Audio Source</label>
                        <div className="mt-2 relative">
                          <input type="file" onChange={e => setForm({ ...form, audio: e.target.files[0] })} accept="audio/*" className="hidden" id="audio-hcs" />
                          <label htmlFor="audio-hcs" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-8 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer transition-all">
                            <Music className="text-indigo-400 mb-2" size={32} />
                            <span className="text-sm font-bold text-slate-600">{form.audio ? form.audio.name : "Select Audio File"}</span>
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

                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Summaries (Select one correct)</label>
                      {form.summaries.map((sum, i) => (
                        <div key={i} className={`p-4 border rounded-2xl transition-all ${sum.isCorrect ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-100 bg-white'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Option {i + 1}</span>
                            <input type="radio" name="hcs-correct" checked={sum.isCorrect} onChange={() => setCorrectSummary(i)} className="w-4 h-4 accent-indigo-600" />
                          </div>
                          <textarea
                            value={sum.text}
                            onChange={e => {
                              const ns = [...form.summaries];
                              ns[i].text = e.target.value;
                              setForm({ ...form, summaries: ns });
                            }}
                            rows={3}
                            className="w-full bg-transparent outline-none text-xs leading-relaxed font-medium placeholder:text-slate-300 resize-none"
                            placeholder="Type summary content..."
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button disabled={submitLoading} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">
                    {submitLoading ? <Loader2 className="animate-spin mx-auto" /> : editingId ? "Save Changes" : "Create HCS Question"}
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
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-tighter">HCS Overview</span>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">{viewData.title}</h2>
                  </div>

                  <div className="bg-slate-900 rounded-[2.5rem] p-8 border-4 border-slate-800">
                    <audio controls className="w-full accent-indigo-500">
                      <source src={viewData.audioUrl} />
                    </audio>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest"><FileText size={16} /> Audio Transcript</div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 italic text-slate-500 text-sm leading-relaxed">
                      "{viewData.transcript || "Transcript not generated yet"}"
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest"><CheckCircle2 size={16} /> Summary Options</div>
                    <div className="grid gap-4">
                      {viewData.summaries?.map((sum, i) => (
                        <div key={i} className={`p-6 rounded-3xl border transition-all ${sum.isCorrect ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/10' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${sum.isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</span>
                            {sum.isCorrect && <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Correct Answer</span>}
                          </div>
                          <p className={`text-sm leading-relaxed ${sum.isCorrect ? 'text-emerald-900 font-medium' : 'text-slate-500'}`}>{sum.text}</p>
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

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </AdminLayout>
  );
};

export default ManageHighlightSummary;