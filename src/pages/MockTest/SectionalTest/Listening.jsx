import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import api from "../../../services/api";
import ScoreBreakdownTable from "../FullMockTest/ScoreBreakdownTable";

// --- MAIN WRAPPER ---
export default function APEUniListeningTest({ backendData, onComplete, isFullMock, onExit }) {
  const [step, setStep] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flattenedQuestions, setFlattenedQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [resultId, setResultId] = useState(null);

  // Import logic needs to be top of file, doing it via separate call or assuming it works if I find top line. 
  // I will just add the state here.

  // Global Section Timer: 25 Minutes
  const [globalTime, setGlobalTime] = useState(50 * 60);
  const answersRef = useRef([]); // To access current answers in timer callback

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!backendData) return;
    const sequence = [
      ...(backendData.summarizeSpokenTextQuestions || []).map(q => ({ ...q, type: "SST" })),
      ...(backendData.multipleChoiceMultiple || []).map(q => ({ ...q, type: "MCMA" })),
      ...(backendData.fillInTheBlanks || []).map(q => ({ ...q, type: "FIB_L" })),
      ...(backendData.highlightIncorrectSummary || []).map(q => ({ ...q, type: "HCS" })),
      ...(backendData.multipleChoiceSingle || []).map(q => ({ ...q, type: "MCS" })),
      ...(backendData.selectMissingWord || []).map(q => ({ ...q, type: "SMW" })),
      ...(backendData.highLightIncorrectWords || []).map(q => ({ ...q, type: "HIW" })),
      ...(backendData.writeFromDictation || []).map(q => ({ ...q, type: "WFD" })),
      ...(backendData.answerShortQuestion || []).map(q => ({ ...q, type: "ASQ" })),
    ];
    setFlattenedQuestions(sequence);
  }, [backendData]);

  // Global Timer Logic
  useEffect(() => {
    let interval;
    if (step === 4 && globalTime > 0) {
      interval = setInterval(() => {
        setGlobalTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            submitFullMockTest(answersRef.current); // Auto-submit on timeout
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleNextQuestion = (answerData) => {
    const payload = {
      questionId: flattenedQuestions[currentIdx]._id,
      type: flattenedQuestions[currentIdx].type,
      answer: answerData,
    };

    const updatedAnswers = [...answers, payload];
    setAnswers(updatedAnswers);
    answersRef.current = updatedAnswers; // Sync ref

    if (currentIdx < flattenedQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      submitFullMockTest(updatedAnswers);
    }
  };

  const submitFullMockTest = async (finalAnswers) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (isFullMock && onComplete) {
      onComplete(finalAnswers);
      return;
    }

    try {
      const response = await api.post("/question/listening/result", {
        listeningId: backendData._id,
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

  if (isSubmitting) return <div className="p-20 text-center font-bold text-primary-700">Analysing your results...</div>;

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-sans select-none overflow-hidden">
      <div className="bg-[#eeeeee] border-b border-gray-300">
        <div className="px-6 py-2 flex justify-between items-center text-sm font-bold text-gray-600">
          <span>Pawan PTE Mock Test - {backendData.title || "Listening"}</span>
          <button onClick={onExit} className="bg-white border border-gray-400 px-3 py-1 rounded text-xs hover:bg-gray-100">Exit Test</button>
        </div>
        <div className="h-9 bg-slate-900 flex items-center justify-end px-6 space-x-6 text-white text-xs font-medium">
          {step === 4 && (
            <>
              <span className="bg-[#006b81] px-3 py-1 rounded">Question {currentIdx + 1} of {flattenedQuestions.length}</span>
              <span className={globalTime < 60 ? "text-red-300 animate-pulse" : ""}>Section Time: {formatGlobalTime(globalTime)}</span>
            </>
          )}
        </div>

        <div className="flex-grow flex flex-col overflow-y-auto bg-white w-full shadow-sm border border-gray-200">
          {step === 0 && <OverviewScreen />}
          {step === 1 && <HeadsetCheckScreen />}
          {step === 2 && <MicCheckScreen />}
          {step === 3 && <IntroScreen />}
          {step === 4 && (
            flattenedQuestions.length > 0 ? (
              <ListeningQuestionController
                key={flattenedQuestions[currentIdx]._id}
                question={flattenedQuestions[currentIdx]}
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
          {step === 5 && <ResultScreen resultId={resultId} resultData={resultData} />}
        </div>

        {step < 4 && (
          <div className="h-16 bg-[#eeeeee] border-t border-gray-300 flex items-center justify-end px-10">
            <button onClick={() => setStep(step + 1)} className="bg-primary-600 text-white px-10 py-2 rounded-sm text-sm font-bold uppercase">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== LISTENING QUESTION CONTROLLER ===================== */

function ListeningQuestionController({ question, onNext }) {
  const [status, setStatus] = useState("PREPARING");
  const [prepTime, setPrepTime] = useState(3);
  const [audioProgress, setAudioProgress] = useState(0); // 0 to 100
  const [answer, setAnswer] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    let timer;
    if (status === "PREPARING" && prepTime > 0) {
      timer = setInterval(() => setPrepTime(prev => prev - 1), 1000);
    } else if (status === "PREPARING" && prepTime === 0) {
      startAudio();
    }
    return () => clearInterval(timer);
  }, [status, prepTime]);

  const startAudio = () => {
    setStatus("PLAYING");
    audioRef.current = new Audio(question.audioUrl);

    // Track Audio Progress
    audioRef.current.ontimeupdate = (e) => {
      if (!audioRef.current) return;
      const prog = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(prog || 0);
    };

    audioRef.current.play();
    audioRef.current.onended = () => {
      setStatus("FINISHED");
      setAudioProgress(100);
    };
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const renderQuestionUI = () => {
    switch (question.type) {
      case "SST":
        return (
          <div className="mt-6">
            <textarea
              className="w-full h-48 border-2 p-4 text-sm focus:outline-none focus:border-primary-500 rounded"
              placeholder="Write summary (50-70 words)..."
              onChange={(e) => setAnswer(e.target.value)}
            />
          </div>
        );
      case "HIW":
        const words = (question.content || "").split(" ");
        return (
          <div className="mt-6 leading-loose text-lg">
            {words.map((word, i) => (
              <span
                key={i}
                onClick={() => {
                  const current = Array.isArray(answer) ? answer : [];
                  setAnswer(current.includes(word) ? current.filter(w => w !== word) : [...current, word]);
                }}
                className={`cursor-pointer px-1 rounded ${(answer || []).includes(word) ? "bg-yellow-300" : "hover:bg-gray-100"}`}
              >
                {word}{" "}
              </span>
            ))}
          </div>
        );
      case "FIB_L":
        const parts = (question.transcript || "").split("__");
        return (
          <div className="mt-6 leading-loose text-lg text-gray-700">
            {parts.map((part, i) => (
              <React.Fragment key={i}>
                {part}
                {i < parts.length - 1 && (
                  <input
                    type="text"
                    className="border-b-2 border-gray-400 w-32 mx-1 px-2 focus:outline-none focus:border-primary-500 text-center"
                    onChange={(e) => {
                      const current = answer || {};
                      setAnswer({ ...current, [i]: e.target.value });
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        );
      case "MCMA":
      case "MCS":
        return (
          <div className="mt-6 space-y-3">
            <p className="font-bold text-gray-700 mb-4">{question.question}</p>
            {question.options?.map((opt, i) => (
              <label key={i} className="flex items-center space-x-3 p-4 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type={question.type === "MCMA" ? "checkbox" : "radio"}
                  name="listening-opt"
                  onChange={() => setAnswer(opt)}
                />
                <span className="text-sm">{typeof opt === 'string' ? opt : opt.text}</span>
              </label>
            ))}
          </div>
        );
      case "WFD":
      case "ASQ":
        return (
          <div className="mt-10">
            <input
              type="text"
              className="w-full border-b-2 border-gray-300 p-2 focus:outline-none focus:border-primary-500 text-xl"
              placeholder={question.type === "ASQ" ? "Type your short answer..." : "Type the sentence here..."}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </div>
        );
      case "HCS":
      case "SMW":
        return (
          <div className="mt-6 space-y-3">
            <p className="font-bold text-gray-700 mb-4">{question.question}</p>
            {question.options?.map((opt, i) => (
              <label key={i} className="flex items-center space-x-3 p-4 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="listening-opt"
                  onChange={() => setAnswer(opt)}
                />
                <span className="text-sm">{typeof opt === 'string' ? opt : opt.text}</span>
              </label>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="w-full bg-white px-10 pt-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-sm font-bold text-gray-400 uppercase mb-2">{getTaskTitle(question.type)}</h2>
        <p className="text-sm text-gray-700 mb-8 italic border-l-4 border-[#008199] pl-4">{getInstructionText(question.type)}</p>

        {/* DYNAMIC AUDIO PROGRESS BAR */}
        <div className="bg-slate-800 p-5 rounded-lg w-full mb-10 shadow-md">
          <div className="flex items-center gap-6">
            <div className="text-2xl text-white">
              {status === "PREPARING" ? "⏳" : status === "PLAYING" ? "🔊" : "✅"}
            </div>
            <div className="flex-1 bg-white/30 h-3 rounded-full overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-100 ease-linear"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
            <span className="text-white text-sm font-bold min-w-[110px] text-right">
              {status === "PREPARING" ? `Starts in ${prepTime}s` : status === "PLAYING" ? "Playing..." : "Completed"}
            </span>
          </div>
        </div>

        {renderQuestionUI()}

        <div className="fixed bottom-0 left-0 w-full bg-[#eeeeee] border-t border-gray-300 z-50">
          <div className="px-10 py-3 flex justify-end">
            <button onClick={() => onNext(answer)} className="bg-primary-600 text-white px-12 py-2 rounded-sm text-sm font-bold uppercase shadow-md hover:bg-[#e67e00]">
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== STATIC HELPERS ===================== */

function getTaskTitle(type) {
  const map = {
    SST: "Summarize Spoken Text",
    MCMA: "Multiple Choice (Multiple)",
    FIB_L: "Fill in the Blanks",
    HIW: "Highlight Incorrect Words",
    WFD: "Write from Dictation",
    HCS: "Highlight Correct Summary",
    SMW: "Select Missing Word",
    ASQ: "Answer Short Question",
    MCS: "Multiple Choice (Single)"
  };
  return map[type] || "Listening Task";
}

function getInstructionText(type) {
  switch (type) {
    case "WFD": return "Type the sentence exactly as you hear it.";
    case "HIW": return "Click on the words in the transcript that differ from the audio.";
    default: return "Listen to the audio and answer the question.";
  }
}

// Import at top (assumed done in next edit or implicitly if I do full file replacement, but here I do chunks)

function ResultScreen({ resultId, resultData }) {
  if (!resultData) return <div className="p-20 text-center">Loading...</div>;

  const breakdownData = {
    listening: {
      answers: resultData.scores.map(s => ({ type: s.questionType, score: s.score, maxScore: s.maxScore }))
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-primary-700 mb-4">Listening Test Result</h1>
        <div className="inline-block bg-primary-600 text-white p-6 rounded-2xl shadow-lg">
          <p className="text-sm uppercase font-bold opacity-80 mb-1">Overall Score</p>
          <p className="text-5xl font-black">{resultData.overallScore}</p>
        </div>
      </div>
      <ScoreBreakdownTable result={breakdownData} />

      <div className="mt-8 text-center">
        <button onClick={() => window.location.reload()} className="bg-primary-600 text-white px-8 py-2 font-bold uppercase rounded">Return to Dashboard</button>
      </div>
    </div>
  );
}

/* ===================== HARDWARE & INTRO SCREENS (REUSED) ===================== */

function OverviewScreen() {
  return (
    <div className="p-10 max-w-4xl">
      <h2 className="text-2xl font-bold mb-4">The test is approximately 50 minutes long.</h2>
      <table className="border-collapse border border-gray-300 w-full text-sm">
        <thead><tr className="bg-gray-100"><th className="border p-2 text-left">Task Type</th><th className="border p-2 text-left">Time Allowed</th></tr></thead>
        <tbody>
          {["Summarize Spoken Text", "Multiple Choice", "Fill in the Blanks", "Highlight Correct Summary", "Select Missing Word", "Highlight Incorrect Words", "Write from Dictation"].map((item, idx) => (
            <tr key={idx}><td className="border p-2">{item}</td><td className="border p-2">{idx === 3 ? " 50 Minutes" : ""}</td></tr>
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




function IntroScreen() {
  return (
    <div className=" bg-white px-10 py-8">
      {/* Content */}
      <div className="max-w-3xl">
        <h2 className="font-semibold mb-2">Test Introduction</h2>

        <p className="text-sm mb-6">
          This test measures the Listening skill in English that you will need in
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



/* ===================== RESULT SCREEN ===================== */

// function ResultScreen({ testResult, isLoadingResult }) {
//     if (isLoadingResult) return (
//         <div className="flex flex-col items-center justify-center h-full py-20">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
//             <p className="mt-4 font-bold text-gray-600">Calculating your listening score...</p>
//         </div>
//     );

//     return (
//         <div className="p-10">
//             <h1 className="text-3xl font-black mb-6">Test Results</h1>
//             <div className="grid grid-cols-3 gap-6">
//                 <div className="bg-cyan-600 text-white p-6 rounded-lg">
//                     <p className="text-xs uppercase opacity-70">Listening Score</p>
//                     <p className="text-4xl font-bold">78 / 90</p>
//                 </div>
//                 <div className="bg-gray-800 text-white p-6 rounded-lg">
//                     <p className="text-xs uppercase opacity-70">Task Completion</p>
//                     <p className="text-4xl font-bold">100%</p>
//                 </div>
//             </div>
//             <p className="mt-10 text-gray-500 italic">Detailed feedback is available in your student dashboard.</p>
//             <button onClick={() => window.location.reload()} className="mt-6 bg-[#fb8c00] text-white px-10 py-2 rounded font-bold">RETAKE PRACTICE</button>
//         </div>
//     );
// }