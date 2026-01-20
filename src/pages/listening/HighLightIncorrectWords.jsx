import React, { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, Volume2, RotateCcw, Headphones, Play, ChevronRight, RotateCw, History, Trash2, Share2, X, CheckCircle2, Info } from "lucide-react";
import { submitHIWAttempt } from "../../services/api";
import { useSelector } from "react-redux";

export default function HighlightIncorrectWords({ question, setActiveSpeechQuestion }) {
  const [status, setStatus] = useState("idle"); 
  const [prepTimer, setPrepTimer] = useState(1);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [result, setResult] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const audioRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  const words = useMemo(() => {
    if (!question?.content) return [];
    return question.content.replace(/\s+/g, " ").trim().split(" ");
  }, [question.content]);

  useEffect(() => {
    let timer;
    if (status === "countdown" && prepTimer > 0) {
      timer = setInterval(() => setPrepTimer(t => t - 1), 1000);
    } else if (status === "countdown" && prepTimer === 0) {
      setStatus("playing");
      if (audioRef.current) audioRef.current.play();
    }
    return () => clearInterval(timer);
  }, [status, prepTimer]);

  const handleWordClick = (index) => {
    if (status !== "playing") return;
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleViewPrevious = (attempt) => {
    const uiIndices = attempt.selectedIndices.map(idx => idx - 1);
    setSelectedIndices(uiIndices);
    setResult({
      score: attempt.score,
      correctCount: attempt.correctCount || 0,
      wrongCount: attempt.wrongCount || 0,
      missedCount: attempt.missedCount || 0,
      mistakes: question.mistakes 
    });
    setStatus("submitted");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (audioRef.current) audioRef.current.pause();
    const indicesToSend = selectedIndices.map(i => i + 1);
    try {
      const res = await submitHIWAttempt({
        questionId: question._id,
        userId: user?._id,
        selectedIndices: indicesToSend,
        timeTaken: Math.floor(currentTime)
      });
      setResult(res.data);
      setStatus("submitted");
      setShowModal(true); // Open modal automatically on submit
    } catch (err) { console.error(err); }
  };

  // --- RESULT MODAL COMPONENT ---
  const ResultModal = () => {
    if (!result || !showModal) return null;

    const totalMistakes = question.mistakes.length;
    const scorePercentage = (result.score / totalMistakes) * 100;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-xl text-blue-500"><ChevronRight className="rotate-90" size={20}/></div>
                <h2 className="text-xl font-bold text-slate-700">
                    {question.name || "HIW_A_0418"} <span className="text-slate-400 font-medium">({question.title || "Whale Mimics Speech"})</span>
                </h2>
                <Share2 size={20} className="text-blue-500 cursor-pointer ml-2 hover:scale-110 transition" />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-full font-bold hover:bg-blue-100 transition">
                <RotateCcw size={18} /> Redo
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-full font-bold hover:bg-blue-100 transition">
                <ChevronRight size={18} /> Next Question
              </button>
              <button onClick={() => setShowModal(false)} className="p-2.5 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition">
                <X size={22} />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row p-10 gap-10">
            {/* Left Score Card */}
            <div className="md:w-[35%] bg-white border-2 border-slate-50 rounded-[3rem] p-10 flex flex-col items-center justify-center relative shadow-sm ring-1 ring-purple-100/50">
              <div className="absolute top-6 right-8 text-purple-300 bg-purple-50 p-2 rounded-full rotate-12"><Play size={16} fill="currentColor" /></div>
              <h3 className="text-lg font-bold text-slate-600 mb-10 tracking-tight">Your Score</h3>
              
              <div className="relative w-56 h-56 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-180" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" strokeDasharray="125.6" strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="40" stroke="#3b82f6" strokeWidth="8" fill="transparent" strokeDasharray="125.6" strokeDashoffset={125.6 - (125.6 * (result.score / totalMistakes))} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute flex flex-col items-center mt-2">
                    <span className="text-7xl font-black text-slate-800 tracking-tighter">{result.score}</span>
                </div>
                <div className="absolute bottom-6 flex justify-between w-full px-10 text-xs font-black text-slate-400">
                  <span>0</span>
                  <span>{totalMistakes}</span>
                </div>
              </div>

              <div className="w-full mt-10 space-y-5">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2.5 text-sm font-bold text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" /> Reading
                  </span>
                  <span className="bg-green-100 text-green-700 px-4 py-1 rounded-xl font-black text-sm">{(scorePercentage * 0.9).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2.5 text-sm font-bold text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full bg-pink-400" /> Listening
                  </span>
                  <span className="bg-pink-100 text-pink-700 px-4 py-1 rounded-xl font-black text-sm">{(scorePercentage * 0.9).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Right Lists Section */}
            <div className="flex-1 flex flex-col gap-8">
              {/* Correct Answer Box */}
              <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="bg-[#E6F8E8] px-8 py-4 text-slate-700 font-bold text-lg">Correct Answer</div>
                <div className="p-6 space-y-4 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {question.mistakes.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-3.5 text-slate-600 font-bold px-2">
                      <CheckCircle2 size={20} className="text-green-500" /> {m.answer}
                    </div>
                  ))}
                </div>
              </div>

              {/* My Answer Box */}
              <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="bg-[#EAF6FE] px-8 py-4 text-slate-700 font-bold text-lg">My Answer</div>
                <div className="p-6 space-y-4 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {selectedIndices.length > 0 ? selectedIndices.map((i, idx) => {
                    const isCorrect = question.mistakes.some(m => m.index === i + 1);
                    return (
                      <div key={idx} className="flex items-center gap-3.5 text-slate-600 font-bold px-2">
                        {isCorrect ? <CheckCircle2 size={20} className="text-green-500" /> : <X size={20} className="text-red-500" />}
                        {words[i]}
                      </div>
                    );
                  }) : <p className="text-slate-400 italic px-2">No words selected</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 font-sans text-slate-800">
      <ResultModal />
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveSpeechQuestion(false)} className="p-2 hover:bg-slate-100 rounded-full transition">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-2xl font-bold">Highlight Incorrect Words</h1>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden relative">
        <div className="p-8 bg-slate-50 border-b flex items-center gap-8">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {status === "countdown" ? prepTimer : <Headphones size={24} />}
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(currentTime/duration)*100}%` }} />
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span>{Math.floor(currentTime)}s</span>
              <span>{Math.floor(duration || 0)}s</span>
            </div>
          </div>
          <Volume2 className="text-slate-400" />
        </div>

        {status === "idle" && (
          <div className="absolute inset-0 top-[120px] z-20 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <button onClick={() => setStatus("countdown")} className="bg-blue-600 text-white px-12 py-4 rounded-full font-black flex items-center gap-3 shadow-2xl hover:scale-105 transition active:scale-95">
              <Play fill="white" /> CLICK TO START
            </button>
          </div>
        )}

        <div className="p-12 min-h-[400px]">
          <div className="text-lg lg:text-xl leading-[3.5rem] text-slate-700 font-medium select-none">
            {words.map((word, index) => {
              const isSelected = selectedIndices.includes(index);
              const mistakeDetail = (result?.mistakes || question?.mistakes)?.find(m => m.index === index + 1);
              const isActuallyMistake = !!mistakeDetail;

              let bgColor = "";
              if (status === "submitted") {
                if (isActuallyMistake && isSelected) bgColor = "bg-green-100 text-green-700 ring-2 ring-green-400"; 
                else if (!isActuallyMistake && isSelected) bgColor = "bg-red-100 text-red-700 ring-2 ring-red-400"; 
                else if (isActuallyMistake && !isSelected) bgColor = "bg-blue-100 text-blue-700 ring-2 ring-blue-200"; 
              } else if (isSelected) {
                bgColor = "bg-blue-600 text-white shadow-md"; 
              }

              return (
                <span key={index} className="relative inline-block mr-1">
                  <span onClick={() => handleWordClick(index)} className={`cursor-pointer px-1 py-1 rounded-md transition-all ${bgColor}`}>
                    {word}
                  </span>
                  {status === "submitted" && isActuallyMistake && (
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-10 bg-yellow-100 text-yellow-800 text-[10px] font-black px-2 py-1 rounded border border-yellow-200 whitespace-nowrap z-30 shadow-sm">
                      (Answer : {mistakeDetail.answer})
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        <div className="p-8 border-t flex justify-between items-center bg-white">
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 font-bold text-slate-400 hover:text-slate-600 transition">
            <RotateCcw size={20} /> Redo
          </button>
          {status !== "submitted" ? (
            <button onClick={handleSubmit} disabled={status !== "playing"} className="bg-blue-600 disabled:bg-slate-200 text-white px-16 py-3 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition active:scale-95">
              Submit Answer
            </button>
          ) : (
            <div className="flex gap-4">
               <button onClick={() => setShowModal(true)} className="bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition">
                 View Result Details
               </button>
               <button className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition">
                 Next Question <ChevronRight size={18} />
               </button>
            </div>
          )}
          <div className="text-sm font-bold text-slate-300">ID: {question?._id?.slice(-6)}</div>
        </div>
      </div>

      {/* HISTORY TAB */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <h3 className="font-black text-slate-800 flex items-center gap-2 mb-6 text-lg">
          <History size={22} className="text-blue-500" />
          Attempt History
        </h3>
        <div className="space-y-4">
          {question.lastAttempts?.length > 0 ? (
            question.lastAttempts.map((attempt, index) => (
              <div key={attempt._id || index} className="bg-slate-50 rounded-2xl px-6 py-4 flex items-center justify-between border border-transparent hover:border-blue-100 transition">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-black text-slate-600 uppercase">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{user?.name || "User"}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(attempt.createdAt).toLocaleDateString()} {new Date(attempt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleViewPrevious(attempt)} className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold px-6 py-2 rounded-xl flex items-center gap-2 shadow-sm transition active:scale-95">
                  Score {attempt.score}/{question.mistakes.length} <RotateCcw size={16} />
                </button>
                <div className="flex items-center gap-3 text-slate-400">
                  <button className="hover:text-indigo-500 transition"><Share2 size={18} /></button>
                  <button className="hover:text-red-500 transition"><Trash2 size={18} /></button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-400 italic">No previous attempts</div>
          )}
        </div>
      </div>

      <audio ref={audioRef} src={question.audioUrl} onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)} onLoadedMetadata={(e) => setDuration(e.target.duration)} className="hidden" />
    </div>
  );
}