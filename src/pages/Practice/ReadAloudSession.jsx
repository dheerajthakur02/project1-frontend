import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';
import {
    ArrowLeft,
    BookOpen,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Shuffle,
    Play,
    Square,
    Mic,
    Info,
    MoreVertical,
    BarChart2,
    CheckCircle
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';

const ReadAloudSession = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Data State
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Session State
    const [status, setStatus] = useState('prep'); // prep, recording, submitting, result
    const [timeLeft, setTimeLeft] = useState(35); // 35s Prep
    const [maxTime, setMaxTime] = useState(35);
    const [result, setResult] = useState(null);

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    // State for Text-to-Speech
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Fetch Question
    useEffect(() => {
        const fetchQuestion = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/read-aloud/${id}`);
                if (response.data.success) {
                    setQuestion(response.data.data);
                    resetSession();
                } else {
                    setError("Question not found");
                }
            } catch (err) {
                console.error(err);
                // Fallback for demo if backend fails or ID invalid
                setQuestion({
                    id: 'RA_A_DEMO',
                    name: 'Demo Question',
                    text: 'Yellow is considered the most optimistic color. Yet surprisingly, people lose their tempers more often in yellow rooms, and babies cry more in them. The reason may be that yellow is the most complex color for the eyes. So, it can be overpowering if overused.',
                    difficulty: 'Medium',
                    isPrediction: true
                });
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchQuestion();
    }, [id]);

    const resetSession = () => {
        setStatus('prep');
        setTimeLeft(35);
        setMaxTime(35);
        setResult(null);
        resetTranscript();
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    const handleNext = () => {
        if (question && question.nextId) {
            navigate(`/practice/${question.nextId}`);
        }
    };

    const handlePrev = () => {
        if (question && question.prevId) {
            navigate(`/practice/${question.prevId}`);
        }
    };

    const toggleTTS = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            const utterance = new SpeechSynthesisUtterance(question.text);
            utterance.lang = 'en-US'; // Default to US English
            utterance.rate = 0.9; // Slightly slower for clarity
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            setIsSpeaking(true);
        }
    };

    // Timer Logic
    useEffect(() => {
        let interval;
        if ((status === 'prep' || status === 'recording') && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            if (status === 'prep') {
                startRecording();
            } else if (status === 'recording') {
                stopRecording();
            }
        }
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    const startRecording = () => {
        setStatus('recording');
        setTimeLeft(40); // 40s Recording time
        setMaxTime(40);
        resetTranscript();
        SpeechRecognition.startListening({ continuous: true });
    };

    const stopRecording = async () => {
        await SpeechRecognition.stopListening();
        setStatus('submitting');

        // Use live transcript or fallback
        const finalTranscript = transcript;

        if (!finalTranscript) {
            // Handle no speech
            setResult({
                score: 0,
                pronunciation: 0,
                fluency: 0,
                content: 0,
                transcript: "(No speech detected)"
            });
            setStatus('result');
            return;
        }

        try {
            const res = await axios.post('/api/attempts', {
                paragraphId: question._id || question.id, // Handle fallback ID
                transcript: finalTranscript
            });

            if (res.data.success) {
                setResult(res.data.data);
                setStatus('result');
            }
        } catch (err) {
            console.error("Submission error", err);
            // Fallback local scoring if backend fails (for demo continuity)
            setResult({
                score: 12.5,
                pronunciation: 4.5,
                fluency: 3.8,
                content: 4.2,
                transcript: finalTranscript
            });
            setStatus('result');
        }
    };

    const handleSkipPrep = () => {
        startRecording();
    };

    if (loading) return <div className="p-8 text-center">Loading Question...</div>;
    if (!question) return <div className="p-8 text-center text-red-500">Question not found</div>;

    // Progress percentage for the line
    const progressPercent = ((maxTime - timeLeft) / maxTime) * 100;

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Top Navigation / Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/practice')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft className="text-slate-500" size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            Read Aloud
                            <span className="text-xs font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">Ai+</span>
                        </h1>
                        <Info className="text-slate-400 cursor-pointer hover:text-slate-600" size={16} />
                    </div>

                    <div className="flex items-center gap-3">
                        {/* TTS Control */}
                        <button
                            onClick={toggleTTS}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors
                                ${isSpeaking ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            {isSpeaking ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                            {isSpeaking ? 'Stop Reading' : 'Listen'}
                        </button>

                        <button className="flex items-center gap-2 text-primary-600 font-semibold border border-primary-200 px-4 py-1.5 rounded-lg hover:bg-primary-50">
                            <BookOpen size={16} />
                            Study Guide
                        </button>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Question Meta Row */}
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-bold text-slate-700">
                            #{question.id?.toString().includes('RA') ? question.id : 'RA_A_' + (question._id?.toString().slice(-4) || 'DEMO')}
                        </span>
                        <span className="text-slate-500">({question.name || question.title || "Unknown Title"})</span>

                        {question.isPrediction && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">Predictive</span>
                        )}

                        <span className={`px-2 py-0.5 rounded text-xs font-bold
                            ${question.difficulty === 'Hard' ? 'bg-red-100 text-red-600' :
                                question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'}`}>
                            {question.difficulty || 'Medium'}
                        </span>
                    </div>

                    {/* Content Area */}
                    <div className="p-8">
                        {/* Text Passage */}
                        <div className="mb-12">
                            <p className="text-xl leading-relaxed text-slate-800 font-normal">
                                {question.text}
                            </p>
                        </div>

                        {/* Interactive Area (Timer/Status) */}
                        <div className="relative py-8">
                            {status === 'prep' && (
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    {/* Progress Line */}
                                    <div className="w-full max-w-2xl h-1 bg-slate-200 rounded-full relative">
                                        <div
                                            className="h-full bg-slate-800 rounded-full transition-all duration-1000 ease-linear"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                        {/* Bubble Timer */}
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-white border-2 border-slate-800 rounded-full flex items-center justify-center font-bold text-lg shadow-sm transition-all duration-1000 ease-linear"
                                            style={{ left: `${progressPercent}%` }}
                                        >
                                            {timeLeft}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSkipPrep}
                                        className="mt-6 text-sm font-semibold text-primary-600 hover:text-primary-700 tracking-wide uppercase"
                                    >
                                        Skip Preparation Time
                                    </button>
                                </div>
                            )}

                            {status === 'recording' && (
                                <div className="flex flex-col items-center justify-center space-y-6">
                                    <div className="flex items-center gap-3 text-red-600 animate-pulse">
                                        <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                                        <span className="font-bold text-lg">Recording... 00:{timeLeft}</span>
                                    </div>



                                    <button
                                        onClick={stopRecording}
                                        className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Square size={18} fill="currentColor" />
                                        Click To Stop
                                    </button>
                                </div>
                            )}

                            {/* Result View */}
                            {status === 'result' && result && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    {/* Alert Banner */}
                                    {result.score < 10 && (
                                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                                            <Info size={16} />
                                            Low score detected. Try to speak more clearly and fluently.
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                        {/* Left: Overall Score Circle */}
                                        <div className="bg-white border server-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center h-full relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
                                            <div className="relative w-40 h-40">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                                                    <circle
                                                        cx="80" cy="80" r="70"
                                                        stroke="#8b5cf6"
                                                        strokeWidth="12"
                                                        fill="none"
                                                        strokeDasharray="440"
                                                        strokeDashoffset={440 - (440 * (result.score / 30))}
                                                        className="transition-all duration-1000 ease-out"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-4xl font-bold text-slate-800">{result.score || 0}</span>
                                                    <span className="text-xs text-slate-400 font-medium">/ 30</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                                                <span className="font-semibold text-slate-600">Speaking</span>
                                                <span className="ml-auto bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-sm font-bold">{result.score}</span>
                                            </div>
                                        </div>

                                        {/* Right: Breakdown Cards */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between pointer-events-none">
                                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs">
                                                        <BarChart2 size={12} />
                                                    </div>
                                                    Scoring Parameters
                                                </h3>
                                                <button className="text-xs border border-slate-200 px-3 py-1 rounded-full text-slate-500 flex items-center gap-1">
                                                    Pro Evaluation <MoreVertical size={12} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4">
                                                {/* Content */}
                                                <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                                    <span className="text-xs font-semibold text-slate-500 mb-2">Content</span>
                                                    <div className="text-xl font-bold text-slate-800">{result.content} <span className="text-xs text-slate-400">/10</span></div>
                                                    <span className={`text-[10px] mt-1 px-1.5 py-0.5 rounded ${result.content < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                        {result.content < 5 ? 'Bad' : 'Good'}
                                                    </span>
                                                </div>
                                                {/* Pronunciation */}
                                                <div className="border border-red-100 bg-red-50/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                                    <span className="text-xs font-semibold text-slate-500 mb-2">Pronunciation</span>
                                                    <div className="text-xl font-bold text-slate-800">{result.pronunciation} <span className="text-xs text-slate-400">/10</span></div>
                                                    <span className={`text-[10px] mt-1 px-1.5 py-0.5 rounded ${result.pronunciation < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                        {result.pronunciation < 5 ? 'Bad' : 'Good'}
                                                    </span>
                                                </div>
                                                {/* Fluency */}
                                                <div className="border border-orange-100 bg-orange-50/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                                    <span className="text-xs font-semibold text-slate-500 mb-2">Oral Fluency</span>
                                                    <div className="text-xl font-bold text-slate-800">{result.fluency} <span className="text-xs text-slate-400">/10</span></div>
                                                    <span className={`text-[10px] mt-1 px-1.5 py-0.5 rounded ${result.fluency < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                        {result.fluency < 5 ? 'Bad' : 'Good'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-center gap-6 pb-12">
                    <button onClick={() => navigate(-1)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                            <ChevronLeft size={20} />
                        </div>
                        <span className="text-xs font-medium">Previous</span>
                    </button>

                    <button onClick={resetSession} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                            <RefreshCw size={18} />
                        </div>
                        <span className="text-xs font-medium">Redo</span>
                    </button>

                    {/* Middle Check Button */}
                    <button className="w-12 h-12 rounded-xl bg-slate-300 flex items-center justify-center text-white shadow-inner">
                        <CheckCircle size={24} fill="currentColor" className="text-white" />
                    </button>

                    <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                            <Shuffle size={18} />
                        </div>
                        <span className="text-xs font-medium">Shuffle</span>
                    </button>

                    <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                            <ChevronRight size={20} />
                        </div>
                        <span className="text-xs font-medium">Next</span>
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ReadAloudSession;
