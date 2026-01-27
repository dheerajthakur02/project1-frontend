import React, { useState, useEffect, useRef } from "react";

const FIBL = ({ backendData }) => {
  const [step, setStep] = useState(0); // 0: Intro, 1: Test, 2: Result
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); 

  // Timers
  const [introTime, setIntroTime] = useState(120); // 2:00 for Intro
  const [globalTime, setGlobalTime] = useState(35 * 60); // 35:00 for Exam

  const questions = backendData?.fiblQuestions || [];
  const currentQuestion = questions[currentIdx];

  // Logic for Step 0: Intro Timer
  useEffect(() => {
    let timer;
    if (step === 0 && introTime > 0) {
      timer = setInterval(() => setIntroTime((prev) => prev - 1), 1000);
    } else if (step === 0 && introTime === 0) {
      setStep(1);
    }
    return () => clearInterval(timer);
  }, [step, introTime]);

  // Logic for Step 1: Global Exam Timer
  useEffect(() => {
    let timer;
    if (step === 1 && globalTime > 0) {
      timer = setInterval(() => setGlobalTime((prev) => prev - 1), 1000);
    } else if (step === 1 && globalTime === 0) {
      setStep(2);
    }
    return () => clearInterval(timer);
  }, [step, globalTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (questionId, index, value) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        [index]: value,
      },
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setStep(2);
    }
  };

  if (!questions.length) return <div className="p-10 font-bold">Loading FIBL Data...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none overflow-hidden text-[#333]">
      {/* HEADER */}
      <div className="bg-[#eeeeee] border-b border-gray-300">
        <div className="px-4 py-2 flex justify-between items-center">
          <span className="text-xl text-gray-700 font-medium">APEUni Mock Test</span>
          <div className="flex flex-col items-end text-[13px] text-gray-600">
            <div className="flex items-center gap-1 font-semibold">
              <span className="material-icons-outlined text-base">schedule</span>
              <span>Time Remaining {step === 0 ? formatTime(introTime) : formatTime(globalTime)}</span>
            </div>
            <span>{step === 1 ? `${currentIdx + 1} of ${questions.length}` : "1 of 1"}</span>
          </div>
        </div>
        <div className="h-9 bg-[#008199]"></div>
      </div>

      {/* BODY */}
      <div className="flex-grow flex flex-col">
        {step === 0 && (
          <div className="flex-grow flex flex-col items-start pt-10 px-10">
            <div className="w-full text-left space-y-4 text-[13px] text-gray-800 leading-relaxed">
              <p className="font-bold">Instructions:</p>
              <p>You will hear a recording. Type the missing words in each blank.</p>
              <p>The total time for this section is 35 minutes.</p>
              <p>Please click 'Next' to start the test.</p>
            </div>
            <Footer onNext={() => setStep(1)} phase="INTRO" />
          </div>
        )}

        {step === 1 && (
          <div className="flex-grow flex flex-col">
            <div className="px-10 py-4 text-[13px] text-gray-800 border-b border-gray-100">
              You will hear a recording. Type the missing words in each blank.
            </div>
            <div className="flex-grow flex flex-col items-center pt-8 px-10">
              <FIBLController
                key={currentQuestion._id}
                question={currentQuestion}
                userAnswers={userAnswers[currentQuestion._id] || {}}
                onInputChange={(idx, val) => handleInputChange(currentQuestion._id, idx, val)}
              />
            </div>
            <Footer onNext={handleNext} phase="TEST" isLast={currentIdx === questions.length - 1} />
          </div>
        )}

        {step === 2 && (
          <div className="flex-grow flex flex-col items-center justify-center space-y-4">
             <div className="text-2xl font-bold text-gray-400">Practice Finished</div>
             <button onClick={() => window.location.reload()} className="bg-[#008199] text-white px-8 py-2 rounded font-bold">Retake</button>
          </div>
        )}
      </div>
    </div>
  );
};

/* --- UPDATED FIBL CONTROLLER WITH 6s TIMER --- */
function FIBLController({ question, userAnswers, onInputChange }) {
  const [audioProgress, setAudioProgress] = useState(0);
  const [prepTime, setPrepTime] = useState(6); // 6 seconds preparation
  const [status, setStatus] = useState("PREPARING"); // PREPARING or PLAYING
  
  const audioRef = useRef(null);

  useEffect(() => {
    // 1. Initialize Audio
    const audio = new Audio(question.audioUrl);
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setAudioProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => setStatus("FINISHED");

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    // 2. Start 6-second countdown
    const countdown = setInterval(() => {
      setPrepTime((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setStatus("PLAYING");
          // 3. Play audio after countdown
          audio.play().catch(e => console.error("Audio Play Error:", e));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdown);
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, [question]);

  const renderTranscript = () => {
    const parts = question.transcript.split("__");
    return parts.map((part, i) => (
      <React.Fragment key={i}>
        {part}
        {i < parts.length - 1 && (
          <input
            type="text"
            className="inline-block border border-gray-400 h-7 w-32 mx-1 px-2 text-[14px] focus:outline-none focus:border-[#008199] rounded-sm align-middle"
            value={userAnswers[i + 1] || ""}
            onChange={(e) => onInputChange(i + 1, e.target.value)}
          />
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* TEAL AUDIO PLAYER BOX */}
      <div className="bg-[#4aa3c2] w-[450px] p-6 rounded shadow-sm mb-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="text-white text-[10px]">{status === "PLAYING" ? "⏸" : "▶"}</div>
          <div className="flex-grow h-[10px] bg-white rounded-sm relative overflow-hidden">
            <div
              className="absolute h-full bg-gray-400 transition-all duration-300"
              style={{ width: `${status === "PLAYING" ? audioProgress : 0}%` }}
            />
          </div>
        </div>

        {/* Status Text (Prep Timer) */}
        <div className="text-center text-white text-[12px] font-medium mb-3 h-4">
           {status === "PREPARING" ? `Beginning in ${prepTime} seconds` : "Playing"}
        </div>

        <div className="flex justify-center items-center text-white">
           <div className="flex items-center gap-3">
            <span className="text-sm">🔊</span>
            <div className="w-24 h-[3px] bg-white/40 rounded overflow-hidden">
              <div className="w-3/4 h-full bg-white" />
            </div>
          </div>
        </div>
      </div>

      {/* TRANSCRIPT TEXT */}
      <div className="w-full max-w-6xl text-[15px] leading-[2.5] text-gray-800 text-justify tracking-wide">
        {renderTranscript()}
      </div>
    </div>
  );
}

function Footer({ onNext, phase, isLast }) {
  return (
    <div className="fixed bottom-0 left-0 w-full h-14 bg-[#cccccc] border-t border-gray-300 flex items-center justify-between px-4">
      <button className="bg-white border border-gray-400 text-[#555] px-6 py-1.5 text-sm rounded shadow-sm hover:bg-gray-100">
        Save and Exit
      </button>
      <button
        onClick={onNext}
        className="bg-[#008199] text-white px-10 py-1.5 text-sm rounded border border-[#006b81] font-bold uppercase tracking-wider hover:bg-[#006b81] shadow-md"
      >
        {phase === "TEST" && isLast ? "Finish" : "Next"}
      </button>
    </div>
  );
}

export default FIBL;