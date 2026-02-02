import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import api from "../../../services/api";

// --- MAIN WRAPPER ---
export default function APEUniReadingTest({ backendData, onComplete, isFullMock, onExit }) {
  const [step, setStep] = useState(0); // 0: Overview, 1: Headset, 2: Mic, 3: Intro, 4: Exam, 5: Result
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flattenedQuestions, setFlattenedQuestions] = useState([]);
  const [answers, setAnswers] = useState([]); // For backend submission
  const [userAnswers, setUserAnswers] = useState({}); // For UI component state
  const [timeLeft, setTimeLeft] = useState(51 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultId, setResultId] = useState(null);
  const [resultData, setResultData] = useState(null);

  const answersRef = useRef([]); // Critical for auto-submit closure
  const { user } = useSelector((state) => state.auth);

  // Flatten the nested backend data
  useEffect(() => {
    if (!backendData) return;
    const sequence = [
      ...(backendData.summarizeWrittenText || []).map(q => ({ ...q, type: "SWT" })),
      ...(backendData.multipleChoiceMultiple || []).map(q => ({ ...q, type: "MCM" })),
      ...(backendData.reOrderParagraphs || []).map(q => ({ ...q, type: "RO" })),
      ...(backendData.fillInTheBlanksWithDragDrop || []).map(q => ({ ...q, type: "FIB_DD" })),
      ...(backendData.multipleChoiceSingle || []).map(q => ({ ...q, type: "MCS" })),
    ];
    setFlattenedQuestions(sequence);
  }, [backendData]);

  // Global Timer Logic
  useEffect(() => {
    let timer;
    if (step === 4 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            submitFullTest(answersRef.current); // Auto-submit when time hits 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  const handleNextQuestion = () => {
    const currentQuestion = flattenedQuestions[currentIdx];
    if (!currentQuestion) return; // Prevention for undefined access
    const currentAnswer = userAnswers[currentQuestion._id];

    const payload = {
      questionId: currentQuestion._id,
      type: currentQuestion.type,
      answer: currentAnswer
    };

    const updatedAnswers = [...answers, payload];
    setAnswers(updatedAnswers);
    answersRef.current = updatedAnswers; // Sync ref for timer

    if (currentIdx < flattenedQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
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
      const response = await api.post("/question/reading/result/calculate", {
        readingId: backendData._id,
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
      alert("Test ended. Error saving results.");
      setStep(5);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (isSubmitting) return <div className="p-20 text-center font-bold text-primary-700">Analysing Reading Answers...</div>;
  if (!backendData) {
    return <div className="p-10 text-center text-gray-400">Loading Reading Test Data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="bg-[#eeeeee] border-b border-gray-300">
        <div className="px-6 py-2 flex justify-between items-center text-sm font-bold text-gray-600">
          <span>Pawan PTE Reading - {backendData.title}</span>
          <button onClick={onExit} className="bg-white border border-gray-400 px-3 py-1 rounded text-xs hover:bg-gray-100">Exit</button>
        </div>
        <div className="h-9 bg-slate-900 flex items-center justify-end px-6 space-x-6 text-white text-xs font-medium">
          {step === 4 && (
            <>
              <span className="bg-[#006b81] px-3 py-1 rounded">Question {currentIdx + 1} of {flattenedQuestions.length}</span>
              <span className={timeLeft < 60 ? "text-red-300 animate-pulse" : ""}>Section Time: {formatTime(timeLeft)}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex-grow flex flex-col overflow-y-auto bg-white border border-gray-200">
        {step === 0 && <OverviewScreen />}
        {step === 1 && <HeadsetCheckScreen />}
        {step === 2 && <MicCheckScreen />}
        {step === 3 && <IntroScreen />}
        {step === 4 && (
          flattenedQuestions.length > 0 ? (
            <ReadingQuestionController
              key={flattenedQuestions[currentIdx]._id} // Forces fresh UI per question
              question={flattenedQuestions[currentIdx]}
              answer={userAnswers[flattenedQuestions[currentIdx]._id]}
              setAnswer={(val) => setUserAnswers({ ...userAnswers, [flattenedQuestions[currentIdx]._id]: val })}
            />
          ) : (
            <div className="p-20 text-center">
              <h2 className="text-xl font-bold text-gray-500">No questions in this section.</h2>
              <button
                onClick={() => onComplete([])}
                className="mt-6 bg-primary-600 text-white px-8 py-2 rounded font-bold"
              >
                Proceed to Next Section
              </button>
            </div>
          )
        )}
        {step === 5 && <ReadingResultScreen resultId={resultId} resultData={resultData} />}
      </div>

      {/* Footer Navigation */}
      <div className="h-16 bg-[#eeeeee] border-t border-gray-300 flex items-center justify-between px-10">
        <div className="text-gray-500 text-xs font-medium">PTE Academic Official Practice • Reading</div>
        {step < 5 && (
          <button
            onClick={step < 4 ? () => setStep(step + 1) : handleNextQuestion}
            className="bg-primary-600 text-white px-10 py-2 rounded-sm text-sm font-bold shadow-md hover:bg-[#e67e00] uppercase tracking-wide"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

/* ===================== QUESTION CONTROLLER ===================== */

function ReadingQuestionController({ question, answer, setAnswer }) {
  const getInstruction = (type) => {
    switch (type) {
      case "SWT": return "Read the passage below and summarize it in one sentence. You have 10 minutes.";
      case "MCM": return "Read the text and answer the question by selecting all correct responses. More than one response may be correct.";
      case "MCS": return "Read the text and answer the multiple-choice question by selecting one correct response.";
      case "RO": return "The text boxes in the left panel are in random order. Restore the original order by dragging them to the right panel.";
      case "FIB_DD": return "In the text below some words are missing. Drag words from the box to the appropriate place in the text.";
      default: return "";
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <p className="text-[15px] text-gray-800 mb-6 font-medium bg-blue-50 p-3 border-l-4 border-blue-400 italic">
        {getInstruction(question.type)}
      </p>

      <div className="grid grid-cols-1 gap-8">
        {question.type === "SWT" && <SWTLayout question={question} answer={answer} setAnswer={setAnswer} />}
        {(question.type === "MCS" || question.type === "MCM") && <ChoiceLayout question={question} answer={answer} setAnswer={setAnswer} />}
        {question.type === "RO" && <ReorderLayout question={question} answer={answer} setAnswer={setAnswer} />}
        {question.type === "FIB_DD" && <FIBDragDropLayout question={question} answer={answer} setAnswer={setAnswer} />}
      </div>
    </div>
  );
}

/* ===================== LAYOUT COMPONENTS ===================== */

function SWTLayout({ question, answer, setAnswer }) {
  const wordCount = answer ? answer.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
  return (
    <div className="flex flex-col gap-6">
      <div className="border p-6 bg-gray-50 leading-relaxed text-gray-700 max-h-64 overflow-y-auto shadow-inner">
        {question.paragraph}
      </div>
      <textarea
        autoFocus
        className="w-full h-40 border-2 border-gray-300 p-4 focus:border-primary-500 outline-none rounded shadow-sm"
        placeholder="Type your summary here..."
        value={answer || ""}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
        <span>Word Count: <span className="text-black">{wordCount}</span></span>
        <span className={wordCount > 75 || (wordCount < 5 && wordCount > 0) ? "text-red-500" : ""}>Target: 5-75 words</span>
      </div>
    </div>
  );
}

function ChoiceLayout({ question, answer, setAnswer }) {
  const isMulti = question.type === "MCM";
  const currentSelections = answer || [];

  const toggleOption = (opt) => {
    if (!isMulti) { setAnswer([opt]); }
    else {
      if (currentSelections.includes(opt)) setAnswer(currentSelections.filter(i => i !== opt));
      else setAnswer([...currentSelections, opt]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      <div className="border p-6 text-sm leading-relaxed max-h-[500px] overflow-y-auto text-gray-700 shadow-inner">
        {question.text || question.paragraph}
      </div>
      <div>
        <h3 className="font-bold text-gray-800 mb-6 text-base">{question.question}</h3>
        <div className="space-y-3">
          {(question.options || []).map((opt, i) => (
            <label key={i} className={`flex items-start gap-4 p-4 border-2 rounded cursor-pointer transition-all ${currentSelections.includes(opt) ? "bg-cyan-50 border-cyan-400" : "hover:bg-gray-50 border-gray-100"}`}>
              <input
                type={isMulti ? "checkbox" : "radio"}
                checked={currentSelections.includes(opt)}
                onChange={() => toggleOption(opt)}
                className="mt-1 w-4 h-4 text-primary-700"
              />
              <span className="text-sm text-gray-700 font-medium">{opt}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReorderLayout({ question, answer, setAnswer }) {
  const [source, setSource] = useState(question.sentences || []);
  const target = answer || [];

  const moveToTarget = (item) => {
    setSource(source.filter(s => s.id !== item.id));
    setAnswer([...target, item]);
  };
  const moveToSource = (item) => {
    setAnswer(target.filter(t => t.id !== item.id));
    setSource([...source, item]);
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-[450px]">
      <div className="border-2 border-dashed border-gray-300 p-4 overflow-y-auto rounded bg-gray-50">
        <p className="text-xs font-black text-gray-400 mb-4 uppercase text-center tracking-widest">Source Panel</p>
        {source.map(s => (
          <div key={s.id} onClick={() => moveToTarget(s)} className="p-4 mb-3 bg-white border rounded shadow-sm cursor-pointer hover:border-[#008199] text-sm leading-relaxed transition-all">
            {s.text}
          </div>
        ))}
      </div>
      <div className="border-2 border-cyan-100 bg-cyan-50/20 p-4 overflow-y-auto rounded">
        <p className="text-xs font-black text-cyan-500 mb-4 uppercase text-center tracking-widest">Target Order</p>
        {target.map((s, idx) => (
          <div key={s.id} onClick={() => moveToSource(s)} className="p-4 mb-3 bg-white border-l-4 border-l-[#008199] border rounded shadow-md cursor-pointer text-sm leading-relaxed">
            <span className="font-black mr-2 text-primary-700">{idx + 1}.</span> {s.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function FIBDragDropLayout({ question, answer, setAnswer }) {
  const selections = answer || {};
  const handleDrop = (index, word) => setAnswer({ ...selections, [index]: word });
  const parts = (question.text || "").split(/(\[\d+\])/g);

  return (
    <div className="flex flex-col gap-10">
      <div className="p-10 border rounded shadow-inner bg-gray-50 leading-[3.5rem] text-[17px] text-gray-800">
        {parts.map((part, i) => {
          const match = part.match(/\[(\d+)\]/);
          if (match) {
            const slotIdx = match[1];
            return (
              <span key={i} className="inline-block mx-2 min-w-[130px] h-10 border-b-2 border-[#008199] bg-white px-3 leading-10 text-center font-bold text-primary-700 rounded-t">
                {selections[slotIdx] || "______"}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
      <div className="flex flex-wrap gap-4 p-8 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        {(question.options || []).map((opt, i) => {
          const isUsed = Object.values(selections).includes(opt);
          return (
            <button
              key={i}
              disabled={isUsed}
              onClick={() => {
                const nextSlot = parts.map(p => p.match(/\[(\d+)\]/)).find(m => m && !selections[m[1]]);
                if (nextSlot) handleDrop(nextSlot[1], opt);
              }}
              className={`px-6 py-2 border rounded-full shadow-sm text-sm font-bold transition-all ${isUsed ? "bg-gray-300 text-gray-50 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-primary-600 hover:text-white"}`}
            >
              {opt}
            </button>
          );
        })}
        <button onClick={() => setAnswer({})} className="text-xs text-red-500 font-bold uppercase underline ml-auto">Reset All</button>
      </div>
    </div>
  );
}

/* ===================== SCREENS ===================== */

function OverviewScreen() {
  return (
    <div className="p-16 max-w-4xl ">
      <h2 className="text-2xl font-black mb-8 text-gray-800 border-b-4 border-primary-600 pb-2 inline-block">Part 2: Reading</h2>
      <p className="text-gray-600 mb-10 text-lg leading-relaxed">The Reading section measures your ability to understand academic English. You will have approximately 51 minutes for this part.</p>
      <table className="border-collapse border border-gray-300 w-full text-sm">
        <thead className="bg-gray-100"><tr><th className="border p-3 text-left">Task</th><th className="border p-3 text-left">Time Allowed</th></tr></thead>
        <tbody>
          {["Summarize Written Text", "Fill in the Blanks", "Multiple Choice", "Re-order Paragraphs", "Fill in the Blanks (Drag and Drop)", "Multiple Choice (single)", "Highlight Correct Summary", "Higlight incorrect Words"].map((t, i) => (
            <tr key={i}><td className="border p-3">{t}</td><td className="border p-3 text-gray-400 italic">{i === 3 ? "51 Minutes" : ""}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



// Add import at the top
import ScoreBreakdownTable from "../FullMockTest/ScoreBreakdownTable";

function ReadingResultScreen({ resultId, resultData }) {
  if (!resultData) return <div className="p-20 text-center">Loading Result...</div>;

  // Adapt data for ScoreBreakdownTable
  // It expects { reading: { answers: [...] } }
  // Our resultData.scores has { questionType, score, maxScore }
  const breakdownData = {
    reading: {
      answers: resultData.scores.map(s => ({
        type: s.questionType,
        score: s.score,
        maxScore: s.maxScore
      }))
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black mb-4 text-primary-700">Test Result</h1>
        <p className="text-gray-500 mb-6">Result ID: {resultId}</p>

        <div className="inline-block bg-primary-600 text-white p-6 rounded-2xl shadow-lg">
          <p className="text-sm uppercase font-bold opacity-80 mb-1">Overall Reading Score</p>
          <p className="text-5xl font-black">{resultData.overallScore}</p>
        </div>
      </div>

      <ScoreBreakdownTable result={breakdownData} />

      <div className="mt-10 text-center">
        <button onClick={() => window.location.reload()} className="bg-primary-600 text-white px-10 py-3 rounded font-bold uppercase shadow-md hover:bg-[#e67e00]">
          Return to Dashboard
        </button>
      </div>
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




function IntroScreen() {
  return (
    <div className=" bg-white px-10 py-8">
      {/* Content */}
      <div className="max-w-3xl">
        <h2 className="font-semibold mb-2">Test Introduction</h2>

        <p className="text-sm mb-6">
          This test measures the Reading skill in English that you will need in
          an academic setting.
        </p>

        {/* Bullet Points */}
        <ul className="text-sm space-y-4">
          <li>
            - The timer will be shown in the top right corner of your screen. The
            number of items in the section will also be displayed.
          </li>

          {/* Timer Mock */}
          <li className="flex items-center">
            <div className="bg-[#d4cdcb] flex items-center gap-4 px-4 py-2 rounded w-[260px]">
              <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white">
                ⏱
              </div>
              <span className="text-lg tracking-wider text-gray-800">
                00:02 / 00:55
              </span>
            </div>
          </li>

          <li>
            - By clicking on the Next button at the bottom of each screen you
            confirm your answer and move to the next question. If you click on
            Next you will not be able to return to the previous question. You
            will not be able to revisit any questions at the end of the test.
          </li>

          <li>
            - This test makes use of different varieties of English, for
            example, British, American, Australian. You can answer in the
            standard English variety of your choice.
          </li>
        </ul>
      </div>
    </div>
  );
}