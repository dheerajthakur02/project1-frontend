

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Info,
  BookOpen,
  Headphones,
  Volume2,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  History,
  Share2,
  Trash2,
  X,
  Languages,
  Eye,
  RefreshCw,
  BarChart2,
  Users
} from "lucide-react";

import { useSelector } from "react-redux";
import { submitHighlightAttempt } from "../../services/api";
import axios from "axios";

const PREP_TIME = 3;

const AttemptHistory = ({ question, attempts, setResult, setStatus,onSelectAttempt  }) => {
  const [activeTab, setActiveTab] = useState("my");
  const [communityAttempts, setCommunityAttempts] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);

  const fetchCommunityAttempts = async () => {
    try {
      setLoadingCommunity(true);
      const res = await axios.get(`api/hcs/${question._id}/community`);
    
        setCommunityAttempts(res?.data?.data);
      
    } catch (err) {
      console.error("Community fetch error:", err);
    } finally {
      setLoadingCommunity(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "community" && communityAttempts.length === 0) {
      fetchCommunityAttempts();
    }
  };

  const dataToRender = activeTab === "my" ? attempts : communityAttempts;

  return (
    <div className="mt-12 font-sans">
      {/* HEADER + TABS */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="text-purple-600" size={20} />
          <h3 className="font-bold text-slate-800">
            {activeTab === "my" ? "Your Attempts" : "Community Attempts"}
          </h3>
        </div>

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
            <Users size={14} />
            Community
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
              className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow group cursor-pointer"
            >
              {/* USER (Community only) */}
              {activeTab === "community" && (
                <div className="min-w-[150px]">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    User
                  </span>
                  <div className="text-sm font-semibold text-slate-700">
                    {attempt.user?.name || "Anonymous"}
                  </div>
                </div>
              )}

              {/* DATE */}
              <div className="min-w-[150px]">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Date
                </span>
                <div className="text-sm font-semibold text-slate-700">
                  {attempt.createdAt
                    ? new Date(attempt.createdAt).toLocaleString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Just now"}
                </div>
              </div>

              {/* SCORE */}
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Score
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-xl font-bold ${
                      attempt.score === attempt.maxScore
                        ? "text-green-600"
                        : attempt.score > attempt.maxScore / 2
                        ? "text-blue-600"
                        : "text-red-500"
                    }`}
                  >
                    {attempt.isCorrect ? "1":"0"}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">
                    / 1
                  </span>
                </div>
              </div>

              {/* STATUS */}
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    attempt.score === attempt.maxScore
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {attempt.score === attempt.maxScore
                    ? "Perfect"
                    : "Completed"}
                </span>
              </div>

              {/* ACTION */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 font-bold text-sm">
                View Result →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function HCS({ question, setActiveSpeechQuestion, nextButton, previousButton }) {
  const { user } = useSelector((state) => state.auth);

  const audioRef = useRef(null);
  const progressRef = useRef(null);

  const [status, setStatus] = useState("countdown");
  const [prepTimer, setPrepTimer] = useState(PREP_TIME);

  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFinished, setAudioFinished] = useState(false);

  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (status !== "countdown" || prepTimer <= 0) return;

    const t = setTimeout(() => setPrepTimer(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [status, prepTimer]);

  useEffect(() => {
    if (status === "countdown" && prepTimer === 0) {
      handleAudioStart();
    }
  }, [prepTimer, status]);

  /* ---------------- AUDIO ---------------- */
  const handleAudioStart = () => {
    setStatus("playing");

    setTimeout(() => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => { });
    }, 300);
  };

  const togglePlayPause = () => {
    if (!audioRef.current || audioFinished) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => { });
    }
  };

  const handleSkip = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = audioDuration;
    setAudioFinished(true);
    setIsPlaying(false);
  };

  /* ---------------- HELPERS ---------------- */
  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const resetSession = () => {
    setStatus("countdown");
    setPrepTimer(PREP_TIME);
    setSelectedOption(null);
    setAudioFinished(false);
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    try {
      const res = await submitHighlightAttempt({
        questionId: question._id,
        selectedSummaryIndex: selectedOption,
        userId: user._id,
        timeTaken: Math.floor(currentTime),
      });
      setResult(res.data);
      setStatus("result");
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">

      <div className="max-w-7xl mx-auto space-y-6">

          <div>
        <h1>
            Highlight Correct Summary
        </h1>
        <p>
          You will hear a recording. Click on the paragraph that best relates to the recording.
        </p>
      </div>

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveSpeechQuestion(false)} className="p-2 bg-white border rounded-full">
              <ArrowLeft />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Highlight Correct Summary <Info size={16} className="text-blue-500" />
            </h1>
          </div>
          <button className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-xl">
            <BookOpen size={18} /> Study Guide
          </button>
        </div>

        {/* MAIN CARD */}
        {status === "countdown" ? (
          <div className="bg-white rounded-3xl border p-24 text-center">
            <h2 className="text-2xl font-bold">Starting Soon…</h2>
            <div className="text-6xl font-black text-blue-600 animate-pulse">
              {prepTimer}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border overflow-hidden">

            {/* AUDIO BAR */}
            <div className="px-8 py-6 bg-slate-50 border-b flex items-center gap-6">
              <button
                onClick={togglePlayPause}
                disabled={audioFinished}
                className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:bg-slate-300"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <div className="flex-1">
                <div
                  ref={progressRef}
                  className="h-2 bg-slate-200 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{
                      width: audioDuration
                        ? `${Math.min((currentTime / audioDuration) * 100, 100)}%`
                        : "0%",
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-400 font-bold mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(audioDuration)}</span>
                </div>
              </div>

              {!audioFinished && (
                <button onClick={handleSkip} className="text-blue-600 font-bold">
                  <SkipForward size={20} />
                </button>
              )}
            </div>

            {/* OPTIONS */}
            <div className="p-8 space-y-4">
              {question.summaries.map((opt, i) => (
                <div
                  key={opt._id}
                  onClick={() => setSelectedOption(i)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition
                    ${selectedOption === i
                      ? "border-blue-500 bg-blue-50"
                      : "border-transparent hover:bg-slate-50"}`}
                >
                  <p className="font-bold text-sm text-slate-400 mb-1">
                    OPTION {String.fromCharCode(65 + i)}
                  </p>
                  <p className="text-slate-700 leading-relaxed break-words">
                    {opt.text}
                  </p>
                </div>
              ))}
            </div>


            {/* SUBMIT BUTTON - MOVED INSIDE CARD */}
            <div className="px-8 pb-8">
              <button
                onClick={handleSubmit}
                disabled={selectedOption === null}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg disabled:bg-slate-300 shadow-lg shadow-blue-200 disabled:shadow-none transition-all hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={24} /> Submit Answer
              </button>
            </div>
          </div>
        )}

        {/* FOOTER CONTROLS - REPLACED WITH SST STYLE */}
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
      </div>
