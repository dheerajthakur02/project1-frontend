import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {
    ArrowLeft, RefreshCw, ChevronLeft, ChevronRight, Shuffle, Play, Square, Mic, Info, BarChart2, CheckCircle, Volume2, PlayCircle, History, Eye, FileText, X,
    Target
} from 'lucide-react';
import { submitRepeatAttempt } from '../../services/api';
import ImageAttemptHistory from './ImageAttemptHistory';
import { useSelector } from 'react-redux';

const RepeatSentenceSession = ({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) => {
    console.log(question)
    const navigate = useNavigate();
    const transcriptRef = useRef("");
    const { user } = useSelector((state) => state.auth)
    const [status, setStatus] = useState('prep');
    const [timeLeft, setTimeLeft] = useState(3);
    const [maxTime, setMaxTime] = useState(3);
    const [result, setResult] = useState(null);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);

    const [isPlaying, setIsPlaying] = useState(false);

    // Flash Answer State
    const [showFlashAnswer, setShowFlashAnswer] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunks = useRef([]);
    const questionAudioRef = useRef(null);

    const { transcript, resetTranscript } = useSpeechRecognition();

    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    // Reset session when question changes
    useEffect(() => {
        resetSession();
    }, [question]);

    useEffect(() => {
        let interval;
        // Prep uses countdown
        if (status === 'prep' && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        }
        // Recording uses count-up 
        else if (status === 'recording' && timeLeft < maxTime) {
            interval = setInterval(() => setTimeLeft((prev) => prev + 1), 1000);
        }

        // Handle Switching
        else if (timeLeft === 0 && status === 'prep') {
            handleStartListening();
        } else if (timeLeft >= maxTime && status === 'recording') {
            stopRecording();
        }

        return () => clearInterval(interval);
    }, [status, timeLeft, maxTime]);

    const handleStartClick = () => {
        setStatus('prep');
        setTimeLeft(3);
        setMaxTime(3);
    };

    const handleStartListening = () => {
        setStatus("listening");
        setAudioCurrentTime(0);

        if (questionAudioRef.current) {
            questionAudioRef.current.currentTime = 0;
            questionAudioRef.current
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => startRecording());
        }
    };

    const handleTogglePlayPause = () => {
        if (!questionAudioRef.current) return;

        if (questionAudioRef.current.paused) {
            questionAudioRef.current.play();
            setIsPlaying(true);
        } else {
            questionAudioRef.current.pause();
            setIsPlaying(false);
        }
    };

    useEffect(() => {
        const audio = questionAudioRef.current;
        if (!audio) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);

        audio.addEventListener("play", onPlay);
        audio.addEventListener("pause", onPause);

        return () => {
            audio.removeEventListener("play", onPlay);
            audio.removeEventListener("pause", onPause);
        };
    }, []);


    const handleSelectAttempt = (attempt) => {
        setResult(attempt);
        setStatus('result');
    };


    const onAudioEnded = () => {
        startRecording();
    };

    const startRecording = async () => {
        resetTranscript();
        transcriptRef.current = "";
        setStatus('recording');
        setTimeLeft(0); // Start at 0 for count-up
        setMaxTime(15);
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
            const response = await submitRepeatAttempt(formData);
            setResult(response.data);
            setStatus("result");
        } catch (err) {
            console.error("Submission error", err);
            setStatus("idle");
        }
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

    // Function to view history
    const handleViewHistory = (attempt) => {
        setResult({
            ...attempt,
            // Ensure wordAnalysis exists for the results view to map over
            wordAnalysis: attempt.wordAnalysis || []
        });
        setStatus('result');
    };

    const resetSession = () => {
        setResult(null);
        setStatus('prep');
        setTimeLeft(3);
        setMaxTime(3);
        resetTranscript();
        transcriptRef.current = "";
    };

    const handleShowAnswer = () => {
        setShowFlashAnswer(true);
        setTimeout(() => {
            setShowFlashAnswer(false);
        }, 4000); // Show for 4 seconds
    };

    const handleTranscribe = () => {
        setShowTranscript(true);
    };

    const progressPercent = ((maxTime - timeLeft) / maxTime) * 100;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <audio
                ref={questionAudioRef}
                src={question.audioUrl}
                className="hidden"
                onLoadedMetadata={(e) => setAudioDuration(Math.ceil(e.target.duration))}
                onTimeUpdate={(e) => setAudioCurrentTime(Math.ceil(e.target.currentTime))}
                onEnded={onAudioEnded}
            />
            <div>
                <h1>Repeat Sentence</h1>
                <p>
                    You will hear a sentence. Please repeat the sentence exactly as you hear it. You will hear the sentence only once
                </p>
            </div>
            <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">
                    <button onClick={() => setActiveSpeechQuestion(false)} className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Repeat Sentence <span className="text-xs font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">Ai+</span>
                    </h1>
                </div>

            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[450px] flex flex-col">
                <div className="bg-slate-50 px-6 py-3 border-b flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <span className="font-bold text-slate-700">#{question?._id?.slice(-5)?.toUpperCase()}</span>
                        <span className="text-slate-500 text-sm">{question?.title}</span>
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                        {question.difficulty || 'Medium'}
                    </div>

                </div>

                <div className="flex-1 p-8 flex flex-col items-center justify-center">

                    {/* 1. IDLE STATE WITH HISTORY */}
                    {/* Auto-start enabled */}

                    {/* 2. PREP STATE */}
                    {status === 'prep' && (
                        <div className="text-center space-y-4">
                            <div className="text-slate-400 font-semibold uppercase tracking-widest text-sm">Preparation</div>
                            <div className="text-5xl font-black text-slate-800">{timeLeft}s</div>
                            <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden mx-auto">
                                <div className="h-full bg-primary-600 transition-all duration-1000 linear" style={{ width: `${progressPercent}%` }} />
                            </div>
                        </div>
                    )}

                    {/* 3. LISTENING STATE */}
                    {(status === "listening" || status === "recording") && (
                        <div className="relative w-full max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">

                            {/* Skip Audio */}
                            {status !== "recording" && (
                                <button
                                    onClick={() => {
                                        questionAudioRef.current?.pause();
                                        setIsPlaying(false);
                                        setStatus("recording");
                                        startRecording();
                                    }}
                                    className="absolute top-4 right-4 text-xs font-semibold text-blue-600 hover:underline"
                                >
                                    Skip Audio
                                </button>
                            )}

                            {/* Transcript */}
                            <div className="text-center text-slate-600 text-sm italic leading-relaxed max-h-24 overflow-y-auto px-4">
                                {question.transcript}
                            </div>

                            {/* Speaker Icon */}
                            <div className="flex justify-center">
                                <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center animate-pulse">
                                    <Volume2 size={36} />
                                </div>
                            </div>

                            {/* Play / Pause */}
                            <div className="flex flex-col items-center gap-3">
                                <button
                                    onClick={handleTogglePlayPause}
                                    className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition"
                                >
                                    {isPlaying ? <Square size={30} /> : <Play size={30} />}
                                </button>

                                <p className="text-sm font-medium text-slate-500">
                                    {isPlaying ? "Playing speaker audio..." : "Audio paused"}
                                </p>
                            </div>

                            {/* Progress */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-mono text-slate-500">
                                    <span>{audioCurrentTime}s</span>
                                    <span>{audioDuration}s</span>
                                </div>

                                <input
                                    type="range"
                                    min="0"
                                    max={audioDuration || 0}
                                    step="0.1"
                                    value={audioCurrentTime}
                                    onChange={(e) => {
                                        questionAudioRef.current.currentTime = e.target.value;
                                        setAudioCurrentTime(e.target.value);
                                    }}
                                    className="w-full accent-blue-600 cursor-pointer"
                                />

                                <p className="text-center text-xs text-slate-400">
                                    Listening to speaker...
                                </p>
                            </div>
                        </div>
                    )}


                    {/* 4. RECORDING STATE */}
                    {status === 'recording' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex items-center gap-3 text-red-600">
                                <div className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
                                <span className="font-bold text-2xl">Recording... {timeLeft < 10 ? `0${timeLeft}` : timeLeft} / {maxTime}</span>
                            </div>
                            <button onClick={stopRecording} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg transition-colors">
                                <Square size={18} fill="currentColor" /> Finish Recording
                            </button>
                        </div>
                    )}

                    {/* 5. SUBMITTING STATE */}
                    {status === 'submitting' && (
                        <div className="text-center space-y-4">
                            <RefreshCw className="w-12 h-12 text-primary-600 animate-spin mx-auto" />
                            <p className="font-bold text-slate-700 text-lg">Analyzing your response...</p>
                        </div>
                    )}

                    {/* 6. RESULT STATE */}
                    {status === 'result' && result && (
                        <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            {/* Alert Banner */}
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

                            {/* SCORE GAUGE AND PARAMETERS */}
                            <div className="grid grid-cols-12 gap-6">
                                <div className="col-span-12 md:col-span-4 bg-white rounded-3xl border-4 border-purple-50 p-6 shadow-sm relative overflow-hidden">
                                    <h3 className="text-center font-bold text-slate-700 mb-4">Your Score</h3>
                                    <div className="relative flex justify-center items-center h-32">
                                        <svg className="w-48 h-24">
                                            <path d="M 10 90 A 70 70 0 0 1 180 90" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
                                            <path d="M 10 90 A 70 70 0 0 1 180 90" fill="none" stroke="url(#purpleGradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray="267" strokeDashoffset={267 - (267 * (result.score / 13))} className="transition-all duration-1000 ease-out" />
                                            <defs>
                                                <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#8b5cf6" />
                                                    <stop offset="100%" stopColor="#ec4899" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute bottom-2 flex flex-col items-center">
                                            <span className="text-5xl font-black text-slate-800">{Math.round(result.score)}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg">
                                            <span className="text-sm font-medium text-slate-600">Speaking</span>
                                            <span className="font-bold text-slate-700">{result.score.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-12 md:col-span-8 bg-white rounded-3xl border border-slate-100 p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="flex items-center gap-2 font-bold text-slate-700">Scoring Parameters</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <ParameterCard label="Content" score={result.content} max={5} />
                                        <ParameterCard label="Pronunciation" score={result.pronunciation} max={5} />
                                        <ParameterCard label="Oral Fluency" score={result.fluency} max={5} />
                                    </div>
                                </div>
                            </div>

                            {/* AUDIO PLAYERS */}
                            <div className="grid grid-cols-2 gap-6">
                                <AudioPlayerCard label="Question" duration="0:04" url={question.audioUrl} />
                                <AudioPlayerCard label="My Answer" duration="00:06" url={result.studentAudio?.url} isAnswer />
                            </div>

                            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                <h3 className="font-bold text-slate-700 mb-4 uppercase tracking-widest text-[10px]">Correct Answer</h3>
                                <p className="text-xl leading-relaxed text-slate-600 font-medium italic">
                                    {question?.transcript}
                                </p>
                            </div>

                            {/* TRANSCRIPT AREA */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-8">
                                <h3 className="font-bold text-slate-700 mb-4">Transcript Analysis</h3>
                                <div className="text-2xl leading-relaxed text-slate-400 font-medium">
                                    {result.wordAnalysis?.length > 0 ? result.wordAnalysis.map((item, index) => (
                                        <span key={index} className={`mx-1 ${item.status === 'correct' ? 'text-slate-700' : 'text-red-400'}`}>
                                            {item.word}
                                        </span>
                                    )) : <span className="text-slate-300 italic text-lg">No word analysis available for this attempt.</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>



            {/* Bottom Controls */}
            <div className="flex items-center justify-between pb-10">
                {/* LEFT SIDE: Translate, Answer, Redo */}
                <div className="flex items-center gap-4">
                    {/* Transcribe */}
                    <button
                        onClick={handleTranscribe}
                        className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
                            <FileText size={18} />
                        </div>
                        <span className="text-xs font-bold">Transcribe</span>
                    </button>

                    {/* Answer (Flash) */}
                    <button onClick={handleShowAnswer} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
                            <Eye size={18} />
                        </div>
                        <span className="text-xs font-bold">Answer</span>
                    </button>

                    {/* Redo */}
                    <button onClick={resetSession} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
                            <RefreshCw size={18} />
                        </div>
                        <span className="text-xs font-bold">Redo</span>
                    </button>
                </div>


                {/* RIGHT SIDE: Prev, Next */}
                <div className="flex items-center gap-4">
                    <button onClick={previousButton} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
                            <ChevronLeft size={20} />
                        </div>
                        <span className="text-xs font-bold">Previous</span>
                    </button>

                    <button onClick={nextButton} className="flex flex-col items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white shadow-sm">
                            <ChevronRight size={20} />
                        </div>
                        <span className="text-xs font-bold">Next</span>
                    </button>
                </div>
            </div>
            {question.lastAttempts && (
                <ImageAttemptHistory
                    question={question}
                    module={"repeat-sentence"}
                    onSelectAttempt={handleSelectAttempt}
                />
            )}

            {/* Flash Message Overlay */}
            {showFlashAnswer && (
                <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-lg text-center">
                    <p className="font-medium text-sm leading-relaxed">
                        {question.transcript || "No transcript available."}
                    </p>
                </div>
            )}

            {/* Transcribe Toast */}
            {showTranscript && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="bg-white text-slate-800 border border-slate-200 px-6 py-4 rounded-xl shadow-2xl max-w-2xl flex items-start gap-4">
                        <FileText className="shrink-0 mt-1 text-blue-600" size={20} />
                        <div className="space-y-1">
                            <h4 className="font-bold text-sm text-blue-700">Audio Transcript</h4>
                            <p className="text-sm leading-relaxed text-slate-700 max-h-40 overflow-y-auto pr-2">
                                {question.transcript || "No transcript available."}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowTranscript(false)}
                            className="hover:bg-slate-100 p-1 rounded-full transition-colors"
                        >
                            <X size={16} className="text-slate-500" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ... Sub-components (ControlBtn, ParameterCard, AudioPlayerCard) remain the same as your original file

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

const AudioPlayerCard = ({ label, url, duration, isAnswer }) => (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
        <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">{label}</span>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={() => {
                    const a = new Audio(url);
                    a.play();
                }} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200">
                    <Play size={14} fill="currentColor" />
                </button>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full bg-slate-500 w-1/3"></div>
                </div>
                <div className="text-[10px] text-slate-400 tabular-nums">{duration}</div>
            </div>
        </div>
    </div>
);

export default RepeatSentenceSession;