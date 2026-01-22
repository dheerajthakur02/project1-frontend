import React, { useState, useEffect, useRef } from "react";

// --- MAIN WRAPPER ---
export default function APEUniMockTest({ backendData }) {
  const [step, setStep] = useState(0); // 0: Overview, 1: Headset, 2: Mic, 3: Intro, 4: Exam, 5: Result
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flattenedQuestions, setFlattenedQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]); // Stores audio blobs/text

  useEffect(() => {
    if (!backendData) return;
    const sequence = [
      ...(backendData.readAloudQuestions || []).map((q) => ({ ...q, type: "READ_ALOUD", prepTime: 40, recTime: 40 })),
      ...(backendData.repeatSentenceQuestions || []).map((q) => ({ ...q, type: "REPEAT_SENTENCE", prepTime: 3, recTime: 15 })),
      ...(backendData.describeImageQuestions || []).map((q) => ({ ...q, type: "DESCRIBE_IMAGE", prepTime: 25, recTime: 40 })),
      ...(backendData.reTellLectureQuestions || []).map((q) => ({ ...q, type: "RE_TELL_LECTURE", prepTime: 10, recTime: 40 })),
      ...(backendData.summarizeSpokenTextQuestions || []).map((q) => ({ ...q, type: "SST", prepTime: 5, recTime: 600 })),
    ];
    setFlattenedQuestions(sequence);
  }, [backendData]);

  // Inside APEUniMockTest component
const [testResult, setTestResult] = useState(null);
const [isLoadingResult, setIsLoadingResult] = useState(false);

