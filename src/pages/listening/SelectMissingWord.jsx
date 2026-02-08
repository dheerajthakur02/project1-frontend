import React, { useState, useEffect, useRef } from "react";
//import { ArrowLeft, Volume2, RotateCcw, ChevronRight, X, Play, CheckCircle2, Info, Headphones, BookOpen, Share2, History, Calendar, Trash2, Languages, Eye, RefreshCw, ChevronLeft } from "lucide-react";
import api, { submitChooseSingleAnswerAttempt, submitHighlightAttempt, submitSelectMissingWordAttempt } from "../../services/api";
import { useSelector } from "react-redux";

// import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Headphones,
  Volume2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Languages,
  Eye,
  History,
  RotateCcw,
  Share2,
  Trash2,
  CheckCircle2,
  BookOpen,
  Info,
  BarChart2,
  Users,
  X,
  FileText
} from "lucide-react";
// import axios from "axios"; // Removed direct axios import


const PREP_TIME = 3;




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


const AttemptHistory = ({ question, attempts, setResult, setStatus, onSelectAttempt }) => {

  const [activeTab, setActiveTab] = useState("my");
  const [communityAttempts, setCommunityAttempts] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);

  const fetchCommunityAttempts = async () => {
    try {
      setLoadingCommunity(true);



      const { data } = await api.get(`/select-missing-word/${question._id}/community`);

      setCommunityAttempts(data?.data);


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
        {/* <div className="flex items-center gap-2">
          <BarChart2 className="text-purple-600" size={20} />
          <h3 className="font-bold text-slate-800">
            {activeTab === "my" ? "Your Attempts" : "Community Attempts"}
          </h3>
        </div> */}

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
                    className={`text-xl font-bold ${attempt.score === attempt.maxScore
                      ? "text-green-600"
                      : attempt.score > attempt.maxScore / 2
                        ? "text-blue-600"
                        : "text-red-500"
                      }`}
                  >
                    {attempt.isCorrect ? "1" : "0"}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">
                    / 1
                  </span>
                </div>
              </div>

              {/* STATUS */}
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${attempt.score === attempt.maxScore
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

export default function SelectMissingWord({
  question,
  setActiveSpeechQuestion,
  nextButton,
  previousButton,
}) {
  const { user } = useSelector((state) => state.auth);

  const [status, setStatus] = useState("countdown"); // countdown | playing | finished | result
  const [prepTimer, setPrepTimer] = useState(PREP_TIME);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const audioRef = useRef(null);
  const progressRef = useRef(null);

  /* ---------------- HELPERS ---------------- */
  const formatTime = (time) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* ---------------- COUNTDOWN ---------------- */
  useEffect(() => {
    let timer;
    if (status === "countdown" && prepTimer > 0) {
      timer = setInterval(() => setPrepTimer((t) => t - 1), 1000);
    } else if (status === "countdown" && prepTimer === 0) {
      handleAudioStart();
    }
    return () => clearInterval(timer);
  }, [status, prepTimer]);

  /* ---------------- AUDIO CONTROLS ---------------- */
  const handleAudioStart = () => {
    setStatus("playing");
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      setStatus("playing");
    }
  };

  const handleSkipAudio = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = audioRef.current.duration;
    setCurrentTime(audioRef.current.duration);
    setIsPlaying(false);
    setStatus("finished");
  };

  /* ---------------- REDO ---------------- */
  const handleRedo = () => {
    setStatus("countdown");
    setPrepTimer(PREP_TIME);
    setSelectedOption(null);
    setResult(null);
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    try {
      const res = await submitSelectMissingWordAttempt({
        questionId: question._id,
        selectedOptionIndex: selectedOption,
        userId: user._id,
        timeTaken: Math.floor(currentTime),
      });

      setResult(res.data);
      setStatus("result");
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------- VIEW PREVIOUS ---------------- */
  const handleViewPrevious = (attempt) => {
    const mappedResult = {
      score: attempt.isCorrect ? 1 : 0,
      myAnswerText: question.options[attempt.selectedOptionIndex]?.text,
      correctAnswerText: question.options.find((o) => o.isCorrect)?.text,
      isHistory: true,
    };
    setResult(mappedResult);
    setStatus("result");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div>
        <h1>Select Missing Word</h1>
        <p>You will hear a recording about fiction writing. At the end of the recording the lost word or group of words has been replaced by a beep. Select the correct option to complete the recording.</p>
      </div>
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setActiveSpeechQuestion(false)}
          className="p-2 bg-white border rounded-full"
        >
          <ArrowLeft />
        </button>
        <h1 className="text-xl font-black">
          Select Missing Word <Info size={14} className="inline text-blue-500" />
        </h1>
      </div>

      {/* COUNTDOWN */}
      {status === "countdown" ? (
        <div className="bg-white rounded-3xl border p-20 text-center">
          <h2 className="text-2xl font-bold mb-6">Starting Soon...</h2>
          <div className="text-6xl font-black text-blue-600 animate-pulse">
            {prepTimer}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          {/* AUDIO BAR */}
          <div className="p-6 bg-slate-50 border-b flex items-center gap-6">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-white">
              <Headphones />
            </div>

            {/* PROGRESS */}
            <div className="flex-1">
              <div
                ref={progressRef}
                onClick={(e) => {
                  const rect = progressRef.current.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  audioRef.current.currentTime = percent * audioDuration;
                }}
                className="h-2 bg-slate-200 rounded-full cursor-pointer"
              >
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${(currentTime / audioDuration) * 100 || 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1 text-slate-400 font-bold">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>

            {/* CONTROLS */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPause}
                disabled={status === "finished"}
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:bg-slate-300"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <select
                onChange={(e) =>
                  (audioRef.current.playbackRate = Number(e.target.value))
                }
                className="border rounded px-2 py-1 text-xs font-bold"
              >
                <option value="1">1x</option>
                <option value="0.75">0.75x</option>
                <option value="1.25">1.25x</option>
              </select>

              <button
                onClick={handleSkipAudio}
                disabled={status === "finished"}
                className="text-sm font-bold text-blue-600 disabled:text-slate-400"
              >
                Skip
              </button>
            </div>
          </div>

          {/* OPTIONS */}
          <div className="p-8 space-y-4">
            <h2 className="font-bold">{question.title}</h2>

            {question.options.map((option, index) => {
              const selected = selectedOption === index;
              return (
                <div
                  key={index}
                  onClick={() => setSelectedOption(index)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition ${selected
                    ? "border-blue-500 bg-blue-50"
                    : "border-transparent hover:bg-slate-50"
                    }`}
                >
                  <p className="font-bold text-sm mb-1">
                    OPTION {String.fromCharCode(65 + index)}
                  </p>
                  <p>{option.text}</p>
                </div>
              );
            })}
          </div>

          {/* SUBMIT */}
          <div className="p-6 bg-slate-50 border-t flex justify-end">
            <button
              disabled={selectedOption === null}
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold disabled:bg-slate-300 flex items-center gap-2"
            >
              <CheckCircle2 /> Submit Answer
            </button>
          </div>
        </div>
      )}

      {/* AUDIO */}
      <audio
        ref={audioRef}
        src={question.audioUrl}
        onLoadedMetadata={() => setAudioDuration(audioRef.current.duration)}
        onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setStatus("finished");
        }}
        className="hidden"
      />


      {/* ================= FOOTER CONTROLS ================= */}
      <div className="flex items-center justify-between pb-6 mt-6">
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

          {/* Redo */}
          <button onClick={handleRedo} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors">
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
              <RefreshCw size={18} />
            </div>
            <span className="text-xs font-bold">Redo</span>
          </button>
        </div>

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




      <AttemptHistory question={question} attempts={question?.lastAttempts} setResult={setResult} setStatus={setStatus} />

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
        title={<><CheckCircle2 size={18} className="text-emerald-600" /><span className="font-bold text-slate-800">Correct Answer</span></>}
      >
        <div className="space-y-3">
          {question?.options?.map((opt, i) => (
            opt.isCorrect && (
              <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {String.fromCharCode(65 + i)}
                </div>
                <div>
                  <p className="font-bold text-emerald-900 text-sm">{opt.text}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-0.5">Correct Option</p>
                </div>
              </div>
            )
          ))}
        </div>
      </Toast>


      {/* RESULT */}
      {status === "result" && result && (
        <HCSResultModal
          result={result}
          onClose={() => setStatus("idle")}
          onRedo={handleRedo}
        />
      )}
    </div>
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