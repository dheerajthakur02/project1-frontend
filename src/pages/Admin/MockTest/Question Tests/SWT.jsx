import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Edit, Trash2, Search, Eye, Loader2, PlusCircle, X,
  FileText // Icon for Summarize Written Text
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useSelector } from "react-redux";
import AdminLayout from "../../../../components/Admin/AdminLayout"; // Adjust path as needed

const ManageSWTs = () => {
  const { user } = useSelector((state) => state.auth);
  const [swtSections, setSwtSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState({}); // Stores available SWT Questions
  const [unusedLoading, setUnusedLoading] = useState(true);

  // State for form fields
  const initialForm = {
    title: "",
    SummarizeTextQuestions: [], // Matches backend schema field for SWT
  };
  const [form, setForm] = useState(initialForm);

  // --- API Calls ---
  const fetchSWTSections = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/question/swt"); // Backend controller route
      setSwtSections(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch Summarize Written Text sections:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnusedQuestions = async () => {
    setUnusedLoading(true);
    try {
      // Use the new single endpoint for all unused questions
      const res = await axios.get("/api/question/swt/get/unused");
      setAvailableQuestions(res.data.data || {});
    } catch (err) {
      console.error("Failed to fetch unused Summarize Written Text questions:", err);
    } finally {
      setUnusedLoading(false);
    }
  };

  useEffect(() => {
    fetchSWTSections();
  }, []);

  const filteredSWTSections = useMemo(() => {
    return swtSections.filter(q => q.title?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [swtSections, searchTerm]);

  const getAvailableQuestionsKey = (formQuestionType) => {
    // Maps 'SummarizeTextQuestions' from form to 'summarizeText' key from getUnusedQuestionsForAllTypes
    if (formQuestionType === "SummarizeTextQuestions") {
      return "summarizeText";
    }
    // Add other mappings if this component were to handle multiple types
    return formQuestionType.replace('Questions', '');
  };

  // --- Handlers for Form and Modal Actions ---
  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = {
        title: form.title,
        SummarizeTextQuestions: form.SummarizeTextQuestions.map(q => q._id || q), // Matches backend field
      };

      if (editingId) {
        await axios.put(`/api/question/swt/${editingId}`, payload); // Backend update route
      } else {
        await axios.post("/api/question/swt", payload); // Backend create route
      }
      setIsModalOpen(false);
      await fetchSWTSections();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving Summarize Written Text section:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddQuestionToForm = (questionType, question) => {
    // Check max questions before adding
    if (form[questionType].length >= 2) { // Enforce max 2 questions for SWT
      alert("Summarize Written Text sections cannot have more than 2 questions.");
      return;
    }
    setForm(prevForm => ({
      ...prevForm,
      [questionType]: [...prevForm[questionType], question]
    }));
    const key = getAvailableQuestionsKey(questionType);
    setAvailableQuestions(prevAvailable => ({
      ...prevAvailable,
      [key]: prevAvailable[key].filter(q => q._id !== question._id)
    }));
  };

  const handleRemoveQuestionFromForm = (questionType, questionId) => {
    const removedQuestion = form[questionType].find(q => (q._id || q) === questionId);
    setForm(prevForm => ({
      ...prevForm,
      [questionType]: prevForm[questionType].filter(q => (q._id || q) !== questionId)
    }));
    if (removedQuestion) {
      const key = getAvailableQuestionsKey(questionType);
      setAvailableQuestions(prevAvailable => ({
        ...prevAvailable,
        [key]: [...(prevAvailable[key] || []), removedQuestion]
      }));
    }
  };

  const handleEditClick = async (section) => {
    setEditingId(section._id);
    setIsModalOpen(true);
    setSubmitLoading(true);
    try {
      const res = await axios.get(`/api/question/swt/${section._id}`); // Backend get by ID route
      const detailedSection = res.data.data;
      setForm({
        title: detailedSection.title,
        SummarizeTextQuestions: detailedSection.SummarizeTextQuestions || [], // Matches backend populated field
      });

      const unusedRes = await axios.get("/api/question/swt/get/unused"); // New single endpoint
      const fetchedUnusedQuestions = unusedRes.data.data || {};

      const filteredAvailableQuestions = {};
      const formQuestionType = "SummarizeTextQuestions"; // Explicitly define for clarity
      const availableKey = getAvailableQuestionsKey(formQuestionType);

      if (fetchedUnusedQuestions[availableKey]) {
          const sectionQuestionIds = new Set(detailedSection[formQuestionType]?.map(q => q._id.toString()));
          filteredAvailableQuestions[availableKey] = fetchedUnusedQuestions[availableKey].filter(
              q => !sectionQuestionIds.has(q._id.toString())
          );
      }
      setAvailableQuestions(filteredAvailableQuestions);
    } catch (err) {
      console.error("Failed to fetch Summarize Written Text section details for editing:", err);
      setIsModalOpen(false);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this Summarize Written Text section? This cannot be undone.")) {
      try {
        await axios.delete(`/api/question/swt/${id}`); // Backend delete route
        fetchSWTSections();
      } catch (err) {
        console.error("Error deleting Summarize Written Text section:", err);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setAvailableQuestions({});
  };

  // --- Render Helper for Question Selection ---
  const renderQuestionSelection = (questionType, Icon) => {
    const availableKey = getAvailableQuestionsKey(questionType);
    const questionsToDisplay = availableQuestions[availableKey] || [];

    return (
      <div className="space-y-4 border p-4 rounded-xl bg-slate-50">
        <h3 className="flex items-center gap-2 font-bold text-slate-700">
          <Icon size={20} className="text-orange-500" /> {/* Orange color for SWT */}
          {questionType.replace('SummarizeTextQuestions', 'Summarize Written Text Questions').replace(/([A-Z])/g, ' $1').trim()}
          <span className="text-sm text-slate-500 font-normal">({form[questionType].length} selected)</span>
        </h3>
        <div className="flex flex-wrap gap-2 mb-4 min-h-[40px] border-b pb-2">
          {form[questionType].length === 0 ? (
             <span className="text-sm text-slate-400 italic">No questions selected.</span>
          ) : (
            form[questionType].map((q) => (
              <span key={q._id || q} className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full"> {/* Orange color */}
                {q.text || `ID: ${q._id || q}`} {/* SWT questions typically have 'text' */}
                <button type="button" onClick={() => handleRemoveQuestionFromForm(questionType, q._id || q)} className="ml-1 text-orange-500 hover:text-orange-800"><X size={14} /></button> {/* Orange color */}
              </span>
            ))
          )}
        </div>
        {unusedLoading && !editingId ? (
          <Loader2 className="animate-spin mx-auto text-orange-400" size={24} />
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-white">
            {questionsToDisplay.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-2">No more available questions of this type.</p>
            ) : (
              questionsToDisplay.map((q) => (
                <button
                  type="button"
                  key={q._id}
                  onClick={() => handleAddQuestionToForm(questionType, q)}
                  className="w-full text-left p-2 border rounded-lg hover:bg-orange-50 transition-colors text-sm text-slate-700" // Orange hover color
                >
                  {q.title || `Question ID: ${q._id}`}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  };


  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manage Summarize Written Text Sections</h2>
            <p className="text-slate-500 font-medium">Create and organize PTE Summarize Written Text sections</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingId(null);
              setForm(initialForm);
              fetchUnusedQuestions(); // Fetch questions when creating a new section
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-100" // Orange gradient
          >
            <PlusCircle size={22} /> <span>Create New SWT Section</span>
          </motion.button>
        </div>

        {/* SEARCH */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500" size={20} /> {/* Orange color */}
          <input
            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by section title..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-4 focus:ring-orange-50 outline-none transition-all" // Orange ring focus
          />
        </div>

        {/* LIST OF SWT SECTIONS */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" size={40} /></div>
          ) : filteredSWTSections.length === 0 ? (
            <div className="py-20 text-center text-slate-500">No Summarize Written Text sections found.</div>
          ) : (
            filteredSWTSections.map((section) => (
              <motion.div key={section._id} whileHover={{ y: -4 }} className="grid grid-cols-1 md:grid-cols-12 items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-orange-200 transition-all group"> {/* Orange hover border */}
                <div className="col-span-6 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all"> {/* Orange accent */}
                    <FileText size={20} /> {/* Icon for Summarize Written Text */}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{section.title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Writing Module - Summarize Written Text</p>
                  </div>
                </div>
                <div className="col-span-3 text-center text-slate-600 text-sm">
                  <p>Questions: {section.SummarizeTextQuestions?.length || 0}</p>
                </div>
                <div className="col-span-3 flex justify-end gap-2">
                  <button onClick={() => { setViewData(section); setIsViewModalOpen(true); }} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"><Eye size={18} /></button>
                  <button onClick={() => handleEditClick(section)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(section._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={18} /></button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* ADD/EDIT MODAL */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-2xl font-black text-slate-800">{editingId ? "Edit Summarize Written Text Section" : "New Summarize Written Text Section"}</h2>
                  <button onClick={handleCloseModal} className="p-2 hover:bg-white rounded-xl shadow-sm"><X size={20} /></button>
                </div>
                <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-6">
                  <input
                    placeholder="Section Title"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:bg-white"
                    required
                  />

                  {submitLoading ? (
                     <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" size={32}/></div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                      {renderQuestionSelection("SummarizeTextQuestions", FileText)}
                    </div>
                  )}

                  <button disabled={submitLoading || form.SummarizeTextQuestions.length > 2} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-xl"> {/* Orange button */}
                    {submitLoading ? <Loader2 className="animate-spin mx-auto" /> : "Save SWT Section"}
                  </button>
                  {form.SummarizeTextQuestions.length > 2 && (
                    <p className="text-red-500 text-sm mt-2">Maximum 2 questions allowed for Summarize Written Text sections.</p>
                  )}
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
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-10 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">SWT Section</span> {/* Orange tag */}
                      <h2 className="text-3xl font-black text-slate-900">{viewData.title}</h2>
                    </div>
                    <button onClick={() => setIsViewModalOpen(false)} className="p-3 bg-slate-100 rounded-full"><X /></button>
                  </div>

                  {/* Display details of questions within this section */}
                  {[
                    { type: "SummarizeTextQuestions", label: "Summarize Written Text Questions", icon: FileText },
                  ].map(({ type, label, icon: Icon }, index) => (
                    viewData[type] && viewData[type].length > 0 && (
                      <div key={index} className="space-y-4">
                        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800 border-b pb-2">
                          <Icon className="text-orange-500" size={24} /> {label} ({viewData[type].length}) {/* Orange icon */}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4"> {/* Single column for SWT text content */}
                          {viewData[type].map(q => (
                            <div key={q._id || q} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                              <p className="font-semibold text-slate-700">{q.text || `Question ID: ${q._id || q}`}</p>
                              {q.sampleAnswer && ( // If you have a sample answer field
                                <div className="mt-2 text-sm text-slate-600 border-t pt-2">
                                    <p className="font-medium">Sample Answer:</p>
                                    <p className="text-slate-500">{q.sampleAnswer}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default ManageSWTs;