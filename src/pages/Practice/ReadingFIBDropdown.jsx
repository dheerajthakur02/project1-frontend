import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Shuffle, Hash, BarChart2, Info, X } from 'lucide-react';
import { submitReadingFIBDropdownAttempt, getReadingFIBDropdownAttempts } from '../../services/api'; // Ensure this is imported
import { useSelector } from 'react-redux';

const AttemptHistory = ({ questionId, currentAttemptId, onSelectAttempt }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!questionId) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await getReadingFIBDropdownAttempts(questionId);
                if (res.success) {
                    console.log(res.data)
                    setHistory(res.data);
                }
            } catch (err) {
                console.error('Failed to fetch history', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [questionId, currentAttemptId]);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading history...</div>;

    if (history.length === 0) {
        return (
            <div className="mt-8 font-sans">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart2 className="text-purple-600" size={20} />
                    <h3 className="font-bold text-slate-800">Your Attempts</h3>
                </div>
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                        <Info size={20} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">No attempts yet</p>
                    <p className="text-xs mt-1 opacity-70">Complete the exercise to see your history</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12 font-sans">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
                <BarChart2 className="text-purple-600" size={20} />
                <h3 className="font-bold text-slate-800">History ({history.length})</h3>
            </div>

            <div className="space-y-4">
                {history.map((attempt) => (
                    <div
                        key={attempt._id}
                        onClick={() => onSelectAttempt?.(attempt)}
                        className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow group cursor-pointer"
                    >
                        {/* Date */}
                        <div className="min-w-[150px]">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Date</span>
                            <div className="text-sm font-semibold text-slate-700">
                                {new Date(attempt.createdAt).toLocaleString('en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </div>
                        </div>

                        {/* Score */}
                        <div className="flex-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Score</span>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-xl font-bold ${attempt.score === attempt.maxScore ? 'text-green-600' :
                                    attempt.score > (attempt.maxScore / 2) ? 'text-blue-600' : 'text-red-500'
                                    }`}>
                                    {attempt.score}
                                </span>
                                <span className="text-sm text-slate-400 font-medium">/ {attempt.maxScore}</span>
                            </div>
                        </div>

                        {/* Status/Badge */}
                        <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${attempt.score === attempt.maxScore ? 'bg-green-100 text-green-700' :
                                'bg-slate-100 text-slate-600'
                                }`}>
                                {attempt.score === attempt.maxScore ? 'Perfect' : 'Completed'}
                            </span>
                        </div>

                        {/* View Action */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 font-bold text-sm">
                            View Result &rarr;
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ReadingFIBDropdown = ({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) => {
    const { user } = useSelector((state) => state.auth);
    const [userAnswers, setUserAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [textSegments, setTextSegments] = useState([]);

    // UI State
    const [isResultOpen, setIsResultOpen] = useState(false);
    const [viewAttempt, setViewAttempt] = useState(null);

    // Initialize segments and answers on load
    useEffect(() => {
        if (question && question.text) {
            const segments = question.text.split(/_{2,}/g);
            setTextSegments(segments);
            resetForm();
        }
    }, [question]);

    const [status, setStatus] = useState("prep");
    const [timeLeft, setTimeLeft] = useState(3);

    useEffect(() => {
        if (status !== "prep") return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setStatus("answering");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [status]);

    const resetForm = () => {
        if (!question) return;
        const initialAnswers = {};
        question.blanks.forEach(b => {
            initialAnswers[b.index] = "";
        });
        setUserAnswers(initialAnswers);
        setResult(null);
        setIsResultOpen(false);
        setViewAttempt(null);
        setStatus("prep");
        setTimeLeft(3);
    }

    const handleAnswerChange = (index, value) => {
        setUserAnswers(prev => ({
            ...prev,
            [index]: value
        }));
    };

    const handleSubmit = async () => {
        if (!user?._id) return;

        const formattedAnswers = Object.keys(userAnswers).map(key => ({
            index: parseInt(key),
            answer: userAnswers[key]
        }));

        const payload = {
            userId: user._id,
            questionId: question._id,
            userAnswers: formattedAnswers
        };

        try {
            const res = await submitReadingFIBDropdownAttempt(payload);
            if (res.success) {
                setResult(res.data);
                setViewAttempt(res.data);
                setIsResultOpen(true);
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

    // Calculate progress/filled status
    const totalBlanks = question?.blanks?.length || 0;
    const filledBlanks = Object.values(userAnswers).filter(a => a !== "").length;
    const isSubmitDisabled = filledBlanks === 0;

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            <div>
                <h1>Fill in the Blanks (Drop Down)</h1>
                <p>There are some words missing in the following text. Please select the correct word in the drop-down box.</p>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => setActiveSpeechQuestion(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Fill in the Blanks (Dropdown)
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Reading</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-slate-500">
                        {filledBlanks} / {totalBlanks} filled
                    </div>
                </div>
            </div>

            {/* Question Card */}
            {status === "prep" ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 text-center space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800">Starting Soon...</h2>
                    <div className="text-6xl font-black text-primary-600 animate-pulse">
                        {timeLeft}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                                <Hash size={14} />
                                {question?._id?.slice(-5)?.toUpperCase()}
                            </span>
                            <span className="text-slate-500 text-sm font-medium border-l border-slate-200 pl-4">
                                {question?.title || "Reading Task"}
                            </span>
                        </div>
                        {question?.isPrediction && (
                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-md font-bold shadow-sm">
                                Predictive
                            </span>
                        )}
                    </div>

                    <div className="p-8 leading-relaxed text-lg text-slate-700">
                        {textSegments.map((segment, i) => {
                            const isOneIndexed = question?.blanks?.length > 0 && !question.blanks.some(b => b.index === 0);
                            const targetIndex = isOneIndexed ? i + 1 : i;
                            const blank = question?.blanks?.find(b => b.index === targetIndex);

                            return (
                                <React.Fragment key={i}>
                                    <span>{segment}</span>
                                    {i < textSegments.length - 1 && blank && (
                                        <span className="inline-block mx-1 align-middle">
                                            <select
                                                value={userAnswers[targetIndex] || ""}
                                                onChange={(e) => handleAnswerChange(targetIndex, e.target.value)}
                                                className="appearance-none px-4 py-1.5 rounded-lg border-2 text-base font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white border-slate-200 hover:border-blue-400 text-slate-700"
                                                style={{ minWidth: '120px' }}
                                            >
                                                <option value="" disabled className="text-slate-300">Select...</option>
                                                {blank.options.map((opt, optIdx) => (
                                                    <option key={optIdx} value={opt} className="text-slate-700">{opt}</option>
                                                ))}
                                            </select>
                                        </span>
                                    )}
                                </React.Fragment>
                            );
                        })}
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

            {/* History Section */}
            {question && (
                <AttemptHistory
                    questionId={question._id}
                    currentAttemptId={result?._id}
                    onSelectAttempt={openAttempt}
                />
            )}

            {/* Footer Nav */}
            <div className="flex items-center justify-center gap-6 py-6">
                <button onClick={previousButton} className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary-600 transition-colors group">
                    {/* Reuse nav styles */}
                    <div className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center bg-white shadow-sm group-hover:border-primary-200 group-hover:shadow-md transition-all"><ChevronLeft size={24} /></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Previous</span>
                </button>
                <button onClick={handleRedo} className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary-600 transition-colors group">
                    <div className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center bg-white shadow-sm group-hover:border-primary-200 group-hover:shadow-md transition-all"><RefreshCw size={20} /></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Redo</span>
                </button>
                <button onClick={shuffleButton} className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary-600 transition-colors group">
                    <div className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center bg-white shadow-sm group-hover:border-primary-200 group-hover:shadow-md transition-all"><Shuffle size={20} /></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Shuffle</span>
                </button>
                <button onClick={nextButton} className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary-600 transition-colors group">
                    <div className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center bg-white shadow-sm group-hover:border-primary-200 group-hover:shadow-md transition-all"><ChevronRight size={24} /></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Next</span>
                </button>
            </div>


            {/* =========================
                RESULT MODAL
               ========================= */}
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

                            {/* Score Header */}
                            <div className="flex flex-col items-center justify-center mb-10">
                                <div className="relative w-40 h-40">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke={viewAttempt.score === viewAttempt.maxScore ? "#22c55e" : "#3b82f6"}
                                            strokeWidth="12"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray="440"
                                            strokeDashoffset={440 - 440 * (viewAttempt.score / viewAttempt.maxScore)}
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
                                        {viewAttempt.score === viewAttempt.maxScore ? "Perfect Score!" : "Good Attempt"}
                                    </h4>
                                    <p className="text-slate-500 text-sm">You answered {viewAttempt.score} out of {viewAttempt.maxScore} correctly.</p>
                                </div>
                            </div>

                            {/* Detailed Text View with Inline Corrections */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 leading-relaxed text-lg text-slate-700">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <Info size={16} /> Detailed Review
                                </h4>

                                {textSegments.map((segment, i) => {
                                    const isOneIndexed = question?.blanks?.length > 0 && !question.blanks.some(b => b.index === 0);
                                    const targetIndex = isOneIndexed ? i + 1 : i;
                                    const blank = question?.blanks?.find(b => b.index === targetIndex);

                                    // Find user's answer for this blank in the viewed attempt
                                    const userAnsObj = viewAttempt.userAnswers.find(a => a.index === targetIndex);
                                    const userAns = userAnsObj ? userAnsObj.answer : "No Answer";
                                    const isCorrect = userAnsObj ? userAnsObj.isCorrect : false;

                                    return (
                                        <React.Fragment key={i}>
                                            <span>{segment}</span>
                                            {i < textSegments.length - 1 && blank && (
                                                <span className="inline-block mx-1 align-middle">
                                                    {isCorrect ? (
                                                        <span className="px-3 py-1 rounded-lg bg-green-100 text-green-700 font-bold border border-green-200">
                                                            {userAns} <CheckCircle size={14} className="inline ml-1" />
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex flex-col align-middle mx-1">
                                                            {/* User's Wrong Answer (if any) */}
                                                            {userAns && userAns !== "No Answer" && (
                                                                <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-600 line-through decoration-red-600 decoration-2 opacity-70 mb-0.5 w-fit">
                                                                    {userAns}
                                                                </span>
                                                            )}
                                                            {/* Correct Answer */}
                                                            <span className="px-3 py-1 rounded-lg bg-green-50 text-green-700 font-bold border border-green-200 shadow-sm whitespace-nowrap">
                                                                {blank.correctAnswer}
                                                            </span>
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => {
                                    setIsResultOpen(false);
                                    handleRedo(); // Optional: reset to try again immediately or just close
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

export default ReadingFIBDropdown;
