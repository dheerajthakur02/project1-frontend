import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/Admin/AdminLayout';
import axios from 'axios';
import {
    Save, Map, Mic, PenTool, BookOpen, Headphones,
    CheckCircle2, AlertCircle, Loader2, ArrowRight, ArrowLeft
} from 'lucide-react';

const SECTIONS = {
    SPEAKING: {
        id: 'speaking',
        label: 'Speaking',
        icon: Mic,
        color: 'text-rose-500 bg-rose-50 border-rose-200',
        types: [
            { id: 'readAloud', label: 'Read Aloud', api: '/api/read-aloud', count: 6 },
            { id: 'repeatSentence', label: 'Repeat Sentence', api: '/api/repeat-sentence/all', count: 10 },
            { id: 'describeImage', label: 'Describe Image', api: '/api/image/all', count: 6 },
            { id: 'reTellLecture', label: 'Re-tell Lecture', api: '/api/retell-lecture/all', count: 3 },
            { id: 'answerShortQuestion', label: 'Answer Short Question', api: '/api/short-answer/all', count: 10 }
        ]
    },
    WRITING: {
        id: 'writing',
        label: 'Writing',
        icon: PenTool,
        color: 'text-blue-500 bg-blue-50 border-blue-200',
        types: [
            { id: 'summarizeWrittenText', label: 'Summarize Written Text', api: '/api/summarize-text/all', count: 2 },
            { id: 'writeEssay', label: 'Write Essay', api: '/api/essay/all', count: 1 }
        ]
    },
    READING: {
        id: 'reading',
        label: 'Reading',
        icon: BookOpen,
        color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
        types: [
            { id: 'fillInTheBlanksDropdown', label: 'FIB Dropdown', api: '/api/reading-fib-dropdown', count: 5 }, // Mounted at /api/reading-fib-dropdown
            { id: 'multipleChoiceMultiple', label: 'MCQ Multiple', api: '/api/reading-multi-choice-multi-answer', count: 2 }, // Mounted as such
            { id: 'reOrderParagraphs', label: 'Re-order Paragraphs', api: '/api/reading-reorder', count: 2 },
            { id: 'fillInTheBlanksDragDrop', label: 'FIB Drag & Drop', api: '/api/reading-fib-drag-drop', count: 4 }, // Mounted as such
            { id: 'multipleChoiceSingle', label: 'MCQ Single', api: '/api/reading-multi-choice-single-answer', count: 2 } // Mounted as such
        ]
    },
    LISTENING: {
        id: 'listening',
        label: 'Listening',
        icon: Headphones,
        color: 'text-purple-500 bg-purple-50 border-purple-200',
        types: [
            { id: 'summarizeSpokenText', label: 'Summarize Spoken Text', api: '/api/sst/all', count: 2 },
            { id: 'multipleChoiceMultiple', label: 'MCQ Multiple', api: '/api/listening-multi-choice-multi-answer', count: 2 }, // Mounted as such
            { id: 'fillInTheBlanks', label: 'Fill in Blanks', api: '/api/listening-fib', count: 2 },
            { id: 'highlightCorrectSummary', label: 'Highlight Correct Summary', api: '/api/hcs', count: 2 },
            { id: 'multipleChoiceSingle', label: 'MCQ Single', api: '/api/choose-single-answer', count: 2 }, // Mounted as /api/choose-single-answer ? Check server.js line 124
            { id: 'selectMissingWord', label: 'Select Missing Word', api: '/api/select-missing-word', count: 2 }, // Mounted as such
            { id: 'highlightIncorrectWords', label: 'Highlight Incorrect Words', api: '/api/hiw', count: 2 }, // Mounted as such
            { id: 'writeFromDictation', label: 'Write From Dictation', api: '/api/write-from-dictation', count: 3 } // Mounted as such
        ]
    }
};

