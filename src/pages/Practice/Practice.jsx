import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import RepeatSentenceSession from './RepeatSentenceSession';
import DescribeImageModule from './DescribeImageModule';
import { useSelector } from 'react-redux';
import ShortAnswer from './ShortAnswer';
import SummarizeGroup from './SummarizeGroup';
import ReTell from './Retell';

function Practice() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Speaking');
    const [activeSubTab, setActiveSubTab] = useState('Read Aloud');
    const [readAloudQuestions, setReadAloudQuestions] = useState([]);
    const [repeatSentenceQuestions, setRepeatSentenceQuestions] = useState([]);
    const [imageQuestions, setImageQuestions] = useState([])
    const [shortAnswerQuestion, setShortAnswerQuestion] = useState([])
    const [summarizeGroupQuestion, setSummarizeGroupQuestion] = useState([])
    const [retellQuestions, setRetellQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeSpeechQuestion, setActiveSpeechQuestion] = useState(false);
    const [speechQuestion, setSpeechQuestion] = useState(null);

    // Fetch Read Aloud Questions
    useEffect(() => {
        if (activeSubTab === 'Read Aloud') {
            const fetchReadAloud = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await fetch('/api/read-aloud');
                    const data = await response.json();

                    if (data.success) {
                        setReadAloudQuestions(data.data);
                    } else {
                        setError(data.message || 'Failed to fetch questions');
                    }
                } catch (err) {
                    setError('Error connecting to server');
                    console.error('Fetch error:', err);
                } finally {
                    setLoading(false);
                }
            };

            fetchReadAloud();
        }
    }, [activeSubTab]);

    // Mock Data for other tabs (placeholder)
    const mockQuestions = [
        { id: 'RA_A_1360', title: "Shakespeare's Rise", difficulty: 'Hard', status: 'Practiced (1)', isPrediction: true },
        { id: 'RA_A_1359', title: "Tesla's Betrayal", difficulty: 'Medium', status: 'Not Practiced', isPrediction: true },
    ];

    const {user} = useSelector((state)=>state.auth)


  const handlePreviousButton = () => {
  if (!displayQuestions.length || !speechQuestion) return;

  const currentIndex = displayQuestions.findIndex(
    q => q._id === speechQuestion._id
  );

  if (currentIndex === -1) return;

  const prevIndex =
    currentIndex === 0
      ? displayQuestions.length - 1
      : currentIndex - 1;

  setSpeechQuestion(displayQuestions[prevIndex]);
  return displayQuestions[prevIndex];
};

    const handleNextButton = () => {

  if (!displayQuestions.length || !speechQuestion) return;

  const currentIndex = displayQuestions.findIndex(
    q => q._id === speechQuestion._id
  );

  if (currentIndex === -1) return;

  const nextIndex =
    currentIndex === displayQuestions.length - 1
      ? 0
      : currentIndex + 1;

  setSpeechQuestion(displayQuestions[nextIndex]);
  return displayQuestions[nextIndex];
};


  const handleShuffleButton = () => {
  if (!displayQuestions.length) return;

  const randomIndex = Math.floor(
    Math.random() * displayQuestions.length
  );

  setSpeechQuestion(displayQuestions[randomIndex]);
  return displayQuestions[randomIndex];
};


   
    // Decide which questions to show
   const displayQuestions = (() => {
  switch (activeSubTab) {
    case 'Read Aloud':
      return readAloudQuestions;
    case 'Repeat Sentence':
      return repeatSentenceQuestions;
    case 'Describe Image':
        return imageQuestions;
    case 'Answer Short Question':
        return shortAnswerQuestion;
    case 'Summarize Group Discussion':
        return summarizeGroupQuestion;
    case 'Re-tell Lecture':
        return retellQuestions;
    default:
      return []; // or mockQuestions for other tabs
  }
})();


    const tabs = [
        { id: 'Speaking', icon: 'mic' },
        { id: 'Writing', icon: 'edit' },
        { id: 'Reading', icon: 'book' },
        { id: 'Listening', icon: 'headphones' },
    ];

    // const subTabs = [
    //     { id: 'Read Aloud', isAi: true },
    //     { id: 'Repeat Sentence', isAi: true },
    //     { id: 'Describe Image', isAi: true },
    //     { id: 'Re-tell Lecture', isAi: true },
    //     { id: 'Answer Short Question', isAi: true },
    // ];

const fetchRepeatSentences = async () => {
    setLoading(true);
    setError(null);
    try {
        const response = await fetch(`/api/repeat-sentence/get/${user._id}`);
        const data = await response.json();
            setRepeatSentenceQuestions(data?.data);
    } catch (err) {
        setError('Error connecting to server');
        console.error('Fetch error:', err);
    } finally {
        setLoading(false);
    }
};

