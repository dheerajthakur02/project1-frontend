import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";

// --- SUMMARIZE WRITTEN TEXT COMPONENT ---
export default function SWT({ backendData }) {
  const [step, setStep] = useState(0); // 0: Test, 1: Result
  const [summaryText, setSummaryText] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  // Extract question data from backend data provided
  const question = backendData?.SummarizeTextQuestions?.[0] || {};
  const questionId = question._id;

  // Set global timer based on answerTime from backend (600s = 10 mins)
  const [globalTimeLeft, setGlobalTimeLeft] = useState(question.answerTime || 600);

  // Global Timer Logic
  useEffect(() => {
    let timer;
    if (step === 0 && globalTimeLeft > 0) {
      timer = setInterval(() => setGlobalTimeLeft((prev) => prev - 1), 1000);
    } else if (globalTimeLeft === 0 && step === 0) {
      handleSubmit(); // Auto-submit when timer hits 0
    }
    return () => clearInterval(timer);
  }, [step, globalTimeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  };

  const handleSubmit = async () => {
    if (step === 1) return;
    setStep(1);
    setIsLoadingResult(true);

    try {
      const { data } = await api.post("/writing/calculate-swt", {
        testId: backendData._id,
        answers: [{ questionId, content: summaryText }],
      });
      setTestResult(data.data);
    } catch (err) {
      console.error("Scoring Error:", err);
    } finally {
      setIsLoadingResult(false);
    }
  };

  // UI Toolbar Handlers
  const handleToolbarAction = (action) => {
    const textarea = document.getElementById("swt-textarea");
    if (!textarea) return;

    if (action === "undo") document.execCommand("undo");
    if (action === "redo") document.execCommand("redo");
    if (action === "copy") {
      navigator.clipboard.writeText(summaryText.substring(textarea.selectionStart, textarea.selectionEnd));
    }
    if (action === "cut") {
      navigator.clipboard.writeText(summaryText.substring(textarea.selectionStart, textarea.selectionEnd));
      const newText = summaryText.slice(0, textarea.selectionStart) + summaryText.slice(textarea.selectionEnd);
      setSummaryText(newText);
    }
  };

  if (!backendData) {
    return <div className="p-10 text-center font-bold text-gray-500">Loading SWT Practice Data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-sans select-none overflow-hidden">
      {/* Header (Same as Screenshot) */}
      <div className="bg-[#eeeeee] border-b border-gray-300">
        <div className="px-4 py-2 flex justify-between items-center">
          <span className="text-xl text-gray-700 font-medium font-sans">Pawan PTE Mock Test</span>
          <div className="flex flex-col items-end text-[13px] text-gray-600">
            <div className="flex items-center gap-1 font-semibold">
              <span className="material-icons-outlined text-base">schedule</span>
              <span>Time Remaining {formatTime(globalTimeLeft)}</span>
            </div>
            <span>1 of 1</span>
          </div>
        </div>
        <div className="h-9 bg-[#008199]"></div>
      </div>

      {/* Main Container */}
      <div className="flex-grow bg-white p-6 overflow-y-auto">
        {step === 0 ? (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Instruction Text */}
            <p className="text-[13px] text-gray-800 leading-relaxed">
              Read the passage below and summarize it using one sentence. Type your response in the box at the bottom of the screen. You have 10 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points in the passage.
            </p>

            {/* Passage Box (Source Text) */}
            <div className="border border-gray-300 p-5 rounded shadow-sm bg-gray-50 text-[15px] leading-7 text-gray-800 h-64 overflow-y-auto">
              {question.paragraph}
            </div>

            {/* Editor Area */}
            <div className="border border-[#62a8be] rounded-sm flex flex-col mt-4">
              {/* Toolbar */}
              <div className="bg-[#62a8be] h-10 flex items-center px-2 gap-4 text-white text-[13px]">
                <button onClick={() => handleToolbarAction('cut')} className="flex items-center gap-1 hover:bg-[#5297ad] px-2 py-1 transition">
                  <span className="material-icons-outlined text-sm">content_cut</span> Cut
                </button>
                <button onClick={() => handleToolbarAction('copy')} className="flex items-center gap-1 hover:bg-[#5297ad] px-2 py-1 transition">
                  <span className="material-icons-outlined text-sm">content_copy</span> Copy
                </button>
                <button className="flex items-center gap-1 hover:bg-[#5297ad] px-2 py-1 transition">
                  <span className="material-icons-outlined text-sm">content_paste</span> Paste
                </button>
                <button onClick={() => handleToolbarAction('undo')} className="flex items-center gap-1 hover:bg-[#5297ad] px-2 py-1 transition">
                  <span className="material-icons-outlined text-sm">undo</span> Undo
                </button>
                <button onClick={() => handleToolbarAction('redo')} className="flex items-center gap-1 hover:bg-[#5297ad] px-2 py-1 transition">
                  <span className="material-icons-outlined text-sm">redo</span> Redo
                </button>
              </div>

              {/* Text Area */}
              <textarea
                id="swt-textarea"
                className="w-full h-32 p-4 text-[15px] focus:outline-none resize-none leading-relaxed border-none"
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="Write your one-sentence summary here..."
              ></textarea>

              {/* Word Count Bar */}
              <div className="bg-[#62a8be] h-10 flex items-center px-4 text-white text-[13px] font-medium border-t border-[#5297ad]">
                Word Count: {getWordCount(summaryText)}
              </div>
            </div>
          </div>
        ) : (
          <ResultScreen testResult={testResult} isLoadingResult={isLoadingResult} />
        )}
      </div>

      {/* Footer (Same as Screenshot) */}
      <div className="h-16 bg-[#eeeeee] border-t border-gray-300 flex items-center justify-between px-6">
        <button className="bg-white border border-gray-400 px-6 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-100 font-medium">
          Save and Exit
        </button>
        {step === 0 && (
          <button
            onClick={handleSubmit}
            className="bg-[#008199] text-white px-10 py-1.5 rounded text-sm font-bold shadow-md hover:bg-[#006b81] tracking-wide"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

// --- RESULT SCREEN ---
function ResultScreen({ testResult, isLoadingResult }) {
  if (isLoadingResult) return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-[#008199] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold text-[#008199]">Scoring your summary...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-10 text-center border mt-10 rounded-lg shadow-sm bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">SWT Practice Result</h1>
      <div className="grid grid-cols-2 gap-4 text-left">
        <div className="p-4 border rounded bg-blue-50">
          <p className="text-xs text-gray-500 uppercase font-bold">Content</p>
          <p className="text-xl font-bold">{testResult?.scores?.content || 0} / 90</p>
        </div>
        <div className="p-4 border rounded bg-green-50">
          <p className="text-xs text-gray-500 uppercase font-bold">Grammar & Vocabulary</p>
          <p className="text-xl font-bold">{testResult?.scores?.grammar || 0} / 90</p>
        </div>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 bg-[#fb8c00] text-white px-8 py-2 rounded uppercase font-bold text-xs"
      >
        Retake Practice
      </button>
    </div>
  );
}