const handleNextQuestion = async (answerData) => {
  const updatedAnswers = [...userAnswers, { questionId: flattenedQuestions[currentIdx]._id, ...answerData }];
  setUserAnswers(updatedAnswers);

  if (currentIdx < flattenedQuestions.length - 1) {
    setCurrentIdx((prev) => prev + 1);
  } else {
    // TEST ENDED -> Trigger Calculation
    setStep(5);
    setIsLoadingResult(true);
    try {
      const response = await fetch("/api/speaking/calculate-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "USER_ID_HERE", // Replace with real Auth User ID
          speakingTestId: backendData._id,
          answers: updatedAnswers,
        }),
      });
      const result = await response.json();
      setTestResult(result.data);
    } catch (err) {
      console.error("Failed to fetch results", err);
    } finally {
      setIsLoadingResult(false);
    }
  }
};

  if (!backendData || (flattenedQuestions.length === 0 && step !== 5)) {
    return <div className="p-10 font-bold text-center text-gray-500">Loading Test Data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-sans select-none overflow-hidden">
      {/* Pearson Style Header */}
      <div className="bg-[#eeeeee] border-b border-gray-300">
        <div className="px-6 py-2 flex justify-between items-center text-sm font-bold text-gray-600">
          <span>APEUni PTE Mock Test - {backendData.title || "Speaking Section"}</span>
          <button className="bg-white border border-gray-400 px-3 py-1 rounded text-xs hover:bg-gray-100">Exit Test</button>
        </div>
        <div className="h-9 bg-[#008199] flex items-center justify-end px-6 space-x-6 text-white text-xs font-medium">
          {step === 4 && (
            <>
              <span className="bg-[#006b81] px-3 py-1 rounded">Question {currentIdx + 1} of {flattenedQuestions.length}</span>
              <span>Time Remaining: 30:00</span>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-y-auto bg-white w-full shadow-sm border border-gray-200">
        {step === 0 && <OverviewScreen />}
        {step === 1 && <HeadsetCheckScreen />}
        {step === 2 && <MicCheckScreen />}
        {step === 3 && <IntroScreen />}
        {step === 4 && (
          <QuestionController 
            key={flattenedQuestions[currentIdx]._id}
            question={flattenedQuestions[currentIdx]} 
            onNext={handleNextQuestion} 
          />
        )}
        {step === 5 && <ResultScreen questions={flattenedQuestions} answers={userAnswers} />}
      </div>

      {/* Footer Navigation */}
      <div className="h-16 bg-[#eeeeee] border-t border-gray-300 flex items-center justify-between px-10">
        <div className="text-gray-500 text-xs">PTE Academic Official Practice</div>
        {step < 4 && (
          <button 
            onClick={() => setStep(step + 1)} 
            className="bg-[#fb8c00] text-white px-10 py-2 rounded-sm text-sm font-bold shadow-md hover:bg-[#e67e00] uppercase tracking-wide"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}



function QuestionController({ question, onNext }) {
  const [status, setStatus] = useState("PREPARING");
  const [timeLeft, setTimeLeft] = useState(question.prepTime);
  const [recordedBlob, setRecordedBlob] = useState(null);

  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const hasSubmittedRef = useRef(false);

  /* ===================== LIFECYCLE ===================== */

  useEffect(() => {
    startTimer();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (hasSubmittedRef.current) return;

    clearInterval(timerRef.current);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  /* ===================== TIMER ===================== */

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handlePhaseTransition();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /* ===================== PHASE LOGIC ===================== */

  const handlePhaseTransition = () => {
    if (status === "PREPARING") {
      if (
        question.audioUrl &&
        (question.type === "REPEAT_SENTENCE" ||
          question.type === "RE_TELL_LECTURE")
      ) {
        playAudio();
      } else {
        startRecording();
      }
    } else if (status === "RECORDING") {
      stopRecording();
    }
  };

  /* ===================== AUDIO ===================== */

  const playAudio = () => {
    setStatus("PLAYING");

    const audio = new Audio(question.audioUrl);
    audioRef.current = audio;

    audio.play();
    audio.onended = () => startRecording();
  };

  /* ===================== RECORDING ===================== */

  const startRecording = async () => {
    setStatus("RECORDING");
    setTimeLeft(question.recTime);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks = [];

      recorder.ondataavailable = e => chunks.push(e.data);

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        setRecordedBlob(blob);
        setStatus("FINISHED");
      };

      recorder.start();
      startTimer();
    } catch (err) {
      console.error("Microphone permission denied", err);
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  /* ===================== UI ===================== */

  return (
    <div className="w-full min-h-screen bg-white px-6 pt-8">
      <div className="max-w-5xl mx-auto">

        {/* Instruction */}
        <p className="text-sm text-gray-800 mb-6">
          {getInstructionText(question.type)}
        </p>

        {/* ===== AUDIO PLAYER ===== */}
        {(question.type === "REPEAT_SENTENCE" ||
          question.type === "RE_TELL_LECTURE") && (
          <div className="bg-[#4aa3c2] p-5 rounded-md w-[420px] mx-auto mb-6">
            <div className="flex items-center gap-3">
              <span className="text-white text-xl">▶</span>
              <div className="flex-1 bg-white h-3 rounded" />
            </div>
            <div className="flex justify-between text-xs text-white mt-2">
              <span>
                {status === "PREPARING" && `Beginning in ${timeLeft}s`}
              </span>
              <span>🔊</span>
            </div>
          </div>
        )}

        {/* ===== READ ALOUD ===== */}
        {question.type === "READ_ALOUD" && (
          <div className="text-center text-lg leading-relaxed text-gray-800 mb-12">
            {question.text}
          </div>
        )}

        {/* ===== RECORDING BAR ===== */}
        {question.type !== "WRITE_SUMMARY" && (
          <div className="flex items-center justify-center gap-4 mt-10">

            {/* Mic Button */}
            <div
              onClick={() => {
                if (status === "RECORDING") stopRecording();
              }}
              className={`w-14 h-14 rounded-full border-4 flex items-center justify-center
              ${status === "RECORDING"
                ? "border-red-500 cursor-pointer"
                : "border-gray-400 cursor-not-allowed"}`}
            >
              <div
                className={`w-5 h-5 rounded-full
                ${status === "RECORDING"
                  ? "bg-red-500"
                  : "bg-gray-400"}`}
              />
            </div>

            {/* Status + Wave */}
            <div>
              <p className="text-sm text-gray-600">
                {status === "RECORDING" ? "Recording" : ""}
              </p>
              <div className="flex gap-1 mt-1">
                {[...Array(25)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded ${
                      status === "RECORDING"
                        ? "bg-blue-500 h-4 animate-pulse"
                        : "bg-gray-300 h-2"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            <span className="text-sm text-gray-500 ml-4">
              00:{String(timeLeft).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>

      {/* ===== NEXT BUTTON ===== */}
      {status === "FINISHED" && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50">
          <div className="px-6 py-3 flex justify-end">
            <button
              onClick={() => {
                if (!recordedBlob) return;

                hasSubmittedRef.current = true;
                cleanup();
                onNext({ audio: recordedBlob });
              }}
              className="bg-[#3fa9c4] text-white px-6 py-1 rounded-full text-sm shadow"
            >
              NEXT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


/* ===================== HELPERS ===================== */

function getInstructionText(type) {
  switch (type) {
    case "READ_ALOUD":
      return "Look at the text below. In 40 seconds, you must read this text aloud.";
    case "REPEAT_SENTENCE":
      return "You will hear a sentence. Repeat the sentence exactly.";
    case "RE_TELL_LECTURE":
      return "You will hear a lecture. Retell what you hear.";
    default:
      return "";
  }
}


// --- RESULTS SCREEN ---
function ResultScreen({ testResult, isLoadingResult }) {
  // 1. Loading State (Showing a professional PTE-style loader)
  if (isLoadingResult) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] w-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#008199] mb-4"></div>
        <h2 className="text-xl font-bold text-gray-700">Analyzing your performance...</h2>
        <p className="text-gray-500">Our AI is scoring your fluency and pronunciation.</p>
      </div>
    );
  }

  // 2. Error State
  if (!testResult) {
    return <div className="p-10 text-center">No result data found. Please try again.</div>;
  }

  return (
    <div className="p-10 w-full animate-fadeIn">
      <div className="flex justify-between items-end mb-8 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Speaking Scorecard</h1>
          <p className="text-gray-500 uppercase text-xs font-bold tracking-widest mt-1">PTE Academic Mock Test Result</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 font-bold uppercase">Test Date</p>
          <p className="font-bold text-gray-700">{new Date(testResult.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <ScoreCard label="Overall Score" score={testResult.overallScore} color="bg-gray-800" />
        <ScoreCard label="Oral Fluency" score={testResult.sectionScores.fluency} color="bg-[#008199]" />
        <ScoreCard label="Pronunciation" score={testResult.sectionScores.pronunciation} color="bg-[#fb8c00]" />
        <ScoreCard label="Content" score={testResult.sectionScores.content} color="bg-teal-600" />
      </div>

      <h3 className="font-bold text-lg mb-4 text-gray-700 border-l-4 border-[#fb8c00] pl-3">Detailed Question Analysis</h3>
      
      <div className="space-y-3">
        {testResult.detailedAnalysis.map((item, idx) => (
          <div key={idx} className="border border-gray-200 p-5 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">
                    Q{idx + 1} • {item.type.replace("_", " ")}
                  </span>
                  <div className="flex text-orange-400 text-xs">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>{i < Math.round(item.score / 20) ? "★" : "☆"}</span>
                    ))}
                  </div>
                </div>
                {/* Transcript - This mimics APEUni's result look */}
                <div className="bg-gray-50 p-3 rounded border border-dashed border-gray-300">
                   <p className="text-xs text-gray-400 uppercase font-bold mb-1">Your Transcript:</p>
                   <p className="text-sm text-gray-700 italic">"{item.userTranscript || "No speech detected"}"</p>
                </div>
              </div>

              <div className="ml-8 text-center flex flex-col justify-center bg-gray-50 px-4 py-2 rounded border">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Score</span>
                <span className="text-2xl font-black text-[#008199]">{item.score}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-10 flex space-x-4">
        <button 
          onClick={() => window.location.reload()}
          className="bg-gray-800 text-white px-8 py-3 rounded text-sm font-bold hover:bg-black transition-colors shadow-lg"
        >
          RETAKE TEST
        </button>
        <button className="border border-gray-300 text-gray-600 px-8 py-3 rounded text-sm font-bold hover:bg-gray-50 transition-colors">
          DOWNLOAD PDF REPORT
        </button>
      </div>
    </div>
  );
}

// Sub-component for the score circles/boxes
function ScoreCard({ label, score, color }) {
  return (
    <div className={`${color} text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform`}>
      <div className="text-[10px] uppercase font-bold opacity-70 tracking-widest mb-1">{label}</div>
      <div className="flex items-baseline space-x-1">
        <span className="text-5xl font-black">{score}</span>
        <span className="text-sm opacity-50">/ 90</span>
      </div>
      {/* Progress mini-bar */}
      <div className="w-full bg-white/20 h-1.5 mt-4 rounded-full overflow-hidden">
        <div className="bg-white h-full" style={{ width: `${(score / 90) * 100}%` }}></div>
      </div>
    </div>
  );
}

// --- UTILS & HARDWARE SCREENS (Omitted for brevity, use your existing ones) ---
// function getInstructionText(type) {
//   const map = {
//     READ_ALOUD: "Look at the text below. In 40 seconds, you must read this text aloud as naturally and clearly as possible. You have 40 seconds to read aloud.",
//     REPEAT_SENTENCE: "You will hear a sentence. Please repeat the sentence exactly as you hear it. You will hear the sentence only once.",
//     DESCRIBE_IMAGE: "Look at the image below. In 25 seconds, please speak into the microphone and describe in detail what the image is showing. You will have 40 seconds to give your response.",
//     RE_TELL_LECTURE: "You will hear a lecture. After listening to the lecture, in 10 seconds, please retell what you have just heard from the lecture in your own words. You will have 40 seconds to give your response.",
//   };
//   return map[type] || "Please follow the instructions on the screen.";
// }


// --- HARDWARE / INTRO SCREENS ---
function OverviewScreen() {
  return (
    <div className="max-w-4xl">
      <h2 className="text-lg font-bold mb-6">The test is approximately 31 minutes long.</h2>
      <table className="border-collapse border border-gray-400 w-full max-w-sm text-xs">
        <thead><tr className="bg-gray-100"><th className="border border-gray-400 p-2">Part</th><th className="border border-gray-400 p-2">Content</th></tr></thead>
        <tbody>
          {["Read Aloud", "Repeat Sentence", "Describe Image", "Re-tell Lecture", "Summarize Spoken Text"].map((item, idx) => (
            <tr key={idx}><td className="border border-gray-400 p-2 text-center">{idx === 0 ? "Part 1" : ""}</td><td className="border border-gray-400 p-2">{item}</td></tr>
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
              className={`w-10 h-10 rounded-full border-4 flex items-center justify-center ${
                recording ? "border-red-500" : "border-gray-400"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  recording ? "bg-red-500 animate-pulse" : "bg-gray-400"
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
          This test measures the Speaking skill in English that you will need in
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


// // --- UTILS ---
// function getInstructionText(type, prep, rec) {
//   const map = {
//     READ_ALOUD: `Read the text aloud naturally. Prep: ${prep}s | Rec: ${rec}s`,
//     DESCRIBE_IMAGE: `Describe the image shown. Prep: ${prep}s | Rec: ${rec}s`,
//     REPEAT_SENTENCE: `Repeat the sentence exactly as you hear it.`,
//     RE_TELL_LECTURE: `Re-tell the lecture in your own words.`,
//     HIW: `Click words that differ from the audio.`,
//     SST: `Summarize the spoken text (50-70 words).`
//   };
//   return map[type] || "Follow the on-screen instructions.";
// }