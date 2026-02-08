import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Shuffle, Hash, BarChart2, Info, X, GripVertical, ArrowRight, Eye, Languages } from 'lucide-react';
import api, { submitReadingReorderAttempt, getReadingReorderAttempts } from '../../services/api';
import { useSelector } from 'react-redux';
// import axios from 'axios'; // Removed direct axios import

export const getReadingReorderCommunityAttempts = (questionId) =>
  api.get(
    `/reading-reorder/${questionId}/community`
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
        const res = await getReadingReorderAttempts(questionId);

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
        const res = await getReadingReorderCommunityAttempts(questionId); // Using the new API for community attempts

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


const ReadingReorder = ({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) => {
  const { user } = useSelector((state) => state.auth);
  const [sourceItems, setSourceItems] = useState([]);
  const [targetItems, setTargetItems] = useState([]);
  const [result, setResult] = useState(null);
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
    if (!question || !question.sentences) {
      console.log("No question text found for translation");
      return;
    }
    console.log("Starting translation...");
    setLoadingTranslation(true);
    setShowToast(true);

    try {
      // Concatenate all sentence texts
      const fullText = question.sentences.map(s => s.text).join(" ");

      const res = await axios.get(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          fullText.substring(0, 1000)
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
    if (!question || !question.correctOrder) return;
    setShowFlashAnswer(true);
    setTimeout(() => setShowFlashAnswer(false), 8000); // Hide after 8 seconds
  };


  // Initialize
  useEffect(() => {
    if (question && question.sentences) {
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
    // Shuffle source items for display
    const items = [...question.sentences];
    // Fisher-Yates shuffle or simplified sort
    const shuffled = items.sort(() => Math.random() - 0.5);

    setSourceItems(shuffled);
    setTargetItems([]);
    setResult(null);
    setIsResultOpen(false);
    setViewAttempt(null);
    setStatus("prep");
    setTimeLeft(3);
    setTimer(0);
  };

  const handleDragStart = (e, item, source) => {
    setDraggedItem({ item, source }); // source: 'source' or 'target'
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, source }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnTarget = (e) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { item, source } = draggedItem;

    if (source === 'source') {
      // Move from source to target
      setSourceItems(prev => prev.filter(i => i.id !== item.id));
      setTargetItems(prev => [...prev, item]);
    } else if (source === 'target') {
      // Check if dropped on another item for reordering could be complex
      // For now simple append if dropped on container. 
      // Better: implement sortable list logic later
    }
    setDraggedItem(null);
  };

  // Helper for dropping specifically into a position in target list
  // Not implemented fully here to keep it simple first

  const moveToTarget = (item) => {
    setSourceItems(prev => prev.filter(i => i.id !== item.id));
    setTargetItems(prev => [...prev, item]);
  }

  const moveToSource = (item) => {
    setTargetItems(prev => prev.filter(i => i.id !== item.id));
    setSourceItems(prev => [...prev, item]);
  }

  const handleSubmit = async () => {
    if (!user?._id) return;

    // userOrder needs to be array of IDs
    const userOrder = targetItems.map(item => item.id);

    const payload = {
      userId: user._id,
      questionId: question._id,
      userOrder,
      timeTaken: timer
    };

    try {
      const res = await submitReadingReorderAttempt(payload);
      if (res.success) {
        setResult(res.data);
        setViewAttempt(res.data);
        setIsResultOpen(true);
      }
    } catch (error) {
      console.error("Submission failed", error);
    }
  };

  // Calculate filled status
  const totalItems = question?.sentences?.length || 0;
  const isSubmitDisabled = targetItems.length !== totalItems; // Must use all items? Usually yes in Reorder.


  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      <div>
        <h1>
          Reorder Paragraph
        </h1>
        <p>The text boxes in the left panel have been placed in a random order. Restore the original order by dragging the text boxes from the left panel to the right panel.
        </p>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveSpeechQuestion(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Re-order Paragraph
            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Reading</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 rounded-lg px-3 py-1 text-sm font-bold text-slate-600 flex items-center gap-2">
            <RefreshCw size={14} className={status === "answering" ? "animate-spin-slow" : ""} />
            {formatTime(timer)}
          </div>
        </div>
      </div>

      {/* Main Interface: Split Pane */}
      {status === "prep" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 text-center space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Starting Soon...</h2>
          <div className="text-6xl font-black text-primary-600 animate-pulse">
            {timeLeft}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[600px]">

          {/* SOURCE COLUMN */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-white">
              <h3 className="font-bold text-slate-700">Source</h3>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-3">
              {sourceItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item, 'source')}
                  onClick={() => moveToTarget(item)}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-grab active:cursor-grabbing transition-all flex gap-4 group"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {/* Usually source doesn't have letters A/B/C fixed, but purely content */}
                    {/* Or use item.id if it is A,B,C... */}
                    <GripVertical size={16} />
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed select-none">{item.text}</p>
                </div>
              ))}
              {sourceItems.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  <span className="text-sm">All items moved</span>
                </div>
              )}
            </div>
          </div>

          {/* TARGET COLUMN */}
          <div
            className="bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={handleDropOnTarget}
          >
            <div className="px-6 py-4 border-b border-blue-100 bg-blue-50">
              <h3 className="font-bold text-blue-800">Your Answer</h3>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-3">
              {targetItems.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <span className="text-sm">+ Drag here</span>
                </div>
              )}
              {targetItems.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item, 'target')}
                  onClick={() => moveToSource(item)}
                  className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm cursor-grab active:cursor-grabbing flex gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 border border-blue-200 shadow-sm">
                    {/* Dynamic Alphabet Index logic if needed, or just specific visual */}
                    {String.fromCharCode(65 + index)}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed select-none">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="p-4 bg-white/50 border-t border-blue-100 flex justify-end">
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
          <button onClick={resetForm} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors">
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

          <button onClick={nextButton} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors">
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
          title="Correct Order"
        >
          <div className="space-y-4">
            {question?.correctOrder?.map((itemId, idx) => {
              const item = question.sentences.find(s => s.id === itemId);
              return (
                <div key={itemId} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-sm mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="text-slate-700 text-sm leading-relaxed font-medium">
                    {item ? item.text : "Loading..."}
                  </div>
                </div>
              );
            })}
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
          onSelectAttempt={(a) => {
            setViewAttempt(a);
            setIsResultOpen(true);
          }}
        />
      )}

      {/* Result Modal */}
      {isResultOpen && viewAttempt && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity" onClick={() => setIsResultOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in zoom-in-50 duration-300">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle className="text-green-500" size={16} />
                Result Analysis
              </h3>
              <button onClick={() => setIsResultOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-white">
              {/* Score Header */}
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="text-2xl font-black text-slate-800 mb-0.5">{viewAttempt.score} <span className="text-sm text-slate-400 font-medium">/ {viewAttempt.maxScore}</span></div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">Adjacent Pair Score</div>
                {viewAttempt.timeTaken !== undefined && (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm font-semibold text-slate-600">
                    <RefreshCw size={14} />
                    Time Taken: {formatTime(viewAttempt.timeTaken)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">

                {/* LEFT COLUMN: CORRECT ORDER (SOURCE) */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 mb-2 pb-2 border-b border-slate-100">Correct Order</h4>
                  <div className="space-y-0 relative">
                    {/* Render items in CORRECT ORDER */}
                    {question.correctOrder.map((itemId, idx) => {
                      const item = question.sentences.find(s => s.id === itemId);
                      const isLast = idx === question.correctOrder.length - 1;

                      return (
                        <div key={itemId} className="relative pb-3 last:pb-0">
                          {/* Connector Line (Green) - Only if not last */}
                          {!isLast && (
                            <div className="absolute left-4 top-8 bottom-0 w-0 border-l border-dashed border-green-500 z-0"></div>
                          )}

                          {/* Connector Icon (Green Check) - Only if not last */}
                          {!isLast && (
                            <div className="absolute left-4 -ml-1.5 top-[100%] -mt-2.5 z-10 w-3 h-3 rounded-full bg-green-100 text-green-600 flex items-center justify-center border border-green-200 shadow-sm">
                              <CheckCircle size={8} fill="currentColor" className="text-green-500" />
                            </div>
                          )}

                          {/* Card */}
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 relative z-10 flex gap-3 shadow-sm items-start">
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-md shadow-blue-200 mt-0.5">
                              {itemId}
                            </div>
                            <div className="text-slate-700 leading-snug text-xs font-medium">
                              {item?.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT COLUMN: MY ANSWER */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 mb-2 pb-2 border-b border-slate-100">My Answer</h4>
                  <div className="space-y-0 relative">
                    {viewAttempt.userOrder.map((itemId, idx) => {
                      const item = question.sentences.find(s => s.id === itemId);
                      const isLast = idx === viewAttempt.userOrder.length - 1;

                      // Determination of relation to NEXT item
                      let isPairCorrect = false;
                      if (!isLast) {
                        const nextId = viewAttempt.userOrder[idx + 1];
                        const pairStr = `${itemId}-${nextId}`;
                        // Check result
                        const pairResult = viewAttempt.pairResults.find(p => p.pair === pairStr);
                        isPairCorrect = pairResult?.isCorrect;
                      }

                      return (
                        <div key={idx} className="relative pb-3 last:pb-0">
                          {/* Connector Line - Only if not last */}
                          {!isLast && (
                            <div className={`absolute left-4 top-8 bottom-0 w-0 border-l border-dashed z-0 ${isPairCorrect ? 'border-green-500' : 'border-red-400'}`}></div>
                          )}

                          {/* Connector Icon - Only if not last */}
                          {!isLast && (
                            <div className={`absolute left-4 -ml-1.5 top-[100%] -mt-2.5 z-10 w-3 h-3 rounded-full flex items-center justify-center border shadow-sm ${isPairCorrect ? 'bg-green-100 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-500'}`}>
                              {isPairCorrect ?
                                <CheckCircle size={8} fill="currentColor" className="text-green-500" /> :
                                <X size={8} strokeWidth={3} />
                              }
                            </div>
                          )}

                          {/* Card */}
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200 relative z-10 flex gap-3 shadow-sm items-start">
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-md shadow-blue-200 mt-0.5">
                              {itemId}
                            </div>
                            <div className="text-slate-700 leading-snug text-xs font-medium">
                              {item?.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => { setIsResultOpen(false); resetForm(); }} className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 text-xs">
                <RefreshCw size={12} />
                Practice Again
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default ReadingReorder;

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
