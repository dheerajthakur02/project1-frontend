import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layout
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';

// Speaking Components
import RepeatSentenceSession from './RepeatSentenceSession';
import DescribeImageModule from './DescribeImageModule';
import ShortAnswer from './ShortAnswer';
import SummarizeGroup from './SummarizeGroup';
import ReTell from './Retell';
import Respond from './RespondSituation';
import ReadingFIBDropdown from './ReadingFIBDropdown';
import ReadingMultiChoiceMultiAnswer from './ReadingMultiChoiceMultiAnswer';
import ReadingMultiChoiceSingleAnswer from './ReadingMultiChoiceSingleAnswer';
import ReadingFIBDragDrop from './ReadingFIBDragDrop';
import ReadingReorder from './ReadingReorder';
import QuestionFilter from '../../components/Practice/QuestionFilter';



// Writing Components (Create these if not already existing)
// For now, I am assuming standard naming based on your imports.
import SummarizeWrittenText from '../writing/SummarizeText';
import WriteEssay from '../writing/WriteEssay';
import SST from '../listening/SST';
import HCS from '../listening/HCS';
import ChooseSingleAnswer from '../listening/ChooseSingleAnswer';
import SelectMissingWord from '../listening/SelectMissingWord';
import HighlightIncorrectWords from '../listening/HighLightIncorrectWords';
import ListeningFIB from '../listening/ListeningFIB';
import ListeningMultiChoiceMultiAnswer from '../listening/ListeningMultiChoiceMultiAnswer';
import WriteFromDictation from '../listening/WriteFromDictation';
import { getWriteFromDictationQuestions } from '../../services/api';


