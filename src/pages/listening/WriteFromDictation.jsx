import React, { useEffect, useRef, useState } from "react";
//import { ArrowLeft, Clock, Volume2, RotateCcw, ChevronRight, X, ChevronLeft, RefreshCw, CheckCircle, Shuffle, History, Share2, Trash2, Info, Hash, Languages, Eye } from "lucide-react";
import { useSelector } from "react-redux";
import api, { submitWriteFromDictationAttempt } from "../../services/api";

const MAX_TIME = 60; // Usually short for WFD

import {
  ArrowLeft,
  Clock,
  Volume2,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  CheckCircle,
  Shuffle,
  History,
  Hash,
  Languages,
  Eye,
  Users,
  User,
  X,
  Info,
  FileText
} from "lucide-react";
// import axios from "axios"; // Removed direct axios import


const Toast = ({ show, onClose, title, children }) => {
  if (!show) return null;
  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl p-6 max-w-lg w-[90vw] relative border border-slate-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
        <div className="mb-2 flex items-center gap-2">
          {title}
        </div>
        <div className="text-sm font-medium leading-relaxed text-slate-600 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};





function WFDAttemptHistory({ question }) {
  const [mode, setMode] = useState("my"); // my | community
  const [community, setCommunity] = useState([])

  const attempts =
    mode === "my"
      ? question?.lastAttempts || []
      : community;

  const fetchCommunityAttempts = async () => {
    try {

      const { data } = await api.get(`/write-from-dictation/${question._id}/community`);

      console.log(data?.data)
      setCommunity(data?.data);

    } catch (err) {
      console.error("Community fetch error:", err);
    }

  };

  const handleTabChange = (tab) => {
    setMode(tab);

    fetchCommunityAttempts();
  };

  //   if (!attempts.length) {
  //     return (
  //       <div className="bg-white rounded-2xl border p-6 text-center text-slate-400">
  //         <History className="mx-auto mb-2" />
  //         No attempts yet
  //       </div>
  //     );
  //   }

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-800 flex items-center gap-2">
          <History size={20} className="text-blue-500" />
          Attempt History
        </h3>

        {/* TOGGLE */}
        <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-bold">
          <button
            onClick={() => handleTabChange("my")}
            className={`px-3 py-1 rounded-md flex items-center gap-1 ${mode === "my"
              ? "bg-white shadow text-blue-600"
              : "text-slate-500"
              }`}
          >
            <User size={14} /> My
          </button>
          <button
            onClick={() => handleTabChange("community")}
            className={`px-3 py-1 rounded-md flex items-center gap-1 ${mode === "community"
              ? "bg-white shadow text-purple-600"
              : "text-slate-500"
              }`}
          >
            <Users size={14} /> Community
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {attempts.map((attempt, index) => {
          const correct =
            attempt.wordAnalysis?.filter(w => w.status === "correct").length || 0;
          const missing =
            attempt.wordAnalysis?.filter(w => w.status === "missing").length || 0;
          const extra =
            attempt.wordAnalysis?.filter(w => w.status === "extra").length || 0;

          return (
            <div
              key={index}
              className="border rounded-xl p-4 bg-slate-50 hover:bg-slate-100 transition"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500">
                  {mode === "community"
                    ? attempt.userName || "Anonymous"
                    : `Attempt #${question.attemptCount - index}`}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(attempt.createdAt).toLocaleString()}
                </span>
              </div>

              {/* SCORE */}
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl font-black text-slate-800">
                  {attempt.totalScore}
                  <span className="text-sm text-slate-400"> / 10</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock size={14} />
                  {attempt.timeTaken}s
                </div>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-3 gap-3 text-xs font-bold">
                <Stat label="Correct" value={correct} color="green" />
                <Stat label="Missing" value={missing} color="red" />
                <Stat label="Extra" value={extra} color="purple" />
              </div>

              {/* TRANSCRIPT */}
              <div className="mt-3">
                <p className="text-xs font-bold text-slate-500 mb-1">
                  Answer
                </p>
                <p className="text-sm text-slate-700 bg-white border rounded-lg p-2 line-clamp-3">
                  {attempt.studentTranscript}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const Stat = ({ label, value, color }) => {
  const colors = {
    green: "text-green-600 bg-green-100",
    red: "text-red-600 bg-red-100",
    purple: "text-purple-600 bg-purple-100",
  };

  return (
    <div className="flex items-center gap-2 bg-white border rounded-lg p-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${colors[color]}`}>
        {value}
      </div>
      <span className="text-slate-600">{label}</span>
    </div>
  );
};


export default function WriteFromDictation({
  question,
  setActiveSpeechQuestion,
  nextButton,
  previousButton,
  shuffleButton,
}) {
  const { user } = useSelector((state) => state.auth);

  const audioRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [prepTimer, setPrepTimer] = useState(3);

  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFinished, setAudioFinished] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  /* ---------------- PREP TIMER ---------------- */
  useEffect(() => {
    if (!started && prepTimer > 0) {
      const t = setTimeout(() => setPrepTimer((p) => p - 1), 1000);
      return () => clearTimeout(t);
    }

    if (!started && prepTimer === 0) {
      handleStart();
    }
  }, [prepTimer, started]);

  /* ---------------- MAIN TIMER ---------------- */
  useEffect(() => {
    if (!started || audioFinished || timeLeft <= 0 || status === "result") return;
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [started, audioFinished, timeLeft, status]);

  /* ---------------- AUDIO CONTROL ---------------- */
  const handleStart = () => {
    setStarted(true);
    setTimeout(() => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => { });
    }, 300);
  };

  const togglePlayPause = () => {
    if (!audioRef.current || audioFinished) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => { });
  };

  const handleSkipAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = audioDuration;
    setAudioFinished(true);
    setIsPlaying(false);
  };

  /* ---------------- HELPERS ---------------- */
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  /* ---------------- SUBMIT ---------------- */
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
    } catch {
      setStatus("idle");
    }
  };

  const resetSession = () => {
    setStarted(false);
    setPrepTimer(3);
    setCurrentTime(0);
    setAudioFinished(false);
    setIsPlaying(false);
    setTimeLeft(MAX_TIME);
    setAnswer("");
    setStatus("idle");
    setResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* HEADER */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveSpeechQuestion(false)}
          className="hover:bg-gray-100 p-2 rounded-full transition"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">
          Write From Dictation <span className="text-purple-600 font-black italic">AI+</span>
        </h1>
      </div>

      {/* DESCRIPTION */}
      <div>
        <p>
          You will hear a sentence. Type the sentence in the box below exactly as you hear it. You
          will hear the sentence only once.
        </p>
      </div>

      {/* MAIN */}
      {!started ? (
        <div className="bg-white border rounded-2xl p-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Starting Soon…</h2>
          <div className="text-6xl font-black text-blue-600 animate-pulse">{prepTimer}</div>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl p-6 space-y-6">
          {/* AUDIO BAR */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl">
            <button
              onClick={togglePlayPause}
              disabled={audioFinished}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-full text-white flex items-center justify-center"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <div className="flex-1">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{
                    width:
                      audioDuration > 0
                        ? `${Math.min((currentTime / audioDuration) * 100, 100)}%`
                        : "0%",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>

            {!audioFinished && (
              <button onClick={handleSkipAudio} className="text-sm font-bold text-blue-600">
                Skip
              </button>
            )}
          </div>

          {/* INPUT + TIMER */}
          <div className="grid grid-cols-12 gap-6">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={audioFinished ? "Type the sentence you heard…" : "Listening…"}
              className="col-span-12 lg:col-span-9 h-40 p-4 border-2 border-dashed border-blue-200 rounded-xl resize-none text-lg break-words"
            />

            <div className="col-span-12 lg:col-span-3 bg-slate-50 rounded-xl p-6 border text-center space-y-4">
              <div className="flex justify-center items-center gap-2 text-blue-600 font-bold text-xl">
                <Clock /> {formatTime(timeLeft)}
              </div>
              <div>
                <div className="text-4xl font-black">{wordCount}</div>
                <p className="text-sm text-slate-500">Words</p>
              </div>

              <button
                disabled={status === "submitting"}
                onClick={handleSubmit}
                className="w-full bg-blue-600 disabled:bg-slate-300 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 disabled:shadow-none"
              >
                {status === "submitting" ? "Evaluating..." : "Submit Answer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER NAV */}
      <div className="flex items-center justify-between pb-6 mt-6">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-4">
          {/* Transcribe */}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className={`flex flex-col items-center gap-1 transition-colors ${showTranscript ? "text-blue-600" : "text-slate-600 hover:text-slate-800"}`}
          >
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm transition-all ${showTranscript ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white"}`}>
              <FileText size={18} />
            </div>
            <span className="text-xs font-bold">Transcribe</span>
          </button>

          {/* Answer */}
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className={`flex flex-col items-center gap-1 transition-colors ${showAnswer ? "text-emerald-600" : "text-slate-600 hover:text-slate-800"}`}
          >
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm transition-all ${showAnswer ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-white"}`}>
              <Eye size={18} />
            </div>
            <span className="text-xs font-bold">Answer</span>
          </button>

          <button
            onClick={resetSession}
            className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
              <RefreshCw size={18} />
            </div>
            <span className="text-xs font-bold">Redo</span>
          </button>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">
          <button
            onClick={previousButton}
            className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
              <ChevronLeft size={20} />
            </div>
            <span className="text-xs font-bold">Previous</span>
          </button>

          <button
            onClick={nextButton}
            className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
              <ChevronRight size={20} />
            </div>
            <span className="text-xs font-bold">Next</span>
          </button>
        </div>
      </div>

      <WFDAttemptHistory question={question} />

      {/* TRANSCRIPT TOAST */}
      <Toast
        show={showTranscript}
        onClose={() => setShowTranscript(false)}
        title={<><FileText size={18} className="text-blue-600" /><span className="font-bold text-slate-800">Audio Transcript</span></>}
      >
        <p className="leading-relaxed text-slate-600">
          {question?.transcript || "No transcript available for this audio."}
        </p>
      </Toast>

      {/* ANSWER TOAST */}
      <Toast
        show={showAnswer}
        onClose={() => setShowAnswer(false)}
        title={<><CheckCircle size={18} className="text-emerald-600" /><span className="font-bold text-slate-800">Correct Sentence</span></>}
      >
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <p className="font-bold text-emerald-900 text-lg leading-relaxed">
            {question?.transcript || "No answer available."}
          </p>
        </div>
      </Toast>

      {/* AUDIO ELEMENT */}
      <audio
        ref={audioRef}
        src={question.audioUrl}
        className="hidden"
        onLoadedMetadata={() => setAudioDuration(audioRef.current.duration)}
        onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setAudioFinished(true);
        }}
      />

      {status === "result" && result && (
        <WFDResultModal
          result={result}
          onClose={() => setStatus("idle")}
          onRedo={resetSession}
          onNext={nextButton}
          question={question}
        />
      )}
    </div>
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
