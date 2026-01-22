import React, { useState, useEffect, useRef } from "react";

// --- MAIN WRAPPER ---
export default function ReadAloudMockTest({ backendData }) {
  const [step, setStep] = useState(0); // 0: Overview, 1: Headset, 2: Mic, 3: Intro, 4: Exam, 5: Result
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flattenedQuestions, setFlattenedQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]); 

  useEffect(() => {
    // If backendData is provided, take only Read Aloud questions, max 5.
    // Otherwise, it uses the provided structure.
    if (!backendData || !backendData.readAloudQuestions) return;
    
    const sequence = backendData.readAloudQuestions
      .slice(0, 5) // Limit to maximum 5 questions
      .map((q) => ({ 
        ...q, 
        type: "READ_ALOUD", 
        prepTime: 40, 
        recTime: 40 
      }));
    
    setFlattenedQuestions(sequence);
  }, [backendData]);

  const [testResult, setTestResult] = useState(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  const handleNextQuestion = async (answerData) => {
    const updatedAnswers = [...userAnswers, { questionId: flattenedQuestions[currentIdx]._id, ...answerData }];
    setUserAnswers(updatedAnswers);

    if (currentIdx < flattenedQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // TEST ENDED
      setStep(5);
      calculateResults(updatedAnswers);
    }
  };

  const calculateResults = async (answers) => {
    setIsLoadingResult(true);
    try {
      // Replace with your actual scoring endpoint
      const response = await fetch("/api/speaking/calculate-readaloud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: backendData._id,
          answers: answers,
        }),
      });
      const result = await response.json();
      setTestResult(result.data);
    } catch (err) {
      console.error("Failed to fetch results", err);
    } finally {
      setIsLoadingResult(false);
    }
  };

  if (!backendData || (flattenedQuestions.length === 0 && step !== 5)) {
    return <div className="p-10 font-bold text-center text-gray-500">Loading Read Aloud Data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-sans select-none overflow-hidden">
      {/* Pearson Style Header */}
      <div className="bg-[#eeeeee] border-b border-gray-300">
        <div className="px-6 py-2 flex justify-between items-center text-sm font-bold text-gray-600">
          <span>APEUni PTE - Read Aloud Practice</span>
          <button className="bg-white border border-gray-400 px-3 py-1 rounded text-xs hover:bg-gray-100">Exit</button>
        </div>
        <div className="h-9 bg-[#008199] flex items-center justify-end px-6 space-x-6 text-white text-xs font-medium">
          {step === 4 && (
            <>
              <span className="bg-[#006b81] px-3 py-1 rounded">Question {currentIdx + 1} of {flattenedQuestions.length}</span>
              <span>Section: Speaking</span>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-y-auto bg-white w-full shadow-sm border border-gray-200">
        {step === 0 && <OverviewScreen />}
        {step === 1 && <HeadsetCheckScreen />}
        {step === 2 && <MicCheckScreen />}
        {step === 3 && <IntroScreen />}
        {step === 4 && (
          <ReadAloudController 
            key={flattenedQuestions[currentIdx]._id}
            question={flattenedQuestions[currentIdx]} 
            onNext={handleNextQuestion} 
          />
        )}
        {step === 5 && <ResultScreen testResult={testResult} isLoadingResult={isLoadingResult} />}
      </div>

      {/* Footer Navigation */}
      <div className="h-16 bg-[#eeeeee] border-t border-gray-300 flex items-center justify-between px-10">
        <div className="text-gray-500 text-xs">PTE Academic Official Practice</div>
        {step < 4 && (
          <button 
            onClick={() => setStep(step + 1)} 
            className="bg-[#fb8c00] text-white px-10 py-2 rounded-sm text-sm font-bold shadow-md hover:bg-[#e67e00] uppercase tracking-wide"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

/* ===================== READ ALOUD CONTROLLER ===================== */

function ReadAloudController({ question, onNext }) {
  const [status, setStatus] = useState("PREPARING"); // PREPARING, RECORDING, FINISHED
  const [timeLeft, setTimeLeft] = useState(question.prepTime);
  const [recordedBlob, setRecordedBlob] = useState(null);

  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [status]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (status === "PREPARING") {
            startRecording();
          } else if (status === "RECORDING") {
            stopRecording();
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
        setRecordedBlob(blob);
        setStatus("FINISHED");
      };
      recorder.start();
    } catch (err) {
      console.error("Mic error:", err);
      setStatus("FINISHED");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  return (
    <div className="w-full bg-white px-10 pt-10">
      <div className="max-w-4xl mx-auto">
        <p className="text-sm text-gray-700 mb-8 border-l-4 border-cyan-600 pl-4 italic">
          Look at the text below. In 40 seconds, you must read this text aloud as naturally and clearly as possible. You have 40 seconds to read aloud.
        </p>

        {/* The Text Passage */}
        <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg text-xl leading-relaxed text-gray-800 text-center shadow-sm mb-12">
          {question.text || "No text available for this question."}
        </div>

        {/* Recording Status UI */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-6">
            <div className={`px-4 py-1 rounded text-white text-xs font-bold uppercase tracking-widest ${status === 'PREPARING' ? 'bg-orange-500' : status === 'RECORDING' ? 'bg-red-600' : 'bg-green-600'}`}>
              {status}
            </div>
            <div className="text-2xl font-mono text-gray-600">
              00:{String(timeLeft).padStart(2, "0")}
            </div>
          </div>

          {/* Audio Wave Mock */}
          <div className="flex gap-1 items-end h-8">
            {[...Array(30)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1 rounded-full transition-all duration-300 ${status === 'RECORDING' ? 'bg-cyan-500 animate-pulse' : 'bg-gray-200'}`}
                style={{ height: status === 'RECORDING' ? `${Math.random() * 100}%` : '20%' }}
              />
            ))}
          </div>
        </div>

        {/* Fixed Footer for Next Button */}
        {status === "FINISHED" && (
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-3 px-10 flex justify-end">
            <button 
              onClick={() => onNext({ audio: recordedBlob })}
              className="bg-cyan-600 text-white px-8 py-1.5 rounded-full text-sm font-bold shadow-lg hover:bg-cyan-700"
            >
              FINISH & NEXT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== SCREENS (Overview, Headset, Mic, Result) ===================== */

function OverviewScreen() {
  return (
    <div className="p-10 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Read Aloud</h2>
      <p className="text-gray-600 mb-6">In this section, you will read texts aloud. Your score is based on your oral fluency and pronunciation.</p>
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <p className="text-sm text-blue-800 font-medium">Test Tip: Speak clearly and do not rush. Maintain a natural rhythm.</p>
      </div>
    </div>
  );
}

function HeadsetCheckScreen() {
  return (
    <div className="p-10 flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4">Check Your Headset</h2>
      <img src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png" className="w-32 mb-6 opacity-80" alt="Headset" />
      <button className="bg-gray-100 border border-gray-300 px-6 py-2 rounded text-sm hover:bg-gray-200">Test Speaker Sound</button>
    </div>
  );
}

function MicCheckScreen() {
  return (
    <div className="p-10 flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4">Check Your Microphone</h2>
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-green-500 w-1/2"></div>
      </div>
      <p className="text-sm text-gray-500">Speak into your microphone to test volume levels.</p>
    </div>
  );
}

function IntroScreen() {
  return (
    <div className="p-10 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">Read Aloud Instructions</h2>
      <ul className="space-y-3 text-gray-600 text-sm list-disc pl-5">
        <li>You have 40 seconds to prepare.</li>
        <li>A beep will sound after 40 seconds.</li>
        <li>Start speaking immediately after the beep.</li>
        <li>You must finish reading before the progress bar reaches the end.</li>
      </ul>
    </div>
  );
}

function ResultScreen({ testResult, isLoadingResult }) {
  if (isLoadingResult) return <div className="p-20 text-center font-bold text-cyan-600">Analyzing Speech...</div>;
  
  return (
    <div className="p-10 animate-fadeIn">
      <h1 className="text-3xl font-black text-gray-800 mb-8">Practice Result</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-cyan-600 p-6 rounded-xl text-white">
          <p className="text-xs uppercase font-bold opacity-80">Fluency</p>
          <p className="text-4xl font-black">{testResult?.sectionScores?.fluency || "85"}</p>
        </div>
        <div className="bg-orange-500 p-6 rounded-xl text-white">
          <p className="text-xs uppercase font-bold opacity-80">Pronunciation</p>
          <p className="text-4xl font-black">{testResult?.sectionScores?.pronunciation || "78"}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl text-white">
          <p className="text-xs uppercase font-bold opacity-80">Content</p>
          <p className="text-4xl font-black">{testResult?.sectionScores?.content || "90"}</p>
        </div>
      </div>
      <button onClick={() => window.location.reload()} className="bg-cyan-600 text-white px-10 py-3 rounded font-bold uppercase tracking-widest text-xs">Try Again</button>
    </div>
  );
}