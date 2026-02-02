import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";

const SSTGroup = ({ backendData }) => {
  const [step, setStep] = useState(0); // 0: Intro, 1: Exam, 2: Result
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [idx]: "text" }

  const [testResult, setTestResult] = useState(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  const questions = backendData?.summarizeSpokenTextQuestion || [];

  const handleNext = (textValue) => {
    // Save current answer
    const updatedAnswers = { ...userAnswers, [currentIdx]: textValue };
    setUserAnswers(updatedAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      submitTest(updatedAnswers);
    }
  };

  const submitTest = async (finalAnswers) => {
    setStep(2);
    setIsLoadingResult(true);
    try {
      const { data } = await api.post("/question/sst/submit", {
        testId: backendData._id || questions[0]?._id,
        answers: finalAnswers
      });
      if (data.success) {
        setTestResult(data.data);
      }
    } catch (err) {
      console.error("SST Submit Error", err);
      alert("Error submitting test. Check console.");
    } finally {
      setIsLoadingResult(false);
    }
  };

  if (!questions.length) return <div className="p-10 font-bold">Loading SST Data...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none overflow-hidden text-[#333]">
      {step === 0 && (
        <SSTIntro onStart={() => setStep(1)} />
      )}
      {step === 1 && (
        <SSTController
          key={questions[currentIdx]._id}
          question={questions[currentIdx]}
          currentIdx={currentIdx}
          total={questions.length}
          onNext={handleNext}
        />
      )}
      {step === 2 && (
        <ResultScreen testResult={testResult} isLoading={isLoadingResult} />
      )}
    </div>
  );
};

/* --- STEP 0: INTRO SCREEN (2 Minute Timer) --- */
function SSTIntro({ onStart }) {
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onStart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onStart]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col h-screen">
      <Header title="Pawan PTE Mock Test" timer={formatTime(timeLeft)} counter="Intro" />
      <div className="flex-grow p-12 space-y-4 text-[15px] leading-relaxed">
        <p>This is a single-question type test.</p>
        <p>After the exam, please go to the Study Center to check the correctness of your answers. Pawan PTE AI will help you analyze how to continue preparing for the exam.</p>
        <p>Please click 'Next' to start the test.</p>
      </div>
      <Footer onNext={onStart} />
    </div>
  );
}

