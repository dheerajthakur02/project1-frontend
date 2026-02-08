import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Shuffle, Hash, BarChart2, Info, X, Circle, Eye, Languages } from 'lucide-react';
import api, { submitReadingMultiChoiceSingleAnswerAttempt, getReadingMultiChoiceSingleAnswerAttempts } from '../../services/api';
import { useSelector } from 'react-redux';
// import axios from 'axios'; // Removed direct axios import

export const getReadingMultiChoiceSingleAnswerCommunityAttempts = (questionId) =>
  api.get(
    `/reading-multi-choice-single-answer/${questionId}/community`
  );



const AttemptHistory = ({ questionId, currentAttemptId, onSelectAttempt }) => {
  const [activeTab, setActiveTab] = useState("my"); // my | community
  const [history, setHistory] = useState([]);
  const [community, setCommunity] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= MY ATTEMPTS ================= */
  useEffect(() => {
    if (!questionId || activeTab !== "my") return;

    const fetchMyAttempts = async () => {
      setLoading(true);
      try {
        const res =
          await getReadingMultiChoiceSingleAnswerAttempts(questionId);

        if (res?.data) {
          setHistory(res.data || []);
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
    if (!questionId || activeTab !== "community" || community.length) return;

    const fetchCommunity = async () => {
      setLoading(true);
      try {
        const res =
          await getReadingMultiChoiceSingleAnswerCommunityAttempts(questionId);

        if (res?.data?.success) {
          setCommunity(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch community attempts", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [questionId, activeTab, community.length]);

  /* ================= FLATTEN COMMUNITY ================= */
  const communityAttempts = useMemo(() => {
    return community.flatMap((user) =>
      user.attempts.map((attempt) => ({
        ...attempt,
        communityUserId: user.userId,
      }))
    );
  }, [community]);

  const list = activeTab === "my" ? history : communityAttempts;

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">Loading...</div>
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
        </div>
      )}

      {/* ================= LIST ================= */}
      <div className="space-y-4">
        {list.map((attempt) => (
          <div
            key={attempt._id}
            onClick={() =>
              activeTab === "my" && onSelectAttempt?.(attempt)
            }
            className={`bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-6 transition cursor-pointer ${activeTab === "my"
              ? "hover:shadow-md group"
              : ""
              }`}
          >
            {/* DATE */}
            <div className="min-w-[160px]">
              <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                Date
              </span>
              <div className="text-sm font-semibold text-slate-700">
                {new Date(attempt.createdAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {/* SCORE */}
            <div className="flex-1">
              <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                Score
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-xl font-bold ${attempt.score === attempt.maxScore
                    ? "text-green-600"
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

            {/* USER (COMMUNITY ONLY) */}
            {activeTab === "community" && (
              <div className="text-sm font-bold text-slate-600">
                User • {attempt.communityUserId.slice(-6)}
              </div>
            )}

            {/* STATUS */}
            <div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${attempt.score === attempt.maxScore
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
                  }`}
              >
                {attempt.score === attempt.maxScore
                  ? "Correct"
                  : "Incorrect"}
              </span>
            </div>

            {/* ACTION */}
            {activeTab === "my" && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 font-bold text-sm">
                View Result →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};



const ReadingMultiChoiceSingleAnswer = ({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) => {
  const { user } = useSelector((state) => state.auth);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);

  // UI State
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [viewAttempt, setViewAttempt] = useState(null);

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
      const res = await axios.get(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          question.text.substring(0, 1000)
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
    if (!question || !question.correctAnswer) return;
    setShowFlashAnswer(true);
    setTimeout(() => setShowFlashAnswer(false), 8000); // Hide after 8 seconds
  };


  // Initialize on load
  useEffect(() => {
    if (question) {
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
    setSelectedOption(null);
    setResult(null);
    setIsResultOpen(false);
    setViewAttempt(null);
    setStatus("prep");
    setTimeLeft(3);
    setTimer(0);
  }

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleSubmit = async () => {
    if (!user?._id) return;

    const payload = {
      userId: user._id,
      questionId: question._id,
      userAnswer: selectedOption,
      timeTaken: timer
    };

    try {
      const res = await submitReadingMultiChoiceSingleAnswerAttempt(payload);
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

  const isSubmitDisabled = !selectedOption;

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      <div>
        <h1>Multiple Choice (Single)</h1>
        <p>Read the text and answer the multiple-choice question by selecting the correct response. Only one response is correct.</p>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveSpeechQuestion(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Multiple Choice, Choose Single Answer
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

      {/* Question Card */}
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
              <span className={`text-xs px-2 py-1 rounded-md font-bold shadow-sm ${question?.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                question?.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                {question?.difficulty}
              </span>
            </div>
          </div>

          <div className="p-0 flex flex-col md:flex-row">
            {/* Left Panel: Passage */}
            <div className="md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/30">
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base">
                {question?.text}
              </div>
            </div>

            {/* Right Panel: Question & Options */}
            <div className="md:w-1/2 p-8">
              <h3 className="font-bold text-slate-800 text-lg mb-6 leading-snug">
                {question?.question}
              </h3>

              <div className="space-y-3">
                {question?.options?.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer group
                                        ${selectedOption === option
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }
                                    `}
                    onClick={() => handleOptionSelect(option)}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0
                                        ${selectedOption === option
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }
                                    `}>
                      {selectedOption === option && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${selectedOption === option ? 'text-slate-800' : 'text-slate-600'}`}>
                      {option}
                    </span>
                  </label>
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
          title="Correct Answer"
        >
          <div className="flex justify-center">
            <span className="px-4 py-2 rounded-lg bg-green-100 text-green-700 font-bold border border-green-200 text-lg">
              {question?.correctAnswer}
            </span>
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

      {/* RESULT MODAL */}
      {isResultOpen && viewAttempt && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity" onClick={() => setIsResultOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vh] lg:w-[60vw] lg:h-[80vh] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in zoom-in-50 duration-300">
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle className={viewAttempt.score === 1 ? "text-green-500" : "text-red-500"} size={24} />
                Result Analysis
              </h3>
              <button onClick={() => setIsResultOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto flex-1">
              {/* Score Stats */}
              <div className="flex flex-col items-center justify-center mb-10">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke={viewAttempt.score === 1 ? "#22c55e" : "#ef4444"}
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="440"
                      strokeDashoffset={440 - 440 * (viewAttempt.score / 1)}
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
                    {viewAttempt.score === 1 ? "Correct Answer!" : "Incorrect Answer"}
                  </h4>
                  <p className="text-slate-500 text-sm">
                    Score logic: 1 for correct, 0 for incorrect.
                  </p>
                  {viewAttempt.timeTaken !== undefined && (
                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm font-semibold text-slate-600">
                      <RefreshCw size={14} />
                      Time Taken: {formatTime(viewAttempt.timeTaken)}
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Review */}
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Info size={16} /> Solution Check
                  </h4>
                  <div className="space-y-3">
                    {question?.options?.map((option, index) => {
                      const isSelected = viewAttempt.userAnswer === option;
                      const isCorrect = question.correctAnswer === option;

                      // Determine visual state
                      let borderClass = 'border-slate-100';
                      let bgClass = 'bg-white';
                      let icon = null;

                      if (isCorrect) {
                        // Correct answer (whether selected or not)
                        borderClass = 'border-green-200';
                        bgClass = 'bg-green-50';
                        icon = <span className="text-green-600 font-bold text-xs flex items-center gap-1">Correct Answer <CheckCircle size={14} /></span>;
                      } else if (isSelected && !isCorrect) {
                        // Selected but wrong
                        borderClass = 'border-red-200';
                        bgClass = 'bg-red-50';
                        icon = <span className="text-red-500 font-bold text-xs flex items-center gap-1">Your Choice <X size={14} /></span>;
                      }

                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border flex justify-between items-center ${borderClass} ${bgClass}`}
                        >
                          <span className={`text-sm font-medium ${isSelected || isCorrect ? 'text-slate-800' : 'text-slate-500'}`}>
                            {option}
                          </span>
                          {icon}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
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
      )}

    </div>
  );
};

export default ReadingMultiChoiceSingleAnswer;

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
