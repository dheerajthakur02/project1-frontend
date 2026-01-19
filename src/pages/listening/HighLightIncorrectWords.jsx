import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Volume2, RotateCcw, Headphones, Play, CheckCircle2, Info, X, ChevronRight, RotateCw } from "lucide-react";
import { submitHIWAttempt } from "../../services/api";
import { useSelector } from "react-redux";

export default function HighlightIncorrectWords({ question, setActiveSpeechQuestion }) {
  const [status, setStatus] = useState("idle"); // idle, countdown, playing, submitted
  const [prepTimer, setPrepTimer] = useState(10);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [result, setResult] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  // Split content into words
  const words = question.content.split(/\s+/);

  useEffect(() => {
    let timer;
    if (status === "countdown" && prepTimer > 0) {
      timer = setInterval(() => setPrepTimer(t => t - 1), 1000);
    } else if (status === "countdown" && prepTimer === 0) {
      setStatus("playing");
      audioRef.current.play();
    }
    return () => clearInterval(timer);
  }, [status, prepTimer]);

  const handleWordClick = (index) => {
    if (status !== "playing") return;
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleSubmit = async () => {
    audioRef.current.pause();
    try {
      const res = await submitHIWAttempt({
        questionId: question._id,
        userId: user._id,
        selectedIndices,
        timeTaken: Math.floor(currentTime)
      });
      setResult(res.data.data);
      setStatus("submitted");
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 font-sans text-slate-800">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveSpeechQuestion(false)} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-2xl font-bold">Highlight Incorrect Words</h1>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden relative">
        {/* AUDIO PLAYER */}
        <div className="p-8 bg-slate-50 border-b flex items-center gap-8">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {status === "countdown" ? prepTimer : <Headphones size={24} />}
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${(currentTime/duration)*100}%` }} />
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span>{Math.floor(currentTime)}s</span>
              <span>{Math.floor(duration)}s</span>
            </div>
          </div>
          <Volume2 className="text-slate-400" />
        </div>

        {/* START OVERLAY */}
        {status === "idle" && (
          <div className="absolute inset-0 top-[120px] z-20 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <button onClick={() => setStatus("countdown")} className="bg-blue-600 text-white px-12 py-4 rounded-full font-black flex items-center gap-3 shadow-2xl hover:scale-105 transition">
              <Play fill="white" /> CLICK TO START
            </button>
          </div>
        )}

        {/* PARAGRAPH AREA */}
        <div className="p-12 min-h-[400px]">
          <div className="text-lg lg:text-xl leading-[3.5rem] text-slate-700 font-medium select-none">
            {words.map((word, index) => {
              const isSelected = selectedIndices.includes(index);
              const isMistake = result?.mistakes?.find(m => m.index === index);
              
              // Define Post-Submission Styles
              let bgColor = "";
              if (status === "submitted") {
                if (isMistake && isSelected) bgColor = "bg-green-100 text-green-700 ring-1 ring-green-400"; // Correct Click
                else if (!isMistake && isSelected) bgColor = "bg-red-100 text-red-700 ring-1 ring-red-400"; // Wrong Click
                else if (isMistake && !isSelected) bgColor = "bg-blue-100 text-blue-700 ring-1 ring-blue-400"; // Missed
              } else if (isSelected) {
                bgColor = "bg-blue-600 text-white shadow-md rounded-md"; // During Play
              }

              return (
                <span key={index} className="relative inline-block mr-1.5">
                  <span
                    onClick={() => handleWordClick(index)}
                    className={`cursor-pointer px-1.5 py-1 rounded-md transition-all ${bgColor} ${status === "playing" ? "hover:bg-slate-100" : ""}`}
                  >
                    {word}
                  </span>
                  
                  {/* YELLOW ANSWER LABEL (ONLY ON SUBMITTED) */}
                  {status === "submitted" && isMistake && (
                    <span className="absolute -bottom-10 left-0 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded border border-yellow-200 whitespace-nowrap z-10">
                      (Answer : {isMistake.answer})
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* STATS BAR (ONLY ON SUBMITTED) */}
        {status === "submitted" && result && (
          <div className="bg-slate-50 border-t p-6 flex justify-center gap-12 items-center">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">{result.correctCount}</span>
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Your Correct Words</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{result.missedCount}</span>
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Missed Correct Answers</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">{result.wrongCount}</span>
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Your Wrong Words</span>
            </div>
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="p-8 border-t flex justify-between items-center bg-white">
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 font-bold text-slate-400 hover:text-slate-600 transition">
            <RotateCcw size={20} /> Redo
          </button>
          
          {status !== "submitted" ? (
            <button 
              onClick={handleSubmit} 
              disabled={status !== "playing"}
              className="bg-blue-600 disabled:bg-slate-200 text-white px-16 py-3 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition active:scale-95"
            >
              Submit Answer
            </button>
          ) : (
            <div className="flex gap-4">
               <button className="bg-slate-800 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2">
                 <RotateCw size={18} /> Try Again
               </button>
               <button className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2">
                 Next Question <ChevronRight size={18} />
               </button>
            </div>
          )}

          <div className="text-sm font-bold text-slate-300">Question ID: {question._id.slice(-6)}</div>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={question.audioUrl} 
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onEnded={() => setStatus("playing")} 
        className="hidden"
      />
    </div>
  );
}