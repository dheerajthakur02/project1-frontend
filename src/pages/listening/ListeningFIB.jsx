import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Play, Pause, ChevronRight, Users, CheckCircle, Volume2, Hash, RefreshCw, Shuffle, X, Info, BarChart2, ChevronLeft, Languages, Eye } from 'lucide-react';
import { useSelector } from 'react-redux';
import { submitListeningFIBAttempt } from '../../services/api';
import axios from 'axios';



const AttemptHistory = ({question, attempts, onSelectAttempt }) => {
  const [activeTab, setActiveTab] = useState("my");
  const [communityAttempts, setCommunityAttempts] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);

  const fetchCommunityAttempts = async () => {
    try {
      setLoadingCommunity(true);
      const res = await axios.get(`api/listening-fib/${question._id}/community`);
    
        setCommunityAttempts(res?.data?.data);
      
    } catch (err) {
      console.error("Community fetch error:", err);
    } finally {
      setLoadingCommunity(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "community" && communityAttempts.length === 0) {
      fetchCommunityAttempts();
    }
  };

  const dataToRender = activeTab === "my" ? attempts : communityAttempts;

  return (
    <div className="mt-12 font-sans">
      {/* HEADER + TABS */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="text-purple-600" size={20} />
          <h3 className="font-bold text-slate-800">
            {activeTab === "my" ? "Your Attempts" : "Community Attempts"}
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleTabChange("my")}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition
              ${activeTab === "my"
                ? "bg-purple-600 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
          >
            My Attempts
          </button>

          <button
            onClick={() => handleTabChange("community")}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-1
              ${activeTab === "community"
                ? "bg-purple-600 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
          >
            <Users size={14} />
            Community
          </button>
        </div>
      </div>

      {/* EMPTY STATE */}
      {!dataToRender || dataToRender.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border">
            <Info size={20} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium">
            {loadingCommunity
              ? "Loading community attempts..."
              : "No attempts found"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {dataToRender.map((attempt, idx) => (
            <div
              key={attempt._id || idx}
              onClick={() => onSelectAttempt?.(attempt)}
              className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow group cursor-pointer"
            >
              {/* USER (Community only) */}
              {activeTab === "community" && (
                <div className="min-w-[150px]">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    User
                  </span>
                  <div className="text-sm font-semibold text-slate-700">
                    {attempt.user?.name || "Anonymous"}
                  </div>
                </div>
              )}

              {/* DATE */}
              <div className="min-w-[150px]">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Date
                </span>
                <div className="text-sm font-semibold text-slate-700">
                  {attempt.createdAt
                    ? new Date(attempt.createdAt).toLocaleString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Just now"}
                </div>
              </div>

              {/* SCORE */}
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Score
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-xl font-bold ${
                      attempt.score === attempt.maxScore
                        ? "text-green-600"
                        : attempt.score > attempt.maxScore / 2
                        ? "text-blue-600"
                        : "text-red-500"
                    }`}
                  >
                    {attempt.score}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">
                    / {attempt.maxScore}
                  </span>
                </div>
              </div>

              {/* STATUS */}
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    attempt.score === attempt.maxScore
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {attempt.score === attempt.maxScore
                    ? "Perfect"
                    : "Completed"}
                </span>
              </div>

              {/* ACTION */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 font-bold text-sm">
                View Result →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};



export default function ListeningFIB({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) {
    const { user } = useSelector((state) => state.auth);
    const audioRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [userAnswers, setUserAnswers] = useState({});
    const [status, setStatus] = useState('idle'); // idle, playing, submitting, result
const [audioFinished, setAudioFinished] = useState(false);
const [audioProgress, setAudioProgress] = useState(0); // 0 → 100

    // Prep Timer State
    const [prepStatus, setPrepStatus] = useState("countdown");
    const [prepTimer, setPrepTimer] = useState(3);

    const [result, setResult] = useState(null); // The current attempt result
    const [transcriptWords, setTranscriptWords] = useState([]);
    const [blanks, setBlanks] = useState({}); // Map of index -> correct word
    const [blankLocations, setBlankLocations] = useState([]); // Array of indices where blanks are located, in order of correctAnswers

    // UI State
    const [isResultOpen, setIsResultOpen] = useState(false);
    const [viewAttempt, setViewAttempt] = useState(null);

    // Timer Logic
    useEffect(() => {
        if (prepStatus === "countdown" && prepTimer > 0) {
            const timer = setInterval(() => setPrepTimer(p => p - 1), 1000);
            return () => clearInterval(timer);
        } else if (prepStatus === "countdown" && prepTimer === 0) {
            setPrepStatus("finished");
            // Auto-start audio if desired? Or just remove overlay.
            // ListeningFIB usually has manual play button? Line 350 has button.
            // If we want auto-play:
           if (audioRef.current) {
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
    setAudioFinished(false);
}

        }
    }, [prepStatus, prepTimer]);

    useEffect(() => {
        if (question && question.transcript) {
            let words = question.transcript.split(/\s+/);
            const blanksMap = {};
            const placeholderIndices = [];

            // 1. Detect explicit placeholders
            words.forEach((w, i) => {
                if (w.includes('__')) {
                    placeholderIndices.push(i);
                }
            });

            // Prepare sorted answers to ensure deterministic order
            const sortedAnswers = [...question.correctAnswers].sort((a, b) => a.index - b.index);
            let locations = [];

            if (placeholderIndices.length > 0 && placeholderIndices.length === question.correctAnswers.length) {
                // Use placeholder locations
                locations = placeholderIndices;
                placeholderIndices.forEach((wordIndex, i) => {
                    if (sortedAnswers[i]) {
                        blanksMap[wordIndex] = sortedAnswers[i].correctAnswer;
                    }
                });
            } else {
                // Fallback to explicit indices
                locations = sortedAnswers.map(ans => ans.index);
                question.correctAnswers.forEach(ans => {
                    blanksMap[ans.index] = ans.correctAnswer;
                });
            }

            setTranscriptWords(words);
            setBlanks(blanksMap);
            setBlankLocations(locations);
            setUserAnswers({});
            setStatus('idle');

            // Reset Prep Timer
            setPrepStatus("countdown");
            setPrepTimer(3);

            setResult(null);
            setIsResultOpen(false);
            setViewAttempt(null);

            setAudioProgress(0);
setAudioFinished(false);

        }
    }, [question]);

   const toggleAudio = () => {
    if (!audioRef.current || audioFinished) return;

    if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
    } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
    }
};

const handleSkipAudio = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = audioRef.current.duration;
    setIsPlaying(false);
    setAudioFinished(true);
    setAudioProgress(100);
};



   const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioFinished(true);
};


    const handleInputChange = (index, value) => {
        setUserAnswers(prev => ({ ...prev, [index]: value }));
    };

    const handleSubmit = async () => {
        setStatus('submitting');

        // Use the tracked blankLocations to fetch user answers in the correct order
        // blankLocations corresponds to the order of sorted correctAnswers
        const answersArray = blankLocations.map(loc => userAnswers[loc] || "");
        const timeTaken = 0;

        try {
            const res = await submitListeningFIBAttempt({
                questionId: question._id,
                userId: user._id,
                userAnswers: answersArray,
                timeTaken
            });
            // Construct a result object compatible with our view
            // The backend likely returns `attempt` which has `score`, `maxScore`, `userAnswers` (array)
            // We need to map the array userAnswers back to indices for the view if needed, 
            // OR the view logic needs to handle array vs map.
            // Our view logic below uses `userAnswers` MAP for the current session, 
            // but for historical view it uses the array from the backend. 
            // Let's standardise on the attempt object.

            const newAttempt = res.attempt;
            setResult(newAttempt);
            setViewAttempt(newAttempt);
            setIsResultOpen(true);
            setStatus('result');
        } catch (error) {
            console.error("Submission failed", error);
            setStatus('idle');
        }
    };

    const handleRedo = () => {
        setUserAnswers({});
        setStatus('idle');
        setResult(null);
        setIsResultOpen(false);
        setViewAttempt(null);
        // Reset audio?
      if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
}
setIsPlaying(false);
setAudioFinished(false);
setAudioProgress(0);

        setPrepStatus("countdown");
        setPrepTimer(3);
    };

    const openAttempt = (attempt) => {
        setViewAttempt(attempt);
        setIsResultOpen(true);
    };

    // Calculate progress
    const totalBlanks = Object.keys(blanks).length;
    const filledBlanks = Object.keys(userAnswers).filter(k => userAnswers[k] && userAnswers[k].trim() !== "").length;
    const isSubmitDisabled = filledBlanks === 0;


    const renderTranscript = () => {
        return transcriptWords.map((word, index) => {
            if (blanks[index] !== undefined) {
                const userInput = userAnswers[index] || "";
                return (
                    <span key={index} className="inline-block mx-1 mb-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                            // In this view (editing), we don't show correct/incorrect. That's for the modal.
                            // But user asked to match Reading FIB. Reading FIB shows inputs.
                            className={`border-2 rounded-lg outline-none px-3 py-1.5 text-center transition-all bg-white text-slate-700 font-medium
                                ${status === 'submitting' ? 'bg-slate-50 text-slate-400' : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}
                             `}
                            style={{ width: `${Math.max(100, userInput.length * 12)}px` }}
                        />
                    </span>
                );
            }
            // If word was just a placeholder "__", don't render it as text, our input replaced it (or should have).
            // But if we detected it as a blank, we rendered the input.
            // We should strip the "__" if it was the marker.
            if (word.includes('__') && blanks[index] !== undefined) return null;

            return <span key={index} className="mx-0.5">{word} </span>;
        });
    };

    // Rendering detailed view in modal
    const renderModalTranscript = () => {
        if (!viewAttempt) return null;

        // We need to map the historical array answers back to the blank positions.
        // Assuming viewAttempt.userAnswers is an array of strings in order of blanks.
        // OR array of objects { index, answer, isCorrect } depending on backend.
        // Let's assume standard listening FIB backend response structure:
        // usually `userAnswers` is just [ "word", "word" ] or mixed. 
        // Let's look at `submitListeningFIBAttempt` usage. We sent array of strings.
        // Backend usually stores what we sent.

        // We'll iterate transcript. Keep a counter for which blank we are on.
        let blankCounter = 0;

        return transcriptWords.map((word, index) => {
            if (blanks[index] !== undefined) {
                const correctAnswer = blanks[index];
                // Get user answer by index from the array
                // If viewAttempt.userAnswers is array of strings:
                let userAns = "";
                if (Array.isArray(viewAttempt.userAnswers)) {
                    userAns = viewAttempt.userAnswers[blankCounter] || "";
                }
                blankCounter++;

                const isCorrect = userAns.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

                return (
                    <span key={index} className="inline-block mx-1 align-middle">
                        {isCorrect ? (
                            <span className="px-3 py-1 rounded-lg bg-green-100 text-green-700 font-bold border border-green-200 flex items-center gap-1">
                                {userAns} <CheckCircle size={14} />
                            </span>
                        ) : (
                            <span className="inline-flex flex-col align-middle mx-1">
                                {userAns && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-600 line-through decoration-red-600 decoration-2 opacity-70 mb-0.5 w-fit">
                                        {userAns || "Empty"}
                                    </span>
                                )}
                                <span className="px-3 py-1 rounded-lg bg-green-50 text-green-700 font-bold border border-green-200 shadow-sm whitespace-nowrap">
                                    {correctAnswer}
                                </span>
                            </span>
                        )}
                    </span>
                );
            }
            if (word.includes('__') && blanks[index] !== undefined) return null;
            return <span key={index} className="mx-0.5">{word} </span>;
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1>Fill in the Blanks</h1>
                <p>
                    You will hear a recording. Type the missing words in each blank.</p>
            </div>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => setActiveSpeechQuestion(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Fill in the Blanks
                        <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Listening</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-slate-500">
                        {filledBlanks} / {totalBlanks} filled
                    </div>
                </div>
            </div>

            {/* Question Card */}
            {prepStatus === "countdown" ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-20 text-center space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800">Starting Soon...</h2>
                    <div className="text-6xl font-black text-blue-600 animate-pulse">
                        {prepTimer}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                                <Hash size={14} />
                                {question?._id?.slice(-5)?.toUpperCase()}
                            </span>
                            <span className="text-slate-500 text-sm font-medium border-l border-slate-200 pl-4">
                                {question?.title || "Listening Task"}
                            </span>
                        </div>
                        {question?.difficulty && (
                            <span className={`px-2 py-1 rounded-md text-xs font-bold shadow-sm ${question.difficulty === 'Hard' ? 'bg-red-100 text-red-600' :
                                question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                }`}>
                                {question.difficulty}
                            </span>
                        )}
                    </div>

                    <div className="p-8 space-y-8">
                        {/* PLAYER */}
                    <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
    {/* PLAY / PAUSE */}
    <button
        onClick={toggleAudio}
        disabled={audioFinished}
        className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95"
    >
        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
    </button>

    {/* FAKE PROGRESS BAR (same style as your other components) */}
    <div className="flex-1">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
           <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
    <div
        className="h-full bg-blue-500 transition-[width] duration-200"
        style={{ width: `${audioProgress}%` }}
    />
</div>

        </div>
    </div>

    {/* AUDIO ELEMENT */}
    <audio
    ref={audioRef}
    src={question.audioUrl}
    onEnded={handleAudioEnded}
    onTimeUpdate={() => {
        if (!audioRef.current) return;
        const progress =
            (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setAudioProgress(progress || 0);
    }}
    onPlay={() => setIsPlaying(true)}
    onPause={() => setIsPlaying(false)}
    className="hidden"
/>


    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase">
        <Volume2 size={16} />
        Audio
    </div>

    {/* SKIP BUTTON */}
    {!audioFinished && (
        <button
            onClick={handleSkipAudio}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
            Skip
        </button>
    )}
</div>


                        {/* TEXT CONTENT */}
                        <div className="leading-loose text-lg text-slate-700 font-normal">
                            {renderTranscript()}
                        </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitDisabled || status === 'submitting'}
                            className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center gap-2
                            ${isSubmitDisabled ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-primary-600 hover:bg-primary-700 hover:shadow-primary-200'}
                        `}
                        >
                            <CheckCircle size={20} />
                            {status === 'submitting' ? 'Submitting...' : 'Submit Answer'}
                        </button>
                    </div>
                </div>
            )}

            {/* Footer Nav */}
            <div className="flex items-center justify-between pb-6 mt-6">
                {/* LEFT SIDE: Translate, Answer, Redo */}
                <div className="flex items-center gap-4">
                    {/* Translate (Static) */}
                    <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors cursor-default">
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                            <Languages size={18} />
                        </div>
                        <span className="text-xs font-medium">Translate</span>
                    </button>

                    {/* Answer (Static) */}
                    <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors cursor-default text-opacity-50">
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                            <Eye size={18} />
                        </div>
                        <span className="text-xs font-medium">Answer</span>
                    </button>

                    {/* Redo */}
                    <button onClick={handleRedo} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                            <RefreshCw size={18} />
                        </div>
                        <span className="text-xs font-medium">Redo</span>
                    </button>
                </div>

                {/* RIGHT SIDE: Prev, Next */}
                <div className="flex items-center gap-4">
                    <button onClick={previousButton} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                            <ChevronLeft size={20} />
                        </div>
                        <span className="text-xs font-medium">Previous</span>
                    </button>

                    <button onClick={nextButton} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                            <ChevronRight size={20} />
                        </div>
                        <span className="text-xs font-medium">Next</span>
                    </button>
                </div>
            </div>

            {/* History Section */}
            {question && (
                <AttemptHistory
                question={question}
                    attempts={question.lastAttempts || []} // Pass whatever history we have
                    onSelectAttempt={openAttempt}
                />
            )}



            {/* RESULT MODAL */}
            {isResultOpen && viewAttempt && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity" onClick={() => setIsResultOpen(false)} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vh] lg:w-[60vw] lg:h-[80vh] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in zoom-in-50 duration-300">
                        {/* Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <CheckCircle className="text-green-500" size={24} />
                                Result Analysis
                            </h3>
                            <button onClick={() => setIsResultOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1">
                            {/* Score Header */}
                            <div className="flex flex-col items-center justify-center mb-10">
                                <div className="relative w-40 h-40">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke={viewAttempt.score === viewAttempt.maxScore ? "#22c55e" : "#3b82f6"}
                                            strokeWidth="12"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray="440"
                                            strokeDashoffset={440 - 440 * (viewAttempt.score / viewAttempt.maxScore)}
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl font-black text-slate-800">{viewAttempt.score}</span>
                                        <span className="text-sm text-slate-400 font-bold uppercase tracking-wider">/ {viewAttempt.maxScore}</span>
                                    </div>
                                </div>
                                <div className="mt-4 text-center">
                                    <h4 className="text-xl font-bold text-slate-800">
                                        {viewAttempt.score === viewAttempt.maxScore ? "Perfect Score!" : "Good Attempt"}
                                    </h4>
                                    <p className="text-slate-500 text-sm">You answered {viewAttempt.score} out of {viewAttempt.maxScore} correctly.</p>
                                </div>
                            </div>

                            {/* Review Content */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 leading-relaxed text-lg text-slate-700">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <Info size={16} /> Detailed Review
                                </h4>
                                {renderModalTranscript()}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => {
                                    setIsResultOpen(false);
                                    handleRedo();
                                }}
                                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                            >
                                Practice Again
                            </button>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}
