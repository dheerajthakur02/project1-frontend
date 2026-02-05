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
  Info,
  BarChart2,
  CheckCircle,
  Volume2,
  Sparkles as InventoryIcon,
  Languages,
  Eye,
  AlignLeft,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { submitReadAloudAttempt, getReadAloudHistory } from '../../services/api'; // Not directly used but good to keep
import { useSelector } from 'react-redux';



const getCommunityAttempts = async (questionId) => {
  const response = await axios.get(`/api/attempts/community/${questionId}`)
  return response?.data;
};

const AttemptHistory = ({ questionId, currentAttemptId, onSelectAttempt }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('my_answer'); // my_answer | community

  useEffect(() => {
    if (!questionId) return;

    const fetchAttempts = async () => {
      setLoading(true);
      try {
        const response =
          activeTab === 'my_answer'
            ? await getReadAloudHistory(questionId)
            : await getCommunityAttempts(questionId);



        if (Array.isArray(response?.data)) {
          const mapped = response.data.map(item => ({
            _id: item._id,
            date: item.date,
            userId: item.userId,

            score: item.score || 0,
            pronunciation: item.pronunciation || 0,
            fluency: item.fluency || 0,
            content: item.content || 0,

            transcript: item.transcript,
            wordAnalysis: item.wordAnalysis,
            aiFeedback: item.aiFeedback,
            analysis: item.analysis,
          }));

          setHistory(mapped);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.error('Fetch attempt history failed', err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, [questionId, currentAttemptId, activeTab]);

  /* ========================= UI STATES ========================= */

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading {activeTab === 'community' ? 'community answers' : 'your answers'}...
      </div>
    );
  }

  return (
    <div className="mt-12 font-sans">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('my_answer')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors
            ${activeTab === 'my_answer'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center text-purple-600">
            <BarChart2 size={12} />
          </div>
          My Answer
          <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {activeTab === 'my_answer' ? history.length : ''}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('community')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors
            ${activeTab === 'community'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-slate-500">
            <Shuffle size={12} />
          </div>
          Community Answers
        </button>
      </div>

      {/* Empty State */}
      {history.length === 0 && (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
            <Info size={20} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium">
            {activeTab === 'community'
              ? 'No community answers yet'
              : 'No attempts yet'}
          </p>
          <p className="text-xs mt-1 opacity-70">
            {activeTab === 'community'
              ? 'Be the first to attempt this question'
              : 'Complete the exercise to see your history'}
          </p>
        </div>
      )}

      {/* Attempts List */}
      <div className="space-y-4">
        {history.map(attempt => (
          <div
            key={attempt._id}
            onClick={() => onSelectAttempt?.(attempt)}
            className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm
                       flex flex-col md:flex-row md:items-center gap-6
                       hover:shadow-md transition-shadow cursor-pointer"
          >
            {/* User */}
            <div className="flex items-center gap-4 min-w-[200px]">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-rose-100
                              flex items-center justify-center text-rose-500 font-bold text-lg">
                {attempt.userId?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {attempt.userId?.name || 'User'}
                </h4>
                <div className="text-xs text-slate-400">
                  {new Date(attempt.date).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="flex-1 flex items-center gap-4">
              <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-400 font-bold">Score</span>
                <div className="text-xl font-bold text-purple-600">
                  {attempt.score} <span className="text-xs text-slate-400">/15</span>
                </div>
              </div>

              <div className="flex-1 bg-slate-50 px-4 py-2 rounded-full border border-slate-100
                              flex items-center gap-3">
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-8 h-8 rounded-full bg-white border
                             flex items-center justify-center text-slate-600"
                >
                  <Play size={12} fill="currentColor" />
                </button>
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full" />
                <span className="text-[10px] text-slate-400">0:12 / 0:40</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};




/** =========================
 *  Main Component
 *  ========================= */
const ReadAloudSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Data State
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  // Multi-question state
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sectionId, setSectionId] = useState(null);

  // Session State
  const [status, setStatus] = useState('prep'); // prep, recording, submitting, result
  const [timeLeft, setTimeLeft] = useState(35);
  const [maxTime, setMaxTime] = useState(35);
  const [result, setResult] = useState(null);
  const [isStarted, setIsStarted] = useState(true);
  const transcriptRef = useRef('');

  // NEW: modal state (for current + previous attempts)
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);

  // NEW: One-Line Mode State
  const [isOneLineMode, setIsOneLineMode] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const textContainerRef = useRef(null); // Ref for the text paragraph

  const { user } = useSelector(state => state.auth);


  useEffect(() => {
    const fetchQuestion = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/read-aloud/${id}`);
        if (response.data.success) {
          const sectionData = response.data.data;
          // Check if it's a section with questions
          if (sectionData.readAloudQuestions && Array.isArray(sectionData.readAloudQuestions)) {
            setAllQuestions(sectionData.readAloudQuestions);
            setSectionId(sectionData._id);
            setQuestion(sectionData.readAloudQuestions[0]);
            setCurrentIndex(0);
          } else {
            // Fallback if it returns a single question (unlikely given backend)
            setQuestion(sectionData);
            setAllQuestions([sectionData]);
          }
          resetSession();
        } else {
          setQuestion(null);
        }
      } catch (err) {
        console.error(err);
        // Demo fallback
        const demoQ = {
          id: 'RA_A_DEMO',
          name: 'Demo Question',
          text: 'Yellow is considered the most optimistic color. Yet surprisingly, people lose their tempers more often in yellow rooms, and babies cry more in them. The reason may be that yellow is the most complex color for the eyes. So, it can be overpowering if overused.',
          difficulty: 'Medium',
          isPrediction: true,
        };
        setQuestion(demoQ);
        setAllQuestions([demoQ]);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);


  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);


  const resetSession = () => {
    setIsResultOpen(false);
    setSelectedAttempt(null);

    setStatus('prep');
    setTimeLeft(35); // User requested 3s timer
    setMaxTime(35);
    setResult(null);
    setIsStarted(true); // Auto-start
    setSelectedText(''); // Clear selected text on reset

    resetTranscript();
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setQuestion(allQuestions[prevIdx]);
      resetSession();
    } else if (question && question.prevId) {
      navigate(`/practice/${question.prevId}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < allQuestions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setQuestion(allQuestions[nextIdx]);
      resetSession();
    } else if (question && question.nextId) {
      // Fallback or navigate to another section?
      navigate(`/practice/${question.nextId}`);
    }
  };

  const toggleTTS = () => {
    if (!question?.text) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToSpeak = isOneLineMode && selectedText ? selectedText : question.text; // Speak selected text in one-line mode
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Timer Logic
  useEffect(() => {
    let interval;
    // Prep uses countdown
    if (isStarted && status === 'prep' && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    // Recording uses count-up
    else if (isStarted && status === 'recording' && timeLeft < maxTime) {
      interval = setInterval(() => setTimeLeft((prev) => prev + 1), 1000);
    }
    // Handle switching
    else if (status === 'prep' && timeLeft === 0) {
      startRecording();
    }
    else if (status === 'recording' && timeLeft >= maxTime) {
      stopRecording();
    }

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, timeLeft, isStarted, maxTime]);

  const startRecording = () => {
    // In one-line mode, only allow recording if text is selected
    if (isOneLineMode && !selectedText) {
      alert("Please select some text to start speaking in One-Line Mode.");
      return;
    }

    if (!browserSupportsSpeechRecognition) {
      alert("Speech recognition not supported in this browser");
      return;
    }


    setIsStarted(true);
    setStatus('recording');
    setTimeLeft(0); // Start at 0 for count-up
    setMaxTime(isOneLineMode ? 40 : 40); // Shorter max time for one-line mode
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopRecording = async () => {
    await SpeechRecognition.stopListening();
    setStatus('submitting');

    const finalTranscript = transcriptRef.current;

    if (!finalTranscript || finalTranscript.trim() === '') {
      alert("No speech detected. Please try again.");
      setStatus('prep');
      return;
    }

    const referenceText = isOneLineMode && selectedText ? selectedText : question.text;

    try {
      // Calculate scores on the frontend
      const { payload, resultData } = calculateFrontendScore(finalTranscript, referenceText);

      // Submit to backend
      const res = await axios.post("/api/attempts/save/attempt", payload);
      const savedAttempt = res.data.data;

      // Update UI with the result (either from backend or frontend if not saved)
      setResult(savedAttempt || resultData);
      setSelectedAttempt(savedAttempt || resultData);
      setIsResultOpen(true);
      setStatus('result');

    } catch (err) {
      console.error("Error during scoring or saving attempt:", err);
      // Fallback to displaying frontend calculated result if backend save fails
      const { resultData } = calculateFrontendScore(finalTranscript, referenceText);
      setResult(resultData);
      setSelectedAttempt(resultData);
      setIsResultOpen(true);
      setStatus('result');
    }
  };


  // NEW: Frontend Scoring Logic (returns payload and local result data)
  const calculateFrontendScore = (userTranscript, referenceText) => {

    console.log(userTranscript, referenceText)
    const userWords = userTranscript.toLowerCase().split(/\s+/).filter(Boolean);
    const refWords = referenceText.toLowerCase().split(/\s+/).filter(Boolean);

    let correctWords = 0;
    const wordAnalysis = [];

    // Simple word-by-word comparison for content and pronunciation feedback
    for (let i = 0; i < refWords.length; i++) {
      if (userWords[i] && userWords[i] === refWords[i]) {
        correctWords++;
        wordAnalysis.push({ word: refWords[i], status: 'good' });
      } else {
        // Mark as bad if missing or incorrect
        wordAnalysis.push({ word: refWords[i], status: 'bad' });
      }
    }

    // Assign 'good' to any remaining user words that weren't matched in reference
    // This part might need more sophisticated alignment for true fluency.
    // For now, focusing on matching reference.

    const contentAccuracy = correctWords / refWords.length;

    // Simulate PTE-like scoring (max 5 for each, total 15)
    // This is a basic simulation. You can make it more complex.
    const contentScore = Math.min(5, Math.round(contentAccuracy * 5));

    // Pronunciation: A bit more lenient than content, but still based on accuracy
    const pronunciationScore = Math.min(5, Math.round(contentAccuracy * 5 * 1.1)); // Slightly higher if good content

    // Fluency: Simplistic. If most words are there and spoken within time.
    // You could also factor in words per second here if you track timings.
    const fluencyScore = Math.min(5, Math.round(contentAccuracy * 5 * 0.9)); // Slightly lower if content isn't perfect

    const totalScore = contentScore + pronunciationScore + fluencyScore;

    // Construct the payload for the backend
    const payload = {
      userId: user._id,
      paragraphId: question._id,
      transcript: userTranscript,
      score: totalScore,
      content: contentScore,
      pronunciation: pronunciationScore,
      fluency: fluencyScore,
      wordAnalysis,
      aiFeedback: `Frontend analysis: You got ${correctWords} out of ${refWords.length} words correct. Try to match the selected text more closely!`,
      // Add other fields expected by your backend like date, etc.
      date: new Date().toISOString(),
    };

    // Construct the result data for immediate UI display
    const resultData = {
      score: totalScore,
      fluency: fluencyScore,
      pronunciation: pronunciationScore,
      content: contentScore,
      transcript: userTranscript,
      _id: 'frontend_scored_' + Date.now(), // Unique ID for frontend display
      wordAnalysis: wordAnalysis,
      aiFeedback: `Frontend analysis: You got ${correctWords} out of ${refWords.length} words correct. Try to match the selected text more closely!`
    };

    return { payload, resultData };
  };

  const handleSkipPrep = () => startRecording();

  // NEW: Handle text selection
  const handleTextSelection = () => {
    if (!isOneLineMode) return;

    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString().trim());
      // Optionally, immediately start recording or give a "Speak Selected" button
      // For now, it just sets the selectedText. User still clicks "Record".
    } else {
      setSelectedText('');
    }
  };

  useEffect(() => {
    const textElement = textContainerRef.current;
    if (textElement && isOneLineMode) {
      textElement.addEventListener('mouseup', handleTextSelection);
      textElement.addEventListener('keyup', handleTextSelection); // For keyboard selection
    } else if (textElement) {
      textElement.removeEventListener('mouseup', handleTextSelection);
      textElement.removeEventListener('keyup', handleTextSelection);
      setSelectedText(''); // Clear selected text when leaving one-line mode
    }

    return () => {
      if (textElement) {
        textElement.removeEventListener('mouseup', handleTextSelection);
        textElement.removeEventListener('keyup', handleTextSelection);
      }
    };
  }, [isOneLineMode, question]); // Re-attach listeners when mode changes or question changes


  if (loading) return <div className="p-8 text-center">Loading Question...</div>;
  if (!question) return <div className="p-8 text-center text-red-500">Question not found</div>;

  const progressPercent = ((timeLeft) / maxTime) * 100; // Count-up Logic

  // what modal should display
  const view = selectedAttempt;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Navigation / Header */}
        <div>
          <h1>Read Aloud</h1>
          <p>
            Look at the text below. In {isOneLineMode ? '40' : '40'} seconds, you must read this text aloud as naturally and clearly as possible.
            You have {isOneLineMode ? '40' : '40'} seconds to read aloud.
          </p>
        </div>
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
            {/* NEW: One-Line Mode Toggle */}
            <button
              onClick={() => {
                setIsOneLineMode(!isOneLineMode);
                resetSession(); // Reset session when switching modes
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${isOneLineMode ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
            >
              <AlignLeft size={14} />
              {isOneLineMode ? 'Exit One-Line Mode' : 'One-Line Mode'}
            </button>


            <button
              onClick={toggleTTS}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${isSpeaking ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
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
            <span className="text-slate-500">({question.name || question.title || 'Unknown Title'})</span>

            {question.isPrediction && (
              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">Predictive</span>
            )}

            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${question.difficulty === 'Hard'
                ? 'bg-red-100 text-red-600'
                : question.difficulty === 'Medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
                }`}
            >
              {question.difficulty || 'Medium'}
            </span>
          </div>

          {/* Content Area */}
          <div className="p-8">
            <div className="mb-12">
              <p ref={textContainerRef} className="text-xl leading-relaxed text-slate-800 font-normal select-text">
                {question.text}
              </p>
              {isOneLineMode && selectedText && (
                <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-800 text-sm font-medium">
                  Selected for One-Line Mode: <span className="font-bold">"{selectedText}"</span>
                </div>
              )}
            </div>

            {/* Interactive Area */}
            <div className="relative py-8">
              {status === 'prep' && (
                <div className="flex flex-col items-center justify-center space-y-4">

                  <div className="w-full max-w-2xl h-1 bg-slate-200 rounded-full relative">
                    <div
                      className="h-full bg-slate-800 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${progressPercent}%` }}
                    />
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
                    <span className="font-bold text-lg">Recording... {timeLeft} / {maxTime}</span>
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

            </div>

          </div>

        </div>
        <div>
          {/* Footer Controls - UPDATED LAYOUT */}
          <div className="flex items-center justify-between pb-12">

            {/* LEFT SIDE: Translate, Answer, Redo */}
            <div className="flex items-center gap-4">
              {/* Translate (Static) */}
              <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                  <Languages size={18} />
                </div>
                <span className="text-xs font-medium">Translate</span>
              </button>

              {/* Answer (Static) */}
              <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                  <Eye size={18} />
                </div>
                <span className="text-xs font-medium">Answer</span>
              </button>

              {/* Redo (Preserved Action) */}
              <button onClick={resetSession} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                  <RefreshCw size={18} />
                </div>
                <span className="text-xs font-medium">Redo</span>
              </button>
            </div>


            {/* RIGHT SIDE: Prev, Next */}
            <div className="flex items-center gap-4">
              <button onClick={handlePrevious} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                  <ChevronLeft size={20} />
                </div>
                <span className="text-xs font-medium">Previous</span>
              </button>

              <button onClick={handleNext} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                  <ChevronRight size={20} />
                </div>
                <span className="text-xs font-medium">Next</span>
              </button>
            </div>

          </div>
        </div>

        {/* Attempt History Section */}
        {question && (
          <AttemptHistory
            questionId={question._id || question.id}
            currentAttemptId={result?._id}
            onSelectAttempt={(attempt) => {
              setSelectedAttempt(attempt);
              setIsResultOpen(true);
              setStatus('result'); // keep consistent
            }}
          />
        )}



        {/* =========================
            RESULT MODAL (works for previous attempts too)
           ========================= */}
        {isResultOpen && view && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
              onClick={() => setIsResultOpen(false)}
            />

            {/* Modal Container */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vh] lg:w-[70vw] lg:h-[80vh] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in zoom-in-50 duration-300">
              {/* Modal Header */}
              <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={24} />
                  Result Analysis
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetSession}
                    className="text-slate-500 hover:text-primary-600 font-semibold text-sm px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleNext}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    Next Question
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 overflow-y-auto flex-1">
                {view.score < 10 && (
                  <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                    <Info size={16} />
                    Low score detected. Try to speak more clearly and fluently.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-8">
                  {/* Left: Overall Score Circle */}
                  <div className="bg-white border server-slate-100 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="relative w-56 h-56">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="112" cy="112" r="90" stroke="#f1f5f9" strokeWidth="16" fill="none" />
                        <circle
                          cx="112"
                          cy="112"
                          r="90"
                          stroke="#8b5cf6"
                          strokeWidth="16"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray="565"
                          strokeDashoffset={565 - 565 * ((view.score || 0) / 15)}
                          className="transition-all duration-1500 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-6xl font-black text-slate-800">{view.score || 0}</span>
                        <span className="text-xl text-slate-400 font-medium">/ 15</span>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                      <span className="font-bold text-blue-700">Speaking</span>
                      <span className="font-bold text-slate-800 ml-2">
                        {typeof view.score === 'number' ? view.score.toFixed(2) : Number(view.score || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Breakdown Cards */}
                  <div className="grid grid-cols-3 gap-4 h-full content-center">
                    <div className="bg-white border border-blue-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <span className="text-sm font-semibold text-slate-500">Content</span>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-800">{view.content ?? 0}</span>
                        <span className="text-sm text-slate-400">/5</span>
                      </div>
                      <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded inline-block mt-2 w-fit">Good</span>
                    </div>

                    <div className="bg-white border border-red-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <span className="text-sm font-semibold text-slate-500">Pronunciation</span>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-800">{view.pronunciation ?? 0}</span>
                        <span className="text-sm text-slate-400">/5</span>
                      </div>
                      <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded inline-block mt-2 w-fit">Good</span>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <span className="text-sm font-semibold text-slate-500">Oral Fluency</span>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-800">{view.fluency ?? 0}</span>
                        <span className="text-sm text-slate-400">/5</span>
                      </div>
                      <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded inline-block mt-2 w-fit">Good</span>
                    </div>

                    <div className="col-span-3 mt-4 flex items-center justify-center gap-2 text-slate-400 text-xs border border-dashed border-slate-200 rounded-full py-1">
                      <Info size={12} /> Parameters are based on PTE Scoring Standards
                    </div>
                  </div>
                </div>

                {/* My Answer Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-800 text-lg">My Answer</h4>
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-xs font-semibold text-slate-600">
                      <Volume2 size={14} />
                      <span>00:{isOneLineMode ? '10' : '40'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                    <button className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors">
                      <Play size={18} fill="currentColor" className="ml-1" />
                    </button>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full w-1/3 bg-slate-400 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-500">0:12 / 0:{isOneLineMode ? '10' : '40'}</span>
                  </div>
                </div>

                {/* AI Feedback */}
                {view.aiFeedback && (
                  <div className="mb-8">
                    <h4 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg">
                        <InventoryIcon size={18} />
                      </span>
                      AI Feedback
                    </h4>
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 text-purple-900 leading-relaxed font-medium">
                      {view.aiFeedback}
                    </div>
                  </div>
                )}

                {/* Text Analysis */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-800 text-lg">Detailed Analysis</h4>
                    <button className="text-xs flex items-center gap-1 text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                      <Info size={14} /> Click on word for definition
                    </button>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                    <p className="text-lg leading-relaxed text-slate-700">
                      {(view.wordAnalysis || (isOneLineMode && selectedText ? selectedText.split(' ') : question.text.split(' ')).map((w) => ({ word: w, status: 'good' }))).map((item, index) => {
                        let colorClass = 'decoration-green-400';
                        let textColor = 'text-green-700';

                        if (item.status === 'bad') {
                          colorClass = 'decoration-red-400 decoration-wavy';
                          textColor = 'text-red-600';
                        } else if (item.status === 'average') {
                          colorClass = 'decoration-yellow-400 decoration-wavy';
                          textColor = 'text-yellow-700';
                        }

                        return (
                          <span
                            key={index}
                            className={`mr-1.5 inline-block underline underline-offset-4 ${colorClass} ${textColor} hover:bg-slate-100 rounded px-0.5 cursor-pointer transition-colors`}
                          >
                            {item.word}
                          </span>
                        );
                      })}
                    </p>
                  </div>

                  {/* Dynamic counts based on actual words in the reference text */}
                  <div className="flex flex-wrap items-center gap-4 mt-6">
                    <div className="flex items-center gap-3 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-100">
                      <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center font-bold text-xs">
                        {view.wordAnalysis?.filter(item => item.status === 'good').length || 0}
                      </div>
                      <span className="font-semibold text-sm">Good Pronun.</span>
                    </div>

                    <div className="flex items-center gap-3 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-xl border border-yellow-100">
                      <div className="w-6 h-6 rounded-full bg-yellow-200 flex items-center justify-center font-bold text-xs">
                        {view.wordAnalysis?.filter(item => item.status === 'average').length || 0}
                      </div>
                      <span className="font-semibold text-sm">Average Pronun.</span>
                    </div>

                    <div className="flex items-center gap-3 bg-red-50 text-red-800 px-4 py-2 rounded-xl border border-red-100">
                      <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center font-bold text-xs">
                        {view.wordAnalysis?.filter(item => item.status === 'bad').length || 0}
                      </div>
                      <span className="font-semibold text-sm">Bad Pronun. / Missing</span>
                    </div>
                  </div>
                </div>

                {/* Transcript */}
                <div className="pt-6 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm mb-2">My Transcript</h4>
                  <p className="text-slate-500 text-sm italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                    "{view.transcript}"
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReadAloudSession;