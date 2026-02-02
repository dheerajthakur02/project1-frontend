import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";

export default function DescribeImageMockTest({ backendData }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [step, setStep] = useState(0); // 0: Exam, 1: Result
  const [globalTime, setGlobalTime] = useState(35 * 60); // 35 minutes
  const questions = backendData.describeImageQuestions || [];

  // Global Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setGlobalTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const [userAnswers, setUserAnswers] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = (audioBlob) => {
    // Save current answer
    const currentQ = questions[currentIdx];
    const newAnswers = [...userAnswers, { questionId: currentQ._id, audio: audioBlob }];
    setUserAnswers(newAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setStep(1);
      submitTest(newAnswers);
    }
  };

  const submitTest = async (answers) => {
    setIsLoading(true);
    try {
      const { data } = await api.post("/question/di/submit", {
        testId: backendData._id,
        answers: answers
      });
      if (data.success) {
        setTestResult(data.data);
      }
    } catch (error) {
      console.error("DI Submit Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="p-20 text-center">
        <h1 className="text-2xl font-bold mb-6">Test Result</h1>
        {isLoading ? (
          <div className="text-blue-500">Calculating Score...</div>
        ) : (
          <div className="flex justify-center gap-4">
            <div className="p-4 border rounded bg-blue-50">Fluency: {testResult?.sectionScores?.fluency || 0}</div>
            <div className="p-4 border rounded bg-primary-50">Pronunciation: {testResult?.sectionScores?.pronunciation || 0}</div>
            <div className="p-4 border rounded bg-green-50">Content: {testResult?.sectionScores?.content || 0}</div>
          </div>
        )}
        <button onClick={() => window.location.reload()} className="mt-8 bg-[#008199] text-white px-8 py-2 rounded uppercase font-bold text-xs">Retake Practice</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none overflow-hidden">
      {/* HEADER: Dark Grey */}
      <div className="bg-[#4d4d4d] text-[#e0e0e0] px-4 py-2 flex justify-between items-center text-sm">
        <div className="text-lg font-medium">Pawan PTE</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="opacity-70">🕒 Time Remaining</span>
            <span className="font-mono text-white text-base">{formatTime(globalTime)}</span>
          </div>
          <div className="bg-[#666] px-2 py-0.5 rounded text-xs text-white">
            {currentIdx + 1} of {questions.length}
          </div>
        </div>
      </div>

      {/* INSTRUCTION BAR: Teal */}
      <div className="bg-[#008199] text-white px-6 py-2 text-[13px] font-medium border-t border-[#006b81]">
        Look at the graph below. In 25 seconds, please speak into the microphone and describe in detail what the graph is showing. You will have 40 seconds to give your response.
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow relative bg-[#f9f9f9]">
        <DescribeImageController
          key={questions[currentIdx]._id}
          question={questions[currentIdx]}
          onNext={handleNext}
        />
      </div>
    </div>
  );
}

function DescribeImageController({ question, onNext }) {
  const [status, setStatus] = useState("PREPARING"); // PREPARING or RECORDING
  const [timeLeft, setTimeLeft] = useState(25); // 25s Prep as per standard PTE
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (status === "PREPARING") {
            startRecording();
            return 40; // 40s Recording time
          } else {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const startRecording = async () => {
    setStatus("RECORDING");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (err) {
      console.error("Mic error", err);
    }
  };

  const handleAutoSubmit = () => {
    stopMic();
    onNext();
  };

  const stopMic = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <div className="h-[92vh] flex flex-col">
      <div className="flex-grow flex p-12">
        {/* LEFT: IMAGE */}
        <div className="w-1/2 flex items-center justify-center pr-10">
          <div className="bg-white p-4 shadow-sm border border-gray-200">
            <img
              src={question.imageUrl}
              alt="Describe Graph"
              className="max-h-[400px] object-contain"
            />
          </div>
        </div>

        {/* RIGHT: CIRCULAR STATUS */}
        <div className="w-1/2 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Simple SVG circle loader mock */}
              <svg className="absolute w-full h-full -rotate-90">
                <circle
                  cx="48" cy="48" r="44"
                  fill="none" stroke="#ddd" strokeWidth="4"
                />
                <circle
                  cx="48" cy="48" r="44"
                  fill="none" stroke={status === "PREPARING" ? "#999" : "#ff4444"}
                  strokeWidth="4"
                  strokeDasharray="276"
                  strokeDashoffset={276 - (timeLeft / (status === "PREPARING" ? 25 : 40)) * 276}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className="text-2xl font-bold text-gray-600 z-10">{timeLeft}</span>
            </div>

            <span className="text-gray-400 font-medium">
              {status === "PREPARING" ? `Recording in ${timeLeft} seconds` : "Recording..."}
            </span>

            {status === "RECORDING" && (
              <div className="flex gap-1 items-center h-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="w-1 h-full bg-blue-400 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER BAR */}
      <div className="h-14 bg-[#cccccc] border-t border-[#999] flex items-center justify-between px-2">
        <button className="bg-[#e0e0e0] border border-gray-400 text-gray-700 px-6 py-1 text-sm rounded shadow-sm hover:bg-gray-100 transition-colors">
          Save and Exit
        </button>

        <button
          onClick={() => {
            stopMic();
            onNext(null);
          }}
          disabled={status === "PREPARING"}
          className={`px-10 py-1 text-sm rounded border shadow-md font-bold uppercase tracking-wider transition-all
            ${status === "PREPARING"
              ? "bg-[#99b5bc] text-white border-transparent cursor-not-allowed opacity-60"
              : "bg-[#008199] text-white border-[#006b81] hover:bg-[#006b81]"
            }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}