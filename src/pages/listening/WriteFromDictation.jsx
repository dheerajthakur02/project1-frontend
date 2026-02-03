import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Clock, Volume2, RotateCcw, ChevronRight, X, ChevronLeft, RefreshCw, CheckCircle, Shuffle, History, Share2, Trash2, Info, Hash, Languages, Eye } from "lucide-react";
import { useSelector } from "react-redux";
import { submitWriteFromDictationAttempt } from "../../services/api";

const MAX_TIME = 60; // Usually short for WFD

export default function WriteFromDictation({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) {
    const { user } = useSelector((state) => state.auth);
    const audioRef = useRef(null);

    const [started, setStarted] = useState(false);
    const [prepStatus, setPrepStatus] = useState("countdown"); // "countdown", "finished"
    const [prepTimer, setPrepTimer] = useState(3);

    const [audioFinished, setAudioFinished] = useState(false);
    const [timeLeft, setTimeLeft] = useState(MAX_TIME);
    const [answer, setAnswer] = useState("");
    const [status, setStatus] = useState("idle");
    const [result, setResult] = useState(null);

    /* ---------------- TIMER ---------------- */
    // 3-sec Prep Timer
    useEffect(() => {
        if (prepStatus === "countdown" && prepTimer > 0) {
            const timer = setInterval(() => setPrepTimer((prev) => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (prepStatus === "countdown" && prepTimer === 0) {
            setPrepStatus("finished");
            handleStart();
        }
    }, [prepStatus, prepTimer]);

    useEffect(() => {
        if (!audioFinished || timeLeft <= 0 || status === "result") return;
        const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        return () => clearInterval(timer);
    }, [audioFinished, timeLeft, status]);

    /* ---------------- HELPERS ---------------- */
    const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const handleStart = () => {
        setStarted(true);
        setTimeout(() => audioRef.current?.play(), 300);
    };

    const handleSubmit = async () => {
        setStatus("submitting");
        try {
            const res = await submitWriteFromDictationAttempt({
                questionId: question._id,
                studentTranscript: answer,
                userId: user._id,
                timeTaken: MAX_TIME - timeLeft,
            });
            setResult(res.data);
            setStatus("result");
        } catch (error) {
            console.error("Submission failed", error);
            setStatus("idle");
        }
    };

    const resetSession = () => {
        setResult(null);
        setStatus('idle');
        setAnswer("");
        setStarted(false);
        setPrepStatus("countdown");
        setPrepTimer(3);
        setAudioFinished(false);
        setTimeLeft(MAX_TIME);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-4">
            <div>
                <h1>Write From Dictation</h1>
                <p>You will hear a sentence. Type the sentence in the box below exactly as you hear it. Write as much of the sentence as you can. You will hear the sentence only once.
                </p>
            </div>
            {/* HEADER */}
            <div className="flex items-center gap-2">
                <button onClick={() => setActiveSpeechQuestion(false)} className="hover:bg-gray-100 p-2 rounded-full transition">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">
                    Write From Dictation <span className="text-purple-600 font-black italic">AI+</span>
                </h1>
            </div>

            {/* MAIN CARD */}
            {!started ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 text-center space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800">Starting Soon...</h2>
                    <div className="text-6xl font-black text-blue-600 animate-pulse">{prepTimer}</div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-6">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center mb-6 rounded-t-xl -mx-6 -mt-6">
                        <div className="flex gap-4 items-center">
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                                <Hash size={14} />
                                {question?._id?.slice(-5)?.toUpperCase()}
                            </span>
                            <span className="text-slate-500 text-sm font-medium border-l border-slate-200 pl-4">
                                {question?.title || "Write From Dictation Task"}
                            </span>
                        </div>
                        {
                            question?.difficulty && (
                                <span className={`px-2 py-1 rounded-md text-xs font-bold shadow-sm ${question.difficulty === 'Hard' ? 'bg-red-100 text-red-600' :
                                    question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                    {question.difficulty}
                                </span>
                            )
                        }
                    </div >

                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl">
                        <div className="bg-blue-600 p-3 rounded-full text-white">
                            <Volume2 size={20} />
                        </div>
                        <audio
                            ref={audioRef}
                            src={question.audioUrl}
                            onEnded={() => setAudioFinished(true)}
                            controls
                            className="w-full"
                        />
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-9">
                            <textarea
                                // disabled={!audioFinished || status === "submitting"}
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder={audioFinished ? "Type the sentence you heard..." : "Listening..."}
                                className="w-full h-40 border-2 border-dashed border-blue-200 focus:border-blue-500 rounded-xl p-4 outline-none resize-none transition-colors text-lg"
                            />
                        </div>

                        <div className="col-span-12 lg:col-span-3 bg-slate-50 rounded-xl p-6 flex flex-col items-center justify-between border">
                            <div className="space-y-4 w-full text-center">
                                <div className="flex justify-center items-center gap-2 text-blue-600 font-bold text-xl bg-blue-50 py-2 rounded-lg">
                                    <Clock size={20} /> {formatTime(timeLeft)}
                                </div>

                                <div>
                                    <div className="text-4xl font-black text-slate-800">{wordCount}</div>
                                    <p className="text-sm text-slate-500 font-medium">Word Count</p>
                                </div>

                                <button
                                    disabled={status === "submitting"} // Allow submitting even if word count is low, as sentences can be short
                                    onClick={handleSubmit}
                                    className="w-full bg-blue-600 disabled:bg-slate-300 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 disabled:shadow-none"
                                >
                                    {status === "submitting" ? "Evaluating..." : "Submit Answer"}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            )}
            {/* Footer Nav */}
            <div className="flex items-center justify-between pb-6 mt-6">
                {/* LEFT SIDE: Translate, Answer, Redo */}
                <div className="flex items-center gap-4">
                    {/* Translate (Static) */}
                    <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors cursor-default">
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                            <Languages size={18} />
                        </div>
                        <span className="text-xs font-medium">Translate</span>
                    </button>

                    {/* Answer (Static) */}
                    <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors cursor-default text-opacity-50">
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                            <Eye size={18} />
                        </div>
                        <span className="text-xs font-medium">Answer</span>
                    </button>

                    {/* Redo */}
                    <button onClick={resetSession} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                            <RefreshCw size={18} />
                        </div>
                        <span className="text-xs font-medium">Redo</span>
                    </button>
                </div>

                {/* RIGHT SIDE: Prev, Next */}
                <div className="flex items-center gap-4">
                    <button onClick={previousButton} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                            <ChevronLeft size={20} />
                        </div>
                        <span className="text-xs font-medium">Previous</span>
                    </button>

                    <button onClick={nextButton} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                            <ChevronRight size={20} />
                        </div>
                        <span className="text-xs font-medium">Next</span>
                    </button>
                </div>
            </div>


            {/* ATTEMPT HISTORY SECTION */}
            <div className="mt-8 font-sans">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
                    <History className="text-purple-600" size={20} />
                    <h3 className="font-bold text-slate-800">History ({question.lastAttempts?.length || 0})</h3>
                </div>

                <div className="space-y-4">
                    {question.lastAttempts && question.lastAttempts.length > 0 ? (
                        question.lastAttempts.map((attempt, idx) => (
                            <div
                                key={attempt._id || idx}
                                onClick={() => { setResult(attempt); setStatus("result"); }}
                                className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow group cursor-pointer"
                            >
                                {/* Date */}
                                <div className="min-w-[150px]">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Date</span>
                                    <div className="text-sm font-semibold text-slate-700">
                                        {attempt.createdAt ? new Date(attempt.createdAt).toLocaleString('en-US', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        }) : 'Just now'}
                                    </div>
                                </div>

                                {/* Score */}
                                <div className="flex-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Score</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-xl font-bold ${attempt.totalScore >= 9 ? 'text-green-600' :
                                            attempt.totalScore >= 5 ? 'text-blue-600' : 'text-red-500'
                                            }`}>
                                            {attempt.totalScore}
                                        </span>
                                        <span className="text-sm text-slate-400 font-medium">/ 10</span>
                                    </div>
                                </div>

                                {/* Status/Badge */}
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${attempt.totalScore >= 9 ? 'bg-green-100 text-green-700' :
                                        'bg-slate-100 text-slate-600'
                                        }`}>
                                        {attempt.totalScore >= 9 ? 'Perfect' : 'Completed'}
                                    </span>
                                </div>

                                {/* View Action */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 font-bold text-sm flex items-center gap-1">
                                    View Result <ChevronRight size={16} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                                <History size={20} className="text-slate-300" />
                            </div>
                            <p className="text-sm font-medium">No attempts yet</p>
                            <p className="text-xs mt-1 opacity-70">Complete the exercise to see your history</p>
                        </div>
                    )}
                </div>
            </div>

            {
                status === "result" && result && (
                    <WFDResultModal
                        result={result}
                        question={question}
                        onClose={() => setStatus("idle")}
                        onRedo={resetSession}
                        onNext={nextButton}
                    />
                )
            }
        </div >
    );
}

// Custom Result Modal for WFD
const WFDResultModal = ({ result, onClose, onRedo, onNext, question }) => {
    if (!result) return null;

    const {
        totalScore,
        scores, // { listening, writing }
        wordAnalysis, // [{ word, status }]
    } = result;

    // Derive Missing/Extra/Correct counts
    const correctCount = wordAnalysis.filter(w => w.status === 'correct').length;
    const extraCount = wordAnalysis.filter(w => w.status === 'extra').length; // User wrote it but it wasn't matched
    const missingCount = wordAnalysis.filter(w => w.status === 'missing').length; // In origin but not matched

    // Reconstruct the user's sentence for display (filtering out 'missing' which are backend-added for analysis reference)
    // Actually, my backend logic for 'wordAnalysis' is: it maps USER words to statuses, AND appends MISSING words at the end relative to original.
    // So for "My Answer" display, I should show words that are NOT 'missing'.
    // For "Missing Words" display, I show only 'missing'.

    const userWords = wordAnalysis.filter(w => w.status !== 'missing');
    const missingWords = wordAnalysis.filter(w => w.status === 'missing');

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* HEADER */}
                <div className="sticky top-0 z-10 bg-white flex justify-between items-center p-6 border-b">
                    <h2 className="font-bold text-xl flex items-center gap-2">
                        Result - Write From Dictation
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-md">AI+ Evaluation</span>
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={onRedo} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 font-bold hover:bg-slate-200">Redo</button>
                        <button onClick={onNext} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">Next Question</button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
                    </div>
                </div>

                {/* BODY */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8 max-h-[80vh] overflow-y-auto">

                    {/* LEFT: Score Circle */}
                    <div className="col-span-12 md:col-span-4 flex flex-col items-center justify-center bg-white border rounded-3xl p-6 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Your Score</h3>
                        <div className="relative w-48 h-24 mb-6">
                            {/* Semi-Circle SVG or just simple Circle */}
                            <svg className="w-full h-full" viewBox="0 0 200 100">
                                <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
                                <path
                                    d="M 10 100 A 90 90 0 0 1 190 100"
                                    fill="none"
                                    stroke="url(#grad1)"
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray="283"
                                    strokeDashoffset={283 - (283 * (totalScore / 10))} // Scale to 10
                                />
                                <defs>
                                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#d946ef" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                                <span className="text-4xl font-black text-slate-800">{totalScore}</span>
                                <span className="text-sm text-slate-400 font-bold">/ 10</span>
                            </div>
                        </div>

                        {/* Sub-Scores */}
                        <div className="w-full space-y-3">
                            <div className="flex justify-between items-center bg-pink-50 p-3 rounded-lg border border-pink-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                                    <span className="text-sm font-bold text-slate-700">Listening</span>
                                </div>
                                <span className="font-black text-slate-800">{scores.listening.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <span className="text-sm font-bold text-slate-700">Writing</span>
                                </div>
                                <span className="font-black text-slate-800">{scores.writing.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Analysis */}
                    <div className="col-span-12 md:col-span-8 space-y-6">

                        {/* My Answer Section */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <h4 className="font-bold text-slate-700">My Answer</h4>
                                <button className="text-[10px] flex items-center gap-1 text-slate-400 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200">
                                    <Info size={12} /> Click on word for definition
                                </button>
                            </div>
                            <div className="bg-slate-50 border p-4 rounded-xl leading-relaxed text-lg">
                                {userWords.map((w, i) => (
                                    <span
                                        key={i}
                                        className={`mr-1 inline-block px-1 rounded-md cursor-pointer ${w.status === 'correct' ? 'text-slate-800' : 'text-purple-600 bg-purple-100 font-medium'
                                            }`}
                                        title={w.status === 'correct' ? 'Good Word' : 'Extra Word'}
                                    >
                                        {w.word}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Missing Words Section */}
                        {missingCount > 0 && (
                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                                <h4 className="font-bold text-red-800 text-sm mb-2">Missing Words:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {missingWords.map((w, i) => (
                                        <span key={i} className="text-red-600 bg-white border border-red-100 px-2 py-1 rounded text-sm font-medium">
                                            {w.word}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Legend / Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                            <StatBadge count={correctCount} label="Good Words" color="bg-slate-800" text="text-white" />
                            <StatBadge count={extraCount} label="Extra Words" color="bg-purple-100" text="text-purple-700" />
                            <StatBadge count={missingCount} label="Missing Words" color="bg-red-100" text="text-red-600" />
                            {/* Placeholder for position errors if we implement strict sequence checking later */}
                            <StatBadge count={0} label="Incorrect Position" color="bg-blue-100" text="text-blue-600" />
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

const StatBadge = ({ count, label, color, text }) => (
    <div className="flex items-center gap-3 bg-white border p-3 rounded-xl shadow-sm">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${color} ${text}`}>
            {count}
        </div>
        <span className="text-xs font-bold text-slate-500 leading-tight">{label}</span>
    </div>
);