const fetchImageSentences = async () => {
    setLoading(true);
    setError(null);
    try {
        const response = await fetch(`/api/image/questions/${user._id}`);
        const data = await response.json();
            setImageQuestions(data?.data);
    } catch (err) {
        setError('Error connecting to server');
        console.error('Fetch error:', err);
    } finally {
        setLoading(false);
    }
};

const fetchShortAnswerQuestion = async () => {
    setLoading(true);
    setError(null);
    try {
        const response = await fetch(`/api/short-answer/get/${user._id}`);
        const data = await response.json();
            setShortAnswerQuestion(data?.data);
    } catch (err) {
        setError('Error connecting to server');
        console.error('Fetch error:', err);
    } finally {
        setLoading(false);
    }
};

const fetchSummarizeGroupQuestion = async () => {
    setLoading(true);
    setError(null);
    try {
        const response = await fetch(`/api/summarize-group/get/${user._id}`);
        const data = await response.json();
        console.log("Summarize Group Data:", data?.data);
            setSummarizeGroupQuestion(data?.data);
    } catch (err) {
        setError('Error connecting to server');
        console.error('Fetch error:', err);
    } finally {
        setLoading(false);
    }
};

const fetchReTellQuestion = async () => {
    setLoading(true);
    setError(null);
    try {
        const response = await fetch(`/api/retell-lecture/get/${user._id}`);
        const data = await response.json();
        console.log("Retell Lecture Data:", data?.data);
            setRetellQuestions(data?.data);
    } catch (err) {
        setError('Error connecting to server');
        console.error('Fetch error:', err);
    } finally {
        setLoading(false);
    }
};

    // Suppose you have this inside your component
