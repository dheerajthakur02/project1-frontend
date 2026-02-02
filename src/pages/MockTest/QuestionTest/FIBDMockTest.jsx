import React, { useState, useEffect } from "react";
import api from "../../../services/api";

// --- MAIN COMPONENT ---
export default function FIBDMockTest({ backendData }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [globalTimeLeft, setGlobalTimeLeft] = useState(30 * 60); // 30 Minutes
  const [userAnswers, setUserAnswers] = useState({}); // { [questionIdx]: { [blankIndex]: word } }
  const [isFinished, setIsFinished] = useState(false);

  // Results State
  const [testResult, setTestResult] = useState(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  const questions = backendData?.ReadingFIBDragDrops || [];
  const currentQuestion = questions[currentIdx];

  // Timer logic
  useEffect(() => {
    if (globalTimeLeft <= 0 || isFinished) return;
    const timer = setInterval(() => {
      setGlobalTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [globalTimeLeft, isFinished]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e, word, source) => {
    e.dataTransfer.setData("word", word);
    e.dataTransfer.setData("source", source); // 'pool' or blank index
  };

  const handleDropOnBlank = (e, blankIndex) => {
    e.preventDefault();
    const word = e.dataTransfer.getData("word");
    const source = e.dataTransfer.getData("source");

    setUserAnswers((prev) => {
      const currentQAnswers = prev[currentIdx] || {};
      const newQAnswers = { ...currentQAnswers };

      // If word was in another blank (in same question), clear that blank
      // Note: Simplifying source check to rely on blank index if source is numeric
      if (source !== "pool" && source !== blankIndex) {
        delete newQAnswers[source];
      }

      newQAnswers[blankIndex] = word;

      return { ...prev, [currentIdx]: newQAnswers };
    });
  };

  const handleDropOnPool = (e) => {
    e.preventDefault();
    const source = e.dataTransfer.getData("source");
    if (source !== "pool") {
      setUserAnswers((prev) => {
        const currentQAnswers = prev[currentIdx] || {};
        const newQAnswers = { ...currentQAnswers };
        delete newQAnswers[source];
        return { ...prev, [currentIdx]: newQAnswers };
      });
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      submitTest();
    }
  };

  const submitTest = async () => {
    setIsFinished(true);
    setIsLoadingResult(true);
    try {
      const { data } = await api.post("/question/fibd/submit", {
        testId: backendData._id || questions[0]?._id,
        answers: userAnswers
      });
      if (data.success) {
        setTestResult(data.data);
      }
    } catch (err) {
      console.error("Submit Error:", err);
    } finally {
      setIsLoadingResult(false);
    }
  };

  // Helper to get remaining words for the pool
  const currentQAnswers = userAnswers[currentIdx] || {};
  const assignedWords = Object.values(currentQAnswers);
  const poolWords = (currentQuestion?.options || []).filter(
    (opt) => !assignedWords.includes(opt)
  );

  if (isFinished) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
        {isLoadingResult ? (
          <div className="text-xl font-bold text-[#008199]">Calculating Scores...</div>
        ) : (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Test Result</h1>
            <div className="p-8 border rounded-lg bg-blue-50 shadow-md inline-block">
              <div className="text-4xl font-bold text-[#008199] mb-2">{testResult?.overallScore || 0} / {testResult?.totalMaxScore || 0}</div>
              <div className="text-gray-600 uppercase tracking-wide text-sm font-semibold">Your Score</div>
            </div>
            <div className="mt-10">
              <button
                onClick={() => window.location.reload()}
                className="bg-[#008199] text-white px-8 py-3 rounded uppercase font-bold text-sm shadow hover:bg-[#006b81] transition-colors"
              >
                Retake Practice
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!currentQuestion) return <div className="p-10">Loading Question...</div>;

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-sans select-none overflow-hidden text-gray-800">
      {/* Header */}
      <div className="bg-[#eeeeee] border-b border-gray-300">
        <div className="px-4 py-2 flex justify-between items-center">
          <span className="text-xl text-gray-700 font-medium">Pawan PTE</span>
          <div className="flex flex-col items-end text-[13px] text-gray-600">
            <div className="flex items-center gap-1 font-semibold">
              <span className="material-icons-outlined text-base">schedule</span>
              <span>Time Remaining {formatTime(globalTimeLeft)}</span>
            </div>
            <span>{currentIdx + 1} of {questions.length}</span>
          </div>
        </div>
        <div className="h-9 bg-[#008199]"></div>
      </div>

      {/* Content Area */}
      <div className="flex-grow bg-white p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <p className="text-[13px] mb-8 leading-relaxed">
            In the text below some words are missing. Drag words from the box below to the appropriate place in the text.
            To undo an answer choice, drag the word back to the box below the text.
          </p>

          {/* Passage with Droppable Blanks */}
          <div className="text-[15px] leading-[2.5] mb-12 text-justify">
            {currentQuestion.text.split(/(\[\d+\])/g).map((part, i) => {
              const match = part.match(/\[(\d+)\]/);
              if (match) {
                const blankIndex = match[1];
                const word = currentQAnswers[blankIndex];
                return (
                  <div
                    key={i}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnBlank(e, blankIndex)}
                    className="inline-flex items-center justify-center min-w-[100px] h-[28px] border border-gray-300 mx-1 align-middle bg-white shadow-inner"
                  >
                    {word && (
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, word, blankIndex)}
                        className="bg-white px-3 py-0.5 text-[14px] cursor-move border border-gray-200 shadow-sm rounded-sm"
                      >
                        {word}
                      </div>
                    )}
                  </div>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </div>

          {/* Pool Area (Dark Box) */}
          <div
            className="bg-[#333333] p-6 min-h-[140px] rounded-sm flex flex-wrap gap-4 items-start"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnPool}
          >
            {poolWords.map((word, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={(e) => handleDragStart(e, word, "pool")}
                className="bg-white px-4 py-1.5 text-[14px] font-medium cursor-move shadow-md hover:bg-gray-50 active:scale-95 transition-transform"
              >
                {word}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="h-16 bg-[#eeeeee] border-t border-gray-300 flex items-center justify-between px-6">
        <button className="bg-white border border-gray-400 px-6 py-1.5 rounded-sm text-sm text-gray-700 hover:bg-gray-100 font-medium">
          Save and Exit
        </button>
        <button
          onClick={handleNext}
          className="bg-[#008199] text-white px-10 py-1.5 rounded-md text-sm font-bold shadow-md hover:bg-[#006b81] tracking-wide"
        >
          {currentIdx === questions.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}