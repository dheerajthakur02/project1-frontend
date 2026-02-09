import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
// import axios from 'axios'; // Removed direct axios import


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



// Writing Components
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
import api, { fetchUserProfile, getWriteFromDictationQuestions } from '../../services/api';
import { setCredentials } from '../../redux/slices/authSlice';


const PracticeCard = ({ title, icon, color, count, total, onClick }) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        green: 'bg-green-100 text-green-600',
        red: 'bg-red-100 text-red-600',
    };

    const bgClasses = {
        blue: 'bg-blue-50',
        yellow: 'bg-yellow-50',
        green: 'bg-green-50',
        red: 'bg-red-50',
    };

    return (
        <div onClick={onClick} className={`${bgClasses[color]} p-6 rounded-2xl transition-transform hover:scale-[1.02] cursor-pointer`}>
            <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center`}>
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            </div>

            <div className="mb-2">
                <div className="text-sm font-semibold text-slate-700 mb-1">Practiced Ques : {count}</div>
                <div className="w-full bg-white/50 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-300 h-full w-0" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
                </div>
            </div>

            <div className="flex justify-between items-end text-sm">
                <div>
                    <span className="font-bold text-slate-700">{total ? Math.round((count / total) * 100) : 0}%</span>
                    <div className="text-slate-500 text-xs">Completed</div>
                </div>
                <div className="text-right">
                    <span className="font-bold text-slate-700">Total:</span>
                    <div className="font-bold text-slate-800">{total}</div>
                </div>
            </div>
        </div>
    );
};


function Practice() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);

    // --- STATE ---
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'Speaking');

    const [activeSubTab, setActiveSubTab] = useState('Read Aloud');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Stats State
    const [stats, setStats] = useState({
        speaking: { total: 0, practiced: 0 },
        writing: { total: 0, practiced: 0 },
        reading: { total: 0, practiced: 0 },
        listening: { total: 0, practiced: 0 }
    });

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

   

    // Fetch Stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/dashboard/stats');
                if (data.success) {
                    setStats(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch practice stats", err);
            }
        };
        fetchStats();
    }, []);


    const fetchReadAloud = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/read-aloud/questions/${user._id}`);
            if (data.success) setReadAloudQuestions(data.data);
        } catch (err) { setError('Failed to fetch Read Aloud'); }
        finally { setLoading(false); }
    };

    const fetchRepeatSentences = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/repeat-sentence/get/${user?._id}`);
            console.log(data)
            setRepeatSentenceQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchImageSentences = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/image/questions/${user._id}`);
            setImageQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchShortAnswerQuestion = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/short-answer/get/${user._id}`);
            setShortAnswerQuestion(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchSummarizeGroupQuestion = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/summarize-group/get/${user._id}`);
            setSummarizeGroupQuestion(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchRespondSituationQuestion = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/respond-situation/get/${user._id}`);
            setRespondSituationQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };


    const fetchReTellQuestion = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/retell-lecture/get/${user._id}`);
            setRetellQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchReadingMultiChoiceMultiAnswer = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/reading-multi-choice-multi-answer/get/${user._id}`);
            setReadingMultiChoiceMultiAnswerQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchReadingMultiChoiceSingleAnswer = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/reading-multi-choice-single-answer/get/${user._id}`);
            setReadingMultiChoiceSingleAnswerQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchReadingFIBDropdown = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/reading-fib-dropdown/get/${user._id}`);
            setReadingFIBDropdownQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchReadingFIBDragDrop = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/reading-fib-drag-drop/get/${user._id}`);
            setReadingFIBDragDropQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchReadingReorder = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/reading-reorder/get/${user._id}`);
            setReadingReorderQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };





    const fetchSummarizeWrittenText = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/summarize-text/get/${user._id}`);
            setSummarizeTextQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchEssayQuestions = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/essay/get/${user._id}`);
            setEssayQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };


    const fetchSummarizeSpokenText = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/sst/questions/${user._id}`);
            setSSTQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchListeningMCQMultiple = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/listening-multi-choice-multi-answer/questions/${user._id}`);
            setListeningMCQMultipleQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchListeningFillBlanks = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/listening-fib/questions/${user._id}`);
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
            const { data } = await api.get(`/hcs/attempts/${user._id}`);
            setHCSQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchListeningMCQSingle = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/choose-single-answer/${user._id}`);
            setListeningMCQSingleQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchSelectMissingWord = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/select-missing-word/${user._id}`);
            setSelectMissingWordQuestions(data?.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchHighlightIncorrectWords = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/hiw/${user._id}`);
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
            { id: 'Fill in the Blanks (Drag and Drop)', isAi: true, onClick: fetchReadingFIBDragDrop },
            { id: 'Re-order Paragraph', isAi: true, onClick: fetchReadingReorder },
            { id: 'Multiple Choice, Choose Single Answer', isAi: true, onClick: fetchReadingMultiChoiceSingleAnswer },
            { id: 'Multiple Choice, Choose Multiple Answer', isAi: true, onClick: fetchReadingMultiChoiceMultiAnswer }
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
            questions = questions.filter(q => q.isPredictive);
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

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        <PracticeCard
                            title="Speaking"
                            color="blue"
                            count={stats.speaking.practiced}
                            total={stats.speaking.total}
                            onClick={() => setActiveTab('Speaking')}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>}
                        />
                        <PracticeCard
                            title="Writing"
                            color="yellow"
                            count={stats.writing.practiced}
                            total={stats.writing.total}
                            onClick={() => setActiveTab('Writing')}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
                        />
                        <PracticeCard
                            title="Reading"
                            color="green"
                            count={stats.reading.practiced}
                            total={stats.reading.total}
                            onClick={() => setActiveTab('Reading')}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>}
                        />
                        <PracticeCard
                            title="Listening"
                            color="red"
                            count={stats.listening.practiced}
                            total={stats.listening.total}
                            onClick={() => setActiveTab('Listening')}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>}
                        />
                    </div>

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
                                            <h3 className="text-slate-500 text-sm">({q.name || q.title}) <span className={`${q.isPredictive ? "bg-blue-400 p-2 m-2 rounded text-white" : ""}`}>{q.isPredictive ? "Predictive" : ""}</span> </h3>
                                        </div>

                                        <div className="col-span-2 flex justify-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${q.difficulty === 'Hard' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                                                }`}>
                                                {q.difficulty || 'Medium'}
                                            </span>
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            <button className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-lg text-xs font-bold">
                                                {q.attemptCount > 0 ? `Practiced (${q.attemptCount})` : 'Not Practiced'}
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