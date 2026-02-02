import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";

// --- WRITE FROM DICTATION COMPONENT ---
export default function WFD({ backendData }) {
  const [phase, setPhase] = useState("INTRO"); // "INTRO", "TEST", "RESULT"
  const [currentIdx, setCurrentIdx] = useState(0);
  const [introTimeLeft, setIntroTimeLeft] = useState(2 * 60); // 2 minutes for intro
  const [testTimeLeft, setTestTimeLeft] = useState(10 * 60); // 10 minutes for the test
  const [answers, setAnswers] = useState({}); // Stores answers for each question ID
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const questions = backendData?.WriteFromDictationQuestions || [];
  const currentQuestion = questions[currentIdx];

  // --- TIMERS LOGIC ---
  useEffect(() => {
    let timer;
    if (phase === "INTRO" && introTimeLeft > 0) {
      timer = setInterval(() => setIntroTimeLeft((prev) => prev - 1), 1000);
    } else if (phase === "INTRO" && introTimeLeft === 0) {
      startTest();
    }
    return () => clearInterval(timer);
  }, [phase, introTimeLeft]);

  useEffect(() => {
    let timer;
    if (phase === "TEST" && testTimeLeft > 0) {
      timer = setInterval(() => setTestTimeLeft((prev) => prev - 1), 1000);
    } else if (phase === "TEST" && testTimeLeft === 0) {
      handleSubmit(); // Auto-submit when 10 mins end
    }
    return () => clearInterval(timer);
  }, [phase, testTimeLeft]);

  // --- HANDLERS ---
  const startTest = () => {
    setPhase("TEST");
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };



  // ... inside the component
  const handleSubmit = async () => {
    setPhase("RESULT");
    setIsLoadingResult(true);
    try {
      // Map answers to backend format
      const formattedAnswers = questions.map((q) => ({
        questionId: q._id,
        content: answers[q._id] || "",
      }));

      const { data } = await api.post("/question/wfd/submit", {
        testId: backendData._id,
        answers: formattedAnswers
      });

      if (data.success) {
        setTestResult({
          totalScore: data.data.overallScore
        });
      }
    } catch (err) {
      console.error("Scoring Error:", err);
    } finally {
      setIsLoadingResult(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!backendData) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="bg-[#eeeeee] border-b border-gray-300">
        <div className="px-4 py-2 flex justify-between items-center">
          <span className="text-xl text-gray-700 font-medium">Pawan PTE Mock Test</span>
          <div className="flex flex-col items-end text-[13px] text-gray-600">
            <div className="flex items-center gap-1 font-semibold">
              <span className="material-icons-outlined text-base">schedule</span>
              <span>Time Remaining {formatTime(phase === "INTRO" ? introTimeLeft : testTimeLeft)}</span>
            </div>
            {phase === "TEST" && <span>{currentIdx + 1} of {questions.length}</span>}
          </div>
        </div>
        <div className="h-9 bg-[#008199]"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow bg-white p-10 overflow-y-auto">
        {phase === "INTRO" && (
          <div className="max-w-4xl space-y-6">
            <p className="text-[13px] font-bold">The test is approximately 10 minutes long.</p>
            <table className="border-collapse border border-black text-[13px]">
              <thead>
                <tr className="bg-gray-50 italic">
                  <th className="border border-black px-8 py-1 font-normal">Part</th>
                  <th className="border border-black px-12 py-1 font-normal">Content</th>
                  <th className="border border-black px-8 py-1 font-normal">Time allowed</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-8 py-1 italic">Part1</td>
                  <td className="border border-black px-12 py-1">Write From Dictation</td>
                  <td className="border border-black px-8 py-1">10 minutes</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {phase === "TEST" && (
          <div className="max-w-7xl mx-auto space-y-8">
            <p className="text-[13px] text-gray-800">
              You will hear a sentence. Type the sentence in the box below exactly as you hear it. Write as much of the sentence as you can. You will hear the sentence only once.
            </p>

            {/* Custom Audio Player UI */}
            <div className="flex justify-center">
              <AudioPlayer key={currentQuestion._id} url={currentQuestion.audioUrl} />
            </div>

            {/* Editor Container */}
            <div className="border border-[#62a8be] rounded-sm flex flex-col mt-4">
              <div className="bg-[#62a8be] h-9 flex items-center px-2 gap-4 text-white text-[12px]">
                <button className="flex items-center gap-1"><span className="material-icons-outlined text-sm">content_cut</span> Cut</button>
                <button className="flex items-center gap-1"><span className="material-icons-outlined text-sm">content_copy</span> Copy</button>
                <button className="flex items-center gap-1"><span className="material-icons-outlined text-sm">content_paste</span> Paste</button>
                <button className="flex items-center gap-1 ml-4"><span className="material-icons-outlined text-sm">undo</span> Undo</button>
                <button className="flex items-center gap-1"><span className="material-icons-outlined text-sm">redo</span> Redo</button>
              </div>

              <textarea
                className="w-full h-40 p-4 text-[15px] focus:outline-none resize-none leading-relaxed border-none"
                value={answers[currentQuestion._id] || ""}
                onChange={(e) => setAnswers({ ...answers, [currentQuestion._id]: e.target.value })}
                spellCheck={false}
              />

              <div className="bg-[#62a8be] h-9 flex items-center px-4 text-white text-[12px] font-medium">
                Word Count: {(answers[currentQuestion._id] || "").trim().split(/\s+/).filter(x => x).length}
              </div>
            </div>
          </div>
        )}

        {phase === "RESULT" && (
          <ResultScreen testResult={testResult} isLoadingResult={isLoadingResult} />
        )}
      </div>

      {/* Footer Navigation */}
      <div className="h-16 bg-[#eeeeee] border-t border-gray-300 flex items-center justify-between px-6">
        <button className="bg-white border border-gray-400 px-6 py-1.5 rounded-sm text-sm text-gray-700 font-medium">
          Save and Exit
        </button>
        {phase !== "RESULT" && (
          <button
            onClick={phase === "INTRO" ? startTest : handleNext}
            className="bg-[#008199] text-white px-10 py-1.5 rounded-md text-sm font-bold shadow-md hover:bg-[#006b81]"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function AudioPlayer({ url }) {
  const audioRef = useRef(new Audio(url));
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;

    // Auto play after a short delay (simulating PTE prep time)
    const timeout = setTimeout(() => {
      audio.play();
      setIsPlaying(true);
    }, 3000);

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      clearTimeout(timeout);
      audio.pause();
      audio.removeEventListener("timeupdate", updateProgress);
    };
  }, [url]);

  return (
    <div className="bg-[#62a8be] p-4 rounded-sm flex flex-col items-center gap-3 w-full max-w-md shadow-sm">
      <div className="flex items-center gap-4 w-full">
        <button className="text-white">
          <span className="material-icons">{isPlaying ? 'pause' : 'play_arrow'}</span>
        </button>
        <div className="flex-grow bg-white h-2 rounded-full overflow-hidden">
          <div className="bg-gray-400 h-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-2 w-full justify-center text-white">
        <span className="material-icons text-lg">volume_up</span>
        <div className="w-32 bg-white/30 h-1 rounded-full"><div className="w-1/2 bg-white h-full" /></div>
      </div>
    </div>
  );
}

function ResultScreen({ testResult, isLoadingResult }) {
  if (isLoadingResult) return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-[#008199] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold text-[#008199]">Calculating scores...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-10 text-center border mt-10 rounded-lg shadow-sm bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Practice Result</h1>
      <div className="p-6 border rounded bg-blue-50 text-left">
        <p className="text-sm font-bold uppercase text-gray-500 mb-2">Listening & Writing Score</p>
        <p className="text-3xl font-bold text-[#008199]">{testResult?.totalScore || 0} / 90</p>
      </div>
      <button onClick={() => window.location.reload()} className="mt-8 bg-[#fb8c00] text-white px-8 py-2 rounded uppercase font-bold text-xs">Retake Practice</button>
    </div>
  );
}