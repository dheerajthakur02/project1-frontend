import React, { useEffect, useRef, useState } from "react";

/* ============================================================
   MAIN WRAPPER
============================================================ */
export default function APEUniWritingMockTest({ backendData }) {
  const [step, setStep] = useState(0); 
  // 0 Overview | 1 Headset | 2 Mic | 3 Intro | 4 Exam | 5 Result

  const [currentIdx, setCurrentIdx] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);

  /* -------- FLATTEN BACKEND DATA -------- */
  useEffect(() => {
    if (!backendData) return;

    const seq = [
      ...(backendData.summarizeWrittenText || []).map(q => ({
        ...q,
        type: "SWT",
        time: q.answerTime || 600
      })),
      ...(backendData.writeEssay || []).map(q => ({
        ...q,
        type: "ESSAY",
        time: q.answerTime || 600
      })),
      ...(backendData.summarizeSpokenText || []).map(q => ({
        ...q,
        type: "SST",
        time: 600
      })),
      ...(backendData.writeFromDictation || []).map(q => ({
        ...q,
        type: "WFD",
        time: 60
      }))
    ];

    setQuestions(seq);
  }, [backendData]);

  const handleNextQuestion = (payload) => {
    const updated = [...answers, payload];
    setAnswers(updated);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setStep(5);
    }
  };

  if (!backendData || questions.length === 0) {
    return <div className="p-10 text-center">Loading Writing Test...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-sans">
      {/* HEADER */}
      <div className="bg-[#eeeeee] border-b border-gray-300">
        <div className="px-6 py-2 flex justify-between items-center text-sm font-bold text-gray-600">
          <span>APEUni PTE Mock Test — Writing</span>
          <button className="bg-white border px-3 py-1 rounded text-xs">
            Exit Test
          </button>
        </div>

        <div className="h-9 bg-[#008199] flex items-center justify-end px-6 text-white text-xs">
          {step === 4 && (
            <span className="bg-[#006b81] px-3 py-1 rounded">
              Question {currentIdx + 1} of {questions.length}
            </span>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-grow bg-white overflow-y-auto">
        {step === 0 && <WritingOverview onNext={() => setStep(1)} />}
        {step === 1 && <HeadsetCheckScreen onNext={() => setStep(2)} />}
        {step === 2 && <MicCheckScreen onNext={() => setStep(3)} />}
        {step === 3 && <WritingIntro onNext={() => setStep(4)} />}
        {step === 4 && (
          <WritingQuestionController
            key={questions[currentIdx]._id}
            question={questions[currentIdx]}
            onNext={handleNextQuestion}
          />
        )}
        {step === 5 && <WritingResultScreen answers={answers} />}
      </div>

      {/* FOOTER */}
      {step < 4 && (
        <div className="h-16 bg-[#eeeeee] border-t flex justify-end items-center px-10">
          <button
            onClick={() => setStep(step + 1)}
            className="bg-[#fb8c00] text-white px-10 py-2 font-bold uppercase text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   OVERVIEW
============================================================ */
function WritingOverview({ onNext }) {
  return (
    <div className="p-10 max-w-4xl">
      <h2 className="font-bold text-lg mb-6">
        The Writing test is approximately 30 minutes long.
      </h2>

      <table className="border border-gray-400 text-xs w-full max-w-md">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Task</th>
            <th className="border p-2">Description</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   HEADSET CHECK
============================================================ */
function HeadsetCheckScreen({ onNext }) {
  const audio = useRef(new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"));
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    playing ? audio.current.pause() : audio.current.play();
    setPlaying(!playing);
  };

  return (
    <div className="p-10 flex">
      <div className="w-1/2">
        <h2 className="font-bold mb-4">Headset Check</h2>
        <p className="text-sm mb-4">Click play to test your headset.</p>

        <button
          onClick={toggle}
          className="bg-[#4aa3c0] text-white px-6 py-2 rounded"
        >
          {playing ? "Pause" : "Play"}
        </button>
      </div>

      <div className="w-1/2 flex justify-center items-center">
        <img
          src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png"
          className="w-[260px]"
        />
      </div>
    </div>
  );
}

/* ============================================================
   MIC CHECK
============================================================ */
function MicCheckScreen({ onNext }) {
  const [recording, setRecording] = useState(false);
  const recorder = useRef(null);
  const chunks = useRef([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder.current = new MediaRecorder(stream);
    recorder.current.ondataavailable = e => chunks.current.push(e.data);
    recorder.current.start();
    setRecording(true);
  };

  const stop = () => {
    recorder.current.stop();
    setRecording(false);
  };

  return (
    <div className="p-10 flex">
      <div className="w-1/2">
        <h2 className="font-bold mb-4">Microphone Check</h2>

        <div className="flex gap-4">
          {!recording ? (
            <button onClick={start} className="bg-[#5aa9c3] text-white px-6 py-2">
              Record
            </button>
          ) : (
            <button onClick={stop} className="bg-red-500 text-white px-6 py-2">
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   INTRO
============================================================ */
function WritingIntro({ onNext }) {
  return (
    <div className="p-10 max-w-3xl">
      <h2 className="font-bold mb-4">Writing Test Instructions</h2>

      <ul className="text-sm space-y-4">
        <li>- Timer is shown at the top right.</li>
        <li>- You cannot return to previous questions.</li>
        <li>- Word limits must be respected.</li>
      </ul>
    </div>
  );
}

/* ============================================================
   QUESTION CONTROLLER
============================================================ */
function WritingQuestionController({ question, onNext }) {
  const [text, setText] = useState("");
  const [timeLeft, setTimeLeft] = useState(question.time);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          submit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const submit = () => {
    onNext({
      questionId: question._id,
      type: question.type,
      answer: text
    });
  };

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <div className="flex justify-between mb-4 text-sm">
        <span>{getWritingInstruction(question)}</span>
        <span>⏱ {formatTime(timeLeft)}</span>
      </div>

      {question.paragraph && (
        <div className="bg-gray-50 p-5 mb-4 border">
          {question.paragraph}
        </div>
      )}

      {question.audioUrl && (
        <audio src={question.audioUrl} controls className="mb-4" />
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-48 border p-4 resize-none"
        placeholder="Type your response here..."
      />

      <div className="flex justify-between mt-4">
        <span className="text-xs text-gray-500">
          Words: {text.trim().split(/\s+/).filter(Boolean).length}
        </span>

        <button
          onClick={submit}
          className="bg-[#008199] text-white px-6 py-2 rounded"
        >
          NEXT
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   RESULT
============================================================ */
function WritingResultScreen({ answers }) {
  return (
    <div className="p-10 max-w-3xl">
      <h2 className="text-2xl font-black mb-6">Writing Test Completed</h2>

      {answers.map((a, i) => (
        <div key={i} className="border p-4 mb-3 rounded">
          <p className="text-xs font-bold mb-1">
            Q{i + 1} • {a.type}
          </p>
          <p className="text-sm italic">{a.answer || "No response"}</p>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */
function getWritingInstruction(q) {
  switch (q.type) {
    case "SWT":
      return `Summarize the text in one sentence (Max ${q.maxWords} words)`;
    case "ESSAY":
      return `Write an essay (${q.minWords}-${q.maxWords} words)`;
    case "SST":
      return "Listen and summarize the spoken text";
    case "WFD":
      return "Listen and write the sentence";
    default:
      return "";
  }
}

function formatTime(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}
