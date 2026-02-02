import React, { useState, useEffect, useRef } from "react";

const RTS = ({ backendData }) => {
  const [step, setStep] = useState(0); 
  const [currentIdx, setCurrentIdx] = useState(0);
  const [micStatus, setMicStatus] = useState("checking");

  const [introTime, setIntroTime] = useState(120);
  const [globalTime, setGlobalTime] = useState(30 * 60);

  const questions = backendData?.rtsQuestions || [];
  const currentQuestion = questions[currentIdx];

  useEffect(() => {
    const requestMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicStatus("allowed");
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        setMicStatus("denied");
      }
    };
    requestMic();
  }, []);

  useEffect(() => {
    let timer;
    if (step === 0 && introTime > 0) {
      timer = setInterval(() => setIntroTime(p => p - 1), 1000);
    } else if (step === 0 && introTime === 0) {
      setStep(1);
    }
    return () => clearInterval(timer);
  }, [step, introTime]);

  useEffect(() => {
    let timer;
    if (step === 1 && globalTime > 0) {
      timer = setInterval(() => setGlobalTime(p => p - 1), 1000);
    } else if (step === 1 && globalTime === 0) {
      setStep(2);
    }
    return () => clearInterval(timer);
  }, [step, globalTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!questions.length) return <div className="p-10 font-bold">Loading...</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none overflow-hidden text-[#333]">
      {/* HEADER */}
      <div className="bg-[#eeeeee] border-b border-gray-300">
        <div className="px-4 py-2 flex justify-between items-center">
          <span className="text-xl text-gray-700 font-medium">Pawan PTE Mock Test</span>
          <div className="flex flex-col items-end text-[13px] text-gray-600">
            <div className="flex items-center gap-1 font-semibold">
              <span className="text-[12px] font-bold text-gray-400 mr-1 uppercase">schedule</span>
              <span>Time Remaining {step === 0 ? formatTime(introTime) : formatTime(globalTime)}</span>
            </div>
            <span>{step === 1 ? `${currentIdx + 1} of ${questions.length}` : "1 of 1"}</span>
          </div>
        </div>
        <div className="h-9 bg-[#008199]"></div>
      </div>

      <div className="flex-grow flex flex-col">
        {step === 0 && (
          <div className="flex-grow flex flex-col items-start pt-12 px-16">
            <p className="text-[13px] text-gray-800 mb-10">Click "Next" and we'll start the exam.</p>
            <div className="w-80 h-80 mb-6"><img src="https://cdni.iconscout.com/illustration/premium/thumb/female-teacher-giving-lecture-on-webinar-2900223-2410500.png" alt="intro" className="w-full h-full object-contain" /></div>
            <Footer onNext={() => setStep(1)} />
          </div>
        )}

        {step === 1 && (
          <div className="flex-grow flex flex-col">
            <div className="px-10 py-4 text-[13px] text-gray-800 border-b border-gray-100 bg-[#fdfdfd] leading-relaxed">
              Listen to and read a description of a situation. You will have 10 seconds to think about your answer. Then you will hear a beep. You will have 40 seconds to answer the question. Please answer as completely as you can.
            </div>
            <div className="flex-grow flex flex-col items-center pt-8 px-10">
              <RTSController key={currentIdx} question={currentQuestion} />
            </div>
            <Footer onNext={() => {
                if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
                else setStep(2);
            }} />
          </div>
        )}

        {step === 2 && (
          <div className="flex-grow flex flex-col items-center justify-center">
             <h2 className="text-2xl font-bold text-gray-400 mb-6">Practice Finished</h2>
             <button onClick={() => window.location.reload()} className="bg-[#008199] text-white px-10 py-2 rounded-sm font-bold shadow hover:bg-[#006b81]">Retake</button>
          </div>
        )}
      </div>
    </div>
  );
};