<AttemptHistory question={question} attempts={question?.lastAttempts} />
      {/* AUDIO */}
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

      {/* RESULT */}
      {
        status === "result" && result && (
          <HCSResultModal
            result={result}
            onClose={() => setStatus("idle")}
            onRedo={() => {
              setStatus("countdown");
              setPrepTimer(PREP_TIME);
              setSelectedOption(null);
            }}
          />
        )
      }
    </div >
  );
}


/* ================= RESULT MODAL ================= */
const HCSResultModal = ({ result, onClose, onRedo }) => {


  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = result.score; // 0 or 1
  const offset = circumference - circumference * progress;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden relative border">

        {/* MODAL HEADER */}
        <div className="p-8 flex justify-between items-center border-b bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
              <Share2 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">
                Evaluation Result
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {result.isHistory ? "Viewing Past Attempt" : "New Attempt Submitted"}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={onRedo} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black transition">
              <RotateCcw size={20} /> Redo
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black transition">
              Next Question <ChevronRight size={20} />
            </button>
            <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-500 transition">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-10 grid grid-cols-12 gap-10">
          {/* SCORE GAUGE */}
          <div className="col-span-12 lg:col-span-4 bg-white rounded-[2.5rem] border-4 border-slate-50 p-10 flex flex-col items-center">
            <h3 className="text-sm font-black text-slate-400 mb-8 uppercase tracking-widest">Performance Score</h3>
            <div className="relative w-full aspect-square max-w-[240px] flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="18"
                  strokeLinecap="round"
                />

                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="url(#modalGradient)"
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className="transition-all duration-[1000ms]"
                />

                <defs>
                  <linearGradient id="modalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-black text-slate-800">{result.score}</span>
                <div className="flex justify-between w-32 mt-2 text-[10px] font-black text-slate-300 uppercase">
                  <span>0</span><span>1</span>
                </div>
              </div>
            </div>

            <div className="w-full mt-10 space-y-3">
              <div className="flex justify-between items-center bg-emerald-50 px-5 py-4 rounded-2xl border border-emerald-100">
                <span className="font-bold text-emerald-700 text-sm">Reading</span>
                <span className="font-black text-emerald-800">{result.readingScore?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-purple-50 px-5 py-4 rounded-2xl border border-purple-100">
                <span className="font-bold text-purple-700 text-sm">Listening</span>
                <span className="font-black text-purple-800">{result.listeningScore?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ANSWERS COMPARISON */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-[2.5rem] border-2 border-slate-50 overflow-hidden bg-white shadow-sm">
              <div className="bg-emerald-500 p-4">
                <h4 className="font-black text-white uppercase tracking-wider text-xs">Correct Answer</h4>
              </div>
              <div className="p-8 relative">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black mb-4">
                  {result.correctAnswer}
                </div>
                <p className="text-slate-600 font-medium leading-relaxed italic text-sm">{result.correctAnswerText}</p>
              </div>
            </div>

            <div className="rounded-[2.5rem] border-2 border-slate-50 overflow-hidden bg-white shadow-sm">
              <div className={`p-4 ${result.score === 1 ? 'bg-blue-500' : 'bg-rose-500'}`}>
                <h4 className="font-black text-white uppercase tracking-wider text-xs">My Selection</h4>
              </div>
              <div className="p-8 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black mb-4 ${result.score === 1 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                  {result.myAnswer}
                </div>
                <p className="text-slate-600 font-medium leading-relaxed italic text-sm">{result.myAnswerText || "No option was selected."}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-3 bg-gradient-to-r from-blue-500 to-purple-600 w-full" />
      </div>
    </div>
  );
};