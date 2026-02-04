import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Headphones,
  Volume2,
  RotateCcw,
  Play,
  Pause,
  X,
  History,
  Share2,
  Trash2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Languages,
  Eye,
  RefreshCw,
  BarChart2,
  Info,
  Users,
  FastForward
} from "lucide-react";
import { submitHIWAttempt } from "../../services/api";
import axios from "axios";

export const getHIWCommunityAttempts = (questionId) =>
  axios.get(
    `/api/hiw/${questionId}/community`
  );

const AttemptHistoryHIW = ({ questionId, currentAttemptId, onSelectAttempt }) => {
  const [activeTab, setActiveTab] = useState("my"); // my | community
  const [myAttempts, setMyAttempts] = useState([]);
  const [communityAttemptsRaw, setCommunityAttemptsRaw] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= MY ATTEMPTS ================= */
  useEffect(() => {
    if (!questionId || activeTab !== "my") return;

    const fetchMyAttempts = async () => {
      setLoading(true);
      try {
        const res = questionId?.lastAttempts; // Assuming questionId here refers to the question object which has lastAttempts
        // Or if questionId is just ID, we might need to fetch. Based on usage, it seems to be the question object.

        if (Array.isArray(res)) {
          // Sort by latest first
          const sortedAttempts = [...res].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setMyAttempts(sortedAttempts);
        }
      } catch (err) {
        console.error("Failed to fetch my HIW attempts", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyAttempts();
  }, [questionId, currentAttemptId, activeTab]);

  /* ================= COMMUNITY ATTEMPTS ================= */
  useEffect(() => {
    if (!questionId?._id || activeTab !== "community" || communityAttemptsRaw.length)
      return;

    const fetchCommunityAttempts = async () => {
      setLoading(true);
      try {
        const res = await getHIWCommunityAttempts(questionId._id);

        if (res?.data?.success) {
          setCommunityAttemptsRaw(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch community HIW attempts", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityAttempts();
  }, [questionId, activeTab, communityAttemptsRaw.length]);

  /* ================= FLATTEN & SORT COMMUNITY ATTEMPTS ================= */
  const flattenedCommunityAttempts = useMemo(() => {
    const flattened = communityAttemptsRaw.flatMap((user) =>
      user.attempts.map((attempt) => ({
        ...attempt,
        communityUserId: user.userId,
      }))
    );
    // Sort by latest first
    return flattened.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [communityAttemptsRaw]);

  const list = activeTab === "my" ? myAttempts : flattenedCommunityAttempts;

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">Loading history...</div>
    );
  }

  return (
    <div className="mt-12 font-sans">
      {/* ================= HEADER + TABS ================= */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="text-purple-600" size={20} />
          <h3 className="font-bold text-slate-800">
            {activeTab === "my" ? "Your Attempts" : "Community Attempts"}
          </h3>
        </div>

        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("my")}
            className={`px-4 py-1.5 text-sm font-bold rounded-lg transition ${activeTab === "my"
              ? "bg-white shadow text-purple-600"
              : "text-slate-500"
              }`}
          >
            My
          </button>
          <button
            onClick={() => setActiveTab("community")}
            className={`px-4 py-1.5 text-sm font-bold rounded-lg transition ${activeTab === "community"
              ? "bg-white shadow text-purple-600"
              : "text-slate-500"
              }`}
          >
            Community
          </button>
        </div>
      </div>

      {/* ================= EMPTY STATE ================= */}
      {list.length === 0 && (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border">
            <Info size={20} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium">
            {activeTab === "my"
              ? "No attempts yet"
              : "No community attempts yet"}
          </p>
          <p className="text-xs mt-1 opacity-70">
            Complete the exercise to see your history
          </p>
        </div>
      )}

      {/* ================= LIST ================= */}
      <div className="space-y-4">
        {list.map((attempt) => (
          <div
            key={attempt._id}
            onClick={() => onSelectAttempt?.(attempt)}
            className={`bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-6 transition cursor-pointer ${activeTab === "my" ? "hover:shadow-md group" : ""
              }`}
          >
            {/* 👤 COMMUNITY USER (only for community tab) */}
            {activeTab === "community" && attempt.communityUserId && (
              <div className="min-w-[160px]">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  User
                </span>
                <div className="text-sm font-semibold text-slate-700 truncate">
                  {attempt.communityUserId.slice(-6)}
                </div>
              </div>
            )}

            {/* 📅 DATE */}
            <div className="min-w-[150px]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Date
              </span>
              <div className="text-sm font-semibold text-slate-700">
                {new Date(attempt.createdAt).toLocaleString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {/* 📊 SCORE */}
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
                  {attempt.score}
                </span>
                <span className="text-sm text-slate-400 font-medium">
                  / {attempt.missedCount + attempt.score}
                </span>
              </div>
            </div>

            {/* ✅ STATUS */}
            <div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${attempt.score === attempt.maxScore
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-600"
                  }`}
              >
                {attempt.score === attempt.maxScore ? "Perfect" : "Completed"}
              </span>
            </div>

            {/* ACTION */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 font-bold text-sm">
              View Result →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function HighlightIncorrectWords({ question, setActiveSpeechQuestion, nextButton, previousButton }) {
  const [status, setStatus] = useState("countdown");
  const [prepTimer, setPrepTimer] = useState(3);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [result, setResult] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFinished, setAudioFinished] = useState(false);

  const audioRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  const words = useMemo(() => {
    if (!question?.content) return [];
    return question.content.replace(/\s+/g, " ").trim().split(" ");
  }, [question?.content]);

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

  /* ================= RESET SESSION ================= */
  const resetSession = () => {
    setPrepTimer(3);
    setStatus("countdown");
    setSelectedIndices([]);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setAudioFinished(false);
    setShowModal(false);
    setResult(null);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  /* ================= RESET ON QUESTION CHANGE ================= */
  useEffect(() => {
    resetSession();
  }, [question]);

  const handleWordClick = (index) => {
    if (status !== "playing") return;
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioFinished(true);
  };

  const handleSkipAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = audioRef.current.duration || 0;
      setAudioFinished(true);
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setAudioFinished(true);
    setStatus("submitted");

    try {
      const res = await submitHIWAttempt({
        userId: user._id,
        questionId: question._id,
        selectedIndices
      });
      setResult(res.data);
      setShowModal(true);
    } catch (error) {
      console.error("Error submitting HIW:", error);
      setShowModal(true);
    }
  };

  const handleSelectAttempt = (attempt) => {
    setResult({
      score: attempt.score,
      maxScore: attempt.maxScore,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      missedCount: attempt.missedCount,
      mistakes: question?.mistakes || []
    });
    setSelectedIndices(attempt.selectedIndices);
    setStatus("submitted");
    setShowModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 font-sans text-slate-800">
      <div>
        <h1>Highlight Incorrect Words</h1>
        <p>You will hear a recording. Below is a transcription of the recording. Some words in the transcription differ from what the speaker said. Please click on the words that are different.</p>
      </div>

      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveSpeechQuestion(false)}>
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold">Highlight Incorrect Words</h1>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      {status === "countdown" ? (
        <div className="bg-white rounded-[2.5rem] border shadow-sm p-20 text-center space-y-6 flex flex-col items-center justify-center min-h-[600px]">
          <h2 className="text-2xl font-bold text-slate-800">Starting Soon...</h2>
          <div className="text-6xl font-black text-blue-600 animate-pulse">{prepTimer}</div>
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
            <div className="flex-1 space-y-2">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>{Math.floor(currentTime)}s</span>
                <span>{Math.floor(duration || 0)}s</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 className="text-slate-400" />
              <button
                onClick={handleSkipAudio}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-blue-500 transition-colors tooltip-trigger"
                title="Skip Audio"
              >
                <FastForward size={20} />
              </button>
            </div>
          </div>

          {/* ================= TEXT CONTENT ================= */}
          <div className="p-10 text-lg lg:text-xl leading-[3rem] text-slate-700 font-medium break-words break-all overflow-hidden">
            {words.map((word, index) => {
              const isSelected = selectedIndices.includes(index);
              const mistakeDetail = (question?.mistakes || []).find(m => m.index === index + 1);
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
                  <span
                    onClick={() => handleWordClick(index)}
                    className={`px-1 py-1 rounded cursor-pointer transition-all ${bgColor}`}
                  >
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

          {/* SUBMIT BUTTON */}
          <div className="px-8 pb-8 mt-auto">
            {status !== "submitted" ? (
              <button
                onClick={handleSubmit}
                disabled={status === "submitted"}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg disabled:bg-slate-300 shadow-lg shadow-blue-200 disabled:shadow-none transition-all hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={24} /> Submit Answer
              </button>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="w-full bg-indigo-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-600 transition flex items-center justify-center gap-2"
              >
                View Result Details
              </button>
            )}

          </div>
        </div>
      )}

      {/* ================= HISTORY SECTION ================= */}

      <AttemptHistoryHIW
        questionId={question}
        currentAttemptId={result?._id}
        onSelectAttempt={handleSelectAttempt}
      />


      {/* ================= FOOTER CONTROLS ================= */}
      <div className="flex items-center justify-between pb-6 mt-6">
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
          <button onClick={() => window.location.reload()} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
            <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
              <RefreshCw size={18} />
            </div>
            <span className="text-xs font-medium">Redo</span>
          </button>
        </div>

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

      {/* ================= AUDIO ELEMENT ================= */}
      <audio
        ref={audioRef}
        src={question.audioUrl}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onEnded={handleAudioEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* ================= RESULT MODAL ================= */}
      {showModal && result && (
        <ResultModal
          result={result}
          onClose={() => setShowModal(false)}
          onRedo={resetSession}
          question={question}
          nextButton={nextButton}
        />
      )}

    </div>
  );
}

const ResultModal = ({ result, onClose, onRedo, question, nextButton }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const scoreValue = result.score || 0;
  // If maxScore is not present, use missedCount + score as fallback approximation or just 1
  const maxScore = result.maxScore || (result.score + (result.missedCount || 0)) || 1;
  const percentage = maxScore > 0 ? (scoreValue / maxScore) : 0;
  const offset = circumference - circumference * percentage;

  const totalMistakes = question?.mistakes?.length || 0;
  const scorePercentage = totalMistakes > 0 ? (scoreValue / totalMistakes) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden relative border flex flex-col items-center animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b w-full">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-500"><ChevronRight className="rotate-90" size={20} /></div>
            <h2 className="text-xl font-bold text-slate-700">
              {question?.name || "HIW_Test"} <span className="text-slate-400 font-medium">({question?.title || "Result"})</span>
            </h2>
            <Share2 size={20} className="text-blue-500 cursor-pointer ml-2 hover:scale-110 transition" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onRedo} className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-full font-bold hover:bg-blue-100 transition">
              <RotateCcw size={18} /> Redo
            </button>
            {nextButton && (
              <button onClick={nextButton} className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-full font-bold hover:bg-blue-100 transition">
                <ChevronRight size={18} /> Next Question
              </button>
            )}

            <button onClick={onClose} className="p-2.5 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row p-10 gap-10 w-full">
          {/* Left Score Card */}
          <div className="md:w-[35%] bg-white border-2 border-slate-50 rounded-[3rem] p-10 flex flex-col items-center justify-center relative shadow-sm ring-1 ring-purple-100/50">
            <div className="absolute top-6 right-8 text-purple-300 bg-purple-50 p-2 rounded-full rotate-12"><Play size={16} fill="currentColor" /></div>
            <h3 className="text-lg font-bold text-slate-600 mb-10 tracking-tight">Your Score</h3>

            <div className="relative w-56 h-56 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-180" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" strokeDasharray="125.6" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="40" stroke="#3b82f6" strokeWidth="8" fill="transparent" strokeDasharray="125.6" strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute flex flex-col items-center mt-2">
                <span className="text-7xl font-black text-slate-800 tracking-tighter">{scoreValue}</span>
              </div>
              <div className="absolute bottom-6 flex justify-between w-full px-10 text-xs font-black text-slate-400">
                <span>0</span>
                <span>{maxScore}</span>
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
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center">
                <span className="text-green-800 font-bold block text-sm mb-1">Correct</span>
                <div className="text-2xl font-black text-green-600">{result.correctCount || 0}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
                <span className="text-red-800 font-bold block text-sm mb-1">Incorrect</span>
                <div className="text-2xl font-black text-red-600">{result.wrongCount || 0}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-center">
                <span className="text-orange-800 font-bold block text-sm mb-1">Missed</span>
                <div className="text-2xl font-black text-orange-600">{result.missedCount || 0}</div>
              </div>
            </div>

            {/* Correct Answers List */}
            <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm flex-1">
              <div className="bg-[#E6F8E8] px-8 py-4 text-slate-700 font-bold text-lg">Correct Answers</div>
              <div className="p-6 space-y-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                {question?.mistakes?.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-3.5 text-slate-600 font-bold px-2">
                    <CheckCircle2 size={20} className="text-green-500" /> {m.answer}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
