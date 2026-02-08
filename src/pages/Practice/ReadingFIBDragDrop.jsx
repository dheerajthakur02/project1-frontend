import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Shuffle, Hash, BarChart2, Info, X, GripVertical, Eye, Languages } from 'lucide-react';
import api, { submitReadingFIBDragDropAttempt, getReadingFIBDragDropAttempts } from '../../services/api';
import { useSelector } from 'react-redux';
// import axios from 'axios'; // Removed direct axios import


export const getReadingFIBDragDropCommunityAttempts = (questionId) =>
  api.get(
    `/reading-fib-drag-drop/${questionId}/community`
  );


const AttemptHistory = ({ questionId, currentAttemptId, onSelectAttempt }) => {
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
        const res = await getReadingFIBDragDropAttempts(questionId);

        if (res?.success) {
          // Sort by latest first
          const sortedAttempts = (res.data || []).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setMyAttempts(sortedAttempts);
        }
      } catch (err) {
        console.error("Failed to fetch my attempts", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyAttempts();
  }, [questionId, currentAttemptId, activeTab]);

  /* ================= COMMUNITY ATTEMPTS ================= */
  useEffect(() => {
    if (!questionId || activeTab !== "community" || communityAttemptsRaw.length)
      return;

    const fetchCommunityAttempts = async () => {
      setLoading(true);
      try {
        const res = await getReadingFIBDragDropCommunityAttempts(questionId); // Using the new API for community attempts

        if (res?.data.success) {
          setCommunityAttemptsRaw(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch community attempts", err);
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

  /* ================= LOADING ================= */
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
                  {attempt.communityUserId.slice(-6)} {/* Display last 6 chars */}
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
                      ? "text-blue-600" // Mid-range score
                      : "text-red-500"
                    }`}
                >
                  {attempt.score}
                </span>
                <span className="text-sm text-slate-400 font-medium">
                  / {attempt.maxScore}
                </span>
              </div>
            </div>

            {/* ✅ STATUS */}
            <div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${attempt.score === attempt.maxScore
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-600" // For completed but not perfect
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



const ReadingFIBDragDrop = ({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) => {
  const { user } = useSelector((state) => state.auth);
  const [userAnswers, setUserAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [textSegments, setTextSegments] = useState([]);
  const [availableOptions, setAvailableOptions] = useState([]);

  // UI State
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [viewAttempt, setViewAttempt] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  // Translation State
  const [translation, setTranslation] = useState("");
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Answer Flash State
  const [showFlashAnswer, setShowFlashAnswer] = useState(false);

  const handleTranslate = async () => {
    if (!question || !question.text) {
      console.log("No question text found for translation");
      return;
    }
    console.log("Starting translation...");
    setLoadingTranslation(true);
    setShowToast(true);

    try {
      // Replace placeholders [1], [2] etc with blanks for better context or just spaces
      const textToTranslate = question.text.replace(/\[\d+\]/g, " _______ ");

      const res = await axios.get(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          textToTranslate.substring(0, 1000)
        )}&langpair=en|hi`
      );

      console.log("Translation API Response:", res.data);

      if (res.data && res.data.responseData) {
        setTranslation(res.data.responseData.translatedText);
      }
    } catch (err) {
      console.error("Translation failed", err);
      setTranslation("Translation failed. Please try again.");
    } finally {
      setLoadingTranslation(false);
    }
  };

  const handleShowAnswer = () => {
    if (!question || !question.correctAnswers) return;
    setShowFlashAnswer(true);
    setTimeout(() => setShowFlashAnswer(false), 8000); // Hide after 8 seconds
  };


  // Initialize segments and answers on load
  useEffect(() => {
    if (question && question.text) {
      const segments = question.text.split(/\[\d+\]/g); // Matches [1], [2] etc. 
      // Better split regex to capture blanks or just split by standard placeholder logic if backend always sends [1]
      // Let's assume the text comes with placeholders like [1], [2].
      // If the text comes with underscores like the Dropdown one, adapt.
      // Based on sample data: "The nation [1] its first..."

      setTextSegments(segments);
      resetForm();
    }
  }, [question]);

  const [status, setStatus] = useState("prep");
  const [timeLeft, setTimeLeft] = useState(3);

  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (status !== "prep") return;
    const prepareTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus("answering");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(prepareTimer);
  }, [status]);

  // Answer Timer
  useEffect(() => {
    let interval;
    if (status === "answering" && !isResultOpen) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, isResultOpen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const resetForm = () => {
    if (!question) return;
    const initialAnswers = {};
    // Based on blanks count or indices found in text
    // Sample data uses [1], [2]. So we need to map indices.
    // Assuming question.correctAnswers gives us the indices.
    question.correctAnswers.forEach(ca => {
      initialAnswers[ca.index] = null;
    });

    setUserAnswers(initialAnswers);
    setAvailableOptions([...question.options]);
    setResult(null);
    setIsResultOpen(false);
    setViewAttempt(null);
    setStatus("prep");
    setTimeLeft(3);
    setTimer(0);
  }

  // Drag and Drop Handlers
  const handleDragStart = (e, option, source) => {
    setDraggedItem({ option, source }); // source: 'pool' or blankIndex
    e.dataTransfer.setData('text/plain', JSON.stringify({ option, source }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnBlank = (e, blankIndex) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const { option, source } = data;

    // If dropping on a filled blank, swap or replace?
    // Let's implement Replace: Old value goes back to pool, New value comes in.

    const currentVal = userAnswers[blankIndex];

    // Update Answers
    const newAnswers = { ...userAnswers };
    newAnswers[blankIndex] = option;
    setUserAnswers(newAnswers);

    // Update Pool
    let newOptions = [...availableOptions];

    // If coming from pool, remove from pool
    if (source === 'pool') {
      const optIndex = newOptions.indexOf(option);
      if (optIndex > -1) newOptions.splice(optIndex, 1);
    } else {
      // If coming from another blank (source is an index)
      newAnswers[source] = null; // Clear source blank
      setUserAnswers(newAnswers); // Update directly
    }

    // If there was a value in target blank, return it to pool
    if (currentVal) {
      newOptions.push(currentVal);
    }

    setAvailableOptions(newOptions);
    setDraggedItem(null);
  };

  const handleDropOnPool = (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const { option, source } = data;

    if (source === 'pool') return; // Change nothing

    // Remove from blank
    const newAnswers = { ...userAnswers };
    newAnswers[source] = null;
    setUserAnswers(newAnswers);

    // Add to pool
    setAvailableOptions(prev => [...prev, option]);
    setDraggedItem(null);
  };

  const handleSubmit = async () => {
    if (!user?._id) return;

    // payload for drag drop: index, answer
    const formattedAnswers = Object.keys(userAnswers)
      .filter(key => userAnswers[key] !== null)
      .map(key => ({
        index: parseInt(key),
        answer: userAnswers[key]
      }));

    const payload = {
      userId: user._id,
      questionId: question._id,
      userAnswers: formattedAnswers,
      timeTaken: timer
    };

    try {
      const res = await submitReadingFIBDragDropAttempt(payload);
      if (res.success) {
        setResult(res.data);
        setViewAttempt(res.data);
        setIsResultOpen(true);
      }
    } catch (error) {
      console.error("Submission failed", error);
    }
  };

  const handleRedo = () => {
    resetForm();
  };

  const openAttempt = (attempt) => {
    setViewAttempt(attempt);
    setIsResultOpen(true);
  };

  // Calculate progress
  const totalBlanks = question?.correctAnswers?.length || 0;
  const filledBlanks = Object.values(userAnswers).filter(a => a !== null).length;
  const isSubmitDisabled = filledBlanks === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      <div>
        <h1>Fill in the Blanks (Drag and Drop)</h1>
        <p>
          In the text below some words are missing. Drag words from the box below to the appropriate place in the text. To undo an answer choice, drag the word back to the box below the text.
        </p>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveSpeechQuestion(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Fill in the Blanks (Drag and Drop)
            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Reading</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 rounded-lg px-3 py-1 text-sm font-bold text-slate-600 flex items-center gap-2">
            <RefreshCw size={14} className={status === "answering" ? "animate-spin-slow" : ""} />
            {formatTime(timer)}
          </div>
          <div className="text-sm font-medium text-slate-500">
            {filledBlanks} / {totalBlanks} filled
          </div>
        </div>
      </div>

      {/* Main Interface */}
      {status === "prep" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 text-center space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Starting Soon...</h2>
          <div className="text-6xl font-black text-primary-600 animate-pulse">
            {timeLeft}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Hash size={14} />
                {question?._id?.slice(-5)?.toUpperCase()}
              </span>
              <span className="text-slate-500 text-sm font-medium border-l border-slate-200 pl-4">
                {question?.title || "Reading Task"}
              </span>
            </div>
          </div>

          <div className="p-8">
            {/* Text Area with Blanks */}
            <div className="leading-loose text-lg text-slate-700 mb-10">
              {textSegments.map((segment, i) => {
                // Assuming segments are split by brackets, so we have text, then blank, then text...
                // If segments length is N, there are N-1 blanks typically if split correctly.
                // However, simplified logic: 
                // Text: "A [1] B [2] C" -> split by /\[\d+\]/ -> ["A ", " B ", " C"]
                // We need access to the blank index. 
                // Correct generic loop:

                const blankIndex = i + 1; // 1-based index
                const hasBlankAfter = i < textSegments.length - 1;

                return (
                  <React.Fragment key={i}>
                    <span>{segment}</span>
                    {hasBlankAfter && (
                      <span
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropOnBlank(e, blankIndex)}
                        className={`inline-block min-w-[120px] mx-1 px-3 py-1.5 align-middle border-2 border-dashed rounded-lg transition-all
                                                ${userAnswers[blankIndex]
                            ? 'bg-blue-50 border-blue-200 text-blue-800 font-bold'
                            : 'bg-slate-50 border-slate-300 text-slate-400'
                          }
                                            `}
                      >
                        {userAnswers[blankIndex] ? (
                          <span
                            draggable
                            onDragStart={(e) => handleDragStart(e, userAnswers[blankIndex], blankIndex)}
                            className="cursor-grab active:cursor-grabbing"
                          >
                            {userAnswers[blankIndex]}
                          </span>
                        ) : (
                          <span className="pointer-events-none opacity-50 text-sm">Drop here</span>
                        )}
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Options Pool */}
            <div
              className="bg-slate-50 rounded-xl p-6 border border-slate-100"
              onDragOver={handleDragOver}
              onDrop={handleDropOnPool}
            >
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Available Options</h4>
              <div className="flex flex-wrap gap-3">
                {availableOptions.map((opt, idx) => (
                  <div
                    key={`${opt}-${idx}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, opt, 'pool')}
                    className="bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm font-medium text-slate-700 cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-2"
                  >
                    <GripVertical size={14} className="text-slate-300" />
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center gap-2
                            ${isSubmitDisabled ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-primary-600 hover:bg-primary-700 hover:shadow-primary-200'}
                        `}
            >
              <CheckCircle size={20} />
              Submit Answer
            </button>
          </div>
        </div>
      )}

      {/* Footer Nav */}
      <div className="flex items-center justify-between pb-10">
        {/* LEFT SIDE: Translate, Answer, Redo */}
        <div className="flex items-center gap-4">
          {/* Translate (Working) */}
          <button onClick={handleTranslate} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors">
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
              <Languages size={18} />
            </div>
            <span className="text-xs font-bold">Translate</span>
          </button>

          {/* Answer (Working) */}
          <button onClick={handleShowAnswer} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors">
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
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

        {/* RIGHT SIDE: Prev, Next */}
        <div className="flex items-center gap-4">
          <button onClick={previousButton} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors">
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
              <ChevronLeft size={20} />
            </div>
            <span className="text-xs font-bold">Previous</span>
          </button>

          <button onClick={nextButton} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-600 transition-colors">
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
              <ChevronRight size={20} />
            </div>
            <span className="text-xs font-bold">Next</span>
          </button>
        </div>
      </div>

      {/* Answer Toast */}
      {showFlashAnswer && (
        <Toast
          show={showFlashAnswer}
          onClose={() => setShowFlashAnswer(false)}
          title="Correct Answers"
        >
          <div className="flex flex-wrap justify-center gap-4">
            {question?.correctAnswers?.map((ans, index) => (
              <div key={index} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-bold text-xs">[{ans.index}]:</span>
                <span className="font-semibold text-lg text-green-600">{ans.correctAnswer}</span>
              </div>
            ))}
          </div>
        </Toast>
      )}

      {/* Translation Toast */}
      {showToast && (
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          title="Hindi Translation"
          loading={loadingTranslation}
        >
          <p className="text-sm leading-relaxed text-slate-700">
            {loadingTranslation ? "Translating..." : translation}
          </p>
        </Toast>
      )}



      {/* History Section */}
      {question && (
        <AttemptHistory
          questionId={question._id}
          currentAttemptId={result?._id}
          onSelectAttempt={openAttempt}
        />
      )}

      {/* Result Modal */}
      {isResultOpen && viewAttempt && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity" onClick={() => setIsResultOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vh] lg:w-[60vw] lg:h-[80vh] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in zoom-in-50 duration-300">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle className="text-green-500" size={24} />
                Result Analysis
              </h3>
              <button onClick={() => setIsResultOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              <div className="flex flex-col items-center justify-center mb-10">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke={viewAttempt.score === viewAttempt.maxScore ? "#22c55e" : "#3b82f6"}
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="440"
                      strokeDashoffset={440 - 440 * (viewAttempt.score / (viewAttempt.maxScore || 1))}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-slate-800">{viewAttempt.score}</span>
                    <span className="text-sm text-slate-400 font-bold uppercase tracking-wider">/ {viewAttempt.maxScore}</span>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <h4 className="text-xl font-bold text-slate-800">
                    {viewAttempt.score === viewAttempt.maxScore ? "Perfect Score!" : "Good Attempt"}
                  </h4>
                  <p className="text-slate-500 text-sm">You answered {viewAttempt.score} out of {viewAttempt.maxScore} correctly.</p>
                  {viewAttempt.timeTaken !== undefined && (
                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm font-semibold text-slate-600">
                      <RefreshCw size={14} />
                      Time Taken: {formatTime(viewAttempt.timeTaken)}
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Review */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 leading-relaxed text-lg text-slate-700">
                {textSegments.map((segment, i) => {
                  const blankIndex = i + 1;
                  const hasBlankAfter = i < textSegments.length - 1;

                  // Find correct answer
                  const correctEntry = question.correctAnswers.find(c => c.index === blankIndex);
                  const correctAnswer = correctEntry ? correctEntry.correctAnswer : "?";

                  // Find user answer
                  const userEntry = viewAttempt.userAnswers.find(u => u.index === blankIndex);
                  const userAnswer = userEntry ? userEntry.answer : null;
                  const isCorrect = userEntry ? userEntry.isCorrect : false;

                  return (
                    <React.Fragment key={i}>
                      <span>{segment}</span>
                      {hasBlankAfter && (
                        <span className="inline-block mx-1 align-middle">
                          {isCorrect ? (
                            <span className="px-3 py-1 rounded-lg bg-green-100 text-green-700 font-bold border border-green-200">
                              {userAnswer} <CheckCircle size={14} className="inline ml-1" />
                            </span>
                          ) : (
                            <span className="inline-flex flex-col align-middle mx-1">
                              {userAnswer && (
                                <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-600 line-through decoration-red-600 decoration-2 opacity-70 mb-0.5 w-fit">
                                  {userAnswer}
                                </span>
                              )}
                              <span className="px-3 py-1 rounded-lg bg-green-50 text-green-700 font-bold border border-green-200 shadow-sm">
                                {correctAnswer}
                              </span>
                            </span>
                          )}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => {
                  setIsResultOpen(false);
                  handleRedo();
                }}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                Practice Again
              </button>
            </div>
          </div>
        </>
      )
      }
    </div >
  );
};

export default ReadingFIBDragDrop;

// Toast Component
const Toast = ({ show, onClose, title, children, loading }) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl p-6 max-w-lg w-[90vw] relative border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X size={18} />
        </button>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</span>
          {loading && <RefreshCw size={14} className="animate-spin text-slate-500" />}
        </div>
        <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
