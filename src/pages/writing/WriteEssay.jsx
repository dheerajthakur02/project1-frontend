import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Clock, RefreshCw, ChevronLeft, ChevronRight, Eye, Languages, X
} from "lucide-react";
import { useSelector } from "react-redux";
import { submitEssayAttempt } from "../../services/api";
import WrittenAttemptHistory from "./History";

const MAX_TIME = 1200; // 20 minutes
const MIN_WORDS = 1;
const MAX_WORDS = 500;

const WriteEssay = ({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) => {
  const { user } = useSelector((state) => state.auth);

  const [started, setStarted] = useState(true);
  const [timeLeft, setTimeLeft] = useState(3);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("prep"); // prep | writing | submitting | result
  const [result, setResult] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  // Translation State
  const [translation, setTranslation] = useState("");
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Reset session when question changes
  useEffect(() => {
    resetSession();
  }, [question]);

  // Timer
  useEffect(() => {
    if (!started || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1 && status === "prep") {
          setStatus("writing");
          return MAX_TIME; // Switch to main timer
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, timeLeft, status]);

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  const resetSession = () => {
    setStatus("prep");
    setStarted(true);
    setTimeLeft(3);
    setAnswer("");
    setResult(null);
    setResult(null);
    setIsLocked(false);
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
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(question.description)}&langpair=en|hi`
      );
      const data = await response.json();
      if (data.responseData && data.responseData.translatedText) {
        setTranslation(data.responseData.translatedText);
        setShowToast(true);
      }
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setLoadingTranslation(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSelectAttempt = (attempt) => {
    setResult(attempt);
    setStatus("result");
  };

  // Submit handler
  const handleSubmit = async () => {
    if (wordCount < MIN_WORDS || wordCount > MAX_WORDS) return;

    setStatus("submitting");
    setIsLocked(true);
    setStarted(false);

    try {
      const timeTaken = MAX_TIME - timeLeft;

      const res = await submitEssayAttempt({
        questionId: question._id,
        essayText: answer,
        userId: user._id,
        timeTaken,
      });

      const data = res.data;
      setResult({
        score: data.score || 0,
        essayText: answer,
        wordCount: wordCount,
        misspelled: data.misspelled || 0,
        grammarErrors: data.grammarErrors || 0,
        structureIssues: data.structureIssues || 0,
        styleIssues: data.styleIssues || 0,
        content: data.content || 0,
        grammar: data.grammar || 0,
        spelling: data.spelling || 0,
        vocabulary: data.vocabulary || 0,
        form: data.form || 0,
        structure: data.structure || 0,
        general: data.general || 0,
      });

      setStatus("result");
    } catch (err) {
      console.error(err);
      setStatus("idle");
      setIsLocked(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <div>
        <h1>Write Essay</h1>
        <p>You will have 20 minutes to plan, write and revise an essay about the topic below. Your response will be judged on how well you develop a position, organize your ideas, present supporting details, and control the elements of standard written English. You should write 200-300 words.</p>
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
          Write Essay <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded font-bold">AI+</span>
        </h1>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">

        {/* Prep Screen */}
        {status === "prep" && (
          <div className="text-center space-y-6 py-20">
            <h2 className="text-2xl font-bold text-slate-800">Starting Soon...</h2>
            <div className="text-6xl font-black text-primary-600 animate-pulse">
              {timeLeft}
            </div>
          </div>
        )}

        {/* Main UI */}
        {status === "writing" && (
          <>
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <span className="font-bold text-slate-700">#{question._id.slice(-5).toUpperCase()}</span>
                <span className="ml-2 text-sm text-slate-500">{question.title}</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 font-bold">
                <Clock size={18} /> {formatTime(timeLeft)}
              </div>
            </div>

            {/* Question */}
            <div className="bg-slate-50 border rounded-xl p-6 text-slate-700 leading-relaxed max-h-[260px] overflow-y-auto">
              {question.description}
            </div>

            {/* Textarea + Side Panel */}
            <div className="grid grid-cols-12 gap-6 mt-4">
              <textarea
                className="col-span-12 md:col-span-9 w-full h-60 border-2 border-dashed border-blue-400 rounded-xl p-4 outline-none resize-none focus:border-blue-600 disabled:bg-slate-100"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={isLocked}
                placeholder="Type your essay here..."
              />

              <div className="col-span-12 md:col-span-3 bg-slate-50 rounded-xl p-6 flex flex-col items-center justify-center gap-4">
                <div className={`text-3xl font-black ${isLocked ? "text-gray-400" : "text-slate-800"}`}>
                  {wordCount}
                </div>
                <div className="text-sm text-slate-500">Word Count</div>

                <button
                  className="w-full bg-primary-600 disabled:bg-slate-300 text-white py-2 rounded-lg font-bold"
                  onClick={handleSubmit}
                  disabled={isLocked || wordCount < MIN_WORDS || wordCount > MAX_WORDS}
                >
                  Submit
                </button>
                <p className="text-xs text-slate-400 text-center">200–300 words</p>
              </div>
            </div>
          </>
        )}

        {/* Submitting */}
        {status === "submitting" && (
          <p className="text-center font-bold text-slate-600">Evaluating your response...</p>
        )}

        {/* Result Modal */}
        {status === "result" && result && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-[900px] max-h-[90vh] overflow-y-auto p-8 space-y-6">

              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg">
                  {question.title} <span className="ml-2 text-purple-600 font-bold">AI+</span>
                </h2>
                <button
                  onClick={() => { setStatus("prep"); setStarted(true); setTimeLeft(3); setAnswer(""); setResult(null); setIsLocked(false); }}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-12 gap-6">
                {/* Score */}
                <div className="col-span-4 bg-purple-50 rounded-2xl p-6 text-center">
                  <p className="font-semibold mb-3">Your Score</p>
                  <div className="text-5xl font-black text-purple-700">{result.score}</div>
                  <div className="flex justify-between mt-4 text-sm">
                    <span>Writing</span>
                    <span className="bg-yellow-100 px-2 rounded">{result.writingScore?.toFixed(2) || 0}</span>
                  </div>
                </div>

                {/* Parameters */}
                <div className="col-span-8 bg-slate-50 rounded-2xl p-6">
                  <h3 className="font-bold mb-4">Scoring Parameters</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <ScoreBox label="Content" value={`${result.content}/6`} />
                    <ScoreBox label="Grammar" value={`${result.grammar}/2`} />
                    <ScoreBox label="Spelling" value={`${result.spelling}/2`} />
                    <ScoreBox label="Vocabulary" value={`${result.vocabulary}/2`} />
                    <ScoreBox label="Form" value={`${result.form}/2`} />
                    <ScoreBox label="Development" value={`${result.structure}/2`} />
                    <ScoreBox label="General Linguistic Range" value={`${result.general}/2`} />
                  </div>
                </div>
              </div>

              {/* My Answer */}
              <div className="border-t pt-4">
                <h4 className="font-bold mb-2">My Answer</h4>
                <p className="italic text-slate-600">{result.essayText}</p>
                <div className="flex gap-4 mt-3 text-sm">
                  <span>Total Words: {result.wordCount}</span>
                  <span>Misspelled: {result.misspelled}</span>
                  <span>Grammar: {result.grammarErrors}</span>
                  <span>Structure: {result.structureIssues}</span>
                  <span>Style: {result.styleIssues}</span>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => { setStatus("prep"); setStarted(true); setTimeLeft(3); setAnswer(""); setResult(null); setIsLocked(false); }}
                  className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors"
                >
                  Close
                </button>
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
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <div className={`w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm ${loadingTranslation ? "animate-pulse" : ""}`}>
              <Languages size={18} />
            </div>
            <span className="text-xs font-medium">{loadingTranslation ? "..." : "Translate"}</span>
          </button>

          {/* Answer (Static) */}
          <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
            <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
              <Eye size={18} />
            </div>
            <span className="text-xs font-medium">Answer</span>
          </button>

          {/* Redo */}
          <button onClick={resetSession} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
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

      {/* ---------------- LAST ATTEMPTS HISTORY ---------------- */}
      {question.lastAttempts && question.lastAttempts.length > 0 && (
        <div className="mt-12">
          <h3 className="font-bold text-lg mb-4">Previous Attempts</h3>
          <WrittenAttemptHistory
            question={question}
            module="essay"
            onSelectAttempt={handleSelectAttempt}
          />
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

export default WriteEssay;

const ScoreBox = ({ label, value }) => (
  <div className="bg-white rounded-xl p-4 border text-center">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);
