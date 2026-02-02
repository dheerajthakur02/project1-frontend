import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";

// --- MAIN WRAPPER ---
export default function ReTellLectureMockTest({ backendData }) {
  const [step, setStep] = useState(0); // 0: Intro, 1: Exam, 2: Result
  const [currentIdx, setCurrentIdx] = useState(0);

  // Timers
  const [introTime, setIntroTime] = useState(120); // 2:00 for Intro
  const [globalTime, setGlobalTime] = useState(35 * 60); // 35:00 for Exam

  const [userAnswers, setUserAnswers] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  // Robust data handling
  const questions = Array.isArray(backendData) ? backendData : (backendData?.reTellQuestions || []);

  // Logic for the 2-minute Intro Timer
  useEffect(() => {
    let timer;
    if (step === 0 && introTime > 0) {
      timer = setInterval(() => setIntroTime((prev) => prev - 1), 1000);
    } else if (step === 0 && introTime === 0) {
      handleStartExam();
    }
    return () => clearInterval(timer);
  }, [step, introTime]);

  // Logic for the 35-minute Main Timer
  useEffect(() => {
    let timer;
    if (step === 1 && globalTime > 0) {
      timer = setInterval(() => setGlobalTime((prev) => prev - 1), 1000);
    } else if (step === 1 && globalTime === 0) {
      finishExam(); // Auto finish
    }
    return () => clearInterval(timer);
  }, [step, globalTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartExam = () => setStep(1);

  const handleNext = (answerData) => {
    // Save answer (mock audio url)
    // In real app, upload Blob to Cloudinary/S3 here
    const newAnswer = {
      questionId: questions[currentIdx]._id,
      audioUrl: "https://example.com/mock-audio.mp3" // Placeholder
    };

    const updatedAnswers = [...userAnswers, newAnswer];
    setUserAnswers(updatedAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      finishExam(updatedAnswers);
    }
  };

  const finishExam = async (finalAnswers = userAnswers) => {
    setStep(2);
    setIsLoadingResult(true);
    try {
      const { data } = await api.post("/question/rl/submit", {
        testId: backendData._id || questions[0]._id, // Use questionID as generic ID if section ID missing
        answers: finalAnswers
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

  if (!questions.length) return <div className="p-10 font-bold text-center">Loading Test Data...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none overflow-hidden text-[#333]">
      {/* HEADER BAR - The Timer here changes based on the step */}
      <div className="bg-[#4d4d4d] text-[#e0e0e0] px-4 py-2 flex justify-between items-center text-sm">
        <div className="text-lg font-medium">Pawan PTE Mock Test</div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <span className="text-xs opacity-70">🕒 Time Remaining</span>
            <span className="font-mono text-white text-base">
              {step === 0 ? formatTime(introTime) : formatTime(globalTime)}
            </span>
          </div>
          <div className="bg-[#666] px-2 py-0.5 rounded text-xs text-white">
            {step === 1 ? `${currentIdx + 1} of ${questions.length}` : "Intro"}
          </div>
        </div>
      </div>

      {/* STEP CONTENT */}
      <div className="flex-grow flex flex-col">
        {step === 0 && (
          <IntroScreen onStart={handleStartExam} />
        )}

        {step === 1 && (
          <>
            <div className="bg-[#008199] text-white px-8 py-3 text-[13px] font-medium border-t border-[#006b81] leading-relaxed">
              You will hear a lecture. After listening to the lecture, in 10 seconds, please speak into the microphone and retell what you have just heard from the lecture in your own words. You will have 40 seconds to give your response.
            </div>
            <div className="flex-grow flex flex-col items-center pt-12 bg-[#f9f9f9]">
              <ReTellController
                key={questions[currentIdx]._id}
                question={questions[currentIdx]}
                onNext={handleNext}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <ResultScreen testResult={testResult} isLoadingResult={isLoadingResult} />
        )}
      </div>
    </div>
  );
}

function ResultScreen({ testResult, isLoadingResult }) {
  if (isLoadingResult) return <div className="p-20 text-center font-bold text-[#008199]">Calculating Scores...</div>;

  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-bold mb-6">Test Result</h1>
      <div className="flex justify-center gap-4">
        <div className="p-4 border rounded bg-blue-50">Fluency: {testResult?.sectionScores?.fluency || 0}</div>
        <div className="p-4 border rounded bg-primary-50">Pronunciation: {testResult?.sectionScores?.pronunciation || 0}</div>
        <div className="p-4 border rounded bg-indigo-50">Content: {testResult?.sectionScores?.content || 0}</div>
      </div>
      <button onClick={() => window.location.reload()} className="mt-8 bg-[#008199] text-white px-8 py-2 rounded uppercase font-bold text-xs">Retake Practice</button>
    </div>
  );
}

/* --- INTRO SCREEN --- */
function IntroScreen({ onStart }) {
  return (
    <div className="flex-grow flex flex-col items-center justify-start pt-12 px-20">
      <div className="w-full text-left space-y-4 text-sm text-gray-800 leading-relaxed">
        <p>This is a single-question type test.</p>
        <p>After the exam, please go to the Study Center to check the correctness of your answers. Pawan PTE's AI will help you analyze how to continue preparing for the exam.</p>
        <p>Please click 'Next' to start the test.</p>
      </div>

      {/* Fixed Footer for Intro */}
      <div className="fixed bottom-0 left-0 w-full h-14 bg-[#cccccc] border-t border-[#999] flex items-center justify-end px-2">
        <button
          onClick={onStart}
          className="bg-[#008199] text-white px-10 py-1 text-sm rounded border border-[#006b81] shadow-md font-bold uppercase tracking-wider hover:bg-[#006b81]"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* --- CORE QUESTION CONTROLLER --- */
function ReTellController({ question, onNext }) {
  const [phase, setPhase] = useState("BEGINNING"); // BEGINNING, PLAYING, PREPARING, RECORDING
  const [timeLeft, setTimeLeft] = useState(3);
  const [audioProgress, setAudioProgress] = useState(0);

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Reset state on new question
    setPhase("BEGINNING");
    setTimeLeft(3);
    setAudioProgress(0);

    const audio = new Audio(question.audioUrl);
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setPhase("PREPARING");
      setTimeLeft(10);
    };

    const handleError = (e) => {
      console.error("Audio Load Error", e);
      // Fallback if audio fails: Skip to prep or next
      // For now, let's just go to Prep to avoid "instant" skip confusion
      setPhase("PREPARING");
      setTimeLeft(10);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    // Initial 3s Countdown
    const startTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(startTimer);
          setPhase("PLAYING");
          audio.play().catch(e => {
            console.error("Audio Play Error:", e);
            // IF Autoplay blocked or error, go to prep
            handleEnded();
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(startTimer);
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      stopMic();
    };
  }, [question]);

  // Separate Effect for Countdown Timers (Prep & Recording)
  useEffect(() => {
    let countdown;
    if (phase === "PREPARING" || phase === "RECORDING") {
      countdown = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            if (phase === "PREPARING") {
              startRecording();
              return 40; // Rec time reset
            } else if (phase === "RECORDING") {
              onNext();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdown);
  }, [phase]);

  const startRecording = async () => {
    setPhase("RECORDING");
    // timeLeft is set to 40 by the timer transition above to ensure sync
    // But setting it here again for safety if called manually (though manual call not implemented for prep skip)
    // setTimeLeft(40); 

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (err) {
      console.warn("Mic access denied or error", err);
      // alert("Please allow microphone access."); // Optional prompt
    }
  };

  const stopMic = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  return (
    <div className="w-full flex flex-col items-center h-full">
      {/* TEAL AUDIO BOX */}
      <div className="bg-[#4aa3c2] w-[450px] p-6 rounded shadow-sm mb-12 relative">
        <div className="flex items-center gap-4 mb-3">
          <div className="text-white text-[10px]">▶</div>
          <div className="flex-grow h-[10px] bg-white/30 rounded-sm relative overflow-hidden">
            <div
              className="absolute h-full bg-white transition-all duration-300"
              style={{ width: `${phase === "PLAYING" ? audioProgress : 0}%` }}
            />
          </div>
        </div>

        <div className="text-[11px] text-white font-medium mb-4 h-4 text-left">
          {phase === "BEGINNING" && `Beginning in ${timeLeft} seconds`}
          {phase === "PLAYING" && "Playing"}
          {phase === "PREPARING" && `Recording in ${timeLeft} seconds`}
          {phase === "RECORDING" && `Recording... ${timeLeft}s`}
        </div>

        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <span className="text-sm">🔊</span>
            <div className="w-24 h-[3px] bg-white/50 rounded overflow-hidden">
              <div className="w-3/4 h-full bg-white" />
            </div>
          </div>
          <div className="w-4 h-4 bg-white/20 flex flex-col justify-around p-0.5 rounded-sm">
            {[...Array(9)].map((_, i) => <div key={i} className="bg-white h-[1px] w-full opacity-50" />)}
          </div>
        </div>
      </div>

      {/* RECORDING STATUS ICON */}
      <div className="flex flex-col items-center">
        <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-500
            ${phase === "RECORDING" ? "border-gray-500 scale-110 shadow-lg" : "border-gray-300 opacity-30"}`}>
          <div className={`w-6 h-6 rounded-full ${phase === "RECORDING" ? "bg-gray-500 animate-pulse" : "bg-gray-300"}`} />
        </div>
      </div>

      {/* EXAM FOOTER */}
      <div className="fixed bottom-0 left-0 w-full h-14 bg-[#cccccc] border-t border-[#999] flex items-center justify-between px-2">
        <button className="bg-[#e0e0e0] border border-gray-400 text-[#555] px-6 py-1 text-sm rounded shadow-sm hover:bg-gray-100 transition-colors">
          Save and Exit
        </button>

        <button
          onClick={() => { stopMic(); onNext(); }}
          disabled={phase !== "RECORDING"}
          className={`px-10 py-1 text-sm rounded border shadow-md font-bold uppercase tracking-wider transition-all
            ${phase !== "RECORDING"
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