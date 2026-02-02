import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Clock, Volume2, RotateCcw, ChevronRight, X, ChevronLeft, RefreshCw, CheckCircle, Shuffle, History, Share2, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";

import { submitSummarizeSpokenAttempt, submitSummarizeWrittenAttempt } from "../../services/api";

const MAX_TIME = 600;
const MIN_WORDS = 1;
const MAX_WORDS = 50;

export default function SST({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) {
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

  const handleViewPrevious = (attempt) => {
    setResult(attempt);
    setStatus("result");
  };



  const resetSession = () => {
    setResult(null);
    setStatus('idle');
    setStarted(false);
    setPrepStatus("countdown");
    setPrepTimer(3);
    setAnswer("");
    setAudioFinished(false);
    setTimeLeft(MAX_TIME);
    // resetTranscript(); // Not defined in original file?
  };

  /* ---------------- VIEW PREVIOUS RESULT ---------------- */


  const handleStart = () => {
    setStarted(true);
    setTimeout(() => audioRef.current?.play(), 300);
  };

  const handleSubmit = async () => {
    setStatus("submitting");
    try {
      const res = await submitSummarizeSpokenAttempt({
        questionId: question._id,
        summaryText: answer,
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* HEADER */}
      <div>
        <h1>Summarize Spoken Text</h1>
        <p>You will hear a short report. Write a summary for a fellow student who was not present. You should write 50-70 words. You have 10 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points presented in the lecture.</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setActiveSpeechQuestion(false)} className="hover:bg-gray-100 p-2 rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">
          Summarize Spoken Text <span className="text-purple-600 font-black italic">AI+</span>
        </h1>
      </div>

      {/* MAIN CARD */}
      {/* MAIN CARD */}
      {!started ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 text-center space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Starting Soon...</h2>
          <div className="text-6xl font-black text-blue-600 animate-pulse">
            {prepTimer}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-6">
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
                disabled={!audioFinished || status === "submitting"}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={audioFinished ? "Type your summary here..." : "Listening to audio..."}
                className="w-full h-64 border-2 border-dashed border-blue-200 focus:border-blue-500 rounded-xl p-4 outline-none resize-none transition-colors"
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
                  disabled={!audioFinished || wordCount < MIN_WORDS || wordCount > MAX_WORDS || status === "submitting"}
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 disabled:bg-slate-300 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 disabled:shadow-none"
                >
                  {status === "submitting" ? "Evaluating..." : "Submit Answer"}
                </button>

                <p className="text-xs text-slate-400 font-medium">
                  Target: {MIN_WORDS}–{MAX_WORDS} words
                </p>
              </div>
            </div>
          </div>
          {/* Bottom Controls */}
          <div className="flex items-center justify-center gap-6 pb-10">
            <ControlBtn icon={<ChevronLeft />} label="Previous" onClick={previousButton} className="text-slate-400 hover:text-primary-600 transition-colors" />
            <ControlBtn icon={<RefreshCw size={18} />} label="Redo" onClick={resetSession} />
            <button className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
              <CheckCircle size={24} />
            </button>
            <ControlBtn icon={<Shuffle size={18} />} label="Shuffle" onClick={shuffleButton} />
            <ControlBtn icon={<ChevronRight />} label="Next" onClick={nextButton} />
          </div>
        </div>
      )}

      {status === "result" && result && (
        <ResultModal
          result={result}
          question={question}
          onClose={() => setStatus("idle")}
          onRedo={() => { setStatus("idle"); setStarted(false); setAnswer(""); setTimeLeft(MAX_TIME); setPrepStatus("countdown"); setPrepTimer(3); }}
        />
      )}


      <div>
        <div className="bg-white rounded-[2rem] border shadow-sm p-6 min-h-[400px]">
          <h3 className="font-black text-slate-800 flex items-center gap-2 mb-6">
            <History size={20} className="text-blue-500" />
            Attempt History
          </h3>

          <div className="space-y-4">
            {question.lastAttempts && question.lastAttempts.length > 0 ? (
              question.lastAttempts.map((attempt, index) => (
                <div
                  key={attempt._id || index}
                  className="bg-slate-50 rounded-2xl px-6 py-4 flex items-center justify-between"
                >
                  {/* LEFT */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-black text-slate-600">
                      K
                    </div>

                    <div>
                      <p className="font-bold text-slate-800">Krishna kant</p>
                      <p className="text-xs text-slate-400">
                        {new Date(attempt.createdAt).toLocaleDateString()}{" "}
                        {new Date(attempt.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* CENTER SCORE BUTTON */}
                  <button
                    onClick={() => handleViewPrevious(attempt)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold px-6 py-2 rounded-xl flex items-center gap-2 shadow-sm transition"
                  >
                    Score {attempt.totalScore}/12
                    <RotateCcw size={16} />
                  </button>

                  {/* RIGHT ICONS */}
                  <div className="flex items-center gap-3 text-slate-400">
                    <button className="hover:text-indigo-500 transition">
                      <Share2 size={18} />
                    </button>
                    <button className="hover:text-red-500 transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <History size={20} className="text-slate-300" />
                </div>
                <p className="text-xs font-bold text-slate-400">No previous attempts</p>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}

/* ================= COMPONENTS ================= */




const ResultModal = ({ result, onClose, onRedo, question }) => {
  if (!result) return null;

  const {
    totalScore,
    scores = {},
    misSpelled = 0,
    structureErrors = 0,
    styleIssues = 0,
    grammarErrors = 0,
    wordCount = 0,
    summaryText = "",
    correctedSummary = "",
    questionId
  } = result;

  const {
    content = 0,
    grammar = 0,
    vocabulary = 0,
    form = 0,
    convention = 0
  } = scores;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">

        {/* ================= HEADER ================= */}
        <div className="sticky top-0 z-10 bg-white flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="font-bold text-xl flex items-center gap-2">
              Practice Result
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-md">
                AI+ EVALUATION
              </span>
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Question ID: {questionId?.slice(-8)?.toUpperCase()}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onRedo}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold transition"
            >
              <RotateCcw size={18} />
              Redo
            </button>

            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition">
              Next Question
              <ChevronRight size={18} />
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="p-8 space-y-10 overflow-y-auto max-h-[80vh]">

          {/* ================= SCORE SECTION ================= */}
          <div className="grid grid-cols-12 gap-8">

            {/* -------- TOTAL SCORE -------- */}
            <div className="col-span-12 md:col-span-4 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center shadow-sm">
              <h3 className="font-bold text-slate-700 mb-6 uppercase tracking-widest text-[10px]">
                Your Score
              </h3>

              <div className="relative h-32 w-full flex items-center justify-center">
                <svg className="w-56 h-28">
                  <path
                    d="M 10 90 A 80 80 0 0 1 210 90"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 90 A 80 80 0 0 1 210 90"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="314"
                    strokeDashoffset={314 - (314 * (totalScore / 12))}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-black text-slate-800">
                    {totalScore}
                  </span>
                </div>
              </div>

              <div className="w-full mt-4 flex justify-between px-2 text-[10px] font-bold text-slate-300">
                <span>0</span>
                <span>12</span>
              </div>
            </div>

            {/* -------- SCORE BREAKDOWN -------- */}
            <div className="col-span-12 lg:col-span-8 bg-slate-50 rounded-3xl p-8 border border-slate-200">
              <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                Scoring Parameters
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <ScoreCard label="Content" value={content} max={4} />
                <ScoreCard label="Grammar" value={grammar} max={2} />
                <ScoreCard label="Vocabulary" value={vocabulary} max={2} />
                <ScoreCard label="Form" value={form} max={2} />
              </div>

              <div className="mt-4">
                <ScoreCard
                  label="Convention / Organization"
                  value={convention}
                  max={2}
                  wide
                />
              </div>

              <div className="mt-8 p-4 bg-blue-100/50 rounded-xl border border-blue-200">
                <p className="text-xs text-blue-800 italic text-center leading-relaxed">
                  "Scores are calculated using AI models trained on official PTE scoring standards,
                  analyzing content relevance, linguistic range, and grammatical accuracy."
                </p>
              </div>
            </div>
          </div>

          {/* ================= CORRECTED SUMMARY ================= */}
          <div className="space-y-4">
            <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              Corrected Summary
            </h4>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
              <p className="text-slate-700 italic text-lg leading-relaxed">
                "{correctedSummary || question?.answer}"
              </p>
            </div>
          </div>

          {/* ================= SUBMITTED SUMMARY ================= */}
          <div className="space-y-4">
            <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              Submitted Summary
            </h4>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
              <p className="text-slate-700 italic text-lg leading-relaxed">
                "{summaryText}"
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Badge label="Words" value={wordCount} color="blue" />
              <Badge label="Mis-spelled" value={misSpelled} color="red" />
              <Badge label="Grammar Errors" value={grammarErrors} color="orange" />
              <Badge label="Structure" value={structureErrors} color="indigo" />
              <Badge label="Style Issues" value={styleIssues} color="purple" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



const ScoreCard = ({ label, value = 0, max, wide }) => {
  const percentage = (value / max) * 100;
  const status = percentage >= 80 ? "Good" : percentage >= 50 ? "Average" : "Poor";
  const colorClass = percentage >= 80 ? "text-green-600" : percentage >= 50 ? "text-yellow-600" : "text-red-500";

  return (
    <div className={`bg-white border rounded-xl p-3 text-center shadow-sm ${wide ? "col-span-2" : "col-span-1"}`}>
      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-black text-slate-800">{value}<span className="text-slate-300 text-sm">/{max}</span></p>
      <span className={`text-[10px] font-bold uppercase ${colorClass}`}>{status}</span>
    </div>
  );
};

const Badge = ({ label, value, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    red: "bg-red-50 text-red-700 border-red-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  };
  return (
    <div className={`px-4 py-2 rounded-lg border font-medium text-sm flex gap-2 items-center ${colors[color]}`}>
      <span className="font-black">{value}</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
};

const ControlBtn = ({ icon, label, onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl 
      bg-slate-100 text-slate-700 font-semibold shadow-sm 
      hover:bg-slate-800 hover:text-white transition-all ${className}`}
    >
      {icon}
      <span className="font-bold">{label}</span>
    </button>
  );
};