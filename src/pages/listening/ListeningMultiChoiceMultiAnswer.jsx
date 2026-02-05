import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Shuffle, Hash, BarChart2, Info, X, Play, Pause, Volume2, Languages, Eye, Users } from 'lucide-react';
import { submitListeningMCQMultipleAttempt, getListeningMCQMultipleQuestions } from '../../services/api'; // We will create these next
import { useSelector } from 'react-redux';
import axios from 'axios';



const AttemptHistory = ({ question, attempts, onSelectAttempt }) => {
   
    const [activeTab, setActiveTab] = useState("my");
    const [communityAttempts, setCommunityAttempts] = useState([]);
    const [loadingCommunity, setLoadingCommunity] = useState(false);

    const fetchCommunityAttempts = async () => {
        try {
            setLoadingCommunity(true);
            const res = await axios.get(`api/listening-multi-choice-multi-answer/${question._id}/community`);

            setCommunityAttempts(res?.data?.data);

        } catch (err) {
            console.error("Community fetch error:", err);
        } finally {
            setLoadingCommunity(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);

        fetchCommunityAttempts();
    };

    const dataToRender =
        activeTab === "my" ? attempts : communityAttempts;

    return (
        <div className="mt-12 font-sans">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                    <BarChart2 className="text-purple-600" size={20} />
                    <h3 className="font-bold text-slate-800">
                        {activeTab === "my" ? "Your Attempts" : "Community Attempts"}
                    </h3>
                </div>

                {/* TABS */}
                <div className="flex gap-2">
                    <button
                        onClick={() => handleTabChange("my")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition
              ${activeTab === "my"
                                ? "bg-purple-600 text-white"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                        My Attempts
                    </button>

                    <button
                        onClick={() => handleTabChange("community")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-1
              ${activeTab === "community"
                                ? "bg-purple-600 text-white"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                        <Users size={14} /> Community
                    </button>
                </div>
            </div>

            {/* EMPTY STATE */}
            {!dataToRender || dataToRender.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border">
                        <Info size={20} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">
                        {loadingCommunity
                            ? "Loading community attempts..."
                            : "No attempts found"}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {dataToRender.map((attempt, idx) => (
                        <div
                            key={attempt._id || idx}
                            onClick={() => onSelectAttempt?.(attempt)}
                            className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition cursor-pointer group"
                        >
                            {/* USER (Community only) */}
                            {activeTab === "community" && (
                                <div className="min-w-[160px]">
                                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                                        User
                                    </span>
                                    <div className="font-semibold text-slate-700">
                                        {attempt.user?.name || "Anonymous"}
                                    </div>
                                </div>
                            )}

                            {/* DATE */}
                            <div className="min-w-[160px]">
                                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                                    Date
                                </span>
                                <div className="text-sm font-semibold text-slate-700">
                                    {new Date(attempt.createdAt).toLocaleString("en-US", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </div>
                            </div>

                            {/* SCORE */}
                            <div className="flex-1">
                                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                                    Score
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span
                                        className={`text-xl font-bold ${attempt.score === attempt.maxScore
                                                ? "text-green-600"
                                                : "text-blue-600"
                                            }`}
                                    >
                                        {attempt.score}
                                    </span>
                                    <span className="text-sm text-slate-400 font-medium">
                                        / {attempt.maxScore}
                                    </span>
                                </div>
                            </div>

                            {/* BADGE */}
                            <div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${attempt.totalScore === attempt.maxScore
                                            ? "bg-green-100 text-green-700"
                                            : "bg-slate-100 text-slate-600"
                                        }`}
                                >
                                    {attempt.totalScore === attempt.maxScore
                                        ? "Perfect"
                                        : "Completed"}
                                </span>
                            </div>

                            {/* ACTION */}
                            <div className="opacity-0 group-hover:opacity-100 transition text-purple-600 font-bold text-sm">
                                View Result →
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};




const ListeningMultiChoiceMultiAnswer = ({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) => {

    const { user } = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState('Speaking');
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [audioProgress, setAudioProgress] = useState(0); // 0 → 100


    // Audio State
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Prep state
    const [prepStatus, setPrepStatus] = useState("countdown");
    const [prepTimer, setPrepTimer] = useState(3);

    // UI State
    const [isResultOpen, setIsResultOpen] = useState(false);
    const [viewAttempt, setViewAttempt] = useState(null);
    const [status, setStatus] = useState("idle");

    const [audioFinished, setAudioFinished] = useState(false);


    // Timer Effect
    useEffect(() => {
        if (prepStatus === "countdown" && prepTimer > 0) {
            const timer = setInterval(() => setPrepTimer(p => p - 1), 1000);
            return () => clearInterval(timer);
        } else if (prepStatus === "countdown" && prepTimer === 0) {
            setPrepStatus("finished");
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => { });
                setIsPlaying(true);
                setAudioFinished(false);

            }
        }
    }, [prepStatus, prepTimer]);

    const handleSkipAudio = () => {
        if (!audioRef.current) return;

        audioRef.current.pause();
        audioRef.current.currentTime = audioRef.current.duration;
        setIsPlaying(false);
        setAudioFinished(true);
        setAudioProgress(100);
    };


    const toggleAudio = () => {
        if (!audioRef.current || audioFinished) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(() => { });
            setIsPlaying(true);
        }
    };


    // Initialize on load
    useEffect(() => {
        if (question) {
            setSelectedOptions([]);
            setResult(null);
            setIsResultOpen(false);
            setViewAttempt(null);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setIsPlaying(false);
            // Reset Timer
            setPrepStatus("countdown");
            setPrepTimer(3);
            setAudioProgress(0);
            setAudioFinished(false);


            setHistory(question.lastAttempts || []);
        }
    }, [question]);

    const resetForm = () => {
        setSelectedOptions([]);
        setResult(null);
        setIsResultOpen(false);
        setViewAttempt(null);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
        setPrepStatus("countdown");
        setPrepTimer(3);
        setAudioProgress(0);
        setAudioFinished(false);

    }



    const handleAudioEnded = () => {
        setIsPlaying(false);
        setAudioFinished(true);
        setAudioProgress(100);
    };



    const handleOptionToggle = (option) => {
        setSelectedOptions(prev => {
            if (prev.includes(option)) {
                return prev.filter(o => o !== option);
            } else {
                return [...prev, option];
            }
        });
    };

    const handleSubmit = async () => {
        if (!user?._id) return;

        const payload = {
            userId: user._id,
            questionId: question._id,
            userSelectedOptions: selectedOptions,
            timeTaken: 0 // Implement timer if needed
        };

        try {
            const res = await submitListeningMCQMultipleAttempt(payload);
            if (res.success) {
                // The backend returns { success: true, attempt: {...} } or data: {...}
                const newAttempt = res.attempt || res.data;
                setResult(newAttempt);
                setViewAttempt(newAttempt);
                setIsResultOpen(true);
                setHistory(prev => [newAttempt, ...prev]);
            }
        } catch (error) {
            console.error("Submission failed", error);
        }
    };

    const handleRedo = () => {
        resetForm();
    };

    const openAttempt = (attempt) => {
        setViewAttempt(attempt);
        setIsResultOpen(true);
    };

    const isSubmitDisabled = selectedOptions.length === 0;

    return (
        <div className="max-w-5xl mx-auto space-y-6 font-sans">

            <div>
                <h1>Mulitple Choice (Multiple)</h1>
                <p>Listen to the recording and answer the question by selecting all the correct responses. You will need to select more than one response.</p>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => setActiveSpeechQuestion(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Multiple Choice, Choose Multiple Answer
                        <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Listening</span>
                    </h1>
                </div>
            </div>

            {/* Question Card */}
            {prepStatus === "countdown" ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 text-center space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800">Starting Soon...</h2>
                    <div className="text-6xl font-black text-blue-600 animate-pulse">
                        {prepTimer}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden relative">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="flex gap-4 items-center">
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                                <Hash size={14} />
                                {question?._id?.slice(-5)?.toUpperCase()}
                            </span>
                            <span className="text-slate-500 text-sm font-medium border-l border-slate-200 pl-4">
                                {question?.title || "Listening Task"}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-md font-bold shadow-sm ${question?.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                                question?.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                {question?.difficulty || 'Medium'}
                            </span>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* PLAYER */}
                        <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {/* PLAY / PAUSE */}
                            <button
                                onClick={toggleAudio}
                                disabled={audioFinished}
                                className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center shadow-md"
                            >
                                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                            </button>

                            {/* FAKE PROGRESS (UI only, same as before) */}
                            <div className="flex-1">
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-[width] duration-200"
                                            style={{ width: `${audioProgress}%` }}
                                        />
                                    </div>

                                </div>
                            </div>

                            {/* AUDIO */}
                            <audio
                                ref={audioRef}
                                src={question?.audioUrl}
                                onEnded={handleAudioEnded}
                                onTimeUpdate={() => {
                                    if (!audioRef.current) return;
                                    const progress =
                                        (audioRef.current.currentTime / audioRef.current.duration) * 100;
                                    setAudioProgress(progress || 0);
                                }}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                className="hidden"
                            />


                            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase">
                                <Volume2 size={16} />
                                Audio
                            </div>

                            {/* SKIP */}
                            {!audioFinished && (
                                <button
                                    onClick={handleSkipAudio}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                                >
                                    Skip Audio
                                </button>
                            )}
                        </div>


                        {/* Question Text */}
                        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <h3 className="font-bold text-slate-800 text-lg leading-snug">
                                {question?.question}
                            </h3>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            {question?.options?.map((option, index) => (
                                <label
                                    key={index}
                                    className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer group
                                    ${selectedOptions.includes(option)
                                            ? 'border-blue-500 bg-blue-50/50'
                                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                        }
                                `}
                                    onClick={() => handleOptionToggle(option)}
                                >
                                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0
                                    ${selectedOptions.includes(option)
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : 'border-slate-300 bg-white group-hover:border-slate-400'
                                        }
                                `}>
                                        {selectedOptions.includes(option) && <CheckCircle size={14} />}
                                    </div>
                                    <span className={`text-sm font-medium transition-colors ${selectedOptions.includes(option) ? 'text-slate-800' : 'text-slate-600'}`}>
                                        {option}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitDisabled}
                            className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center gap-2
                            ${isSubmitDisabled ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-primary-600 hover:bg-primary-700 hover:shadow-primary-200'}
                        `}
                        >
                            <CheckCircle size={20} />
                            Submit Answer
                        </button>
                    </div>
                </div>
            )}

            {/* Footer Nav */}
            <div className="flex items-center justify-between pb-6 mt-6">
                {/* LEFT SIDE: Translate, Answer, Redo */}
                <div className="flex items-center gap-4">
                    {/* Translate (Static) */}
                    <button className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors cursor-default">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
                            <Languages size={18} />
                        </div>
                        <span className="text-xs font-bold">Translate</span>
                    </button>

                    {/* Answer (Static) */}
                    <button className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors cursor-default text-opacity-50">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
                            <Eye size={18} />
                        </div>
                        <span className="text-xs font-bold">Answer</span>
                    </button>

                    {/* Redo */}
                    <button onClick={handleRedo} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
                            <RefreshCw size={18} />
                        </div>
                        <span className="text-xs font-bold">Redo</span>
                    </button>
                </div>

                {/* RIGHT SIDE: Prev, Next */}
                <div className="flex items-center gap-4">
                    <button onClick={previousButton} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
                            <ChevronLeft size={20} />
                        </div>
                        <span className="text-xs font-bold">Previous</span>
                    </button>

                    <button onClick={nextButton} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
                            <ChevronRight size={20} />
                        </div>
                        <span className="text-xs font-bold">Next</span>
                    </button>
                </div>
            </div>

            {/* History Section */}
            {question && (
                <AttemptHistory
                    question={question}
                    attempts={history}
                    onSelectAttempt={openAttempt}
                />
            )}



            {/* RESULT MODAL */}
            {isResultOpen && viewAttempt && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity" onClick={() => setIsResultOpen(false)} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vh] lg:w-[60vw] lg:h-[80vh] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in zoom-in-50 duration-300">
                        {/* Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <CheckCircle className="text-green-500" size={24} />
                                Result Analysis
                            </h3>
                            <button onClick={() => setIsResultOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto flex-1">
                            {/* Score Stats */}
                            <div className="flex flex-col items-center justify-center mb-10">
                                <div className="relative w-40 h-40">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke={viewAttempt.score === viewAttempt.maxScore ? "#22c55e" : viewAttempt.score > 0 ? "#3b82f6" : "#ef4444"}
                                            strokeWidth="12"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray="440"
                                            strokeDashoffset={440 - 440 * (Math.max(0, viewAttempt.score) / viewAttempt.maxScore)}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl font-black text-slate-800">{viewAttempt.score}</span>
                                        <span className="text-sm text-slate-400 font-bold uppercase tracking-wider">/ {viewAttempt.maxScore}</span>
                                    </div>
                                </div>
                                <div className="mt-4 text-center">
                                    <h4 className="text-xl font-bold text-slate-800">
                                        {viewAttempt.score === viewAttempt.maxScore ? "Perfect Score!" : "Detailed Analysis"}
                                    </h4>
                                    <p className="text-slate-500 text-sm">
                                        Score logic: +1 for correct, -1 for incorrect selections.
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Review */}
                            <div className="space-y-6">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Info size={16} /> Solution Check
                                    </h4>
                                    <div className="space-y-3">
                                        {question?.options?.map((option, index) => {
                                            const isSelected = viewAttempt.userAnswers.includes(option); // Note: Backend likely saves as userAnswers
                                            const isCorrect = question.correctOptions.includes(option);

                                            // Determine visual state
                                            let borderClass = 'border-slate-100';
                                            let bgClass = 'bg-white';
                                            let icon = null;

                                            if (isSelected && isCorrect) {
                                                // Correctly selected (+1)
                                                borderClass = 'border-green-200';
                                                bgClass = 'bg-green-50';
                                                icon = <span className="text-green-600 font-bold text-xs flex items-center gap-1">+1 Score <CheckCircle size={14} /></span>;
                                            } else if (isSelected && !isCorrect) {
                                                // Incorrectly selected (-1)
                                                borderClass = 'border-red-200';
                                                bgClass = 'bg-red-50';
                                                icon = <span className="text-red-500 font-bold text-xs flex items-center gap-1">-1 Penalty <X size={14} /></span>;
                                            } else if (!isSelected && isCorrect) {
                                                // Missed correct answer
                                                borderClass = 'border-yellow-200';
                                                bgClass = 'bg-yellow-50';
                                                icon = <span className="text-yellow-600 font-bold text-xs">Missed Answer</span>;
                                            }

                                            return (
                                                <div
                                                    key={index}
                                                    className={`p-3 rounded-lg border flex justify-between items-center ${borderClass} ${bgClass}`}
                                                >
                                                    <span className={`text-sm font-medium ${isSelected || isCorrect ? 'text-slate-800' : 'text-slate-500'}`}>
                                                        {option}
                                                    </span>
                                                    {icon}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => {
                                    setIsResultOpen(false);
                                    handleRedo();
                                }}
                                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                            >
                                Practice Again
                            </button>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
};

export default ListeningMultiChoiceMultiAnswer;