function Practice() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);

    // --- STATE ---
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'Speaking');

    const [activeSubTab, setActiveSubTab] = useState('Read Aloud');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Module Data States
    const [readAloudQuestions, setReadAloudQuestions] = useState([]);
    const [repeatSentenceQuestions, setRepeatSentenceQuestions] = useState([]);
    const [imageQuestions, setImageQuestions] = useState([]);
    const [shortAnswerQuestion, setShortAnswerQuestion] = useState([]);
    const [summarizeGroupQuestion, setSummarizeGroupQuestion] = useState([]);
    const [retellQuestions, setRetellQuestions] = useState([]);
    const [respondSituationQuestions, setRespondSituationQuestions] = useState([]);
    const [readingFIBDropdownQuestions, setReadingFIBDropdownQuestions] = useState([]);
    const [readingMultiChoiceMultiAnswerQuestions, setReadingMultiChoiceMultiAnswerQuestions] = useState([]);
    const [readingMultiChoiceSingleAnswerQuestions, setReadingMultiChoiceSingleAnswerQuestions] = useState([]);
    const [readingFIBDragDropQuestions, setReadingFIBDragDropQuestions] = useState([]);
    const [readingReorderQuestions, setReadingReorderQuestions] = useState([]);




    const [summarizeTextQuestions, setSummarizeTextQuestions] = useState([]);
    const [essayQuestions, setEssayQuestions] = useState([]);


    const [sstQuestions, setSSTQuestions] = useState([]);
    const [hcsQuestions, setHCSQuestions] = useState([]);
    const [listeningMCQSingleQuestions, setListeningMCQSingleQuestions] = useState([]);
    const [selectMissingWordQuestions, setSelectMissingWordQuestions] = useState([]);
    const [highlightIncorrectWordsQuestions, setHighlightIncorrectWordsQuestions] = useState([]);
    const [listeningFIBQuestions, setListeningFIBQuestions] = useState([]);
    const [listeningMCQMultipleQuestions, setListeningMCQMultipleQuestions] = useState([]);
    const [writeFromDictationQuestions, setWriteFromDictationQuestions] = useState([]);
    // Session State
    const [activeSpeechQuestion, setActiveSpeechQuestion] = useState(false);
    const [speechQuestion, setSpeechQuestion] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        prediction: false,
        difficulty: 'All',
        status: 'All'
    });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleResetFilters = () => {
        setFilters({
            prediction: false,
            difficulty: 'All',
            status: 'All'
        });
    };

    // --- FETCH FUNCTIONS ---
    const fetchReadAloud = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/read-aloud');
            const data = await response.json();
            if (data.success) setReadAloudQuestions(data.data);
        } catch (err) { setError('Failed to fetch Read Aloud'); }
        finally { setLoading(false); }
    };

    const fetchRepeatSentences = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/repeat-sentence/get/${user._id}`);
            const data = await response.json();
            setRepeatSentenceQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchImageSentences = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/image/questions/${user._id}`);
            const data = await response.json();
            setImageQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchShortAnswerQuestion = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/short-answer/get/${user._id}`);
            const data = await response.json();
            setShortAnswerQuestion(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchSummarizeGroupQuestion = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/summarize-group/get/${user._id}`);
            const data = await response.json();
            setSummarizeGroupQuestion(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchRespondSituationQuestion = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/respond-situation/get/${user._id}`);
            const data = await response.json();
            setRespondSituationQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };


    const fetchReTellQuestion = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/retell-lecture/get/${user._id}`);
            const data = await response.json();
            setRetellQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchReadingMultiChoiceMultiAnswer = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/reading-multi-choice-multi-answer/get/${user._id}`);
            const data = await response.json();
            setReadingMultiChoiceMultiAnswerQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchReadingMultiChoiceSingleAnswer = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/reading-multi-choice-single-answer/get/${user._id}`);
            const data = await response.json();
            setReadingMultiChoiceSingleAnswerQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchReadingFIBDropdown = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/reading-fib-dropdown/get/${user._id}`);
            const data = await response.json();
            setReadingFIBDropdownQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchReadingFIBDragDrop = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/reading-fib-drag-drop/get/${user._id}`);
            const data = await response.json();
            setReadingFIBDragDropQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchReadingReorder = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/reading-reorder/get/${user._id}`);
            const data = await response.json();
            setReadingReorderQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };





    const fetchSummarizeWrittenText = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/summarize-text/get/${user._id}`);
            const data = await response.json();
            setSummarizeTextQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchEssayQuestions = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/essay/get/${user._id}`);
            const data = await response.json();
            setEssayQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };


    const fetchSummarizeSpokenText = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/sst/questions/${user._id}`);
            const data = await response.json();
            setSSTQuestions(data?.data || []);

        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchListeningMCQMultiple = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/listening-multi-choice-multi-answer/questions/${user._id}`);
            const data = await response.json();
            setListeningMCQMultipleQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchListeningFillBlanks = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/listening-fib/questions/${user._id}`);
            const data = await response.json();
            setListeningFIBQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchWriteFromDictation = async () => {
        setLoading(true);
        try {
            const data = await getWriteFromDictationQuestions(user._id);
            setWriteFromDictationQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchHighlightSummary = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/hsc/attempts/${user._id}`);
            const data = await response.json();
            setHCSQuestions(data?.data || []);

        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchListeningMCQSingle = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/choose-single-answer/${user._id}`);
            const data = await response.json();

            setListeningMCQSingleQuestions(data?.data || []);

        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchSelectMissingWord = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/select-missing-word/${user._id}`);
            const data = await response.json();

            setSelectMissingWordQuestions(data?.data || []);

        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchHighlightIncorrectWords = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/hiw/${user._id}`);
            const data = await response.json();

            setHighlightIncorrectWordsQuestions(data?.data || []);

        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };


    // --- CONFIGURATION ---
    const subTabsConfig = {
        Speaking: [
            { id: 'Read Aloud', isAi: true, onClick: fetchReadAloud },
            { id: 'Repeat Sentence', isAi: true, onClick: fetchRepeatSentences },
            { id: 'Describe Image', isAi: true, onClick: fetchImageSentences },
            { id: 'Re-tell Lecture', isAi: true, onClick: fetchReTellQuestion },
            { id: 'Answer Short Question', isAi: true, onClick: fetchShortAnswerQuestion },
            { id: 'Summarize Group Discussion', isAi: true, onClick: fetchSummarizeGroupQuestion },
            { id: 'Respond to a Situation', isAi: true, onClick: fetchRespondSituationQuestion }
        ],
        Writing: [
            { id: 'Summarize Written Text', isAi: true, onClick: fetchSummarizeWrittenText },
            { id: 'Write Essay', isAi: true, onClick: fetchEssayQuestions }
        ],
        Reading: [
            { id: 'Fill in the Blanks (Dropdown)', isAi: true, onClick: fetchReadingFIBDropdown },
            { id: 'Multiple Choice, Choose Multiple Answer', isAi: true, onClick: fetchReadingMultiChoiceMultiAnswer },
            { id: 'Multiple Choice, Choose Single Answer', isAi: true, onClick: fetchReadingMultiChoiceSingleAnswer },
            { id: 'Fill in the Blanks (Drag and Drop)', isAi: true, onClick: fetchReadingFIBDragDrop },
            { id: 'Re-order Paragraph', isAi: true, onClick: fetchReadingReorder }


        ],

        Listening: [
            { id: 'Summarize Spoken Text', isAi: true, onClick: fetchSummarizeSpokenText },
            { id: 'Listening: Multiple Choice, Choose Multiple Answer', isAi: true, onClick: fetchListeningMCQMultiple },
            { id: 'Fill in the blanks (Type In)', isAi: true, onClick: fetchListeningFillBlanks },
            { id: 'Highlight Correct Summary', isAi: true, onClick: fetchHighlightSummary },
            { id: 'Listen: Multiple Choice, choose Single Answer', isAi: true, onClick: fetchListeningMCQSingle },
            { id: 'Select Missing Word', isAi: true, onClick: fetchSelectMissingWord },
            { id: 'Highlight Incorrect Words', isAi: true, onClick: fetchHighlightIncorrectWords },
            { id: 'Write From Dictation', isAi: true, onClick: fetchWriteFromDictation }

        ]
    };

    // --- EFFECTS ---

    // Update activeTab when location state changes (for navigation from Dashboard)
    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    // When main tab changes, set default subtab and fetch data
    useEffect(() => {
        const firstSubTab = subTabsConfig[activeTab]?.[0];
        if (firstSubTab) {
            setActiveSubTab(firstSubTab.id);
            firstSubTab.onClick();
        } else {
            setActiveSubTab(null);
        }
    }, [activeTab]);

    // --- LOGIC ---
    const getRawQuestions = () => {
        switch (activeSubTab) {
            case 'Read Aloud': return readAloudQuestions;
            case 'Repeat Sentence': return repeatSentenceQuestions;
            case 'Describe Image': return imageQuestions;
            case 'Answer Short Question': return shortAnswerQuestion;
            case 'Summarize Group Discussion': return summarizeGroupQuestion;
            case 'Re-tell Lecture': return retellQuestions;
            case 'Respond to a Situation': return respondSituationQuestions;
            case 'Fill in the Blanks (Dropdown)': return readingFIBDropdownQuestions;
            case 'Multiple Choice, Choose Multiple Answer': return readingMultiChoiceMultiAnswerQuestions;
            case 'Multiple Choice, Choose Single Answer': return readingMultiChoiceSingleAnswerQuestions;
            case 'Fill in the Blanks (Drag and Drop)': return readingFIBDragDropQuestions;
            case 'Re-order Paragraph': return readingReorderQuestions;

            case 'Summarize Written Text': return summarizeTextQuestions;
            case 'Write Essay': return essayQuestions;
            case 'Summarize Spoken Text': return sstQuestions;
            case 'Highlight Correct Summary': return hcsQuestions;
            case 'Listen: Multiple Choice, choose Single Answer': return listeningMCQSingleQuestions;
            case 'Select Missing Word': return selectMissingWordQuestions;
            case 'Highlight Incorrect Words': return highlightIncorrectWordsQuestions;
            case 'Fill in the blanks (Type In)': return listeningFIBQuestions;
            case 'Listening: Multiple Choice, Choose Multiple Answer': return listeningMCQMultipleQuestions;
            case 'Write From Dictation': return writeFromDictationQuestions;
            default: return [];
        }
    };

    const displayQuestions = (() => {
        let questions = getRawQuestions();

        if (filters.prediction) {
            questions = questions.filter(q => q.isPrediction);
            // If isPrediction is missing/undefined, it excludes it. 
            // Ensure backend sends this boolean or default to false.
        }

        if (filters.difficulty !== 'All') {
            questions = questions.filter(q => q.difficulty === filters.difficulty);
        }

        if (filters.status !== 'All') {
            if (filters.status === 'Not Practiced') {
                questions = questions.filter(q => !q.attemptCount && q.status !== 'Completed' && q.status !== 'Practiced');
            } else if (filters.status === 'Practiced') {
                questions = questions.filter(q => (q.attemptCount > 0) || q.status === 'Practiced' || q.status === 'Completed');
            }
        }

        return questions;
    })();

    const handleNextButton = () => {
        const currentIndex = displayQuestions.findIndex(q => q._id === speechQuestion._id);
        const nextIndex = (currentIndex + 1) % displayQuestions.length;
        setSpeechQuestion(displayQuestions[nextIndex]);
    };

    const handlePreviousButton = () => {
        const currentIndex = displayQuestions.findIndex(q => q._id === speechQuestion._id);
        const prevIndex = currentIndex === 0 ? displayQuestions.length - 1 : currentIndex - 1;
        setSpeechQuestion(displayQuestions[prevIndex]);
    };

    const handleShuffleButton = () => {
        const randomIndex = Math.floor(Math.random() * displayQuestions.length);
        setSpeechQuestion(displayQuestions[randomIndex]);
    };

    // Dynamic Module Component Selection
    const renderActiveModule = () => {
        const props = {
            question: speechQuestion,
            setActiveSpeechQuestion,
            activeTab: activeSubTab,
            mode: 'practiceMode',
            nextButton: handleNextButton,
            previousButton: handlePreviousButton,
            shuffleButton: handleShuffleButton
        };

        switch (activeSubTab) {
            case "Repeat Sentence": return <RepeatSentenceSession {...props} />;
            case "Answer Short Question": return <ShortAnswer {...props} />;
            case "Summarize Group Discussion": return <SummarizeGroup {...props} />;
            case "Re-tell Lecture": return <ReTell {...props} />;
            case "Respond to a Situation": return <Respond {...props} />;
            case "Describe Image": return <DescribeImageModule {...props} />;
            case "Summarize Written Text": return <SummarizeWrittenText {...props} />;
            case "Write Essay": return <WriteEssay {...props} />;
            case "Fill in the Blanks (Dropdown)": return <ReadingFIBDropdown {...props} />;
            case "Multiple Choice, Choose Multiple Answer": return <ReadingMultiChoiceMultiAnswer {...props} />;
            case "Multiple Choice, Choose Single Answer": return <ReadingMultiChoiceSingleAnswer {...props} />;
            case "Fill in the Blanks (Drag and Drop)": return <ReadingFIBDragDrop {...props} />;
            case "Re-order Paragraph": return <ReadingReorder {...props} />;
            case "Summarize Spoken Text": return <SST {...props} />;
            case "Highlight Correct Summary": return <HCS {...props} />;
            case "Listen: Multiple Choice, choose Single Answer": return <ChooseSingleAnswer {...props} />;
            case "Select Missing Word": return <SelectMissingWord {...props} />;
            case "Highlight Incorrect Words": return <HighlightIncorrectWords {...props} />;


            case 'Fill in the blanks (Type In)': return <ListeningFIB {...props} />;
            case 'Listening: Multiple Choice, Choose Multiple Answer': return <ListeningMultiChoiceMultiAnswer {...props} />;
            case 'Write From Dictation': return <WriteFromDictation {...props} />;

            default: return <div>Component not found</div>;
        }
    };

    const tabs = [
        { id: 'Speaking', icon: 'mic' },
        { id: 'Writing', icon: 'edit' },
        { id: 'Reading', icon: 'book' },
        { id: 'Listening', icon: 'headphones' },
    ];

    return (
        <DashboardLayout>
            {!activeSpeechQuestion ? (
                <div className="p-6 space-y-6 w-full">
                    <h1 className="text-2xl font-bold text-slate-800">Practice</h1>

                    {/* Main Category Tabs */}
                    <div className="bg-white p-1 rounded-xl inline-flex shadow-sm border border-slate-100">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                {tab.id}
                            </button>
                        ))}
                    </div>

                    {/* Sub-Tabs (Dynamically mapped from config) */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {subTabsConfig[activeTab]?.map((sub) => (
                            <button
                                key={sub.id}
                                onClick={() => {
                                    setActiveSubTab(sub.id);
                                    sub.onClick();
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeSubTab === sub.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {sub.id}
                                {sub.isAi && <span className={`text-[10px] px-1 rounded font-bold ${activeSubTab === sub.id ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'}`}>Ai+</span>}
                            </button>
                        ))}
                    </div>

                    <QuestionFilter
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onReset={handleResetFilters}
                    />

                    {/* Question List Table */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50 text-sm font-semibold text-slate-700">
                            <div className="col-span-8">Question Title</div>
                            <div className="col-span-2 text-center">Difficulty</div>
                            <div className="col-span-2 text-right">Status</div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {loading ? (
                                <div className="p-8 text-center text-slate-500">Loading questions...</div>
                            ) : displayQuestions.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">No questions found for {activeSubTab}.</div>
                            ) : (
                                displayQuestions.map((q) => (
                                    <div
                                        key={q._id}
                                        onClick={() => {
                                            // Special logic for Read Aloud (Navigate) or Session (Open Component)
                                            if (activeSubTab === "Read Aloud") {
                                                navigate(`/practice/${q._id}`);
                                            } else {
                                                setActiveSpeechQuestion(true);
                                                setSpeechQuestion(q);
                                            }
                                        }}
                                        className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        <div className="col-span-8 flex items-center gap-3">
                                            <span className="font-semibold text-slate-700">#{q._id.toString().substring(0, 5).toUpperCase()}</span>
                                            <span className="text-slate-500 text-sm">({q.name || q.title})</span>
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${q.difficulty === 'Hard' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                                                }`}>
                                                {q.difficulty || 'Medium'}
                                            </span>
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            <button className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-lg text-xs font-bold">
                                                {q.status || q.attemptCount || 'Not Practiced'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // Switch between practice modules
                renderActiveModule()
            )}
        </DashboardLayout>
    );
}

export default Practice;