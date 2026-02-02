import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";

const HIWGroup = ({ backendData }) => {
  const [step, setStep] = useState(0); // 0: Intro, 1: Exam, 2: Result
  const [currentIdx, setCurrentIdx] = useState(0);

  // Timers
  const [introTime, setIntroTime] = useState(120); // 2:00 for Intro
  const [globalTime, setGlobalTime] = useState(35 * 60); // 35:00 for Exam

  const [userAnswers, setUserAnswers] = useState({}); // { [idx]: [1, 5, 9] }
  const [testResult, setTestResult] = useState(null);
  const [isLoadingResult, setIsLoadingResult] = useState(true);

  const questions = backendData?.highlightIncorrectWordsQuestions || [];

  // Intro Timer Logic
  useEffect(() => {
    let timer;
    if (step === 0 && introTime > 0) {
      timer = setInterval(() => setIntroTime((prev) => prev - 1), 1000);
    } else if (step === 0 && introTime === 0) {
      setStep(1);
    }
    return () => clearInterval(timer);
  }, [step, introTime]);

  // Main Global Timer Logic
  useEffect(() => {
    let timer;
    if (step === 1 && globalTime > 0) {
      timer = setInterval(() => setGlobalTime((prev) => prev - 1), 1000);
    } else if (step === 1 && globalTime === 0) {
      submitTest(); // Auto submit
    }
    return () => clearInterval(timer);
  }, [step, globalTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNext = (currentSelection) => {
    // Save current selection for this question
    const updatedAnswers = { ...userAnswers, [currentIdx]: currentSelection };
    setUserAnswers(updatedAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      submitTest(updatedAnswers);
    }
  };

  const submitTest = async (finalAnswers = userAnswers) => {
    setStep(2);
    setIsLoadingResult(true);
    try {
      const { data } = await api.post("/question/hiw/submit", {
        testId: backendData._id || questions[0]?._id,
        answers: finalAnswers
      });
      if (data.success) {
        setTestResult(data.data);
      }
    } catch (err) {
      console.error("HIW Submit Error", err);
      alert("Error submitting test. Check console.");
    } finally {
      setIsLoadingResult(false);
    }
  };

  if (!questions.length) return <div className="p-10 font-bold">Loading HIW Data...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none overflow-hidden text-[#333]">
      {/* HEADER BAR */}
      <div className="bg-[#4d4d4d] text-[#e0e0e0] px-4 py-2 flex justify-between items-center text-sm">
        <div className="text-lg font-medium">Pawan PTE</div>
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
              <p>After the exam, please go to the Study Center to check the correctness of your answers. APEUni's AI will help you analyze how to continue preparing for the exam.</p>
              <p>Please click 'Next' to start the test.</p>
            </div>
            <Footer onNext={() => setStep(1)} />
          </div>
        )}

        {step === 1 && (
          <>
            <div className="bg-[#008199] text-white px-8 py-3 text-[13px] font-medium border-t border-[#006b81] leading-relaxed">
              You will hear a recording. Below is a transcription of the recording. Some words in the transcription differ from what the speaker said. Please click on the words that are different.
            </div>
            <div className="flex-grow bg-[#f9f9f9] overflow-y-auto">
              <HIWController
                key={questions[currentIdx]._id}
                question={questions[currentIdx]}
                onNext={handleNext}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <ResultScreen testResult={testResult} isLoading={isLoadingResult} />
        )}
      </div>
    </div>
  );
};

/* --- CORE HIW CONTROLLER --- */
function HIWController({ question, onNext }) {
  const [phase, setPhase] = useState("BEGINNING"); // BEGINNING, PLAYING, ENDED
  const [timeLeft, setTimeLeft] = useState(10); // 10s Beginning countdown
  const [audioProgress, setAudioProgress] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState([]);

  const audioRef = useRef(null);

  // Parse content into words array
  const wordsArray = question.content.split(" ");

  useEffect(() => {
    const audio = new Audio(question.audioUrl);
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setAudioProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => setPhase("ENDED");

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    // Initial 10s countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase("PLAYING");
          audio.play().catch(e => console.error("Audio Play Error:", e));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [question]);

  const toggleWord = (index) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  return (
    <div className="w-full flex flex-col items-center pt-8 px-10 pb-20">
      {/* TEAL AUDIO BOX */}
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

        <div className="text-[11px] text-white font-medium mb-4 h-4">
          {phase === "BEGINNING" && `Beginning in ${timeLeft} seconds`}
          {phase === "PLAYING" && "Playing"}
          {phase === "ENDED" && "Completed"}
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

      {/* CLICKABLE TEXT CONTENT */}
      <div className="max-w-6xl text-[16px] leading-[2.2] text-gray-700 bg-white p-10 rounded shadow-sm border border-gray-200">
        {wordsArray.map((word, index) => (
          <span
            key={index}
            onClick={() => toggleWord(index)}
            className={`cursor-pointer px-1 rounded transition-colors ${selectedIndices.includes(index) ? "bg-[#ffff00] text-black" : "hover:bg-gray-100"
              }`}
          >
            {word}{" "}
          </span>
        ))}
      </div>

      <Footer onNext={() => onNext(selectedIndices)} />
    </div>
  );
}

/* --- RESULT SCREEN --- */
function ResultScreen({ testResult, isLoading }) {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-[#008199] text-xl">
        Calculating Scores...
      </div>
    );
  }

  const score = testResult?.overallScore || 0;
  // Just show totals
  const totalCorrect = testResult?.scores?.reduce((acc, curr) => acc + (curr.answers?.correctCount || 0), 0) || 0;
  const totalIncorrect = testResult?.scores?.reduce((acc, curr) => acc + (curr.answers?.incorrectCount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="bg-white p-10 rounded-lg shadow-xl border max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Test Result</h1>

        <div className="flex justify-center mb-10">
          <div className="w-32 h-32 rounded-full border-4 border-[#008199] flex flex-col items-center justify-center text-[#008199]">
            <span className="text-4xl font-bold">{score}</span>
            <span className="text-xs uppercase font-medium mt-1">Total Score</span>
          </div>
        </div>

        <div className="flex justify-around mb-8">
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{totalCorrect}</div>
            <div className="text-xs text-gray-500 uppercase">Correct</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-600">{totalIncorrect}</div>
            <div className="text-xs text-gray-500 uppercase">Wrong</div>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="bg-[#008199] text-white px-8 py-3 rounded shadow hover:bg-[#006b81] font-bold uppercase tracking-wider"
        >
          Practice Again
        </button>
      </div>
    </div>
  );
}

/* --- REUSABLE FOOTER --- */
function Footer({ onNext }) {
  return (
    <div className="fixed bottom-0 left-0 w-full h-14 bg-[#cccccc] border-t border-[#999] flex items-center justify-between px-2 z-50">
      <button className="bg-[#e0e0e0] border border-gray-400 text-[#555] px-6 py-1 text-sm rounded shadow-sm hover:bg-gray-100 transition-colors">
        Save and Exit
      </button>
      <button
        onClick={onNext}
        className="bg-[#008199] text-white px-10 py-1 text-sm rounded border border-[#006b81] shadow-md font-bold uppercase tracking-wider hover:bg-[#006b81]"
      >
        Next
      </button>
    </div>
  );
}

export default HIWGroup;