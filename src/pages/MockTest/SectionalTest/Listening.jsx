import React, { useState, useEffect, useRef } from "react";

// --- MAIN WRAPPER ---
export default function APEUniListeningTest({ backendData }) {
  const [step, setStep] = useState(0); // 0: Overview, 1: Headset, 2: Mic, 3: Intro, 4: Exam, 5: Result
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flattenedQuestions, setFlattenedQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({}); // Stores answers keyed by question ID

  useEffect(() => {
    if (!backendData) return;

    // Flattening all listening types from your specific JSON structure
    const sequence = [
      ...(backendData.summarizeSpokenTextQuestions || []).map(q => ({ ...q, type: "SST", limit: 70 })),
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

  const [testResult, setTestResult] = useState(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  const handleNextQuestion = (answerData) => {
    const updatedAnswers = { ...userAnswers, [flattenedQuestions[currentIdx]._id]: answerData };
    setUserAnswers(updatedAnswers);

    if (currentIdx < flattenedQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      submitTest(updatedAnswers);
    }
  };

  const submitTest = async (finalAnswers) => {
    setStep(5);
    setIsLoadingResult(true);
    try {
      // Mock API call
      const response = await fetch("/api/listening/calculate-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: backendData._id,
          answers: finalAnswers,
        }),
      });
      const result = await response.json();
      setTestResult(result.data);
    } catch (err) {
      console.error("Failed to fetch results", err);
    } finally {
      setIsLoadingResult(false);
    }
  };

  if (!backendData || (flattenedQuestions.length === 0 && step !== 5)) {
    return <div className="p-10 font-bold text-center text-gray-500">Loading Listening Test Data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-sans select-none overflow-hidden">
      {/* Pearson Style Header */}
      <div className="bg-[#eeeeee] border-b border-gray-300">
        <div className="px-6 py-2 flex justify-between items-center text-sm font-bold text-gray-600">
          <span>APEUni PTE Mock Test - {backendData.title || "Listening Section"}</span>
          <button className="bg-white border border-gray-400 px-3 py-1 rounded text-xs hover:bg-gray-100">Exit Test</button>
        </div>
        <div className="h-9 bg-[#008199] flex items-center justify-end px-6 space-x-6 text-white text-xs font-medium">
          {step === 4 && (
            <>
              <span className="bg-[#006b81] px-3 py-1 rounded">Question {currentIdx + 1} of {flattenedQuestions.length}</span>
              <span>Time Remaining: 25:00</span>
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
          <ListeningQuestionController 
            key={flattenedQuestions[currentIdx]._id}
            question={flattenedQuestions[currentIdx]} 
            onNext={handleNextQuestion} 
          />
        )}
        {step === 5 && <ResultScreen testResult={testResult} isLoadingResult={isLoadingResult} />}
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

/* ===================== LISTENING QUESTION CONTROLLER ===================== */

function ListeningQuestionController({ question, onNext }) {
  const [status, setStatus] = useState("PREPARING"); // PREPARING, PLAYING, FINISHED
  const [timeLeft, setTimeLeft] = useState(3); 
  const [answer, setAnswer] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    let timer;
    if (status === "PREPARING" && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (status === "PREPARING" && timeLeft === 0) {
      startAudio();
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const startAudio = () => {
    setStatus("PLAYING");
    audioRef.current = new Audio(question.audioUrl);
    audioRef.current.play();
    audioRef.current.onended = () => setStatus("FINISHED");
  };

  // UI Helpers for different task types
  const renderQuestionUI = () => {
    switch (question.type) {
      case "SST":
        return (
          <div className="mt-6">
            <textarea 
              className="w-full h-48 border p-4 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Write your summary here (50-70 words)..."
              onChange={(e) => setAnswer(e.target.value)}
            />
            <p className="text-xs mt-2 text-gray-500">Word Count: {answer?.split(/\s+/).filter(x => x).length || 0}</p>
          </div>
        );

      case "HIW":
        const words = question.content.split(" ");
        return (
          <div className="mt-6 leading-loose text-gray-800">
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
        const parts = question.transcript.split("__");
        return (
          <div className="mt-6 leading-loose">
            {parts.map((part, i) => (
              <React.Fragment key={i}>
                {part}
                {i < parts.length - 1 && (
                  <input 
                    type="text" 
                    className="border-b border-gray-400 w-32 mx-1 px-1 focus:outline-none focus:border-cyan-500" 
                    onChange={(e) => {
                        const current = answer || {};
                        setAnswer({...current, [i]: e.target.value});
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        );

      case "MCMA":
      case "MCS":
      case "HCS":
      case "SMW":
        return (
          <div className="mt-6 space-y-3">
            <p className="font-bold text-gray-700">{question.question}</p>
            {question.options.map((opt, i) => {
                const label = typeof opt === 'string' ? opt : opt.text || opt.content;
                return (
                    <label key={i} className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                        <input 
                          type={question.type === "MCMA" ? "checkbox" : "radio"} 
                          name="listening-opt"
                          className="w-4 h-4 text-cyan-600"
                          onChange={() => {
                            if(question.type === "MCMA") {
                                const current = Array.isArray(answer) ? answer : [];
                                setAnswer(current.includes(label) ? current.filter(l => l !== label) : [...current, label]);
                            } else {
                                setAnswer(label);
                            }
                          }}
                        />
                        <span className="text-sm text-gray-600">{label}</span>
                    </label>
                )
            })}
          </div>
        );

      case "WFD":
      case "ASQ":
        return (
            <div className="mt-10">
                <p className="text-sm text-gray-500 mb-2">Type your response below:</p>
                <input 
                    type="text" 
                    className="w-full border-b-2 border-gray-300 p-2 focus:outline-none focus:border-cyan-600 text-lg"
                    autoFocus
                    onChange={(e) => setAnswer(e.target.value)}
                />
            </div>
        );

      default:
        return <div className="mt-10 italic text-gray-400">Question type UI under development.</div>;
    }
  };

  return (
    <div className="w-full bg-white px-10 pt-8 pb-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-sm font-bold text-gray-600 uppercase mb-4">{getTaskTitle(question.type)}</h2>
        <p className="text-sm text-gray-800 mb-6 italic">{getInstructionText(question.type)}</p>

        {/* AUDIO PLAYER BAR */}
        <div className="bg-[#4aa3c2] p-4 rounded-md w-full mb-8">
            <div className="flex items-center gap-4">
                <div className="text-white">
                    {status === "PREPARING" ? "⏳" : status === "PLAYING" ? "🔊" : "✅"}
                </div>
                <div className="flex-1 bg-white/30 h-2 rounded-full overflow-hidden">
                    <div 
                        className={`bg-white h-full transition-all duration-500 ${status === "PLAYING" ? "animate-progress" : ""}`} 
                        style={{ width: status === "FINISHED" ? "100%" : "0%"}}
                    />
                </div>
                <span className="text-white text-xs font-mono">
                    {status === "PREPARING" ? `Starts in ${timeLeft}s` : status === "PLAYING" ? "Playing" : "Completed"}
                </span>
            </div>
        </div>

        {/* QUESTION SPECIFIC UI */}
        {renderQuestionUI()}

        {/* NEXT BUTTON */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50">
          <div className="px-6 py-3 flex justify-end">
            <button
              onClick={() => onNext(answer)}
              className="bg-[#3fa9c4] text-white px-8 py-1.5 rounded-sm text-sm font-bold shadow hover:bg-[#3492aa]"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== HELPERS ===================== */

function getTaskTitle(type) {
    const map = {
        SST: "Summarize Spoken Text",
        MCMA: "Multiple Choice, Choose Multiple Answers",
        FIB_L: "Fill in the Blanks",
        HCS: "Highlight Correct Summary",
        MCS: "Multiple Choice, Choose Single Answer",
        SMW: "Select Missing Word",
        HIW: "Highlight Incorrect Words",
        WFD: "Write from Dictation",
        ASQ: "Answer Short Question"
    };
    return map[type] || "Listening Task";
}

function getInstructionText(type) {
  switch (type) {
    case "SST": return "You will hear a short lecture. Write a summary for a fellow student who was not present at the lecture. You should write 50-70 words.";
    case "HIW": return "You will hear a recording. Below is a transcript of the recording. Some words in the transcript differ from what the speaker said. Please click on the words that are different.";
    case "WFD": return "You will hear a sentence. Type the sentence exactly as you hear it. Write as much of the sentence as you can. You will hear the sentence only once.";
    case "FIB_L": return "You will hear a recording. Type the missing words in each blank.";
    case "SMW": return "You will hear a recording. At the end of the recording the last word or group of words has been replaced by a beep. Select the correct option to complete the recording.";
    default: return "Listen to the audio and answer the question.";
  }
}

/* ===================== HARDWARE & INTRO SCREENS (REUSED) ===================== */

function OverviewScreen() {
    return (
      <div className="p-10 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Listening Part Overview</h2>
        <p className="mb-6 text-gray-600">This part of the test consists of questions that are based on audio or video clips. Each clip is played only once.</p>
        <table className="border-collapse border border-gray-300 w-full text-sm">
          <thead><tr className="bg-gray-100"><th className="border p-2 text-left">Task Type</th><th className="border p-2 text-left">Time Allowed</th></tr></thead>
          <tbody>
            {["Summarize Spoken Text", "Multiple Choice", "Fill in the Blanks", "Highlight Correct Summary", "Select Missing Word", "Highlight Incorrect Words", "Write from Dictation"].map((item, idx) => (
              <tr key={idx}><td className="border p-2">{item}</td><td className="border p-2">Varies</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
}

function HeadsetCheckScreen() {
    const [playing, setPlaying] = useState(false);
    const audio = useRef(new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"));
    const toggle = () => { playing ? audio.current.pause() : audio.current.play(); setPlaying(!playing); };
    return (
      <div className="flex p-10 gap-10">
        <div className="flex-1">
          <h2 className="font-bold text-xl mb-4">Headset Check</h2>
          <p className="text-sm mb-4">Put on your headset and click play to ensure you can hear the audio clearly.</p>
          <button onClick={toggle} className="bg-[#4aa3c0] text-white px-6 py-2 rounded shadow">
            {playing ? "Stop Sound" : "Play Sound"}
          </button>
        </div>
        <img src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png" alt="headset" className="w-40 h-40 opacity-20" />
      </div>
    );
}

function MicCheckScreen() {
    return (
      <div className="p-10">
        <h2 className="font-bold text-xl mb-4">Microphone Check</h2>
        <p className="text-sm mb-4">Even though this is a Listening test, some tasks may require voice input. Ensure your microphone is positioned correctly.</p>
        <div className="flex items-center gap-4 border p-4 rounded bg-gray-50 w-64">
            <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-bold">Microphone Ready</span>
        </div>
      </div>
    );
}

function IntroScreen() {
    return (
      <div className="p-10 max-w-3xl">
        <h2 className="text-xl font-bold mb-4">PTE Listening Section Instructions</h2>
        <ul className="space-y-4 text-sm text-gray-700">
            <li>• Audio clips will play <strong>automatically</strong>.</li>
            <li>• You can only hear each recording <strong>once</strong>.</li>
            <li>• You can adjust the volume using the slider on the screen during the test.</li>
            <li>• For 'Summarize Spoken Text', you have 10 minutes to write your response.</li>
        </ul>
      </div>
    );
}

/* ===================== RESULT SCREEN ===================== */

function ResultScreen({ testResult, isLoadingResult }) {
    if (isLoadingResult) return (
        <div className="flex flex-col items-center justify-center h-full py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            <p className="mt-4 font-bold text-gray-600">Calculating your listening score...</p>
        </div>
    );

    return (
        <div className="p-10">
            <h1 className="text-3xl font-black mb-6">Test Results</h1>
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-cyan-600 text-white p-6 rounded-lg">
                    <p className="text-xs uppercase opacity-70">Listening Score</p>
                    <p className="text-4xl font-bold">78 / 90</p>
                </div>
                <div className="bg-gray-800 text-white p-6 rounded-lg">
                    <p className="text-xs uppercase opacity-70">Task Completion</p>
                    <p className="text-4xl font-bold">100%</p>
                </div>
            </div>
            <p className="mt-10 text-gray-500 italic">Detailed feedback is available in your student dashboard.</p>
            <button onClick={() => window.location.reload()} className="mt-6 bg-[#fb8c00] text-white px-10 py-2 rounded font-bold">RETAKE PRACTICE</button>
        </div>
    );
}