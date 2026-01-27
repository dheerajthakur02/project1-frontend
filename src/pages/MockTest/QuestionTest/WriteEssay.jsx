import React, { useState, useEffect } from "react";

export default function WriteEssayMockTest({ backendData }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [step, setStep] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 mins per essay
  const questions = backendData.essayQuestions || [];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIdx]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setTimeLeft(20 * 60);
    } else {
      setStep(1);
    }
  };

  if (step === 1) return <div className="p-20 text-center font-bold">WE Completed</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none overflow-hidden">
      <div className="bg-[#4d4d4d] text-[#e0e0e0] px-4 py-2 flex justify-between items-center text-sm">
        <div className="text-lg font-medium">APEUni Mock Test - WE</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="opacity-70">🕒 Time Remaining</span>
            <span className="font-mono text-white text-base">{formatTime(timeLeft)}</span>
          </div>
          <div className="bg-[#666] px-2 py-0.5 rounded text-xs text-white">{currentIdx + 1} of {questions.length}</div>
        </div>
      </div>

      <div className="bg-[#008199] text-white px-6 py-2 text-[13px] font-medium border-t border-[#006b81]">
        You will have 20 minutes to plan, write and revise an essay about the topic below. Your response will be judged on how well you develop a position, organize your ideas, present supporting details, and control the elements of standard written English. You should write 200-300 words.
      </div>

      <div className="flex-grow p-10 bg-[#f9f9f9]">
        <div className="max-w-4xl mx-auto bg-white p-8 border shadow-sm flex flex-col h-full">
          <p className="font-bold text-gray-800 mb-6 leading-relaxed">
            {questions[currentIdx]?.questionText}
          </p>
          
          <EssayInput onNext={handleNext} />
        </div>
      </div>
    </div>
  );
}

function EssayInput({ onNext }) {
  const [text, setText] = useState("");
  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  return (
    <div className="flex flex-col flex-grow">
      <textarea
        className="w-full flex-grow p-4 border-2 border-gray-200 focus:border-[#008199] outline-none resize-none text-lg"
        placeholder="Type your essay here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600 font-bold uppercase">
          Word Count: <span className={wordCount < 200 || wordCount > 300 ? "text-red-500" : "text-green-600"}>{wordCount}</span>
        </div>
        <button onClick={onNext} className="bg-[#008199] text-white px-12 py-2 rounded font-bold uppercase shadow-md">Next</button>
      </div>
    </div>
  );
}