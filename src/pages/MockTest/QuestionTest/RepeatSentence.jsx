import React, { useState, useEffect, useRef } from "react";
import api from "../../../services/api";

export default function RepeatSentenceMockTest({ backendData }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [step, setStep] = useState(0); // 0: Exam, 1: Result
  const [globalTime, setGlobalTime] = useState(35 * 60);
  const questions = backendData.repeatSentenceQuestions || [];

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

  // ... (timer useEffect)

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
      const { data } = await api.post("/question/rs/submit", {
        testId: backendData._id,
        answers: answers
      });
      if (data.success) {
        setTestResult(data.data);
      }
    } catch (error) {
      console.error("RS Submit Error", error);
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
          </div>
        )}
        <button onClick={() => window.location.reload()} className="mt-8 bg-[#008199] text-white px-8 py-2 rounded uppercase font-bold text-xs">Retake Practice</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none overflow-hidden">
      {/* HEADER */}
      <div className="bg-slate-900 text-[#e0e0e0] px-4 py-2 flex justify-between items-center text-sm">
        <div className="text-lg font-medium">Pawan PTE Mock Test</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="opacity-70 text-xs">🕒 Time Remaining</span>
            <span className="font-mono text-white text-base">{formatTime(globalTime)}</span>
          </div>
          <div className="bg-[#666] px-2 py-0.5 rounded text-xs text-white">
            {currentIdx + 1} of {questions.length}
          </div>
        </div>
      </div>

      {/* INSTRUCTION BAR */}
      <div className="bg-slate-800 text-white px-8 py-3 text-[13px] font-medium border-t border-slate-700">
        You will hear a sentence. Please repeat the sentence exactly as you hear it. You will hear the sentence only once.
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow flex flex-col items-center pt-16 bg-[#f9f9f9]">
        <RepeatSentenceController
          key={questions[currentIdx]._id}
          question={questions[currentIdx]}
          onNext={handleNext}
        />
      </div>
    </div>
  );
}

function RepeatSentenceController({ question, onNext }) {
  const [status, setStatus] = useState("PLAYING"); // PLAYING, RECORDING
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioTime, setAudioTime] = useState("00:00 / 00:00");
  const [recTimeLeft, setRecTimeLeft] = useState(15); // Standard 15s for Repeat Sentence

  const audioRef = useRef(new Audio(question.audioUrl));
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;

    // Handle Metadata
    const handleMetadata = () => {
      setAudioTime(`00:00 / 00:${Math.round(audio.duration).toString().padStart(2, '0')}`);
    };

    // Handle Progress Slider
    const handleTimeUpdate = () => {
      const progress = (audio.currentTime / audio.duration) * 100;
      setAudioProgress(progress);
      setAudioTime(
        `00:${Math.floor(audio.currentTime).toString().padStart(2, '0')} / 00:${Math.round(audio.duration).toString().padStart(2, '0')}`
      );
    };

    // Handle Audio End -> Start Recording
    const handleEnded = () => {
      setTimeout(() => {
        startRecording();
      }, 500); // 0.5s gap after audio
    };

    audio.addEventListener("loadedmetadata", handleMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.play();

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      stopMic();
    };
  }, []);

  const startRecording = async () => {
    setStatus("RECORDING");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.start();

      // Start 15s countdown
      const recTimer = setInterval(() => {
        setRecTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(recTimer);
            onNext();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Mic Error", err);
    }
  };

  const stopMic = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  return (
    <div className="w-full flex flex-col items-center h-full">
      {/* AUDIO PLAYER BOX */}
      <div className="bg-slate-800 w-[450px] p-6 rounded shadow-sm mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-white text-xs">▶</div>
          <div className="flex-grow h-3 bg-white/30 rounded-sm relative overflow-hidden">
            {/* Slider progress */}
            <div
              className="absolute h-full bg-white transition-all duration-200"
              style={{ width: `${audioProgress}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between items-center text-[11px] text-white font-mono">
          <span>{audioTime}</span>
          <div className="flex items-center gap-2">
            <span>🔊</span>
            <div className="w-24 h-1 bg-white/50 rounded">
              <div className="w-3/4 h-full bg-white" />
            </div>
            <span className="text-xs">⋮</span>
          </div>
        </div>
      </div>

      {/* CIRCULAR RECORDING INDICATOR */}
      <div className="flex flex-col items-center gap-4">
        <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-500
            ${status === "RECORDING" ? "border-gray-500 scale-110 shadow-lg" : "border-gray-300 opacity-20"}`}>
          <div className={`w-6 h-6 rounded-full ${status === "RECORDING" ? "bg-gray-500 animate-pulse" : "bg-gray-300"}`} />
        </div>
        {status === "RECORDING" && (
          <span className="text-gray-500 font-medium text-sm animate-pulse">Recording... {recTimeLeft}s</span>
        )}
      </div>

      {/* FOOTER BAR */}
      <div className="fixed bottom-0 left-0 w-full h-14 bg-[#cccccc] border-t border-[#999] flex items-center justify-between px-2">
        <button className="bg-[#e0e0e0] border border-gray-400 text-gray-700 px-6 py-1 text-sm rounded shadow-sm hover:bg-gray-100 transition-colors">
          Save and Exit
        </button>

        <button
          onClick={() => {
            stopMic();
            onNext();
          }}
          disabled={status === "PLAYING"}
          className={`px-10 py-1 text-sm rounded border shadow-md font-bold uppercase tracking-wider transition-all
            ${status === "PLAYING"
              ? "bg-[#1e293b] text-white border-transparent cursor-not-allowed opacity-60"
              : "bg-primary-600 text-white border-[#006b81] hover:bg-primary-700"
            }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}