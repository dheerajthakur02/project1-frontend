import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {
    ArrowLeft, RefreshCw, ChevronLeft, ChevronRight, Shuffle, Play, Square, Mic, Info, BarChart2, CheckCircle, Volume2, PlayCircle, History, Eye
} from 'lucide-react';
import { submitRepeatAttempt, submitShortAnswerAttempt } from '../../services/api';
import ImageAttemptHistory from './ImageAttemptHistory';
import { useSelector } from 'react-redux';

const ShortAnswer = ({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) => {
    const navigate = useNavigate();
    const transcriptRef = useRef("");
     const {user} = useSelector((state)=>state.auth)
    const [status, setStatus] = useState('idle'); 
    const [timeLeft, setTimeLeft] = useState(0);
    const [maxTime, setMaxTime] = useState(0);
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

    useEffect(() => {
        let interval;
        if ((status === 'prep' || status === 'recording') && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (timeLeft === 0) {
            if (status === 'prep') {
                handleStartListening();
            } else if (status === 'recording') {
                stopRecording();
            }
        }
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    const handleStartClick = () => {
        setStatus('prep');
        setTimeLeft(3);
        setMaxTime(3);
    };

    const handleStartListening = () => {
        setStatus('listening');
        setAudioCurrentTime(0);
        if (questionAudioRef.current) {
            questionAudioRef.current.currentTime = 0;
            questionAudioRef.current.play().catch(err => {
                console.error("Playback blocked", err);
                startRecording();
            });
        }
    };


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
        setTimeLeft(10);
        setMaxTime(10);
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


    // HELPER: Generate AI feedback based on score
    const getAISuggestion = (score) => {
        if (score >= 1) {
            return {
                text: "Excellent work! You captured the main ideas and spoke with high clarity. Keep maintaining this pace.",
                color: "text-green-700 bg-green-50 border-green-100",
                icon: <CheckCircle className="w-5 h-5 text-green-600" />
            };
        } else {
            return {
                text: "Focus on capturing more keywords from the audio and work on your pronunciation to ensure the AI detects more words correctly.",
                color: "text-red-700 bg-red-50 border-red-100",
                icon: <Info className="w-5 h-5 text-red-600" />
            };
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
            const response = await submitShortAnswerAttempt(formData);
            setResult(response.data);
            setStatus("result");
        } catch (err) {
            console.error("Submission error", err);
            setStatus("idle");
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
        setStatus('idle');
        resetTranscript();
        transcriptRef.current = "";
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

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => setActiveSpeechQuestion(false)} className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Answer Short Question <span className="text-xs font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">Ai+</span>
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
                    {status === 'idle' && (
                        <div className="w-full max-w-2xl text-center space-y-8">
                            <div className="space-y-6">
                                <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                    <PlayCircle size={48} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-slate-800">Ready to start?</h2>
                                    <p className="text-slate-500">The audio will play after the preparation timer.</p>
                                </div>
                                <button 
                                    onClick={handleStartClick}
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-primary-200 active:scale-95"
                                >
                                    Start Practice
                                </button>
                            </div>

                            {/* LAST ATTEMPTS SECTION */}
                            
                        </div>
                    )}

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
                    {status === 'listening' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center animate-pulse">
                                <Volume2 size={40} />
                            </div>
                            <div className="text-center space-y-1">
                                <span className="font-bold text-blue-600 text-lg">Listening to Speaker...</span>
                                <div className="text-slate-500 font-semibold text-sm">
                                    {audioCurrentTime || 0} / {audioDuration || 0} sec
                                </div>
                            </div>
                            <div className="w-64 h-2 bg-blue-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: audioDuration ? `${(audioCurrentTime / audioDuration) * 100}%` : '0%' }} />
                            </div>
                        </div>
                    )}

                    {/* 4. RECORDING STATE */}
                    {status === 'recording' && (
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex items-center gap-3 text-red-600">
                                <div className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
                                <span className="font-bold text-2xl">Recording... 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
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
                                            <path d="M 10 90 A 70 70 0 0 1 180 90" fill="none" stroke="url(#purpleGradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray="267" strokeDashoffset={267 - (267 * (result.score / 1))} className="transition-all duration-1000 ease-out" />
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

                                    {/* AUDIO PLAYERS */}
                            <div className="grid grid-rows-2 gap-6 col-span-12 md:col-span-8">
                                <AudioPlayerCard label="Question" duration="0:04" url={question.audioUrl} />
                                <AudioPlayerCard label="My Answer" duration="00:06" url={result.studentAudio?.url} isAnswer />
                            </div>


                                {/* <div className="col-span-12 md:col-span-8 bg-white rounded-3xl border border-slate-100 p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="flex items-center gap-2 font-bold text-slate-700">Scoring Parameters</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <ParameterCard label="Content" score={result.content} max={5} />
                                        <ParameterCard label="Pronunciation" score={result.pronunciation} max={5} />
                                        <ParameterCard label="Oral Fluency" score={result.fluency} max={5} />
                                    </div>
                                </div> */}
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
            <div className="flex items-center justify-center gap-6 pb-10">
                <ControlBtn icon={<ChevronLeft />} label="Previous" onClick={previousButton}/>
                <ControlBtn icon={<RefreshCw size={18} />} label="Redo" onClick={resetSession} />
                <button className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
                    <CheckCircle size={24} />
                </button>
                <ControlBtn icon={<Shuffle size={18} />} label="Shuffle" onClick={shuffleButton}/>
                <ControlBtn icon={<ChevronRight />} label="Next" onClick={nextButton}/>
            </div>
            {question.lastAttempts && question.lastAttempts.length > 0 && (
                        <ImageAttemptHistory 
            question={question} 
            onSelectAttempt={handleSelectAttempt} 
            module={"short-answer"}
          />
         )}
        </div>
    );
};

// ... Sub-components (ControlBtn, ParameterCard, AudioPlayerCard) remain the same as your original file

const ControlBtn = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary-600 transition-colors">
        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
            {icon}
        </div>
        <span className="text-[10px] font-bold uppercase">{label}</span>
    </button>
);

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

export default ShortAnswer;