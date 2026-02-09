import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Edit, Trash2, Search, Eye, Headphones, X, PlusCircle,
  CheckCircle2, Loader2, Music, AlertCircle, PlayCircle,
  FileText, AudioLines, Type, ListOrdered, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../../services/api";
import { useSelector } from "react-redux";
import AdminLayout from "../../../../components/Admin/AdminLayout";

const ManageListeningFIB = () => {
  const { user } = useSelector((state) => state.auth);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewData, setViewData] = useState(null);

  const initialForm = {
    title: "",
    transcript: "",
    difficulty: "Medium",
    correctAnswers: [{ index: 1, correctAnswer: "" }],
    audio: null
  };
  const [form, setForm] = useState(initialForm);

  /* ------------------- API HANDLERS ------------------- */

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/listening-fib/questions/${user._id}`);
      setQuestions(data.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchQuestions(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("transcript", form.transcript);
    fd.append("difficulty", form.difficulty);
    fd.append("correctAnswers", JSON.stringify(form.correctAnswers.filter(a => a.correctAnswer !== "")));
    fd.append("isPredictive", form.isPredictive);
    if (form.audio) fd.append("audio", form.audio);

    try {
      if (editingId) await api.put(`/listening-fib/${editingId}`, fd);
      else await api.post("/listening-fib/add", fd);
      setIsModalOpen(false);
      fetchQuestions();
    } catch (err) { console.error(err); } finally { setSubmitLoading(false); }
  };

  const handleEditClick = (q) => {
    setEditingId(q._id);
    setForm({
      title: q.title || "",
      transcript: q.transcript || "",
      isPredictive: q.isPredictive || false,
      difficulty: q.difficulty || "Medium",
      correctAnswers: q.correctAnswers || [{ index: 1, correctAnswer: "" }],
      audio: null
    });
    setIsModalOpen(true);
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => q.title?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [questions, searchTerm]);

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Listening <span className="text-indigo-600">Fill In The Blanks</span>
            </h2>
            <p className="text-slate-500 font-medium">Manage transcript-based audio gap tasks</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setEditingId(null); setForm(initialForm); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100"
          >
            <PlusCircle size={22} /> <span>New Question</span>
          </motion.button>
        </div>

        {/* SEARCH */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input
            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title..."
            className="w-full pl-16 pr-4 py-5 rounded-3xl border border-slate-200 bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm font-medium"
          />
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed"><Loader2 className="animate-spin text-indigo-500 mx-auto" size={40} /></div>
          ) : filteredQuestions.map(q => (
            <motion.div key={q._id} whileHover={{ y: -4 }} className="grid grid-cols-12 items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
              <div className="col-span-7 flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all"><Type size={24} /></div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{q.title}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{q.correctAnswers?.length} Missing Words</p>
                </div>
              </div>
              <div className="col-span-2 text-center">
                <span className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase ${q.difficulty === 'Hard' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{q.difficulty}</span>
              </div>
              <div className="col-span-3 flex justify-end gap-2">
                <button onClick={() => { setViewData(q); setIsViewModalOpen(true); }} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Eye size={20} /></button>
                <button onClick={() => handleEditClick(q)} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit size={20} /></button>
                <button onClick={async () => { if (window.confirm("Delete?")) { await api.delete(`/listening-fib/${q._id}`); fetchQuestions(); } }} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={20} /></button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* --- ADD/EDIT MODAL --- */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><AudioLines size={24} /></div>
                    <h2 className="text-2xl font-black text-slate-800">{editingId ? "Update FIB" : "New FIB Question"}</h2>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"><X /></button>
                </div>

                <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Title</label>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full mt-2 p-4 bg-slate-50 border rounded-2xl outline-none focus:bg-white" required />
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Transcript</label>
                        <textarea rows={4} value={form.transcript} onChange={e => setForm({ ...form, transcript: e.target.value })} className="w-full mt-2 p-4 bg-slate-50 border rounded-2xl outline-none focus:bg-white resize-none text-sm" placeholder="Paste full transcript here..." required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-slate-700">
                          <option>Easy</option><option>Medium</option><option>Hard</option>
                        </select>
                        {/* The following div was moved out of the select tag for syntactic correctness */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-2xl border border-slate-200">
                          <input
                            type="checkbox"
                            checked={form.isPredictive}
                            onChange={(e) => setForm({ ...form, isPredictive: e.target.checked })}
                            className="w-5 h-5 accent-indigo-600 cursor-pointer"
                          />  <div className="flex items-center gap-1 text-xs font-bold text-slate-600"><Sparkles size={14} className="text-amber-500" /> Prediction</div>
                        </div>
                        <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-4 hover:bg-indigo-50 cursor-pointer">
                          <Music size={20} className="text-indigo-400 mb-1" />
                          <span className="text-[10px] font-bold text-slate-500 text-center">{form.audio ? form.audio.name : "Upload Audio"}</span>
                          <input type="file" hidden onChange={e => setForm({ ...form, audio: e.target.files[0] })} accept="audio/*" />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-2 px-1">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Missing Words (Answers)</label>
                        <button type="button" onClick={() => setForm({ ...form, correctAnswers: [...form.correctAnswers, { index: form.correctAnswers.length + 1, correctAnswer: "" }] })} className="text-xs font-bold text-indigo-600">+ Add Blank</button>
                      </div>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {form.correctAnswers.map((ans, i) => (
                          <div key={i} className="flex items-center gap-3 p-4 border rounded-2xl bg-white shadow-sm">
                            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">{ans.index}</span>
                            <input
                              value={ans.correctAnswer}
                              onChange={e => {
                                const nca = [...form.correctAnswers];
                                nca[i].correctAnswer = e.target.value;
                                setForm({ ...form, correctAnswers: nca });
                              }}
                              className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-700"
                              placeholder="Correct word..." required
                            />
                            <button type="button" onClick={() => setForm({ ...form, correctAnswers: form.correctAnswers.filter((_, idx) => idx !== i) })} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button disabled={submitLoading} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                    {submitLoading ? <Loader2 className="animate-spin" /> : editingId ? "Update FIB Question" : "Create FIB Question"}
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
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-tighter">FIB Overview</span>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">{viewData.title}</h2>
                  </div>

                  <div className="bg-slate-900 rounded-[2.5rem] p-8 border-4 border-slate-800 shadow-2xl">
                    <audio controls className="w-full accent-indigo-500"><source src={viewData.audioUrl} /></audio>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest"><FileText size={16} /> Full Transcript Reference</div>
                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 leading-relaxed text-slate-600 text-sm shadow-inner italic">"{viewData.transcript}"</div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest"><ListOrdered size={16} /> Sequence of Correct Answers</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {viewData.correctAnswers?.sort((a, b) => a.index - b.index).map((ans, i) => (
                        <div key={i} className="p-5 rounded-3xl border bg-emerald-50 border-emerald-100 flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-emerald-200">{ans.index}</span>
                          <span className="font-black text-emerald-900 text-sm">{ans.correctAnswer}</span>
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

export default ManageListeningFIB;