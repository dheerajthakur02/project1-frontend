import React, { useState, useEffect } from "react";
import { ArrowLeft, Clock } from "lucide-react";
import { useSelector } from "react-redux";
import { submitEssayAttempt } from "../../services/api";
import WrittenAttemptHistory from "./History";

const MAX_TIME = 1200; // 20 minutes
const MIN_WORDS = 1;
const MAX_WORDS = 500;

const WriteEssay = ({ question, setActiveSpeechQuestion }) => {
  const { user } = useSelector((state) => state.auth);

  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | result
  const [result, setResult] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  // Timer
  useEffect(() => {
    if (!started || timeLeft <= 0) return;

    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft]);

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

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

        {/* Start Screen */}
        {!started && status === "idle" && (
          <div className="text-center space-y-6 py-20">
            <h2 className="text-2xl font-bold text-slate-800">Ready to start?</h2>
            <button
              onClick={() => setStarted(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-3 rounded-full font-bold shadow"
            >
              Start Practice
            </button>
          </div>
        )}

        {/* Main UI */}
        {started && (
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
                <p className="text-xs text-slate-400 text-center">{MIN_WORDS}–{MAX_WORDS} words</p>
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
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl w-[900px] p-8 space-y-6">

              <div className="flex justify-between items-center">
                <h2 className="font-bold text-lg">
                  {question.title} <span className="ml-2 text-purple-600 font-bold">AI+</span>
                </h2>
                <button onClick={() => { setStatus("idle"); setAnswer(""); setIsLocked(false); }}>✕</button>
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
                    <ScoreBox label="Structure" value={`${result.structure}/6`} />
                    <ScoreBox label="General" value={`${result.general}/6`} />
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

            </div>
          </div>
        )}

      </div>

            {/* ---------------- LAST ATTEMPTS HISTORY ---------------- */}
            {question.lastAttempts && question.lastAttempts.length > 0 && (
              <div className="mt-12">
                <h3 className="font-bold text-lg mb-4">Previous Attempts</h3>
                <WrittenAttemptHistory
                  question={question}
                  module="summarize"
                  onSelectAttempt={handleSelectAttempt}
                />
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