const ManageFullMockTest = () => {
    const [title, setTitle] = useState('');
    const [currentStep, setCurrentStep] = useState(0); // 0-3 for sections
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Store questions fetched from API: { readAloud: [], ... }
    const [availableQuestions, setAvailableQuestions] = useState({});

    // Store selected IDs: { speaking: { readAloud: [], ... }, ... }
    const [selectedIds, setSelectedIds] = useState({
        speaking: {}, writing: {}, reading: {}, listening: {}
    });

    const steps = Object.values(SECTIONS);
    const currentSection = steps[currentStep];

    useEffect(() => {
        const fetchSectionQuestions = async () => {
            setLoading(true);
            const promises = currentSection.types.map(async (type) => {
                // If already fetched, skip
                if (availableQuestions[type.id]) return;

                try {
                    // Handle dynamic endpoints or generic "get all" logic
                    // Adjust endpoints as needed based on backend inspection
                    console.log(`Fetching ${type.label} from ${type.api}`);
                    const res = await axios.get(type.api, { withCredentials: true });
                    const data = res.data.data || res.data; // Handle various response structures

                    setAvailableQuestions(prev => ({
                        ...prev,
                        [type.id]: Array.isArray(data) ? data : []
                    }));
                } catch (error) {
                    console.error(`Failed to fetch ${type.label}`, error);
                    setAvailableQuestions(prev => ({ ...prev, [type.id]: [] }));
                }
            });

            await Promise.all(promises);
            setLoading(false);
        };

        fetchSectionQuestions();
    }, [currentStep]);

    const handleSelect = (typeId, questionId) => {
        const sectionId = currentSection.id;
        setSelectedIds(prev => {
            const currentList = prev[sectionId][typeId] || [];
            const isSelected = currentList.includes(questionId);

            let newList;
            if (isSelected) {
                newList = currentList.filter(id => id !== questionId);
            } else {
                newList = [...currentList, questionId];
            }

            return {
                ...prev,
                [sectionId]: {
                    ...prev[sectionId],
                    [typeId]: newList
                }
            };
        });
    };

    const handleSelectAll = (typeId, requiredCount) => {
        // Auto select random questions up to required count
        // Logic to define... or just allow manual select all? 
        // For mock creation, manual is better. Or "Auto Fill".
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            alert("Please enter a test title");
            return;
        }

        if (!window.confirm("Create this Full Mock Test?")) return;

        setSubmitting(true);
        try {
            const payload = {
                title,
                speaking: selectedIds.speaking,
                writing: selectedIds.writing,
                reading: selectedIds.reading,
                listening: selectedIds.listening
            };

            const res = await axios.post('/api/mocktest/full/create', payload, { withCredentials: true });
            if (res.data.success) {
                alert("Full Mock Test Created Successfully!");
                // Reset or Redirect
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            alert("Failed to create test: " + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const getSelectionProgress = () => {
        // Calculate total selected vs required
        return 0; // TODO for progress bar
    };

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-8 pb-20">
                {/* Header */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Create Full Mock Test</h1>
                        <p className="text-slate-500 font-medium mt-1">Curate a complete PTE exam by selecting questions.</p>
                    </div>
                    <div className="w-full md:w-auto">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Test Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Scored Mock Test 05"
                            className="w-full md:w-80 mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Progress Stepper */}
                <div className="grid grid-cols-4 gap-4">
                    {steps.map((step, idx) => {
                        const Icon = step.icon;
                        const isActive = idx === currentStep;
                        const isPast = idx < currentStep;

                        return (
                            <button
                                key={step.id}
                                onClick={() => setCurrentStep(idx)}
                                className={`relative p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${isActive
                                    ? `bg-white border-blue-500 shadow-lg shadow-blue-100 ring-2 ring-blue-500/20`
                                    : isPast
                                        ? 'bg-slate-50 border-slate-200 opacity-60'
                                        : 'bg-white border-slate-100 text-slate-400'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? step.color : 'bg-slate-100 text-slate-400'}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="text-left">
                                    <span className={`block text-xs font-bold uppercase tracking-widest ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>Section {idx + 1}</span>
                                    <span className={`font-bold ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{step.label}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Question Selection Area */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                    <div className={`p-6 border-b border-slate-100 flex justify-between items-center ${currentSection.color.split(' ')[1]}`}>
                        <div className="flex items-center gap-3">
                            <currentSection.icon className={currentSection.color.split(' ')[0]} size={24} />
                            <h2 className="text-xl font-bold text-slate-800">Select {currentSection.label} Questions</h2>
                        </div>
                        <span className="bg-white/50 px-3 py-1 rounded-lg text-xs font-bold text-slate-600 uppercase tracking-widest">
                            {currentSection.types.length} Question Types
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-10">
                        {loading && <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-slate-300" size={48} /></div>}

                        {!loading && currentSection.types.map((type) => {
                            const questions = availableQuestions[type.id] || [];
                            const selections = selectedIds[currentSection.id][type.id] || [];
                            const isMet = selections.length === type.count;

                            return (
                                <div key={type.id} className="space-y-4">
                                    <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                                        <div>
                                            <h3 className="font-bold text-slate-700 text-lg">{type.label}</h3>
                                            <p className="text-xs font-medium text-slate-400">Select {type.count} questions</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isMet ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                            {selections.length} / {type.count} Selected
                                        </div>
                                    </div>

                                    {questions.length === 0 ? (
                                        <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                                            No questions found for this type.
                                            <br /><span className="text-xs">Check endpoints or add questions.</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            {questions.map(q => {
                                                const selected = selections.includes(q._id);
                                                return (
                                                    <div
                                                        key={q._id}
                                                        onClick={() => handleSelect(type.id, q._id)}
                                                        className={`cursor-pointer p-3 rounded-xl border transition-all flex items-start gap-3 group ${selected
                                                            ? 'bg-blue-50 border-blue-500 shadow-sm'
                                                            : 'bg-white border-slate-200 hover:border-blue-300'
                                                            }`}
                                                    >
                                                        <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 group-hover:border-blue-400'}`}>
                                                            {selected && <CheckCircle2 size={12} className="text-white" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-bold truncate ${selected ? 'text-blue-700' : 'text-slate-700'}`}>
                                                                {q.title || q.name || "Untitled"}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 truncate mt-0.5">ID: {q.id || (q._id && q._id.slice(-6))}</p>
                                                            {q.difficulty && <span className="text-[10px] uppercase font-bold text-slate-300">{q.difficulty}</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                        <button
                            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                            disabled={currentStep === 0}
                            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            Back
                        </button>

                        {currentStep < steps.length - 1 ? (
                            <button
                                onClick={() => setCurrentStep(currentStep + 1)}
                                className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center gap-2"
                            >
                                Next Section <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-10 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Create Mock Test</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default ManageFullMockTest;