/* --- UPDATED RTS CONTROLLER (Recording UI Focus) --- */
function RTSController({ question }) {
  const [phase, setPhase] = useState("BEGINNING"); // BEGINNING, PLAYING, PREPARING, RECORDING, COMPLETED
  const [timer, setTimer] = useState(6);
  const [recElapsed, setRecElapsed] = useState(0); // Current recording seconds
  const [audioState, setAudioState] = useState({ cur: 0, dur: 0 });

  const audioRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let interval;
    if (phase === "BEGINNING" || phase === "PREPARING") {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            phase === "BEGINNING" ? handlePlay() : handleRecord();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (phase === "RECORDING") {
      interval = setInterval(() => {
        setRecElapsed(prev => {
          if (prev >= (question.answerTime || 40)) {
            clearInterval(interval);
            handleStop();
            return question.answerTime || 40;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const handlePlay = () => {
    setPhase("PLAYING");
    const audio = new Audio(question.audioUrl);
    audioRef.current = audio;
    audio.onloadedmetadata = () => setAudioState(s => ({ ...s, dur: Math.floor(audio.duration) }));
    audio.ontimeupdate = () => setAudioState(s => ({ ...s, cur: Math.floor(audio.currentTime) }));
    audio.onended = () => { setPhase("PREPARING"); setTimer(10); };
    audio.play().catch(() => { setPhase("PREPARING"); setTimer(10); });
  };

  const handleRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      setPhase("RECORDING");
      setRecElapsed(0);
      recorder.start();
    } catch (err) { setPhase("COMPLETED"); }
  };

  const handleStop = () => {
    setPhase("COMPLETED");
    if (audioRef.current) audioRef.current.pause();
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  };

  const fmt = (s) => `00:${String(s).padStart(2, '0')}`;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-4xl text-[14px] text-gray-700 mb-10 text-center italic">"{question.title}"</div>

      {/* AUDIO BOX */}
      <div className="bg-[#4aa3c2] w-[400px] p-5 rounded-sm mb-12 flex flex-col items-center">
        <div className="w-full flex items-center gap-4 mb-3">
          <div className="text-white text-[10px] opacity-80 cursor-default">▶</div>
          <div className="flex-grow h-[6px] bg-white/30 rounded-full relative overflow-hidden">
            <div className="absolute h-full bg-white transition-all" style={{ width: `${(audioState.cur / audioState.dur) * 100 || 0}%` }} />
          </div>
        </div>
        <div className="text-[11px] text-white/90 font-mono mb-4">
          {phase === "PLAYING" || phase === "PREPARING" || phase === "RECORDING" || phase === "COMPLETED" 
            ? `${fmt(audioState.cur)} / ${fmt(audioState.dur)}` : `Beginning in ${timer}s`}
        </div>
        <div className="flex justify-between items-center w-full px-2 text-white">
          <span className="text-sm">🔊</span>
          <div className="w-32 h-[3px] bg-white/40 rounded-full overflow-hidden"><div className="w-3/4 h-full bg-white" /></div>
          <div className="w-4 h-4 bg-white/20 p-0.5 rounded-sm flex flex-col justify-around">
            {[...Array(4)].map((_, i) => <div key={i} className="h-[1px] w-full bg-white opacity-60" />)}
          </div>
        </div>
      </div>

      {/* RECORDING INTERFACE (Matches Image) */}
      <div className="flex flex-col items-center gap-2">
         <div className="flex items-center gap-6">
            {/* STOP BUTTON */}
            <button 
                onClick={phase === "RECORDING" ? handleStop : null}
                className={`w-14 h-14 rounded-full border-[3px] flex items-center justify-center transition-all 
                ${phase === 'RECORDING' ? 'border-red-500 bg-white cursor-pointer active:scale-95' : 'border-gray-200 opacity-20'}`}
            >
                <div className={`w-5 h-5 rounded-[2px] ${phase === 'RECORDING' ? 'bg-red-500' : 'bg-gray-300'}`} />
            </button>

            {/* STATUS & PROGRESS */}
            <div className="flex flex-col justify-center">
                <div className="flex items-center gap-4 text-[12px] font-mono text-gray-500">
                    <span>{fmt(recElapsed)}</span>
                    <div className="w-32 h-4 border-b-[1px] border-dotted border-blue-400 opacity-50 relative">
                        {phase === "RECORDING" && <div className="absolute bottom-[-2px] h-[3px] bg-blue-500 transition-all" style={{ width: `${(recElapsed / (question.answerTime || 40)) * 100}%` }} />}
                    </div>
                    <span>{fmt(question.answerTime || 40)}</span>
                </div>
                <div className="text-[12px] text-gray-400 mt-1 font-medium text-center">
                    {phase === "RECORDING" ? "Recording" : phase === "COMPLETED" ? "Completed" : phase === "PREPARING" ? `Prepare in ${timer}s` : ""}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function Footer({ onNext }) {
  return (
    <div className="fixed bottom-0 left-0 w-full h-14 bg-[#cccccc] border-t border-gray-400 flex items-center justify-between px-6">
      <button className="bg-white border border-gray-400 px-6 py-1.5 rounded-sm text-sm text-gray-700 font-medium">Save and Exit</button>
      <button onClick={onNext} className="bg-[#008199] text-white px-10 py-1.5 rounded-sm text-sm font-bold shadow-md hover:bg-[#006b81] uppercase">Next</button>
    </div>
  );
}

export default RTS;