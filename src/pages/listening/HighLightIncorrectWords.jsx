import React, { useState, useEffect, useRef, useMemo } from "react";
//import { ArrowLeft, Volume2, RotateCcw, Headphones, Play, ChevronRight, RotateCw, History, Trash2, Share2, X, CheckCircle2, Info } from "lucide-react";
import { submitHIWAttempt } from "../../services/api";
import { useSelector } from "react-redux";


import {
  ArrowLeft, Headphones, Volume2, RotateCcw, ChevronRight,
  Play, Pause, X, History, Share2, Trash2, CheckCircle2
} from "lucide-react";


export default function HighlightIncorrectWords({ question, setActiveSpeechQuestion }) {
  const [status, setStatus] = useState("countdown");
  const [prepTimer, setPrepTimer] = useState(3);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [result, setResult] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFinished, setAudioFinished] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const audioRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  const words = useMemo(() => {
    if (!question?.content) return [];
    return question.content.replace(/\s+/g, " ").trim().split(" ");
  }, [question?.content]);

  /* ================= COUNTDOWN ================= */
  useEffect(() => {
    let timer;
    if (status === "countdown" && prepTimer > 0) {
      timer = setInterval(() => setPrepTimer(t => t - 1), 1000);
    }
    if (status === "countdown" && prepTimer === 0) {
      setStatus("playing");
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
    return () => clearInterval(timer);
  }, [status, prepTimer]);

  /* ================= AUDIO CONTROLS ================= */
  const toggleAudio = () => {
    if (!audioRef.current || audioFinished) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleSkipAudio = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = audioRef.current.duration;
    setIsPlaying(false);
    setAudioFinished(true);
    setCurrentTime(duration);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioFinished(true);
    setCurrentTime(duration);
  };

  /* ================= WORD CLICK ================= */
  const handleWordClick = (index) => {
    if (status !== "playing") return;
    setSelectedIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setAudioFinished(true);
    setStatus("submitted");
    setShowModal(true);
  };

  /* ================= RESET ON QUESTION ================= */
  useEffect(() => {
    setPrepTimer(3);
    setStatus("countdown");
    setSelectedIndices([]);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setAudioFinished(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [question]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveSpeechQuestion(false)}>
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold">Highlight Incorrect Words</h1>
      </div>

      {/* ================= COUNTDOWN ================= */}
      {status === "countdown" ? (
        <div className="h-[500px] flex flex-col items-center justify-center">
          <p className="text-xl">Starting in</p>
          <p className="text-6xl font-black text-blue-600">{prepTimer}</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border shadow-sm flex flex-col min-h-[600px]">

          {/* ================= AUDIO BAR ================= */}
          <div className="p-6 bg-slate-50 border-b flex items-center gap-6">
            <button
              onClick={toggleAudio}
              disabled={audioFinished}
              className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:bg-slate-300"
            >
              {isPlaying ? <Pause /> : <Play className="ml-1" />}
            </button>

            <div className="flex-1">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-[width] duration-200"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>{Math.floor(currentTime)}s</span>
                <span>{Math.floor(duration)}s</span>
              </div>
            </div>

            {!audioFinished && (
              <button
                onClick={handleSkipAudio}
                className="text-blue-600 font-bold text-sm"
              >
                Skip
              </button>
            )}

            <Volume2 className="text-slate-400" />
          </div>

          {/* ================= CONTENT ================= */}
         <div className="p-10 text-lg lg:text-xl leading-[3rem] text-slate-700 font-medium 
                break-words break-all overflow-hidden">

            {words.map((word, index) => {
              const isSelected = selectedIndices.includes(index);
              return (
                <span
                  key={index}
                  onClick={() => handleWordClick(index)}
                  className={`mr-1 px-1 py-1 rounded cursor-pointer ${
                    isSelected ? "bg-blue-600 text-white" : ""
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </div>

          {/* ================= FOOTER ================= */}
          <div className="p-6 border-t flex justify-between items-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 text-slate-400 font-bold"
            >
              <RotateCcw /> Redo
            </button>

            <button
              onClick={handleSubmit}
              disabled={status !== "playing"}
              className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-bold disabled:bg-slate-300"
            >
              Submit Answer
            </button>
          </div>
        </div>
      )}

      {/* ================= AUDIO ELEMENT ================= */}
      <audio
        ref={audioRef}
        src={question.audioUrl}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
        onEnded={handleAudioEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
}
