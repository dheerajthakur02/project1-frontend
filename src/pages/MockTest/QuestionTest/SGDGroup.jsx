import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";

const SGDGroup = ({ backendData }) => {
  const [step, setStep] = useState(0); // 0: Intro, 1: Exam, 2: Result
  const [currentIdx, setCurrentIdx] = useState(0);

  // Timers
  const [introTime, setIntroTime] = useState(120); // 2:00 for Intro
  const [globalTime, setGlobalTime] = useState(30 * 60); // 30:00 for Exam

  const [userAnswers, setUserAnswers] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  const questions = backendData?.summarizeGroupDiscussionQuestions || [];

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
      finishExam();
    }
    return () => clearInterval(timer);
  }, [step, globalTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNext = (answerData) => {
    const newAnswer = {
      questionId: questions[currentIdx]._id,
      audioUrl: "https://example.com/mock-audio.mp3"
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
      const { data } = await api.post("/question/sgd/submit", {
        testId: backendData._id || questions[0]._id,
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

  if (!questions.length) return <div className="p-10 font-bold">Loading SGD Data...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none overflow-hidden text-[#333]">
      {/* HEADER BAR */}
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

      <div className="flex-grow flex flex-col">
        {step === 0 && (
          <div className="flex-grow flex flex-col items-center justify-start pt-12 px-20">
            <div className="w-full text-left space-y-4 text-sm text-gray-800 leading-relaxed">
              <p>This is a single-question type test.</p>
              <p>After the exam, please go to the Study Center to check the correctness of your answers. Pawan PTE AI will help you analyze how to continue preparing for the exam.</p>
              <p>Please click 'Next' to start the test.</p>
            </div>
            <Footer onNext={() => setStep(1)} />
          </div>
        )}

        {step === 1 && (
          <>
            <div className="bg-[#008199] text-white px-8 py-3 text-[13px] font-medium border-t border-[#006b81] leading-relaxed">
              You will hear three people having a discussion. When you hear the beep, summarize the whole discussion. You will have 10 seconds to prepare and 2 minutes to give your response.
            </div>
            <div className="flex-grow flex flex-col items-center pt-12 bg-[#f9f9f9]">
              <SGDController
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
};

/* --- CORE SGD CONTROLLER --- */
function SGDController({ question, onNext }) {
  const [phase, setPhase] = useState("BEGINNING");
  const [timeLeft, setTimeLeft] = useState(3);
  const [audioProgress, setAudioProgress] = useState(0);

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Reset
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
      setPhase("PREPARING");
      setTimeLeft(10);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    // Initial 3s Countdown
    const startCountdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(startCountdown);
          setPhase("PLAYING");
          audio.play().catch(e => {
            console.error("Autoplay Error:", e);
            handleEnded();
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(startCountdown);
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      stopMic();
    };
  }, [question]);

  // Handle Preparing & Recording phases
  useEffect(() => {
    let timer;
    if (phase === "PREPARING" || phase === "RECORDING") {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (phase === "PREPARING") {
              startRecording();
              return 120; // 2 mins recording
            } else if (phase === "RECORDING") {
              onNext();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase]);

  const startRecording = async () => {
    setPhase("RECORDING");
    // setTimeLeft(120); // Handled in timer transition above
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (err) {
      console.warn("Mic access denied", err);
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
      {/* TEAL AUDIO PLAYER BOX */}
      <div className="bg-[#4aa3c2] w-[450px] p-6 rounded shadow-sm mb-12">
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
          {phase === "RECORDING" && `Recording... ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`}
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
            ${phase === "RECORDING" ? "border-gray-500 scale-110" : "border-gray-300 opacity-30"}`}>
          <div className={`w-6 h-6 rounded-full ${phase === "RECORDING" ? "bg-gray-500 animate-pulse" : "bg-gray-300"}`} />
        </div>
      </div>

      <Footer onNext={() => { stopMic(); onNext(); }} disabled={phase !== "RECORDING"} />
    </div>
  );
}

/* --- REUSABLE FOOTER --- */
function Footer({ onNext, disabled }) {
  return (
    <div className="fixed bottom-0 left-0 w-full h-14 bg-[#cccccc] border-t border-[#999] flex items-center justify-between px-2">
      <button className="bg-[#e0e0e0] border border-gray-400 text-[#555] px-6 py-1 text-sm rounded shadow-sm hover:bg-gray-100 transition-colors">
        Save and Exit
      </button>
      <button
        onClick={onNext}
        disabled={disabled}
        className={`px-10 py-1 text-sm rounded border shadow-md font-bold uppercase tracking-wider transition-all
            ${disabled
            ? "bg-[#99b5bc] text-white border-transparent cursor-not-allowed opacity-60"
            : "bg-[#008199] text-white border-[#006b81] hover:bg-[#006b81]"
          }`}
      >
        Next
      </button>
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

export default SGDGroup;