const subTabs = [
  {
    id: 'Read Aloud',
    isAi: true,
    onClick: () => console.log('Read Aloud clicked'), // placeholder
  },
  {
    id: 'Repeat Sentence',
    isAi: true,
    onClick: () => {
      if (repeatSentenceQuestions.length === 0) fetchRepeatSentences();
    },
  },
  { id: 'Describe Image', isAi: true, onClick: ()  => {
      if (imageQuestions.length === 0) fetchImageSentences();
    },
 },
  { id: 'Re-tell Lecture', isAi: true, onClick: ()  => {
      if (retellQuestions.length === 0) fetchReTellQuestion();
    }, },
  { id: 'Answer Short Question', isAi: true,  onClick: ()  => {
      if (shortAnswerQuestion.length === 0) fetchShortAnswerQuestion();
    },
 },
  { id: 'Summarize Group Discussion', isAi: true,  onClick: ()  => {
      if (summarizeGroupQuestion.length === 0) fetchSummarizeGroupQuestion();
    },
 }
];


    return (
        <DashboardLayout>
           {!activeSpeechQuestion ? (
            <div className="p-6 space-y-6 w-full">
                {/* Page Title */}
                <h1 className="text-2xl font-bold text-slate-800">Practice</h1>

                {/* Main Tabs */}
                <div className="bg-white p-1 rounded-xl inline-flex shadow-sm border border-slate-100">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all
                                ${activeTab === tab.id
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            {/* Simple Icons based on ID */}
                            {tab.id === 'Speaking' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>}
                            {tab.id === 'Writing' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>}
                            {tab.id === 'Reading' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 1-4 4v14a3 3 0 0 1 3-3h7z" /></svg>}
                            {tab.id === 'Listening' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></svg>}
                            {tab.id}
                        </button>
                    ))}
                </div>

                {/* Sub Tabs Scroller */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Back Arrow */}
                    <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                  {/* 
                    {subTabs.map((sub) => (
                        <button
                            key={sub.id}
                            onClick={() => setActiveSubTab(sub.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5
                                ${activeSubTab === sub.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {sub.id}
                            {sub.isAi && (
                                <span className={`text-[10px] px-1 rounded font-bold ${activeSubTab === sub.id ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'}`}>
                                    Ai+
                                </span>
                            )}
                        </button>
                    ))} */}


                    {subTabs.map((sub) => (
                        <button
                            key={sub.id}
                            onClick={() => {
                            setActiveSubTab(sub.id); // Always set active tab
                            sub.onClick();           // Call the tab-specific function
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5
                            ${activeSubTab === sub.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {sub.id}
                            {sub.isAi && (
                            <span className={`text-[10px] px-1 rounded font-bold ${activeSubTab === sub.id ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'}`}>
                                Ai+
                            </span>
                            )}
                        </button>
                        ))}


                    {/* Forward Arrow */}
                    <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                </div>

                {/* Filters Row */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="4" y1="21" y2="14" /><line x1="4" x2="4" y1="10" y2="3" /><line x1="12" x2="12" y1="21" y2="12" /><line x1="12" x2="12" y1="8" y2="3" /><line x1="20" x2="20" y1="21" y2="16" /><line x1="20" x2="20" y1="12" y2="3" /><line x1="1" x2="7" y1="14" y2="14" /><line x1="9" x2="15" y1="8" y2="8" /><line x1="17" x2="23" y1="16" y2="16" /></svg>
                        </div>

                        {['Prediction', 'Difficulty', 'Status'].map(filter => (
                            <button key={filter} className="px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium text-slate-600 flex items-center gap-2 hover:bg-slate-100">
                                {filter}
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </button>
                        ))}

                        <button className="text-sm font-medium text-primary-600 flex items-center gap-1 hover:text-primary-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                            Reset Filter
                        </button>
                    </div>
                </div>

                {/* Continue From Banner */}
                <div className="bg-primary-50 border border-primary-100 p-3 rounded-lg flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-600">Continue from - </span>
                        <span className="text-primary-600 font-bold hover:underline cursor-pointer">#RA_A_1360 Shakespeare's Rise</span>
                        <span className="text-slate-500">Click to continue the previous practice list</span>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                    </button>
                </div>

                {/* Question List */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50 text-sm font-semibold text-slate-700">
                        <div className="col-span-8">Question ID</div>
                        <div className="col-span-2 text-center">Difficulty</div>
                        <div className="col-span-2 text-right">Status</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-slate-100">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">Loading questions...</div>
                        ) : error ? (
                            <div className="p-8 text-center text-red-500">{error}</div>
                        ) : displayQuestions.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No questions found.</div>
                        ) : (
                            displayQuestions.map((q) => (
                                <div key={q.id || q._id} 
                                onClick={() => {
                                    if (activeSubTab === "Repeat Sentence" || activeSubTab === "Summarize Group Discussion" || activeSubTab === "Describe Image" || activeSubTab === "Answer Short Question" || activeSubTab === "Re-tell Lecture") {
                                        setActiveSpeechQuestion(true);
                                        setSpeechQuestion(q);
                                    }
                                    else  {
                                        navigate(`/practice/${q._id}`);
                                    }
                                    }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors cursor-pointer">
                                    <div className="col-span-8 flex items-center gap-3">
                                        <span className="font-semibold text-slate-700">{q.id || (q._id && 'RA_A_' + q._id.toString().substring(0, 4))}</span>
                                        <span className="text-slate-500 text-sm">({q.name || q.title})</span>
                                        {q.isPrediction && (
                                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded font-medium">Predictive</span>
                                        )}
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium
                                            ${q.difficulty === 'Hard' ? 'bg-red-100 text-red-600' :
                                                q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-green-100 text-green-700'}`}>
                                            {q.difficulty}
                                        </span>
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <button className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                                            ${q.status === 'Not Practiced' || !q.status 
                                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                                : 'bg-green-700 text-white hover:bg-green-800'}`}>
                                            {q.status || q.attemptCount || 'Not Practiced'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>)
             : (
            // Logic to switch between different Session Components
            activeSubTab === "Repeat Sentence" ? (
                <RepeatSentenceSession 
                    question={speechQuestion} 
                    setActiveSpeechQuestion={setActiveSpeechQuestion} 
                    activeTab={activeSubTab} 
                    mode={'practiceMode'}
                    nextButton={handleNextButton}
                    previousButton={handlePreviousButton}
                    shuffleButton={handleShuffleButton}
                />
            ) : (
                activeSubTab === "Answer Short Question"?(
                    <ShortAnswer
                        question={speechQuestion} 
                    setActiveSpeechQuestion={setActiveSpeechQuestion} 
                    activeTab={activeSubTab} 
                    mode={'practiceMode'}
                      nextButton={handleNextButton}
                    previousButton={handlePreviousButton}
                    shuffleButton={handleShuffleButton}

                />
                ):(
                activeSubTab === "Summarize Group Discussion"?(
                    <SummarizeGroup
                        question={speechQuestion} 
                    setActiveSpeechQuestion={setActiveSpeechQuestion} 
                    activeTab={activeSubTab} 
                    mode={'practiceMode'}
                      nextButton={handleNextButton}
                    previousButton={handlePreviousButton}
                    shuffleButton={handleShuffleButton}
                />
                ):(
                   (
                activeSubTab === "Re-tell Lecture"?(
                    <ReTell
                        question={speechQuestion} 
                    setActiveSpeechQuestion={setActiveSpeechQuestion} 
                    activeTab={activeSubTab} 
                    mode={'practiceMode'}
                      nextButton={handleNextButton}
                    previousButton={handlePreviousButton}
                    shuffleButton={handleShuffleButton}
                />
                ):(
                    <DescribeImageModule
                    question={speechQuestion} 
                    setActiveSpeechQuestion={setActiveSpeechQuestion} 
                      nextButton={handleNextButton}
                    previousButton={handlePreviousButton}
                    shuffleButton={handleShuffleButton}
                />
                )
            )
                )
            )
            )
        )
        }
        </DashboardLayout>
    );
}

export default Practice;
