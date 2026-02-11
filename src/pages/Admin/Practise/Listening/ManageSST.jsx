import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Edit, Trash2, Search, Eye, Clock, Headphones,
  Filter, Loader2, Sparkles, CheckCircle2, X, PlusCircle,
  AudioLines, FileText, MessageSquare, Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../../services/api";
import { useSelector } from "react-redux";
import AdminLayout from "../../../../components/Admin/AdminLayout";

const ManageSST = () => {
  const { user } = useSelector((state) => state.auth);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const initialForm = { title: "", difficulty: "Medium", keywords: "", answer: "", transcript: "", audio: null, isPredictive: false };
  const [form, setForm] = useState(initialForm);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/sst/questions/${user._id}`);
      setQuestions(data.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchQuestions(); }, []);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => q.title?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [questions, searchTerm]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (key === "keywords") {
        const kwArr = val.split(",").map(k => k.trim());
        fd.append(key, JSON.stringify(kwArr));
      } else if (key === "isPredictive") {
        fd.append(key, val);
      } else if (val) fd.append(key, val);
    });

    try {
      if (editingId) {
        await api.put(`/sst/questions/${editingId}`, fd);
      } else {
        await api.post("/sst/add", fd);
      } setIsModalOpen(false);
      fetchQuestions();
    } catch (err) { console.error(err); } finally { setSubmitLoading(false); }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Summarize Spoken Text</h2>
            <p className="text-slate-500 font-medium">Manage listening-to-writing summary tasks</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setEditingId(null); setForm(initialForm); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100"
          >
            <PlusCircle size={22} /> <span>Add New SST</span>
          </motion.button>
        </div>

        {/* SEARCH */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={20} />
          <input
            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
          />
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={40} /></div>
          ) : (
            filteredQuestions.map((q) => (
              <motion.div key={q._id} whileHover={{ y: -4 }} className="grid grid-cols-1 md:grid-cols-12 items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
                <div className="col-span-6 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Headphones size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{q.title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">SST Module</p>
                    {q.isPredictive && (
                      <span className="inline-block mt-1 text-[8px] font-bold text-white bg-purple-500 px-1.5 py-0.5 rounded uppercase">Prediction</span>
                    )}
                  </div>
                </div>
                <div className="col-span-3 text-center">
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${q.difficulty === 'Hard' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{q.difficulty}</span>
                </div>
                <div className="col-span-3 flex justify-end gap-2">
                  <button onClick={() => { setViewData(q); setIsViewModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye size={18} /></button>
                  <button onClick={() => { setEditingId(q._id); setForm({ ...q, keywords: q.keywords?.join(", "), audio: null, transcript: q.transcript || "", isPredictive: q.isPredictive || false }); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Edit size={18} /></button>
                  <button onClick={async () => { if (window.confirm("Delete?")) await api.delete(`/sst/${q._id}`); fetchQuestions(); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* ADD/EDIT MODAL */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-2xl font-black text-slate-800">{editingId ? "Edit SST" : "New SST Question"}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl shadow-sm"><X size={20} /></button>
                </div>
                <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <input placeholder="Question Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:bg-white" required />
                      <textarea placeholder="Reference Answer / Summary" rows={4} value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:bg-white resize-none" required />
                      <textarea placeholder="Transcript (Required)" rows={4} value={form.transcript} onChange={e => setForm({ ...form, transcript: e.target.value })} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:bg-white resize-none" required />
                      <input placeholder="Keywords (comma separated)" value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:bg-white" />
                    </div>
                    <div className="space-y-4">
                      <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none">
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-600 mt-2">
                        <input type="checkbox" checked={form.isPredictive} onChange={(e) => setForm({ ...form, isPredictive: e.target.checked })} className="w-4 h-4 accent-indigo-600" />
                        Predictive Question
                      </label>
                      <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-10 hover:bg-indigo-50 cursor-pointer transition-all">
                        <AudioLines className="text-indigo-400 mb-2" size={32} />
                        <span className="text-xs font-bold text-slate-500">{form.audio ? form.audio.name : "Upload SST Audio"}</span>
                        <input type="file" hidden onChange={e => setForm({ ...form, audio: e.target.files[0] })} accept="audio/*" />
                      </label>
                    </div>
                  </div>
                  <button disabled={submitLoading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl">
                    {submitLoading ? <Loader2 className="animate-spin mx-auto" /> : "Save SST Question"}
                  </button>
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
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-10 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">SST Preview</span>
                      <h2 className="text-3xl font-black text-slate-900">{viewData.title}</h2>
                    </div>
                    <button onClick={() => setIsViewModalOpen(false)} className="p-3 bg-slate-100 rounded-full"><X /></button>
                  </div>
                  <div className="bg-slate-900 rounded-3xl p-6">
                    <audio controls className="w-full"><source src={viewData.audioUrl} /></audio>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest"><FileText size={16} /> Transcript</div>
                    <div className="p-6 bg-slate-50 rounded-2xl text-slate-600 italic text-sm border">{viewData.transcript}</div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest"><MessageSquare size={16} /> Model Answer</div>
                    <div className="p-6 bg-emerald-50 rounded-2xl text-emerald-900 text-sm border border-emerald-100">{viewData.answer}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {viewData.keywords?.map((k, i) => <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg border">#{k}</span>)}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout >
  );
};

export default ManageSST;