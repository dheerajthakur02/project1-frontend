import React, { useState, useEffect, useRef } from "react";
import { submitReadAloudAttempt } from "../../../services/api";

// --- MAIN WRAPPER ---
export default function ReadAloudMockTest({ backendData }) {
  const [step, setStep] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flattenedQuestions, setFlattenedQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [globalTimeLeft, setGlobalTimeLeft] = useState(35 * 60);

  useEffect(() => {
    if (!backendData) return;
    const rawData = Array.isArray(backendData) ? backendData : (backendData.readAloudQuestions || []);
    const sequence = rawData.map((q) => ({
      ...q,
      type: "READ_ALOUD",
      prepTime: q.prepTime || 40,
      recTime: q.recTime || 40
    }));
    setFlattenedQuestions(sequence);
  }, [backendData]);

  // Global Timer (35 Mins)
  useEffect(() => {
    let timer;
    if (step === 4 && globalTimeLeft > 0) {
      timer = setInterval(() => setGlobalTimeLeft((prev) => prev - 1), 1000);
    } else if (globalTimeLeft === 0) {
      setStep(5);
    }
    return () => clearInterval(timer);
  }, [step, globalTimeLeft]);

  const formatGlobalTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const [testResult, setTestResult] = useState(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  const handleNextQuestion = (answerData) => {
    // In a real app, upload answerData.audio (Blob) to server and get URL
    // For now, we just pass a mock URL or ignore it as backend mock-scores it.

    // const audioUrl = await uploadAudio(answerData.audio); 
    const audioUrl = "mock-audio.mp3";

    const updatedAnswers = [...userAnswers, { questionId: flattenedQuestions[currentIdx]._id, audioUrl }];
    setUserAnswers(updatedAnswers);

    if (currentIdx < flattenedQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setStep(5);
      calculateResults(updatedAnswers);
    }
  };

  const calculateResults = async (answers) => {
    setIsLoadingResult(true);
    try {
      const payload = {
        testId: backendData._id,
        answers: answers.map(a => ({
          questionId: a.questionId,
          audioUrl: a.audioUrl || "mock-audio.mp3", // Handle audio better if possible
          transcript: "Mock Transcript" // ReadAloudMockTest doesn't seem to capture speech text yet
        }))
      };

      const result = await submitReadAloudAttempt(payload);

      if (result.success) {
        setTestResult(result.data);
      }
    } catch (err) {
      console.error("Scoring Error:", err);
    } finally {
      setIsLoadingResult(false);
    }
  };

  if (!backendData || (flattenedQuestions.length === 0 && step !== 5)) {
    return <div className="p-10 text-center font-bold text-gray-500">Loading Practice Data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="bg-[#eeeeee] border-b border-gray-300">
        <div className="px-6 py-2 flex justify-between items-center text-sm font-bold text-gray-600">
          <span>Pawan PTE - Read Aloud</span>
          <button className="bg-white border border-gray-400 px-3 py-1 rounded text-xs hover:bg-gray-100">Exit</button>
        </div>
        <div className="h-9 bg-slate-900 flex items-center justify-end px-6 space-x-6 text-white text-xs font-medium">
          {step === 4 && (
            <>
              <span className="bg-indigo-700 px-3 py-1 rounded">Question {currentIdx + 1} of {flattenedQuestions.length}</span>
              <span>Time Remaining: {formatGlobalTime(globalTimeLeft)}</span>
            </>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-grow flex flex-col overflow-y-auto bg-white border border-gray-200">

        {step === 0 && (
          <ReadAloudController
            key={flattenedQuestions[currentIdx]._id}
            question={flattenedQuestions[currentIdx]}
            onNext={handleNextQuestion}
          />
        )}
        {step === 1 && <ResultScreen testResult={testResult} isLoadingResult={isLoadingResult} />}
      </div>

      {/* Footer Navigation (Only for Intro Steps) */}
      {step < 4 && (
        <div className="h-16 bg-[#eeeeee] border-t border-gray-300 flex items-center justify-end px-10">
          <button onClick={() => setStep(step + 1)} className="bg-primary-600 text-white px-10 py-2 rounded-sm text-sm font-bold shadow-md hover:bg-primary-700 uppercase">
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/* ===================== READ ALOUD CONTROLLER ===================== */

function ReadAloudController({ question, onNext }) {
  const [status, setStatus] = useState("PREPARING"); // PREPARING or RECORDING
  const [timeLeft, setTimeLeft] = useState(question.prepTime);

  const isTransitioningRef = useRef(false);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    startTimer();
    return () => {
      clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [status]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (status === "PREPARING") {
            startRecording();
          } else {
            // Automatic move when recording time ends
            stopAndSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    setStatus("RECORDING");
    setTimeLeft(question.recTime);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        // Send blob to parent
        onNext({ audio: blob });
      };
      recorder.start();
    } catch (err) {
      console.error("Mic access denied", err);
      onNext({ audio: null });
    }
  };

  const stopAndSubmit = () => {
    if (isTransitioningRef.current) return; // Prevent double trigger
    isTransitioningRef.current = true;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    } else {
      // If called before recording starts somehow
      onNext({ audio: null });
    }
  };

  return (
    <div className="w-full bg-white px-10 pt-10 h-full flex flex-col">
      <div className="max-w-4xl mx-auto w-full">
        <p className="text-[13px] text-gray-700 mb-8 border-l-4 border-primary-600 pl-4">
          Look at the text below. In {question.prepTime} seconds, you must read this text aloud as naturally and clearly as possible.
        </p>

        <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg text-xl leading-relaxed text-gray-800 text-center shadow-sm mb-12 min-h-[160px] flex items-center justify-center">
          {question.text}
        </div>

        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="flex items-center gap-6">
            <div className={`px-4 py-1 rounded text-white text-[11px] font-bold uppercase tracking-widest ${status === 'PREPARING' ? 'bg-primary-500' : 'bg-red-600'}`}>
              {status === "PREPARING" ? "Beginning in" : "Recording"}
            </div>
            <div className="text-3xl font-mono text-gray-700">
              00:{String(timeLeft).padStart(2, "0")}
            </div>
          </div>

          <div className="w-full max-w-md bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${status === 'RECORDING' ? 'bg-red-500' : 'bg-primary-400'}`}
              style={{ width: `${(timeLeft / (status === 'PREPARING' ? question.prepTime : question.recTime)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* FOOTER: Only show Next button during Recording */}
      <div className="fixed bottom-0 left-0 w-full bg-[#eeeeee] border-t border-gray-300 py-3 px-10 flex justify-end h-16 items-center">
        {status === "RECORDING" ? (
          <button
            onClick={stopAndSubmit}
            className="bg-primary-600 text-white px-10 py-2 rounded-sm text-sm font-bold shadow-md hover:bg-primary-700 uppercase tracking-wide"
          >
            Next
          </button>
        ) : (
          <span className="text-xs text-gray-400 font-bold uppercase italic">
            Please wait for preparation to finish...
          </span>
        )}
      </div>
    </div>
  );
}

// --- STATIC SCREENS ---


function ResultScreen({ testResult, isLoadingResult }) {
  if (isLoadingResult) return <div className="p-20 text-center font-bold text-[#008199]">Calculating Scores...</div>;
  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-bold mb-6">Test Result</h1>
      <div className="flex justify-center gap-4">
        <div className="p-4 border rounded bg-blue-50">Fluency: {testResult?.sectionScores?.fluency || 0}</div>
        <div className="p-4 border rounded bg-primary-50">Pronunciation: {testResult?.sectionScores?.pronunciation || 0}</div>
      </div>
      <button onClick={() => window.location.reload()} className="mt-8 bg-[#008199] text-white px-8 py-2 rounded uppercase font-bold text-xs">Retake Practice</button>
    </div>
  );
}