import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Clock, RefreshCw, ChevronLeft, ChevronRight, Shuffle, Eye, Languages, BookOpen, X
} from "lucide-react";
import { useSelector } from "react-redux";
import { submitSummarizeWrittenAttempt } from "../../services/api";
import WrittenAttemptHistory from "./History"; // import history component

const MAX_TIME = 600; // 10 minutes
const MIN_WORDS = 5;
const MAX_WORDS = 75;

const SummarizeWrittenText = ({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) => {
  const { user } = useSelector((state) => state.auth);


  const [started, setStarted] = useState(true);
  const [timeLeft, setTimeLeft] = useState(3);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("prep"); // prep | writing | submitting | result
  const [result, setResult] = useState(null);
  const [showAnswerModal, setShowAnswerModal] = useState(false);

  // Translation State
  const [translation, setTranslation] = useState("");
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [showToast, setShowToast] = useState(false);

  /* ---------------- TIMER ---------------- */
  // Reset session when question changes
  useEffect(() => {
    resetSession();
  }, [question]);

  useEffect(() => {
    if (!started || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1 && status === "prep") {
          setStatus("writing");
          return MAX_TIME; // Switch to main timer (10 mins)
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, timeLeft, status]);

  /* ---------------- HELPERS ---------------- */
  const wordCount = answer.trim()
    ? answer.trim().split(/\s+/).length
    : 0;

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    const timeTaken = MAX_TIME - timeLeft;

    const res = await submitSummarizeWrittenAttempt({
      questionId: question._id,
      summaryText: answer,
      userId: user._id,
      timeTaken,
    });

    setResult(res.data);
    setStatus("result");
  };

  /* ---------------- SELECT LAST ATTEMPT ---------------- */
  const handleSelectAttempt = (attempt) => {
    setResult(attempt);
    setStatus("result");
  };

  const resetSession = () => {
    setStatus("prep");
    setStarted(true);
    setTimeLeft(3);
    setAnswer("");
    setResult(null);
    setTranslation("");
    setShowToast(false);
  };

  /* ---------------- TRANSLATION ---------------- */
  const handleTranslate = async () => {
    if (translation) {
      setShowToast(true);
      return;
    }

    setLoadingTranslation(true);
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(question.paragraph)}&langpair=en|hi`
      );
      const data = await response.json();
      if (data.responseData && data.responseData.translatedText) {
        setTranslation(data.responseData.translatedText);
        setShowToast(true);
      }
    } catch (error) {
      console.error("Translation error:", error);
      // Optional: Show error toast or alert
    } finally {
      setLoadingTranslation(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1>Summarize Written Text</h1>
        <p>Read the passage below and summarize it using one sentence. Type your response in the box at the bottom of the screen. You have 10 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points in the passage.</p>
      </div>
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveSpeechQuestion(false)}
          className="p-2 hover:bg-slate-100 rounded-full"
        >
          <ArrowLeft size={20} />
        </button>



        <h1 className="text-xl font-bold text-slate-800">
          Summarize Written Text{" "}
          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded font-bold">
            AI+
          </span>
        </h1>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
        {/* PREP SCREEN */}
        {status === "prep" && (
          <div className="text-center space-y-6 py-20">
            <h2 className="text-2xl font-bold text-slate-800">Starting Soon...</h2>
            <div className="text-6xl font-black text-primary-600 animate-pulse">
              {timeLeft}
            </div>
          </div>
        )}

        {/* MAIN UI */}
        {status === "writing" && (
          <>
            {/* Question Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <span className="font-bold text-slate-700">
                  #{question._id.slice(-5).toUpperCase()}
                </span>
                <span className="ml-2 text-sm text-slate-500">
                  {question.title}
                </span>
              </div>

              <div className="flex items-center gap-2 text-green-600 font-bold">
                <Clock size={18} />
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Passage */}
            <div className="bg-slate-50 border rounded-xl p-6 text-slate-700 leading-relaxed max-h-[260px] overflow-y-auto">
              {question.paragraph}
            </div>

            {/* Answer Box */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-9">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your summary here..."
                  className="w-full h-48 border-2 border-dashed border-blue-400 rounded-xl p-4 outline-none resize-none focus:border-blue-600"
                />
              </div>

              {/* Side Panel */}
              <div className="col-span-12 md:col-span-3 bg-slate-50 rounded-xl p-6 flex flex-col items-center justify-center gap-4">
                <div className="text-3xl font-black text-slate-800">
                  {wordCount}
                </div>
                <div className="text-sm text-slate-500">Word Count</div>

                <button
                  disabled={
                    wordCount < MIN_WORDS || wordCount > MAX_WORDS
                  }
                  onClick={handleSubmit}
                  className="w-full bg-primary-600 disabled:bg-slate-300 text-white py-2 rounded-lg font-bold"
                >
                  Submit
                </button>

                <p className="text-xs text-slate-400 text-center">
                  50–70 words
                </p>
              </div>
            </div>
          </>
        )}

        {/* SUBMITTING */}
        {status === "submitting" && (
          <p className="text-center font-bold text-slate-600">
            Evaluating your response...
          </p>
        )}

        {/* RESULT MODAL */}
        {status === "result" && result && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl w-[900px] p-8 space-y-6">

              {/* HEADER */}
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg">
                  {question.code} ({question.title})
                  <span className="ml-2 text-purple-600 font-bold">AI+</span>
                </h2>
                <button onClick={() => { setStatus("prep"); setStarted(true); setTimeLeft(3); setAnswer(""); setResult(null); }}>✕</button>
              </div>

              <div className="grid grid-cols-12 gap-6">

                {/* SCORE GAUGE */}
                <div className="col-span-4 bg-purple-50 rounded-2xl p-6 text-center">
                  <p className="font-semibold mb-3">Your Score</p>
                  <div className="text-5xl font-black text-purple-700">
                    {result.score}
                  </div>
                  <div className="flex justify-between mt-4 text-sm">
                    <span>Reading</span>
                    <span className="bg-green-100 px-2 rounded">
                      {result.readingScore.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Writing</span>
                    <span className="bg-yellow-100 px-2 rounded">
                      {result.writingScore.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* PARAMETERS */}
                <div className="col-span-8 bg-slate-50 rounded-2xl p-6">
                  <h3 className="font-bold mb-4">Scoring Parameters</h3>

                  <div className="grid grid-cols-4 gap-4">
                    <ScoreBox label="Content" value={`${result.content}/4`} />
                    <ScoreBox label="Grammar" value={`${result.grammar}/2`} />
                    <ScoreBox label="Vocabulary" value={`${result.vocabulary}/2`} />
                    <ScoreBox label="Form" value={`${result.form}/2`} />
                  </div>
                </div>
              </div>

              {/* MY ANSWER */}
              <div className="border-t pt-4">
                <h4 className="font-bold mb-2">My Answer</h4>
                <p className="italic text-slate-600">
                  {result.summaryText}
                </p>

                <div className="flex gap-4 mt-3 text-sm">
                  <span>Total Words: {result.wordCount}</span>
                  <span>Grammar: {result.structureErrors}</span>
                  <span>Style: {result.styleIssues}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between pb-10">
        {/* LEFT SIDE: Translate, Answer, Redo */}
        <div className="flex items-center gap-4">
          {/* Translate */}
          <button
            onClick={handleTranslate}
            disabled={loadingTranslation}
            className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
          >
            <div className={`w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm ${loadingTranslation ? "animate-pulse" : ""}`}>
              <Languages size={18} />
            </div>
            <span className="text-xs font-bold">{loadingTranslation ? "..." : "Translate"}</span>
          </button>

          {/* Answer (Static) */}
          <button onClick={() => setShowAnswerModal(true)} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors">
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
              <Eye size={18} />
            </div>
            <span className="text-xs font-bold">Answer</span>
          </button>

          {/* Redo */}
          <button onClick={resetSession} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors">
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

      {/* ---------------- LAST ATTEMPTS HISTORY ---------------- */}
      {question.lastAttempts && (
        <div className="mt-12">
          <h3 className="font-bold text-lg mb-4">Previous Attempts</h3>
          <WrittenAttemptHistory
            question={question}
            module="summarize-text"
            onSelectAttempt={handleSelectAttempt}
          />
        </div>
      )}
      {/* ---------------- ANSWER MODAL ---------------- */}
      {showAnswerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <BookOpen className="text-purple-600" size={24} /> Model Answer
              </h3>
              <button onClick={() => setShowAnswerModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={24} className="text-slate-500" />
              </button>
            </div>
            <div className="p-8">
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6">
                <p className="text-lg leading-relaxed text-slate-700 font-medium">
                  {question.modelAnswer || "No model answer provided for this passage."}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button onClick={() => setShowAnswerModal(false)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ---------------- TRANSLATION TOAST ---------------- */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-white text-slate-800 border border-slate-200 px-6 py-4 rounded-xl shadow-2xl max-w-2xl flex items-start gap-4">
            <Languages className="shrink-0 mt-1 text-purple-600" size={20} />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-purple-700">Hindi Translation</h4>
              <p className="text-sm leading-relaxed text-slate-700 max-h-40 overflow-y-auto pr-2">
                {translation}
              </p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="hover:bg-slate-100 p-1 rounded-full transition-colors"
            >
              <X size={16} className="text-slate-500" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SummarizeWrittenText;

const ScoreBox = ({ label, value }) => (
  <div className="bg-white rounded-xl p-4 border text-center">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);
