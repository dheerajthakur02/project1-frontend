import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";

/**
 * FIB Mock Test Component
 * Matches the APEUni UI for Reading: Fill in the Blanks
 */
export default function FIBR({ backendData }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [globalTimeLeft, setGlobalTimeLeft] = useState(35 * 60); // 35:00 as per image
  const [userAnswers, setUserAnswers] = useState({}); // { questionIdx: { blankIdx: value } }
  const [isFinished, setIsFinished] = useState(false);

  const [testResult, setTestResult] = useState(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  const questions = backendData?.fibQuestions || [];
  const currentQuestion = questions[currentIdx];

  // Global Timer logic
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

  const handleSelect = (blankIdx, value) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentIdx]: {
        ...(prev[currentIdx] || {}),
        [blankIdx]: value,
      },
    }));
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
      // Backend expects { testId, answers: { 0: {1: "val"}, ... } }
      const { data } = await api.post("/question/fib/submit", {
        testId: backendData._id || questions[0]?._id, // Fallback if needed
        answers: userAnswers
      });
      if (data.success) {
        setTestResult(data.data);
      }
    } catch (err) {
      console.error("FIB Submit Error", err);
      alert("Error submitting test. Check console.");
    } finally {
      setIsLoadingResult(false);
    }
  };

  if (isFinished) {
    return <ResultScreen testResult={testResult} isLoadingResult={isLoadingResult} />;
  }

  if (!currentQuestion) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-sans select-none overflow-hidden">
      {/* Header Section */}
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

      {/* Main Content Area */}
      <div className="flex-grow bg-white p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <p className="text-[13px] text-gray-800 mb-8">
            There are some words missing in the following text. Please select the correct word in the drop-down box.
          </p>

          <div className="text-[15px] leading-[2.5] text-gray-800 tracking-wide text-justify">
            <FIBTextRenderer
              text={currentQuestion.text}
              blanks={currentQuestion.blanks}
              selectedValues={userAnswers[currentIdx] || {}}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="h-16 bg-[#eeeeee] border-t border-gray-300 flex items-center justify-between px-6">
        <button className="bg-white border border-gray-400 px-6 py-1.5 rounded-full text-sm text-gray-700 hover:bg-gray-100 font-medium shadow-sm">
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

function ResultScreen({ testResult, isLoadingResult }) {
  if (isLoadingResult) return <div className="p-20 text-center font-bold text-[#008199]">Calculating Scores...</div>;

  const score = testResult?.overallScore || 0;
  const max = testResult?.totalMaxScore || 0;

  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-bold mb-6">Test Result</h1>
      <div className="flex justify-center gap-4">
        <div className="p-4 border rounded bg-blue-50 text-xl">
          Your Score: <span className="font-bold">{score}</span> / {max}
        </div>
      </div>
      <button onClick={() => window.location.reload()} className="mt-8 bg-[#008199] text-white px-8 py-2 rounded uppercase font-bold text-xs">Retake Practice</button>
    </div>
  );
}

/**
 * Helper component to parse text and inject dropdowns
 */
function FIBTextRenderer({ text, blanks, selectedValues, onSelect }) {
  // Split text by the placeholder "____"
  const parts = text.split("____");

  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <div className="inline-block align-middle mx-1">
              <FIBDropdown
                options={blanks[i]?.options || []}
                selectedValue={selectedValues[i + 1] || ""}
                onSelect={(val) => onSelect(i + 1, val)}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

/**
 * Custom Dropdown matching the screenshot exactly
 */
function FIBDropdown({ options, selectedValue, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block min-w-[120px]" ref={dropdownRef}>
      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="h-[26px] border border-gray-400 bg-white flex items-center justify-between px-2 cursor-pointer text-[13px] hover:border-black"
      >
        <span className={selectedValue ? "text-black" : "text-gray-500"}>
          {selectedValue || "Select..."}
        </span>
        <span className={`text-[10px] transition-transform ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </div>

      {/* Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 top-[25px] w-full bg-white border border-black shadow-lg">
          {options.map((opt, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSelect(opt);
                setIsOpen(false);
              }}
              className={`px-2 py-1 text-[13px] cursor-pointer hover:bg-[#cccccc] ${selectedValue === opt ? "bg-[#d3eaf0]" : ""
                }`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}