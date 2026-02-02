import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {
    ArrowLeft, RefreshCw, ChevronLeft, ChevronRight, Shuffle, Play, Square, Mic, Info,
    BarChart2, CheckCircle, Volume2, PlayCircle, SkipForward, History, Eye, BookOpen
} from 'lucide-react';
import { submitDescribeImageAttempt } from '../../services/api';
import ImageAttemptHistory from './ImageAttemptHistory';
import { useSelector } from 'react-redux';

const DescribeImageModule = ({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) => {
    const [status, setStatus] = useState('prep_start');
    const [timeLeft, setTimeLeft] = useState(3);
    const [maxTime, setMaxTime] = useState(3);
    const [result, setResult] = useState(null);
    const { user } = useSelector((state) => state.auth)
    const mediaRecorderRef = useRef(null);
    const audioChunks = useRef([]);
    const { transcript, resetTranscript } = useSpeechRecognition();

    useEffect(() => {
        let interval;
        const activeStates = ['prep', 'recording', 'prep_start'];

        if (activeStates.includes(status) && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (timeLeft === 0) {
            if (status === 'prep_start') {
                setStatus('prep');
                setTimeLeft(25);
                setMaxTime(25);
            }
            else if (status === 'prep') startRecording();
            else if (status === 'recording') stopRecording();
        }
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    const handleStartClick = () => {
        setStatus('prep');
        setTimeLeft(25);
        setMaxTime(25);
    };

    const handleSelectAttempt = (attempt) => {
        setResult(attempt);
        setStatus('result');
    };

    const startRecording = async () => {
        resetTranscript();
        setStatus('recording');
        setTimeLeft(40);
        setMaxTime(40);
        SpeechRecognition.startListening({ continuous: true });
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunks.current = [];
            recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
            recorder.start();
        } catch (err) { console.error("Mic error", err); }
    };

    const stopRecording = () => {
        SpeechRecognition.stopListening();
        if (mediaRecorderRef.current?.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setStatus('submitting');

            mediaRecorderRef.current.onstop = async () => {
                try {
                    const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                    const formData = new FormData();

                    // Match these keys exactly with your Controller's req.body expectations
                    formData.append('audio', audioBlob, 'recording.webm');
                    formData.append('questionId', question._id);
                    formData.append('transcript', transcript || '');
                    formData.append("userId", user?._id); // Target User ID

                    const response = await submitDescribeImageAttempt(formData);
                    setResult(response.data);
                    setStatus('result');
                } catch (error) {
                    console.error('Submission failed:', error);
                    setStatus('idle');
                }
            };
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

    return (
        <div className="max-w-6xl mx-auto space-y-4 px-4 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                    <button onClick={() => setActiveSpeechQuestion(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                        <ArrowLeft size={20} strokeWidth={3} />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        Describe Image <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-100">Ai+</span>
                    </h1>
                </div>
                <button className="flex items-center gap-2 text-sm font-bold text-blue-600 border border-blue-600 px-4 py-1.5 rounded-full hover:bg-blue-50">
                    <BookOpen size={16} /> Study Guide
                </button>
            </div>

            {/* Main Practice Card */}
            <div className={`rounded-[2rem] overflow-hidden min-h-[500px] border transition-all duration-500 ${status === 'result' ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-[#ffffff] border-slate-700 shadow-2xl'}`}>

                {status !== 'result' ? (
                    /* PRACTICE MODE */
                    <div className="flex flex-col md:flex-row h-full">
                        <div className="flex-[1.5] relative p-8 flex items-center justify-center border-r border-slate-700/50">
                            <div className="absolute top-6 left-8 flex gap-3 z-10">
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-1 rounded">#{question?._id?.slice(-5).toUpperCase()}</span>
                                <span className="text-[10px] font-bold text-orange-400 bg-orange-950/40 px-2 py-1 rounded">{question.difficulty || 'Medium'}</span>
                            </div>

                            <div className={`relative w-full h-full transition-all duration-500 opacity-100 blur-0`}>
                                <img src={question.imageUrl} alt="Task" className="w-full h-full object-contain max-h-[400px] rounded-xl" />
                            </div>

                            {/* Auto Start Enabled - Overlay Removed */}
                        </div>

                        <div className="flex-1 bg-[#ffffff] p-12 flex flex-col items-center justify-center">
                            {(status === 'prep' || status === 'recording' || status === 'prep_start') && (
                                <div className="text-center space-y-8 w-full">
                                    <div className="relative flex items-center justify-center">
                                        <svg className="w-40 h-40 transform -rotate-90">
                                            <circle cx="80" cy="80" r="70" stroke="#333" strokeWidth="6" fill="transparent" />
                                            <circle cx="80" cy="80" r="70" stroke={(status === 'prep' || status === 'prep_start') ? "#3b82f6" : "#ef4444"} strokeWidth="6" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * timeLeft) / maxTime} className="transition-all duration-1000 ease-linear" strokeLinecap="round" />
                                        </svg>
                                        <span className="absolute text-5xl font-black text-black">{timeLeft}</span>
                                    </div>
                                    <p className={`text-sm font-bold uppercase tracking-[0.2em] ${(status === 'prep' || status === 'prep_start') ? 'text-blue-400' : 'text-red-500 animate-pulse'}`}>
                                        {status === 'prep_start' ? 'Starting Soon...' : status === 'prep' ? 'Preparation' : 'Recording...'}
                                    </p>
                                    {(status === 'prep' || status === 'prep_start') ? (
                                        <button onClick={startRecording} className="text-slate-400 hover:text-black text-sm underline underline-offset-8">Skip Preparation</button>
                                    ) : (
                                        <button onClick={stopRecording} className="bg-red-600 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg"><Square size={16} fill="white" /> Finish</button>
                                    )}
                                </div>
                            )}
                            {status === 'submitting' && (
                                <div className="text-center space-y-4">
                                    <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
                                    <p className="font-bold text-slate-400">Analyzing Performance...</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* RESULT MODE (Matched to your Controller Data) */
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
                                {question.modelAnswer}
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

            {/* Bottom Controls */}
            <div className="flex items-center justify-between bg-white px-8 py-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-8">
                    <ControlBtn
                        icon={<ChevronLeft size={22} />}
                        label="Previous"
                        onClick={previousButton}
                        className="font-semibold"
                    />

                    <ControlBtn
                        icon={<RefreshCw size={20} />}
                        label="Redo"
                        onClick={() => { setStatus('prep_start'); setTimeLeft(3); setMaxTime(3); setResult(null); }}
                        className="font-semibold"
                    />

                    <button className="w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-700 font-bold shadow-md hover:bg-green-600 hover:text-white hover:shadow-lg active:scale-95 transition-all">
                        <CheckCircle size={26} />
                    </button>

                    <ControlBtn
                        icon={<Shuffle size={20} />}
                        label="Shuffle"
                        onClick={shuffleButton}
                        className="font-semibold"
                    />

                    <ControlBtn
                        icon={<ChevronRight size={22} />}
                        label="Next"
                        onClick={nextButton}
                        className="font-semibold"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold uppercase">Go to</span>
                    <input type="text" className="w-10 h-8 bg-slate-800 text-white text-center rounded text-sm font-bold" defaultValue="1" />
                    <span className="text-xs text-slate-400 font-bold">/ 700</span>
                </div>
            </div>

            {/* History Table */}
            { question.lastAttempts&& (
                <div className="mt-8 space-y-4">
                    {/* Header */}
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest px-4">
                        <History size={16} /> Recent Attempts
                    </h3>

                    {/* ImageAttemptHistory component */}
                    <ImageAttemptHistory
                        question={question}
                        module={"image"}
                        onSelectAttempt={handleSelectAttempt}
                    />
                </div>
            )}

        </div>
    );
};

const ParameterCard = ({ label, score, max, color }) => (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
        <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">{label}</div>
        <div className="flex items-baseline gap-1 mb-3">
            <span className="text-3xl font-black text-slate-800">{score}</span>
            <span className="text-xs font-bold text-slate-300">/{max}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full transition-all duration-1000" style={{ width: `${(score / max) * 100}%`, backgroundColor: color }}></div>
        </div>
    </div>
);

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

export default DescribeImageModule;