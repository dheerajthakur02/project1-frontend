import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../../services/api";
import WritingResultScreen from "./WritingResult";

/* ============================================================
   MAIN WRAPPER
============================================================ */
export default function APEUniWritingMockTest({ backendData, onComplete, isFullMock, onExit }) {
  const [step, setStep] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultId, setResultId] = useState(null);
  const [resultData, setResultData] = useState(null);

  // Global Section Timer: 54 Minutes
  const [globalTime, setGlobalTime] = useState(54 * 60);
  const answersRef = useRef([]); // Critical for auto-submit

  const { user } = useSelector((state) => state.auth);

  /* -------- FLATTEN BACKEND DATA -------- */
  useEffect(() => {
    if (!backendData) return;
    const seq = [
      ...(backendData.summarizeWrittenText || []).map(q => ({ ...q, type: "SWT", time: q.answerTime || 600 })),
      ...(backendData.writeEssay || []).map(q => ({ ...q, type: "ESSAY", time: q.answerTime || 1200 })),
      ...(backendData.summarizeSpokenText || []).map(q => ({ ...q, type: "SST", time: 600 })),
      ...(backendData.writeFromDictation || []).map(q => ({ ...q, type: "WFD", time: 60 }))
    ];
    setQuestions(seq);
  }, [backendData]);

  /* -------- GLOBAL TIMER LOGIC -------- */
  useEffect(() => {
    let timer;
    if (step === 4 && globalTime > 0) {
      timer = setInterval(() => {
        setGlobalTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            submitFullTest(answersRef.current); // Auto-submit on timeout
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  const handleNextQuestion = async (payload) => {
    const updatedAnswers = [...answers, payload];
    setAnswers(updatedAnswers);
    answersRef.current = updatedAnswers; // Keep ref updated

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      submitFullTest(updatedAnswers);
    }
  };

  const submitFullTest = async (finalAnswers) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (isFullMock && onComplete) {
      onComplete(finalAnswers);
      return;
    }

    try {
      const response = await api.post("/question/writing/attempt", {
        writingId: backendData._id,
        userId: user?._id,
        answers: finalAnswers,
      });

      if (response.data.success) {
        setResultId(response.data.data._id);
        setResultData(response.data.data);
        setStep(5);
      }
    } catch (err) {
      console.error("Submission failed", err);
      alert("Test ended. Error saving result.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatGlobalTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (isSubmitting) return <div className="p-20 text-center font-bold text-[#008199]">Analysing Writing Performance...</div>;
  if (!backendData) return <div className="p-10 text-center">Loading Questions...</div>;

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-sans">
      {/* HEADER */}
      <div className="bg-[#eeeeee] border-b border-gray-300">
        <div className="px-6 py-2 flex justify-between items-center text-sm font-bold text-gray-600">
          <span>Pawan PTE Mock Test — Writing Section</span>
          <button onClick={onExit} className="bg-white border px-3 py-1 rounded text-xs hover:bg-gray-100">Exit Test</button>
        </div>

        <div className="h-9 bg-[#008199] flex items-center justify-end px-6 space-x-6 text-white text-xs font-medium">
          {step === 4 && (
            <>
              <span className="bg-[#006b81] px-3 py-1 rounded">Question {currentIdx + 1} of {questions.length}</span>
              <span className={globalTime < 60 ? "text-red-300 animate-pulse" : ""}>Section Time: {formatGlobalTime(globalTime)}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex-grow bg-white overflow-y-auto">
        {step === 0 && <WritingOverview onNext={() => setStep(1)} />}
        {step === 1 && <HeadsetCheckScreen />}
        {step === 2 && <MicCheckScreen />}
        {step === 3 && <WritingIntro />}
        {step === 4 && (
          questions.length > 0 ? (
            <WritingQuestionController
              key={questions[currentIdx]._id}
              question={questions[currentIdx]}
              onNext={handleNextQuestion}
            />
          ) : (
            <div className="p-20 text-center">
              <h2 className="text-xl font-bold text-gray-500">No questions in this section.</h2>
              <button
                onClick={() => onComplete([])}
                className="mt-6 bg-[#fb8c00] text-white px-8 py-2 rounded font-bold"
              >
                Proceed to Next Section
              </button>
            </div>
          )
        )}
        {step === 5 && <WritingResultScreen resultId={resultId} resultData={resultData} />}
      </div>

      {/* FOOTER */}
      {step < 4 && (
        <div className="h-16 bg-[#eeeeee] border-t flex justify-end items-center px-10">
          <button onClick={() => setStep(step + 1)} className="bg-[#fb8c00] text-white px-10 py-2 rounded-sm text-sm font-bold uppercase shadow-md">
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   QUESTION CONTROLLER
============================================================ */
function WritingQuestionController({ question, onNext }) {
  const [text, setText] = useState("");
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioStatus, setAudioStatus] = useState("STOPPED");
  const audioRef = useRef(null);
  const textRef = useRef("");

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Audio Progress Tracker
  const onTimeUpdate = () => {
    if (audioRef.current) {
      const prog = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(prog);
    }
  };

  const manualSubmit = () => {
    onNext({ questionId: question._id, type: question.type, answer: text });
  };

  const renderPrompt = () => {
    if (question.type === "ESSAY") return question.title || question.description;
    if (question.type === "SWT") return question.paragraph;
    if (question.type === "SST") return question.title;
    return null;
  };

  const promptText = renderPrompt();

  return (
    <div className="p-10 max-w-5xl mx-auto flex flex-col h-full">
      <div className="flex justify-between mb-6 text-sm font-semibold text-gray-700">
        <span>{getWritingInstruction(question)}</span>
        <span className="text-gray-400 font-bold uppercase tracking-widest italic">PTE Writing Tasks</span>
      </div>

      {promptText && (
        <div className="bg-gray-50 p-6 mb-6 border border-gray-200 rounded text-sm leading-relaxed text-gray-800 shadow-sm font-medium">
          {promptText}
        </div>
      )}

      {/* RE-STYLED AUDIO BAR WITH VISIBLE SLIDER */}
      {question.audioUrl && (
        <div className="bg-[#4aa3c2] p-5 rounded-lg w-full mb-8 shadow-md">
          <div className="flex items-center gap-6">
            <div className="text-2xl text-white">🔊</div>
            <div className="flex-1 bg-white/30 h-3 rounded-full overflow-hidden relative">
              <div
                className="bg-white h-full transition-all duration-100 ease-linear"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
            <span className="text-white text-xs font-bold min-w-[80px] text-right">
              {audioProgress >= 100 ? "Completed" : "Playing Audio"}
            </span>
          </div>
          <audio
            ref={audioRef}
            src={question.audioUrl}
            onTimeUpdate={onTimeUpdate}
            onPlay={() => setAudioStatus("PLAYING")}
            onEnded={() => { setAudioStatus("FINISHED"); setAudioProgress(100) }}
            autoPlay
            className="hidden"
          />
        </div>
      )}

      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full flex-grow min-h-[300px] border-2 border-gray-200 p-5 rounded focus:outline-none focus:border-[#008199] shadow-inner text-gray-700 leading-relaxed"
        placeholder="Type your response here..."
      />

      <div className="flex justify-between items-center mt-6">
        <div className="text-sm font-medium text-gray-500 bg-gray-100 px-4 py-2 rounded">
          Words: <span className="text-black">{text.trim() === "" ? 0 : text.trim().split(/\s+/).filter(Boolean).length}</span>
        </div>

        <button onClick={manualSubmit} className="bg-primary-600 hover:bg-primary-700 text-white px-12 py-2 rounded-sm font-bold uppercase tracking-wide shadow-md">
          NEXT
        </button>
      </div>
    </div>
  );
}








/* ============================================================
   SUPPORTING SCREENS
============================================================ */

function WritingOverview({ onNext }) {
  return (
    <div className="p-10 max-w-4xl">
      <h2 className="font-bold text-lg mb-6">
        The Writing test is approximately 54 minutes long.
      </h2>
      <table className="border border-gray-400 text-xs w-full max-w-md">
        <thead>
          <tr className="bg-gray-100 text-gray-600">
            <th className="border p-2 text-left">Task</th>
            <th className="border p-2 text-left">Description</th>
            <th>Time Allowed</th>
          </tr>
        </thead>
        <tbody>
          {[
            "Summarize Written Text",
            "Write Essay",
            "Summarize Spoken Text",
            "Write From Dictation"
          ].map((t, i) => (
            <tr key={i}>
              <td className="border p-2">{i + 1}</td>
              <td className="border p-2">{t}</td>
              <td>{i === 1 ? "54 Minutes" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function HeadsetCheckScreen() {
  const [playing, setPlaying] = useState(false);
  const audio = useRef(
    new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3")
  );

  const toggle = () => {
    if (playing) {
      audio.current.pause();
    } else {
      audio.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className=" bg-[#e5e0df] flex flex-col">
      {/* Main Content */}
      <div className="flex flex-1 bg-white px-10 py-8">
        {/* LEFT CONTENT */}
        <div className="w-1/2 pr-10">
          <h2 className="font-bold mb-4">Headset</h2>

          <p className="text-sm mb-2">
            This is an opportunity to check that your headset is working
            correctly.
          </p>

          <ol className="text-sm list-decimal ml-4 space-y-1 mb-6">
            <li>
              Put your headset on and adjust it so that it fits comfortably over
              your ears.
            </li>
            <li>
              When you are ready, click on the <b>[Play]</b> button. You will
              hear a short recording.
            </li>
            <li>
              If you do not hear anything in your headphones while the status
              reads <b>[Playing]</b>, raise your hand to get the attention of
              the Test Administrator.
            </li>
          </ol>

          {/* AUDIO CONTROL BOX */}
          <div className="bg-[#4aa3c0] w-[320px] p-5 rounded">
            {/* Play Button */}
            <button
              onClick={toggle}
              className="flex items-center gap-3 bg-white px-4 py-2 rounded shadow text-sm font-medium"
            >
              <span className="text-lg">
                {playing ? "⏸" : "▶"}
              </span>
              {playing ? "Pause Audio" : "Click the play button to start"}
            </button>

            {/* Volume Slider (UI only) */}
            <div className="flex items-center gap-3 mt-4 text-white">
              🔊
              <div className="flex-1 h-1 bg-white/70 rounded" />
            </div>
          </div>

          <p className="text-xs mt-6 text-gray-700">
            - During the test you will not have [Play] and [Stop] buttons. The
            audio recording will start playing automatically.
            <br />
            - Please do not remove your headset. You should wear it throughout
            the test.
          </p>
        </div>

        {/* RIGHT IMAGE */}
        <div className="w-1/2 flex justify-center items-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png"
            alt="Headset Illustration"
            className="w-[300px] opacity-90"
          />
        </div>
      </div>
    </div>
  );
}



function MicCheckScreen() {
  const [recording, setRecording] = useState(false);
  const [url, setUrl] = useState(null);
  const recorder = useRef(null);
  const chunks = useRef([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder.current = new MediaRecorder(stream);
    chunks.current = [];

    recorder.current.ondataavailable = (e) => chunks.current.push(e.data);
    recorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: "audio/wav" });
      setUrl(URL.createObjectURL(blob));
    };

    recorder.current.start();
    setRecording(true);
  };

  const stop = () => {
    recorder.current.stop();
    setRecording(false);
  };

  return (
    <div className=" bg-white flex flex-col">

      {/* Main Content */}
      <div className="flex flex-1 px-10 py-8">
        {/* LEFT SECTION */}
        <div className="w-1/2 pr-10">
          <h2 className="font-semibold mb-4">Microphone Check</h2>

          <p className="text-sm mb-2">
            This is an opportunity to check that your microphone is working
            correctly.
          </p>

          <ol className="text-sm list-decimal ml-4 space-y-1 mb-6">
            <li>
              Make sure your headset is on and the microphone is in the downward
              position near your mouth.
            </li>
            <li>
              When you are ready, click on the <b>Record</b> button and say{" "}
              <span className="text-red-500">
                “Testing, testing, one, two, three”
              </span>
              .
            </li>
            <li>After you have spoken, click on the Stop button.</li>
            <li>Now click on the Playback button.</li>
            <li>
              If you cannot hear your voice clearly, please raise your hand.
            </li>
          </ol>

          {/* RECORD CONTROLS */}
          <div className="flex items-center gap-4">
            {!recording ? (
              <button
                onClick={start}
                className="bg-[#5aa9c3] text-white px-10 py-2 rounded shadow"
              >
                Record
              </button>
            ) : (
              <button
                onClick={stop}
                className="bg-red-500 text-white px-10 py-2 rounded shadow"
              >
                Stop
              </button>
            )}

            {/* Mic Status Indicator */}
            <div
              className={`w-10 h-10 rounded-full border-4 flex items-center justify-center ${recording ? "border-red-500" : "border-gray-400"
                }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${recording ? "bg-red-500 animate-pulse" : "bg-gray-400"
                  }`}
              />
            </div>

            {url && (
              <button
                onClick={() => new Audio(url).play()}
                className="bg-gray-200 px-8 py-2 rounded shadow"
              >
                Playback
              </button>
            )}
          </div>

          <p className="text-xs mt-6 text-gray-700">
            During the test, you will not have Record, Playback and Stop buttons.
            The voice recording will start automatically.
          </p>
        </div>

        {/* RIGHT SECTION (IMAGES) */}
        <div className="w-1/2 flex justify-center items-center gap-10">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png"
            alt="Headset Front"
            className="w-[220px]"
          />
          <img
            src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png"
            alt="Headset Side"
            className="w-[180px] opacity-90"
          />
        </div>
      </div>
    </div>
  );
}


function WritingIntro() {
  return (
    <div className="bg-white px-10 py-8">
      <div className="max-w-3xl">
        <h2 className="font-semibold mb-2 text-lg">Test Introduction</h2>
        <p className="text-sm mb-6 text-gray-600">This test measures Writing skills that you will need in an academic setting.</p>
        <ul className="text-sm space-y-4 text-gray-700">
          <li>- Timer is shown at the top right.</li>
          <li>- Use Next button to move forward. You cannot go back.</li>
          <li>- Standard English varieties (UK/US/AU) are all acceptable.</li>
        </ul>
      </div>
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */
function getWritingInstruction(q) {
  switch (q.type) {
    case "SWT":
      return `Summarize written text (Max ${q.maxWords || 75} words)`;
    case "ESSAY":
      return `Write an essay (${q.minWords || 200}-${q.maxWords || 300} words)`;
    case "SST":
      return "Listen and summarize the spoken text (50-70 words)";
    case "WFD":
      return "Listen and write the sentence";
    default:
      return "";
  }
}

function formatTime(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}