import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, Edit, Trash2, Search, Eye, Headphones, X, PlusCircle, 
  CheckCircle2, Loader2, Music, AlertCircle, PlayCircle, 
  Layers, FileText, ListChecks
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useSelector } from "react-redux";
import AdminLayout from "../../../../components/Admin/AdminLayout";

const ManageListeningMCMA = () => {
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
    question: "",
    options: ["", "", "", ""], 
    correctOptions: [], 
    difficulty: "Medium", 
    transcript: "",
    audio: null 
  };
  const [form, setForm] = useState(initialForm);

  /* ------------------- API HANDLERS ------------------- */
  
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/listening-multi-choice-multi-answer/questions/${user._id}`);
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
    
    if (form.correctOptions.length === 0) {
      alert("Please select at least one correct option.");
      return;
    }

    setSubmitLoading(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("question", form.question);
    fd.append("transcript", form.transcript);
    fd.append("difficulty", form.difficulty);
    // Stringify arrays for the controller
    fd.append("options", JSON.stringify(form.options.filter(opt => opt.trim() !== "")));
    fd.append("correctOptions", JSON.stringify(form.correctOptions));
    
    if (form.audio) fd.append("audio", form.audio);

    try {
      if (editingId) {
        await axios.put(`/api/listening-multi-choice-multi-answer/${editingId}`, fd);
      } else {
        await axios.post("/api/listening-multi-choice-multi-answer/add", fd);
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
      await axios.delete(`/api/listening-multi-choice-multi-answer/${id}`);
      setQuestions(questions.filter(q => q._id !== id));
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const handleEditClick = (q) => {
    setEditingId(q._id);
    setForm({
      title: q.title || "",
      question: q.question || "",
      options: q.options || ["", "", "", ""],
      correctOptions: q.correctOptions || [],
      difficulty: q.difficulty || "Medium",
      transcript: q.transcript || "",
      audio: null 
    });
    setIsModalOpen(true);
  };

  /* ------------------- UI HELPERS ------------------- */

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => 
      q.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [questions, searchTerm]);

  const toggleOption = (optValue) => {
    const current = [...form.correctOptions];
    const index = current.indexOf(optValue);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(optValue);
    }
    setForm({ ...form, correctOptions: current });
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Listening: <span className="text-indigo-600">Multiple Answers</span>
            </h2>
            <p className="text-slate-500 font-medium">Manage MCMA tasks (Score: +1 Correct, -1 Incorrect)</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setEditingId(null); setForm(initialForm); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100"
          >
            <PlusCircle size={22} />
            <span>New Question</span>
          </motion.button>
        </div>

        {/* TOOLBAR */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions by title..."
            className="w-full pl-16 pr-4 py-5 rounded-3xl border border-slate-200 bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm font-medium"
          />
        </div>

        {/* LIST TABLE */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
              <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
              <p className="text-slate-400 font-medium">Retrieving MCMA questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border">
               <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
               <p className="text-slate-500 font-bold">No questions found.</p>
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
                    <ListChecks size={24}/>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{q.title}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">MCMA Question • {q.correctOptions?.length} Correct</p>
                  </div>
                </div>
                <div className="col-span-3 text-center">
                  <span className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    q.difficulty === 'Hard' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>
                <div className="col-span-3 flex justify-end gap-2">
                  <button onClick={() => { setViewData(q); setIsViewModalOpen(true); }} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Eye size={20}/></button>
                  <button onClick={() => handleEditClick(q)} className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit size={20}/></button>
                  <button onClick={() => handleDelete(q._id)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={20}/></button>
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
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl"><Layers size={24}/></div>
                    <h2 className="text-2xl font-black text-slate-800">{editingId ? "Edit MCMA" : "New MCMA Question"}</h2>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"><X/></button>
                </div>
                
                <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Left Column: Form Details */}
                    <div className="space-y-6">
                      <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Title</label>
                        <input placeholder="Set title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white transition-all font-medium" required />
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">The Question</label>
                        <textarea placeholder="e.g. Which of the following are mentioned..." rows={2} value={form.question} onChange={e => setForm({...form, question: e.target.value})} className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white transition-all resize-none font-medium" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Difficulty</label>
                           <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})} className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700">
                             <option>Easy</option><option>Medium</option><option>Hard</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Audio</label>
                           <input type="file" onChange={e => setForm({...form, audio: e.target.files[0]})} accept="audio/*" className="w-full mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-[10px] font-bold" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Transcript (Optional)</label>
                        <textarea placeholder="Audio transcript..." rows={3} value={form.transcript} onChange={e => setForm({...form, transcript: e.target.value})} className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white transition-all resize-none text-xs" />
                      </div>
                    </div>

                    {/* Right Column: Dynamic Options */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Manage Options (Select Multiple)</label>
                        <button type="button" onClick={() => setForm({...form, options: [...form.options, ""]})} className="text-xs font-bold text-indigo-600 hover:underline">+ Add Option</button>
                      </div>
                      <div className="space-y-3">
                        {form.options.map((opt, i) => (
                          <div key={i} className={`flex items-center gap-3 p-4 border rounded-2xl transition-all ${form.correctOptions.includes(opt) && opt !== "" ? 'border-emerald-400 bg-emerald-50/50 shadow-inner' : 'border-slate-100 bg-white'}`}>
                            <input 
                              type="checkbox" 
                              checked={form.correctOptions.includes(opt) && opt !== ""} 
                              onChange={() => toggleCorrectOption(opt)} 
                              disabled={opt.trim() === ""}
                              className="w-5 h-5 accent-emerald-600" 
                            />
                            <input 
                              value={opt} 
                              onChange={e => {
                                const no = [...form.options];
                                no[i] = e.target.value;
                                setForm({...form, options: no});
                              }} 
                              className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-700" 
                              placeholder={`Option ${i+1}`} 
                              required 
                            />
                            {form.options.length > 2 && (
                                <button type="button" onClick={() => setForm({...form, options: form.options.filter((_, idx) => idx !== i)})} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    disabled={submitLoading} 
                    className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {submitLoading ? <Loader2 className="animate-spin" /> : editingId ? "Update Question" : "Create Question"}
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
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
                <button onClick={() => setIsViewModalOpen(false)} className="absolute top-8 right-8 p-3 bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all z-10"><X/></button>
                
                <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-4 py-1 rounded-full uppercase">Multiple Answers Mode</span>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">{viewData.title}</h2>
                  </div>

                  <div className="bg-slate-900 rounded-[2.5rem] p-8 border-4 border-slate-800">
                    <audio controls className="w-full accent-indigo-500">
                      <source src={viewData.audioUrl} />
                    </audio>
                  </div>

                  <div className="space-y-6">
                    <p className="font-bold text-slate-800 text-lg">Q: {viewData.question}</p>
                    <div className="grid gap-3">
                      {viewData.options?.map((opt, i) => (
                        <div 
                          key={i} 
                          className={`p-5 rounded-3xl border flex items-center justify-between ${
                            viewData.correctOptions.includes(opt) 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 ring-2 ring-emerald-500/20' 
                            : 'bg-slate-50 border-slate-100 text-slate-500 opacity-60'
                          }`}
                        >
                          <span className="font-bold text-sm">{opt}</span>
                          {viewData.correctOptions.includes(opt) && <CheckCircle2 size={18} className="text-emerald-600"/>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {viewData.transcript && (
                    <div className="space-y-3">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={16}/> Audio Transcript
                        </span>
                        <div className="p-6 bg-slate-50 rounded-2xl border text-sm text-slate-600 italic leading-relaxed">
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

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </AdminLayout>
  );
};

export default ManageListeningMCMA;