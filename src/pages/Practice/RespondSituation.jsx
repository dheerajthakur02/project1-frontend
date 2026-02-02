import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {
    ArrowLeft, RefreshCw, ChevronLeft, ChevronRight, Shuffle, Play, Square, Mic, Info, BarChart2, CheckCircle, Volume2, PlayCircle, History, Eye, SkipForward,
    Target
} from 'lucide-react';
import { submitRespondSituationAttempt, submitSummarizeGroupAttempt } from '../../services/api';
import ImageAttemptHistory from './ImageAttemptHistory';
import { useSelector } from 'react-redux';

const RespondSituation = ({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) => {
    const navigate = useNavigate();
    const transcriptRef = useRef("");
    const { user } = useSelector((state) => state.auth);

    // Statuses: idle -> prep_start -> playing -> prep_record -> recording -> submitting -> result
    const [status, setStatus] = useState('prep_start');
    const [timeLeft, setTimeLeft] = useState(3);
    const [maxTime, setMaxTime] = useState(3);
    const [result, setResult] = useState(null);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);

    const mediaRecorderRef = useRef(null);
    const audioChunks = useRef([]);
    const questionAudioRef = useRef(null);

    const { transcript, resetTranscript } = useSpeechRecognition();

    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    // Main Timer Logic
    useEffect(() => {
        let interval;
        const activeStates = ['prep_start', 'prep_record', 'recording'];

        // Prep: Countdown
        if ((status === 'prep_start' || status === 'prep_record') && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        }
        // Recording: Count Up
        else if (status === 'recording' && timeLeft < maxTime) {
            interval = setInterval(() => setTimeLeft((prev) => prev + 1), 1000);
        }

        // Transitions
        else if (timeLeft === 0) {
            if (status === 'prep_start') handleStartAudio();
            else if (status === 'prep_record') startRecording();
        }
        else if (status === 'recording' && timeLeft >= maxTime) {
            stopRecording();
        }

        return () => clearInterval(interval);
    }, [status, timeLeft, maxTime]);

    const handleStartClick = () => {
        setStatus('prep_start');
        setTimeLeft(3);
        setMaxTime(3);
    };

    const handleStartAudio = () => {
        setStatus('playing');
        setAudioCurrentTime(0);
        if (questionAudioRef.current) {
            questionAudioRef.current.currentTime = 0;
            questionAudioRef.current.play().catch(err => {
                console.error("Playback blocked", err);
                moveToPrepRecord();
            });
        }
    };

    // New: Handle Slider Interaction
    const handleSliderChange = (e) => {
        const time = parseFloat(e.target.value);
        setAudioCurrentTime(time);
        if (questionAudioRef.current) {
            questionAudioRef.current.currentTime = time;
        }
    };

    const onAudioEnded = () => {
        moveToPrepRecord();
    };

    const moveToPrepRecord = () => {
        setStatus('prep_record');
        setTimeLeft(10);
        setMaxTime(10);
    };


    const getAISuggestion = (score) => {
        if (score >= 11) {
            return {
                text: "Excellent work! You captured the main ideas and spoke with high clarity. Keep maintaining this pace.",
                color: "text-green-700 bg-green-50 border-green-100",
                icon: <CheckCircle className="w-5 h-5 text-green-600" />
            };
        } else if (score >= 7) {
            return {
                text: "Good attempt. Try to focus more on key supporting details and maintain a smoother flow to boost your score.",
                color: "text-amber-700 bg-amber-50 border-amber-100",
                icon: <Target className="w-5 h-5 text-amber-600" />
            };
        } else {
            return {
                text: "Focus on capturing more keywords from the audio and work on your pronunciation to ensure the AI detects more words correctly.",
                color: "text-red-700 bg-red-50 border-red-100",
                icon: <Info className="w-5 h-5 text-red-600" />
            };
        }
    };


    const startRecording = async () => {
        resetTranscript();
        transcriptRef.current = "";
        setStatus('recording');
        setTimeLeft(0); // Count Up
        setMaxTime(40);

        SpeechRecognition.startListening({ continuous: true });
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunks.current = [];
            recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
            recorder.start();
        } catch (err) {
            console.error("Microphone access denied", err);
            setStatus('idle');
        }
    };

    const stopRecording = () => {
        SpeechRecognition.stopListening();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            setStatus('submitting');
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
                setTimeout(() => handleFinalSubmission(audioBlob), 300);
            };
        }
    };

    const handleFinalSubmission = async (audioBlob) => {
        const formData = new FormData();
        const finalTranscript = transcriptRef.current.trim() || "(No speech detected)";
        formData.append("questionId", question?._id);
        formData.append("transcript", finalTranscript);
        formData.append("audio", audioBlob);
        formData.append("userId", user?._id);
        try {
            const response = await submitRespondSituationAttempt(formData);
            setResult(response.data);
            setStatus("result");
        } catch (err) {
            console.error("Submission error", err);
            setStatus("idle");
        }
    };

    const resetSession = () => {
        setResult(null);
        setStatus('prep_start');
        setTimeLeft(3);
        setMaxTime(3);
        resetTranscript();
        transcriptRef.current = "";
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const progressPercent = (timeLeft / maxTime) * 100;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <audio
                ref={questionAudioRef}
                src={question.audioUrl}
                className="hidden"
                onLoadedMetadata={(e) => setAudioDuration(e.target.duration)}
                onTimeUpdate={(e) => setAudioCurrentTime(e.target.currentTime)}
                onEnded={onAudioEnded}
            />
                 <div>
                    <h1>
                        Respond To a Situation
                    </h1>
                    <p>Listen to and read a description of a situation. You will have 10 seconds to think about your answer. Then you will hear a beep. You will have 40 seconds to answer the question. Please answer as completely as you can.
</p>
                </div>
                
            <div className="flex items-center justify-between">
               
                <div className="flex items-center gap-2">
                    <button onClick={() => setActiveSpeechQuestion(false)} className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Respons To Situation <span className="text-xs font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">Ai+</span>
                    </h1>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[450px] flex flex-col">
                <div className="bg-slate-50 px-6 py-3 border-b flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <span className="font-bold text-slate-700">#{question?._id?.slice(-5)?.toUpperCase()}</span>
                        <span className="text-slate-500 text-sm">{question?.title}</span>
                    </div>
                </div>

                <div className="flex-1 p-8 flex flex-col items-center justify-center">

                    {/* 1. IDLE STATE */}
                    {/* Auto-start enabled */}

                    {/* 2. PREP START (4s) */}
                    {status === 'prep_start' && (
                        <div className="text-center space-y-4">
                            <div className="text-slate-400 font-semibold uppercase tracking-widest text-sm">Preparation</div>
                            <div className="text-6xl font-black text-primary-600">{timeLeft}s</div>
                        </div>
                    )}

                    {/* 3. PLAYING AUDIO WITH SLIDER */}
                    {status === 'playing' && (
                        <div className="flex flex-col items-center gap-8 w-full max-w-lg">
                            <div>{question.transcript}</div>
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center animate-pulse">
                                <Volume2 size={40} />
                            </div>

                            <div className="w-full space-y-2">
                                <div className="flex justify-between text-sm font-mono text-blue-600 font-bold">
                                    <span>{formatTime(audioCurrentTime)}</span>
                                    <span>{formatTime(audioDuration)}</span>
                                </div>
                                {/* INTERACTIVE SLIDER */}
                                <input
                                    type="range"
                                    min="0"
                                    max={audioDuration || 0}
                                    step="0.1"
                                    value={audioCurrentTime}
                                    onChange={handleSliderChange}
                                    className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all"
                                />
                                <p className="text-center text-slate-500 text-sm font-medium">Listening to Speaker...</p>
                            </div>
                        </div>
                    )}

                    {/* 4. PREP RECORD (10s Skipable) */}
                    {status === 'prep_record' && (
                        <div className="text-center space-y-6">
                            <div className="text-slate-400 font-semibold uppercase tracking-widest text-sm">Prepare to summarize</div>
                            <div className="text-6xl font-black text-slate-800">{timeLeft}s</div>
                            <button
                                onClick={startRecording}
                                className="flex items-center gap-2 mx-auto px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-bold transition-colors"
                            >
                                <SkipForward size={18} /> Skip Timer
                            </button>
                        </div>
                    )}

                    {/* 5. RECORDING (2m) */}
                    {status === 'recording' && (
                        <div className="flex flex-col items-center gap-8 w-full max-w-md">
                            <div className="flex items-center gap-4 text-red-600">
                                <div className="w-4 h-4 bg-red-600 rounded-full animate-ping" />
                                <span className="font-bold text-3xl tabular-nums">{formatTime(timeLeft)} / {formatTime(maxTime)}</span>
                            </div>

                            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 transition-all duration-1000 linear" style={{ width: `${progressPercent}%` }} />
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl w-full border border-dashed border-slate-300 min-h-[120px] text-slate-700">
                                {transcript || "Listening to your summary..."}
                            </div>

                            <button onClick={stopRecording} className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-full font-bold flex items-center gap-3 shadow-xl transition-all active:scale-95">
                                <Square size={20} fill="currentColor" /> Finish Recording
                            </button>
                        </div>
                    )}

                    {/* 6. SUBMITTING */}
                    {status === 'submitting' && (
                        <div className="text-center space-y-4">
                            <RefreshCw className="w-16 h-16 text-primary-600 animate-spin mx-auto" />
                            <p className="font-bold text-slate-700 text-xl">Analyzing Summary...</p>
                        </div>
                    )}

                    {/* 7. RESULT STATE */}
                    {status === 'result' && result && (
                        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 bg-white">
                            {(() => {
                                const suggestion = getAISuggestion(result.score);
                                return (
                                    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${suggestion.color} transition-all duration-500`}>
                                        <div className="flex-shrink-0">{suggestion.icon}</div>
                                        <div className="flex-1">
                                            <span className="font-bold text-xs uppercase tracking-wider block mb-0.5 opacity-70 italic">AI Analysis</span>
                                            <p className="font-medium text-sm leading-relaxed">{suggestion.text}</p>
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="grid grid-cols-12 gap-6">
                                {/* Score Gauge - Calculating out of 16 as per your controller */}
                                <div className="col-span-12 md:col-span-4 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center shadow-sm">
                                    <h3 className="font-bold text-slate-700 mb-6 uppercase tracking-widest text-[10px]">Your Score</h3>
                                    <div className="relative flex justify-center items-center h-32 w-full">
                                        <svg className="w-56 h-28">
                                            <path d="M 10 90 A 80 80 0 0 1 210 90" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
                                            <path d="M 10 90 A 80 80 0 0 1 210 90" fill="none" stroke="url(#blueGradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray="314" strokeDashoffset={314 - (314 * (result.score / 16))} className="transition-all duration-1000 ease-out" />
                                            <defs>
                                                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#8b5cf6" />
                                                    <stop offset="100%" stopColor="#ec4899" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute bottom-2 flex flex-col items-center">
                                            <span className="text-5xl font-black text-slate-800">{result.score}</span>
                                        </div>
                                    </div>
                                    <div className="w-full mt-4 flex justify-between px-2 text-[10px] font-bold text-slate-300">
                                        <span>0</span><span>16</span>
                                    </div>
                                </div>

                                <div className="col-span-12 md:col-span-8 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                    <h3 className="font-bold text-slate-700 mb-8 flex items-center gap-2"><BarChart2 size={16} /> Scoring Parameters</h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        <ParameterCard label="Content" score={result.content} max={6} color="#3b82f6" />
                                        <ParameterCard label="Pronunciation" score={result.pronunciation} max={5} color="#ec4899" />
                                        <ParameterCard label="Oral Fluency" score={result.fluency} max={5} color="#8b5cf6" />
                                    </div>
                                </div>
                            </div>

                            {/* Player for recorded audio */}
                            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex items-center gap-6 shadow-sm">
                                <span className="text-xs font-bold text-slate-400 uppercase w-20">My Answer</span>
                                <audio src={result.studentAudio?.url} controls className="flex-1 h-10" />
                            </div>

                            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                <h3 className="font-bold text-slate-700 mb-4 uppercase tracking-widest text-[10px]">Correct Answer</h3>
                                <p className="text-xl leading-relaxed text-slate-600 font-medium italic">
                                    {question.answer}
                                </p>
                            </div>


                            {/* Transcript Display */}
                            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                <h3 className="font-bold text-slate-700 mb-4 uppercase tracking-widest text-[10px]">Transcript Analysis</h3>
                                <p className="text-xl leading-relaxed text-slate-600 font-medium italic">
                                    "{result.transcript}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-center gap-6 pb-10">
                <ControlBtn icon={<ChevronLeft />} label="Previous" onClick={previousButton} />
                <ControlBtn icon={<RefreshCw size={18} />} label="Redo" onClick={resetSession} />
                <button className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
                    <CheckCircle size={24} />
                </button>
                <ControlBtn icon={<Shuffle size={18} />} label="Shuffle" onClick={shuffleButton} />
                <ControlBtn icon={<ChevronRight />} label="Next" onClick={nextButton} />
            </div>

            {question.lastAttempts  && (
                <ImageAttemptHistory
                    question={question}
                    module={"respond-situation"}
                    onSelectAttempt={(attempt) => { setResult(attempt); setStatus('result'); }}
                />
            )}
        </div>
    );
};

// Sub-components
const ControlBtn = ({ icon, label, onClick, className = "" }) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl 
      bg-slate-100 text-slate-700 font-semibold shadow-sm 
      hover:bg-slate-800 hover:text-white transition-all ${className}`}
        >
            {icon}
            <span className="font-bold">{label}</span>
        </button>
    );
};


const ParameterCard = ({ label, score, max }) => (
    <div className={`rounded-2xl border p-4 transition-all border-slate-100`}>
        <div className="text-xs font-semibold text-slate-500 mb-3">{label}</div>
        <div className="flex items-end justify-between">
            <div className="text-2xl font-black text-slate-800">
                {score}<span className="text-slate-300 font-bold text-sm">/{max}</span>
            </div>
        </div>
    </div>
);

export default RespondSituation;