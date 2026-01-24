import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import api from "../../../services/api";

// --- MAIN WRAPPER ---
export default function APEUniSpeakingMockTest({ backendData, onComplete, isFullMock, onExit }) {
  const [step, setStep] = useState(0); // 0: Overview, 1: Headset, 2: Mic, 3: Intro, 4: Exam, 5: Result
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flattenedQuestions, setFlattenedQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultId, setResultId] = useState(null);
  const [resultData, setResultData] = useState(null);

  // Global Section Timer: 31 Minutes
  const [globalTime, setGlobalTime] = useState(31 * 60);
  const answersRef = useRef([]); // To access current answers inside global timer callback

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!backendData) return;
    const sequence = [
      ...(backendData.readAloudQuestions || []).map((q) => ({ ...q, type: "READ_ALOUD", prepTime: 40, recTime: 40 })),
      ...(backendData.repeatSentenceQuestions || []).map((q) => ({ ...q, type: "REPEAT_SENTENCE", prepTime: 3, recTime: 15 })),
      ...(backendData.describeImageQuestions || []).map((q) => ({ ...q, type: "DESCRIBE_IMAGE", prepTime: 25, recTime: 40 })),
      ...(backendData.reTellLectureQuestions || []).map((q) => ({ ...q, type: "RE_TELL_LECTURE", prepTime: 10, recTime: 40 })),
      ...(backendData.summarizeSpokenTextQuestions || []).map((q) => ({ ...q, type: "SST", prepTime: 5, recTime: 60 })),
    ];
    setFlattenedQuestions(sequence);
  }, [backendData]);

  // --- GLOBAL TIMER LOGIC ---
  useEffect(() => {
    let timer;
    if (step === 4 && globalTime > 0) {
      timer = setInterval(() => {
        setGlobalTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            submitFinalMock(answersRef.current); // Auto-submit on timeout
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  const handleNextQuestion = (audioBlob) => {
    const payload = {
      questionId: flattenedQuestions[currentIdx]._id,
      type: flattenedQuestions[currentIdx].type,
      audio: audioBlob,
    };

    const updatedAnswers = [...answers, payload];
    setAnswers(updatedAnswers);
    answersRef.current = updatedAnswers; // Keep ref updated for timer

    if (currentIdx < flattenedQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      submitFinalMock(updatedAnswers);
    }
  };

  const submitFinalMock = async (finalAnswers) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // FULL MOCK MODE INTERCEPTION
    if (isFullMock && onComplete) {
      onComplete(finalAnswers);
      return; // Hand over control to parent
    }

    setStep(5);
    try {
      // Note: Speaking requires FormData to upload Blobs
      // NOTE: Temporarily sending JSON to match backend capability until multer is added to this route
      const payload = {
        speakingTestId: backendData._id,
        userId: user?._id,
        answers: finalAnswers.map(ans => ({
          questionId: ans.questionId,
          type: ans.type,
          transcript: "Audio recorded (Simulated Transcript)", // Placeholder
          audioUrl: null
        }))
      };

      const response = await api.post("/question/speaking/calculate-result", payload);
      if (response.data.success) {
        setResultId(response.data.data._id);
        setResultData(response.data.data);
      }
    } catch (err) {
      console.error("Submission failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (isSubmitting && step === 5) return <div className="p-20 text-center font-bold text-[#008199]">Uploading recordings and scoring...</div>;

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-sans select-none overflow-hidden">
      {/* HEADER */}
      <div className="bg-[#eeeeee] border-b border-gray-300">
        <div className="px-6 py-2 flex justify-between items-center text-sm font-bold text-gray-600">
          <span>Practice PTE Mock Test — Speaking Section</span>
          <button onClick={onExit} className="bg-white border px-3 py-1 rounded text-xs hover:bg-gray-100">Exit Test</button>
        </div>
        <div className="h-9 bg-[#008199] flex items-center justify-end px-6 space-x-6 text-white text-xs font-medium">
          {step === 4 && (
            <>
              <span className="bg-[#006b81] px-3 py-1 rounded">Question {currentIdx + 1} of {flattenedQuestions.length}</span>
              <span className={globalTime < 60 ? "text-red-300 animate-pulse" : ""}>Section Time: {formatTime(globalTime)}</span>
            </>
          )}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-grow flex flex-col overflow-y-auto bg-white border border-gray-200">
        {step === 0 && <OverviewScreen />}
        {step === 1 && <HeadsetCheckScreen />}
        {step === 2 && <MicCheckScreen />}
        {step === 3 && <IntroScreen />}
        {step === 4 && (
          flattenedQuestions.length > 0 ? (
            <SpeakingQuestionController
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

      {/* FOOTER NAVIGATION (For Steps 0-3 only) */}
      {step < 4 && (
        <div className="h-16 bg-[#eeeeee] border-t border-gray-300 flex items-center justify-end px-10">
          <button onClick={() => setStep(step + 1)} className="bg-[#fb8c00] text-white px-10 py-2 rounded-sm text-sm font-bold uppercase shadow-md hover:bg-[#e67e00]">
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/* ===================== SPEAKING QUESTION CONTROLLER ===================== */

function SpeakingQuestionController({ question, onNext }) {
  const [status, setStatus] = useState("PREPARING");
  const [timer, setTimer] = useState(question.prepTime);
  const [audioProgress, setAudioProgress] = useState(0);

  const phaseTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioObjRef = useRef(null);

  useEffect(() => {
    runPrepPhase();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    clearInterval(phaseTimerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioObjRef.current) { audioObjRef.current.pause(); audioObjRef.current = null; }
  };

  const runPrepPhase = () => {
    setStatus("PREPARING");
    let count = question.prepTime;
    setTimer(count);

    phaseTimerRef.current = setInterval(() => {
      count -= 1;
      setTimer(count);
      if (count <= 0) {
        clearInterval(phaseTimerRef.current);
        if (question.audioUrl && (question.type === "REPEAT_SENTENCE" || question.type === "RE_TELL_LECTURE")) {
          runPlayPhase();
        } else {
          runRecordPhase();
        }
      }
    }, 1000);
  };

  const runPlayPhase = () => {
    setStatus("PLAYING");
    const audio = new Audio(question.audioUrl);
    audioObjRef.current = audio;
    audio.play();
    audio.ontimeupdate = () => setAudioProgress((audio.currentTime / audio.duration) * 100);
    audio.onended = () => { setAudioProgress(100); runRecordPhase(); };
  };

  const runRecordPhase = async () => {
    setStatus("RECORDING");
    let count = 0;
    setTimer(count);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        setStatus("FINISHED");
        onNext(blob);
      };

      recorder.start();

      phaseTimerRef.current = setInterval(() => {
        count += 1;
        setTimer(count);
        if (count >= question.recTime) stopRecording();
      }, 1000);

    } catch (err) {
      alert("Mic Access Denied");
      onNext(null);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="w-full bg-white px-10 pt-10 pb-32">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-sm font-bold text-gray-400 uppercase mb-2">{question.type.replace("_", " ")}</h2>
        <p className="text-sm text-gray-700 mb-8 italic border-l-4 border-[#008199] pl-4">{getInstructionText(question.type)}</p>

        {question.text && <div className="text-xl leading-relaxed text-gray-800 bg-gray-50 p-8 rounded-lg border mb-10 shadow-inner">{question.text}</div>}
        {question.imageUrl && <div className="flex justify-center mb-10"><img src={question.imageUrl} className="max-h-72 border rounded-lg" alt="Describe" /></div>}

        <div className="bg-gray-50 p-8 rounded-2xl border border-dashed border-gray-300 flex flex-col items-center">
          <div className="flex items-center gap-8 w-full max-w-2xl">
            <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-xs
                    ${status === "RECORDING" ? "border-red-500 text-red-500 animate-pulse" : status === "PLAYING" ? "border-blue-500 text-blue-500" : "border-gray-400 text-gray-400"}`}>
              {status === "RECORDING" ? "REC" : status === "PLAYING" ? "PLAY" : "WAIT"}
            </div>

            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold uppercase mb-2 text-gray-400">
                <span>{status} PHASE</span>
                <span>{status === "RECORDING" ? `${timer}s / ${question.recTime}s` : `${timer}s left`}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-1000 ease-linear ${status === "RECORDING" ? "bg-red-500" : "bg-[#008199]"}`}
                  style={{ width: status === "RECORDING" ? `${(timer / question.recTime) * 100}%` : status === "PLAYING" ? `${audioProgress}%` : `${(timer / question.prepTime) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {status === "RECORDING" && (
            <button onClick={stopRecording} className="mt-8 bg-[#fb8c00] text-white px-12 py-2 rounded-sm text-sm font-bold uppercase shadow-md">
              Finish Recording & Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== STATIC HELPERS ===================== */

function getInstructionText(type) {
  const map = {
    READ_ALOUD: "Look at the text below. In 40 seconds, you must read this text aloud as naturally and clearly as possible.",
    REPEAT_SENTENCE: "You will hear a sentence. Please repeat the sentence exactly as you hear it.",
    DESCRIBE_IMAGE: "Look at the image below. In 25 seconds, please speak into the microphone and describe in detail what the image is showing.",
    RE_TELL_LECTURE: "You will hear a lecture. After listening to the lecture, please retell what you have heard in your own words.",
    SST: "Summarize the spoken text in your own words."
  };
  return map[type] || "Follow the on-screen instructions.";
}

// Add import at the top
import ScoreBreakdownTable from "../FullMockTest/ScoreBreakdownTable";

function ResultScreen({ resultId, resultData }) {
  if (!resultData) return <div className="p-20 text-center">Loading Result...</div>;

  const breakdownData = {
    speaking: {
      answers: resultData.scores.map(s => ({
        type: s.questionType,
        score: s.score,
        maxScore: s.maxScore || 90
      }))
    }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-[#008199] mb-4">Speaking Test Result</h1>
        <div className="inline-block bg-[#008199] text-white p-6 rounded-2xl shadow-lg">
          <p className="text-sm uppercase font-bold opacity-80 mb-1">Overall Score</p>
          <p className="text-5xl font-black">{resultData.overallScore}</p>
        </div>
      </div>

      {/* Detailed Table */}
      <ScoreBreakdownTable result={breakdownData} />

      <div className="mt-8 text-center">
        <button onClick={() => window.location.reload()} className="bg-[#fb8c00] text-white px-10 py-3 rounded font-bold uppercase shadow-md">
          Return to dashboard
        </button>
      </div>
    </div>
  );
}

// Reuse HeadsetCheckScreen, MicCheckScreen, IntroScreen from your existing code.


// --- HARDWARE / INTRO SCREENS ---
function OverviewScreen() {
  return (
    <div className="max-w-4xl">
      <h2 className="text-lg font-bold mb-6">The test is approximately 31 minutes long.</h2>
      <table className="border-collapse border border-gray-400 w-full max-w-sm text-xs">
        <thead><tr className="bg-gray-100"><th className="border border-gray-400 p-2">Part</th><th className="border border-gray-400 p-2">Content</th><th>Time Allowed</th></tr></thead>
        <tbody>
          {["Read Aloud", "Repeat Sentence", "Describe Image", "Re-tell Lecture", "Summarize Spoken Text"].map((item, idx) => (
            <tr key={idx}><td className="border border-gray-400 p-2 text-center">{idx === 0 ? "Part 1" : ""}</td><td className="border border-gray-400 p-2">{item}</td><td>{idx === 2 ? " 31 Minutes" : ""}</td></tr>
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
