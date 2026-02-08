import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Edit, Trash2, Search, Eye, Loader2, Sparkles, CheckCircle2, X, PlusCircle,
  FileText, MessageSquare, Tag, LayoutDashboard, Volume2, Image, BookOpen, Mic,
  Headphones // Assuming Image is used for Describe Image tasks
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../../../services/api";
import { useSelector } from "react-redux";
import AdminLayout from "../../../../components/Admin/AdminLayout"; // Adjust path as needed

const ManageDescribeImages = () => {
  const { user } = useSelector((state) => state.auth);
  const [diSections, setDiSections] = useState([]); // Changed state name
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState({}); // Stores available ImageQuestions
  const [unusedLoading, setUnusedLoading] = useState(true);

  // State for form fields including question arrays
  const initialForm = {
    title: "",
    describeImageQuestions: [], // Only one type of question for DI sections
  };
  const [form, setForm] = useState(initialForm);

  // --- API Calls ---
  const fetchDISections = async () => {
    setLoading(true);
    try {
      // Endpoint to get all existing Describe Image sections
      const { data } = await api.get("/question/di"); // Backend route
      setDiSections(data.data || []);
    } catch (err) {
      console.error("Failed to fetch Describe Image sections:", err);
      // TODO: Add user-facing error message
    } finally {
      setLoading(false);
    }
  };

  const fetchUnusedQuestions = async () => {
    setUnusedLoading(true);
    try {
      // Endpoint to get all ImageQuestions not currently used in any DI section
      const { data } = await api.get("/question/di/get/unused");
      setAvailableQuestions(data.data || {});
    } catch (err) {
      console.error("Failed to fetch unused Describe Image questions:", err);
      // TODO: Add user-facing error message
    } finally {
      setUnusedLoading(false);
    }
  };

  useEffect(() => {
    fetchDISections();
  }, []); // Fetch sections on initial component mount

  // Memoized filtered list for search functionality
  const filteredDISections = useMemo(() => {
    return diSections.filter(q => q.title?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [diSections, searchTerm]);

  // Helper to normalize question type names for `availableQuestions` keys
  // e.g., "describeImageQuestions" (form key) -> "describeImage" (availableQuestions key)
  const getAvailableQuestionsKey = (formQuestionType) => {
    return formQuestionType.replace('Questions', '');
  };

  // --- Handlers for Form and Modal Actions ---
  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      // Map questions in form state to just their IDs for the API payload
      const payload = {
        title: form.title,
        describeImageQuestions: form.describeImageQuestions.map(q => q._id || q),
      };

      if (editingId) {
        // Update existing section
        await api.put(`/question/di/${editingId}`, payload);
      } else {
        // Create new section
        await api.post("/question/di", payload); // Assuming this is your create endpoint
      }
      setIsModalOpen(false); // Close the modal
      await fetchDISections(); // Refresh the list of sections
      handleCloseModal(); // Reset form and available questions state for next interaction
    } catch (err) {
      console.error("Error saving Describe Image section:", err);
      // TODO: Implement user-friendly error notification
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddQuestionToForm = (questionType, question) => {
    setForm(prevForm => ({
      ...prevForm,
      [questionType]: [...prevForm[questionType], question] // Add question to the form's array
    }));

    // Remove the added question from the list of available (unused) questions
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
      [questionType]: prevForm[questionType].filter(q => (q._id || q) !== questionId) // Remove from form's array
    }));

    // If the removed question was found, add it back to the available (unused) questions
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
    setIsModalOpen(true); // Open the modal

    setSubmitLoading(true); // Set loading to true while fetching section details
    try {
      // Fetch the full section details with populated questions
      const { data: resData } = await api.get(`/question/di/${section._id}`);
      const detailedSection = resData.data;

      // Populate the form with existing section data
      setForm({
        title: detailedSection.title,
        describeImageQuestions: detailedSection.describeImageQuestions || [],
      });

      // Fetch all unused questions to provide options for adding more
      const unusedRes = await api.get("/question/di/get/unused");
      const fetchedUnusedQuestions = unusedRes.data.data || {};

      // Filter out questions ALREADY IN THE CURRENT SECTION from the fetched unused list
      const filteredAvailableQuestions = {};
      const typeKey = getAvailableQuestionsKey("describeImageQuestions");
      if (fetchedUnusedQuestions[typeKey]) {
        const sectionQuestionIds = new Set(detailedSection[typeKey]?.map(q => q._id.toString()));
        filteredAvailableQuestions[typeKey] = fetchedUnusedQuestions[typeKey].filter(
          q => !sectionQuestionIds.has(q._id.toString())
        );
      }
      setAvailableQuestions(filteredAvailableQuestions);

    } catch (err) {
      console.error("Failed to fetch Describe Image section details for editing:", err);
      // TODO: Show error message
      setIsModalOpen(false); // Close modal if fetching fails
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this Describe Image section? This cannot be undone.")) {
      try {
        await api.delete(`/question/di/${id}`);
        fetchDISections(); // Refresh the list after deletion
      } catch (err) {
        console.error("Error deleting Describe Image section:", err);
        // TODO: Show error message
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(initialForm); // Reset form state
    setAvailableQuestions({}); // Clear available questions to ensure a fresh fetch next time
  };

  // --- Render Helper for Question Selection ---
  const renderQuestionSelection = (questionType, Icon) => {
    const availableKey = getAvailableQuestionsKey(questionType);
    const questionsToDisplay = availableQuestions[availableKey] || [];

    return (
      <div className="space-y-4 border p-4 rounded-xl bg-slate-50">
        <h3 className="flex items-center gap-2 font-bold text-slate-700">
          <Icon size={20} className="text-pink-500" /> {/* Pink color for DI */}
          {questionType.replace(/([A-Z])/g, ' $1').trim().replace('Questions', ' Questions')}
          <span className="text-sm text-slate-500 font-normal">({form[questionType].length} selected)</span>
        </h3>
        <div className="flex flex-wrap gap-2 mb-4 min-h-[40px] border-b pb-2">
          {form[questionType].length === 0 ? (
            <span className="text-sm text-slate-400 italic">No questions selected.</span>
          ) : (
            form[questionType].map((q) => (
              <span key={q._id || q} className="flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded-full"> {/* Pink color */}
                {q.title || q.text || `ID: ${q._id || q}`} {/* Display title, text, or ID */}
                <button type="button" onClick={() => handleRemoveQuestionFromForm(questionType, q._id || q)} className="ml-1 text-pink-500 hover:text-pink-800"><X size={14} /></button> {/* Pink color */}
              </span>
            ))
          )}
        </div>
        {unusedLoading && !editingId ? ( // Show loader for initial fetch of unused questions, but not during edit if already loaded
          <Loader2 className="animate-spin mx-auto text-pink-400" size={24} />
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
                  className="w-full text-left p-2 border rounded-lg hover:bg-pink-50 transition-colors text-sm text-slate-700" // Pink hover color
                >
                  {q.title || q.text || q.question || `Question ID: ${q._id}`}
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
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manage Describe Image Sections</h2>
            <p className="text-slate-500 font-medium">Create and organize PTE Describe Image test sections</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingId(null); // Clear editing state for new creation
              setForm(initialForm); // Reset form
              fetchUnusedQuestions(); // Fetch unused questions for a fresh start
              setIsModalOpen(true); // Open the modal
            }}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-pink-100" // Pink gradient
          >
            <PlusCircle size={22} /> <span>Create New DI Section</span>
          </motion.button>
        </div>

        {/* SEARCH */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500" size={20} /> {/* Pink color */}
          <input
            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by section title..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-4 focus:ring-pink-50 outline-none transition-all" // Pink ring focus
          />
        </div>

        {/* LIST OF DESCRIBE IMAGE SECTIONS */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-pink-500" size={40} /></div> // Pink loader
          ) : filteredDISections.length === 0 ? (
            <div className="py-20 text-center text-slate-500">No Describe Image sections found.</div>
          ) : (
            filteredDISections.map((section) => (
              <motion.div key={section._id} whileHover={{ y: -4 }} className="grid grid-cols-1 md:grid-cols-12 items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-pink-200 transition-all group"> {/* Pink hover border */}
                <div className="col-span-6 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-all"> {/* Pink accent */}
                    <Image size={20} /> {/* Icon for Describe Image module */}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{section.title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Speaking Module - Describe Image</p>
                  </div>
                </div>
                <div className="col-span-3 text-center text-slate-600 text-sm">
                  {/* Display question count */}
                  <p>Questions: {section.describeImageQuestions?.length || 0}</p>
                </div>
                <div className="col-span-3 flex justify-end gap-2">
                  <button onClick={() => { setViewData(section); setIsViewModalOpen(true); }} className="p-2 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg"><Eye size={18} /></button> {/* Pink hover */}
                  <button onClick={() => handleEditClick(section)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button> {/* Blue hover for edit */}
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
                  <h2 className="text-2xl font-black text-slate-800">{editingId ? "Edit Describe Image Section" : "New Describe Image Section"}</h2>
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

                  {submitLoading ? ( // Show loader while saving/fetching for edit
                    <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-pink-500" size={32} /></div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6"> {/* Only one column for DI questions */}
                      {renderQuestionSelection("describeImageQuestions", Image)}
                    </div>
                  )}

                  <button disabled={submitLoading} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold shadow-xl"> {/* Pink button */}
                    {submitLoading ? <Loader2 className="animate-spin mx-auto" /> : "Save Describe Image Section"}
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
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-10 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="bg-pink-100 text-pink-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">Describe Image Section</span> {/* Pink tag */}
                      <h2 className="text-3xl font-black text-slate-900">{viewData.title}</h2>
                    </div>
                    <button onClick={() => setIsViewModalOpen(false)} className="p-3 bg-slate-100 rounded-full"><X /></button>
                  </div>

                  {/* Display details of questions within this section */}
                  {[
                    { type: "describeImageQuestions", label: "Describe Image Questions", icon: Image },
                  ].map(({ type, label, icon: Icon }, index) => (
                    viewData[type] && viewData[type].length > 0 && (
                      <div key={index} className="space-y-4">
                        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800 border-b pb-2">
                          <Icon className="text-pink-500" size={24} /> {label} ({viewData[type].length}) {/* Pink icon */}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {viewData[type].map(q => (
                            <div key={q} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                              <p className="font-semibold text-slate-700">{q.title || q.text || q.question || `Question ID: ${q}`}</p>
                              {q.imageUrl && ( // Assuming your ImageQuestion model has an imageUrl
                                <img src={q.imageUrl} alt={`Image for ${q.title || q._id}`} className="mt-2 rounded-lg object-cover h-32 w-full" />
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

export default ManageDescribeImages;