/* --- STEP 1: EXAM CONTROLLER (10 Minute Timer) --- */
function SSTController({ question, currentIdx, total, onNext }) {
  const [phase, setPhase] = useState("BEGINNING"); // BEGINNING, PLAYING, WRITING
  const [beginningTime, setBeginningTime] = useState(15); // 15s beginning
  const [examTime, setExamTime] = useState(600); // 10 minutes
  const [text, setText] = useState("");
  const [audioProgress, setAudioProgress] = useState(0);

  const audioRef = useRef(null);

  // Exam Global Timer (10 mins)
  useEffect(() => {
    const timer = setInterval(() => {
      setExamTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onNext(text); // Auto-submit with current text
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onNext, text]);

  // Beginning Countdown (15s)
  useEffect(() => {
    if (phase === "BEGINNING") {
      const timer = setInterval(() => {
        setBeginningTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            startAudio();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase]);

  const startAudio = () => {
    setPhase("PLAYING");
    const audio = new Audio(question.audioUrl);
    audioRef.current = audio;
    audio.play();
    audio.ontimeupdate = () => setAudioProgress((audio.currentTime / audio.duration) * 100);
    audio.onended = () => setPhase("WRITING");
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="Pawan PTE Mock Test"
        timer={formatTime(examTime)}
        counter={`${currentIdx + 1} of ${total}`}
      />

      <div className="bg-slate-800 text-white px-8 py-3 text-[13px] leading-relaxed font-medium">
        You will hear a short report. Write a summary for a fellow student who was not present. You should write 50-70 words. You have 10 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points presented in the lecture.
      </div>

      <div className="flex-grow flex flex-col items-center bg-[#f9f9f9] pt-8 px-4 overflow-y-auto">
        {/* AUDIO PLAYER */}
        <div className="bg-slate-800 w-[450px] p-6 rounded shadow-sm mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="text-white text-[10px]">▶</div>
            <div className="flex-grow h-[8px] bg-white/30 rounded-sm relative overflow-hidden">
              <div
                className="absolute h-full bg-white transition-all duration-300"
                style={{ width: `${phase === "PLAYING" ? audioProgress : 0}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-white font-medium mb-4 h-4">
            {phase === "BEGINNING" ? `Beginning in ${beginningTime} seconds` : phase === "PLAYING" ? "Playing" : "Completed"}
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

        {/* TEXT EDITOR */}
        <div className="w-full max-w-[1200px] border border-[#4aa3c2] rounded shadow-sm bg-white overflow-hidden">
          {/* TOOLBAR */}
          <div className="bg-slate-800 px-2 py-1 flex items-center gap-4 text-white text-[12px]">
            <ToolbarBtn icon="✂" label="Cut" />
            <ToolbarBtn icon="📋" label="Copy" />
            <ToolbarBtn icon="📥" label="Paste" />
            <ToolbarBtn icon="↩" label="Undo" />
            <ToolbarBtn icon="↪" label="Redo" />
          </div>

          <textarea
            className="w-full h-48 p-4 outline-none text-[15px] leading-relaxed resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck="false"
          />

          <div className="bg-slate-800 px-4 py-1.5 text-white text-[13px] border-t border-white/20">
            Word Count: {wordCount}
          </div>
        </div>
      </div>

      <Footer onNext={() => onNext(text)} />
    </div>
  );
}

/* --- RESULT SCREEN --- */
function ResultScreen({ testResult, isLoading }) {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-[#008199] text-xl">
        AI is analyzing your summary...
      </div>
    );
  }

  const score = testResult?.overallScore || 0;
  // Use first question result to show breakdown if available
  const details = testResult?.scores?.[0] || {};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white p-10 rounded-lg shadow-xl max-w-2xl w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Analysis Report</h1>

        <div className="flex justify-center mb-10">
          <div className="w-32 h-32 rounded-full border-4 border-[#008199] flex flex-col items-center justify-center text-[#008199]">
            <span className="text-4xl font-bold">{score}</span>
            <span className="text-xs uppercase font-medium mt-1">Total Score</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-8 text-sm">
          <ScoreCard label="Content" score={details.contentScore} max={2} />
          <ScoreCard label="Form" score={details.formScore} max={2} />
          <ScoreCard label="Grammar" score={details.grammarScore} max={2} />
          <ScoreCard label="Vocab" score={details.vocabScore} max={2} />
          <ScoreCard label="Spelling" score={details.spellingScore} max={2} />
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

function ScoreCard({ label, score, max }) {
  return (
    <div className="flex flex-col items-center p-3 bg-gray-50 rounded border border-gray-100">
      <span className="font-bold text-lg text-gray-700">{score?.toFixed(1) || 0}</span>
      <span className="text-[10px] text-gray-500 uppercase mt-1">/ {max}</span>
      <span className="text-xs font-medium text-gray-600 mt-2">{label}</span>
    </div>
  )
}

/* --- REUSABLE UI COMPONENTS --- */

function Header({ title, timer, counter }) {
  return (
    <div className="bg-slate-900 text-[#e0e0e0] px-4 py-2 flex justify-between items-center text-sm">
      <div className="text-lg font-medium">{title}</div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1">
          <span className="text-xs opacity-70">🕒 Time Remaining</span>
          <span className="font-mono text-white text-base">{timer}</span>
        </div>
        <div className="bg-[#666] px-2 py-0.5 rounded text-xs text-white">
          {counter}
        </div>
      </div>
    </div>
  );
}

function Footer({ onNext }) {
  return (
    <div className="h-14 bg-[#cccccc] border-t border-[#999] flex items-center justify-between px-2">
      <button className="bg-[#e0e0e0] border border-gray-400 text-[#555] px-6 py-1 text-sm rounded shadow-sm hover:bg-gray-100 transition-colors">
        Save and Exit
      </button>
      <button
        onClick={onNext}
        className="bg-primary-600 text-white px-10 py-1 text-sm rounded border border-[#006b81] shadow-md font-bold uppercase tracking-wider hover:bg-primary-700"
      >
        Next
      </button>
    </div>
  );
}

function ToolbarBtn({ icon, label }) {
  return (
    <button className="flex items-center gap-1 hover:bg-white/10 px-2 py-1 rounded transition-colors">
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default SSTGroup;