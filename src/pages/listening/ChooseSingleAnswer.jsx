import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Volume2, RotateCcw, ChevronRight, X, Play, CheckCircle2, Info, Headphones, BookOpen, Share2, History, Calendar, Trash2, Languages, Eye, RefreshCw, ChevronLeft, Pause, Users,
  User } from "lucide-react";
import { submitChooseSingleAnswerAttempt, submitHighlightAttempt } from "../../services/api";
import { useSelector } from "react-redux";

const PREP_TIME = 3;


import axios from "axios";

 function AttemptHistory({ question, userId }) {
  const [mode, setMode] = useState("my"); // my | community
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAttempts();
  }, [mode]);

 const fetchAttempts = async () => {
  try {
    setLoading(true);

    if (mode === "my") {
      setAttempts(question?.lastAttempts || []);
    } else {
      const res = await axios.get(
        `/api/choose-single-answer/${question._id}/community`
      );

      const formattedAttempts = res.data.data.flatMap((item) =>
        item.attempts.map((attempt) => ({
          ...attempt,
          user: item.user,
          userId: item.userId,
        }))
      );
      formattedAttempts.sort(
  (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
);


      setAttempts(formattedAttempts);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  const handleViewPrevious = (attempt) => {
    console.log("View attempt:", attempt);
  };


  return (
    <div>
      <div className="bg-white rounded-[2rem] border shadow-sm p-6 min-h-[400px]">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <History size={20} className="text-blue-500" />
            Attempt History
          </h3>

          {/* TOGGLE */}
          <div className="flex bg-slate-100 rounded-xl p-1 text-xs font-bold">
            <button
              onClick={() => setMode("my")}
              className={`px-4 py-1.5 rounded-lg flex items-center gap-1 ${
                mode === "my"
                  ? "bg-white shadow text-blue-600"
                  : "text-slate-500"
              }`}
            >
              <User size={14} /> My
            </button>
            <button
              onClick={() => setMode("community")}
              className={`px-4 py-1.5 rounded-lg flex items-center gap-1 ${
                mode === "community"
                  ? "bg-white shadow text-indigo-600"
                  : "text-slate-500"
              }`}
            >
              <Users size={14} /> Community
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-slate-400">Loading...</p>
          ) : attempts.length > 0 ? (
            attempts.map((attempt, index) => (
              <div
                key={attempt._id || index}
                className="bg-slate-50 rounded-2xl px-6 py-4 flex items-center justify-between"
              >
                {/* LEFT */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-black text-slate-600">
                    {mode === "community"
                      ? attempt.userName?.[0]?.toUpperCase() || "U"
                      : "K"}
                  </div>

                  <div>
                    
                     <p className="font-bold text-slate-800">
                      {mode === "community"
                        ? attempt.user?.name || "Anonymous"
                        : "Krishna Kant"}
                    </p>

                    <p className="text-xs text-slate-400">
                      {new Date(attempt.createdAt).toLocaleDateString()}{" "}
                      {new Date(attempt.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* CENTER */}
                <button
                  onClick={() => handleViewPrevious(attempt)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold px-6 py-2 rounded-xl flex items-center gap-2 shadow-sm transition"
                >
                  Score {attempt.isCorrect?"1":"0"}/1
                  <RotateCcw size={16} />
                </button>

                {/* RIGHT */}
                <div className="flex items-center gap-3 text-slate-400">
                  <button className="hover:text-indigo-500 transition">
                    <Share2 size={18} />
                  </button>

                  {mode === "my" && (
                    <button className="hover:text-red-500 transition">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <History size={20} className="text-slate-300" />
              </div>
              <p className="text-xs font-bold text-slate-400">
                No previous attempts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default function ChooseSingleAnswer({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) {

  const [status, setStatus] = useState("countdown");
  const [prepTimer, setPrepTimer] = useState(PREP_TIME);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
const [isPlaying, setIsPlaying] = useState(false);
const [audioFinished, setAudioFinished] = useState(false);

  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  /* ---------------- TIMER LOGIC ---------------- */
  useEffect(() => {
    let timer;
    if (status === "countdown" && prepTimer > 0) {
      timer = setInterval(() => setPrepTimer((prev) => prev - 1), 1000);
    } else if (status === "countdown" && prepTimer === 0) {
      handleAudioStart();
    }
    return () => clearInterval(timer);
  }, [status, prepTimer]);

  const handleStartPrep = () => setStatus("countdown");

  const handleAudioStart = () => {
  setStatus("playing");
  setAudioFinished(false);
  if (audioRef.current) {
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
  }
};

const togglePlayPause = () => {
  if (!audioRef.current || audioFinished) return;

  if (isPlaying) {
    audioRef.current.pause();
    setIsPlaying(false);
  } else {
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
  }
};
const handleSkipAudio = () => {
  if (!audioRef.current) return;

  audioRef.current.pause();
  audioRef.current.currentTime = audioDuration;
  setIsPlaying(false);
  setAudioFinished(true);
  setStatus("finished");
};


  /* ---------------- VIEW PREVIOUS RESULT ---------------- */
  const handleViewPrevious = (attempt) => {
    // Mapping backend attempt history structure to Modal structure
    const mappedResult = {
      score: attempt.isCorrect ? 1 : 0,
      readingScore: attempt.isCorrect ? 0.5 : 0,
      listeningScore: attempt.isCorrect ? 0.5 : 0,
      myAnswer: String.fromCharCode(65 + attempt.selectedOptionIndex),
      correctAnswer: String.fromCharCode(65 + question.options.findIndex(o => o.isCorrect)),
      myAnswerText: question.options[attempt.selectedOptionIndex]?.text,
      correctAnswerText: question.options.find(o => o.isCorrect)?.text,
      questionId: question.questionId || "HCS_RESULT",
      isHistory: true
    };
    setResult(mappedResult);
    setStatus("result");
  };

  /* ---------------- SUBMIT LOGIC ---------------- */
  const handleSubmit = async () => {
    try {
      const res = await submitChooseSingleAnswerAttempt({
        questionId: question._id,
        selectedOptionIndex: selectedOption,
        userId: user._id,
        timeTaken: Math.floor(audioRef.current?.currentTime || 0),
      });



      // Backend usually returns { success: true, data: { ... } }
      setResult(res.data);
      setStatus("result");
    } catch (err) {
      console.error("Submission error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8">
      <div>
        <h1>Multiple Choice (Single)</h1>
        <p>Listen to the recording and answer the single-choice question by selectingthe correct response . Only one response is correct.</p>
      </div>
      <div className="max-w-7xl mx-auto  gap-8">

        {/* LEFT COLUMN: MAIN TASK */}
        <div className=" space-y-6">
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveSpeechQuestion(false)} className="p-2 bg-white shadow-sm border rounded-full hover:bg-slate-50 transition">
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Listening: Multiple Choice, Choose Single Answer <Info size={16} className="text-blue-500" />
              </h1>
            </div>
            <button className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition">
              <BookOpen size={18} /> Study Guide
            </button>
          </div>

          {/* TASK CARD */}
          {status === "countdown" ? (
            <div className="bg-white rounded-[2.5rem] border shadow-sm p-20 text-center space-y-6 flex flex-col items-center justify-center min-h-[600px]">
              <h2 className="text-2xl font-bold text-slate-800">Starting Soon...</h2>
              <div className="text-6xl font-black text-blue-600 animate-pulse">{prepTimer}</div>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border shadow-sm relative overflow-hidden flex flex-col min-h-[600px]">
              {/* AUDIO CONTROL BAR */}
             <div className="px-10 py-8 bg-slate-50/80 border-b flex items-center gap-6">

  {/* PLAY / PAUSE */}
  <button
    onClick={togglePlayPause}
    disabled={audioFinished}
    className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 
               text-white flex items-center justify-center shadow-md"
  >
    {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
  </button>

  {/* PROGRESS BAR */}
  <div className="flex-1 flex flex-col gap-2">
    <div
      ref={progressRef}
      onClick={(e) => {
        if (!audioRef.current) return;
        const rect = progressRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioRef.current.currentTime = percent * audioDuration;
      }}
      className="h-2 bg-slate-200 rounded-full overflow-hidden cursor-pointer"
    >
      <div
        className="h-full bg-blue-500 transition-all"
        style={{
          width: audioDuration
            ? `${(currentTime / audioDuration) * 100}%`
            : "0%",
        }}
      />
    </div>

    <div className="flex justify-between text-xs font-bold text-slate-400">
      <span>{formatTime(currentTime)}</span>
      <span>{formatTime(audioDuration)}</span>
    </div>
  </div>

  {/* SKIP BUTTON */}
  {!audioFinished && (
    <button
      onClick={handleSkipAudio}
      className="text-sm font-bold text-blue-600 hover:text-blue-800"
    >
      Skip Audio
    </button>
  )}

  <Volume2 size={20} className="text-slate-400" />
</div>


              {/* OVERLAY FOR START */}
              {/* OVERLAY FOR START - REMOVED FOR AUTO START */}
              {/* {status === "idle" && ( ... )} */}

              {/* OPTIONS BOX */}
              <div className="p-10 flex-1">
                <div className="border-2 border-dashed border-slate-100 rounded-[2rem] p-6 space-y-4">
                  <h2>{question.title}</h2>
                  {question.options.map((option, index) => {
                    const isSelected = selectedOption === index;
                    return (
                      <div
                        key={option._id}
                        onClick={() => setSelectedOption(index)}
                        className={`flex gap-6 p-5 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? "border-blue-500 bg-blue-50/30" : "border-transparent hover:bg-slate-50"
                          }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-1 ${isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <span className={`font-black text-sm mb-1 block ${isSelected ? "text-blue-600" : "text-slate-400"}`}>
                            OPTION {String.fromCharCode(65 + index)}
                          </span>
                          <p className={`text-[15px] leading-relaxed font-medium ${isSelected ? "text-slate-900" : "text-slate-600"}`}>
                            {option.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SUBMIT BUTTON SECTION */}
              <div className="px-10 py-6 bg-slate-50 border-t flex justify-end">
                <button
                  disabled={selectedOption === null || status === "idle"}
                  onClick={handleSubmit}
                  className="bg-blue-600 disabled:bg-slate-300 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 size={20} /> Submit Answer
                </button>
              </div>

            </div>
          )}
        </div>

        {/* RIGHT COLUMN: HISTORY */}

      </div>
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
          <button onClick={() => { setSelectedOption(null); setStatus("countdown"); setPrepTimer(PREP_TIME); }} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
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

      {/*  */}
          <AttemptHistory question={question} userId={user._id}/>
      {/* AUDIO ELEMENT */}
      <audio
  ref={audioRef}
  src={question.audioUrl}
  onLoadedMetadata={() => setAudioDuration(audioRef.current.duration)}
  onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false)}
  onEnded={() => {
    setIsPlaying(false);
    setAudioFinished(true);
    setStatus("finished");
  }}
  className="hidden"
/>


      {/* RESULT MODAL */}
      {status === "result" && result && (
        <HCSResultModal
          result={result}
          onClose={() => setStatus("idle")}
          onRedo={() => { setStatus("countdown"); setSelectedOption(null); setPrepTimer(PREP_TIME); }}
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