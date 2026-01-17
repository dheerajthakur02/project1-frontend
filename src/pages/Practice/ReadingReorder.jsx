import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Shuffle, Hash, BarChart2, Info, X, GripVertical, ArrowRight } from 'lucide-react';
import { submitReadingReorderAttempt, getReadingReorderAttempts } from '../../services/api';
import { useSelector } from 'react-redux';

const AttemptHistory = ({ questionId, currentAttemptId, onSelectAttempt }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!questionId) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await getReadingReorderAttempts(questionId);
                if (res.success) {
                    setHistory(res.data);
                }
            } catch (err) {
                console.error('Failed to fetch history', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [questionId, currentAttemptId]);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading history...</div>;

    if (history.length === 0) {
        return (
            <div className="mt-8 font-sans">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart2 className="text-purple-600" size={20} />
                    <h3 className="font-bold text-slate-800">Your Attempts</h3>
                </div>
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                        <Info size={20} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">No attempts yet</p>
                    <p className="text-xs mt-1 opacity-70">Complete the exercise to see your history</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12 font-sans">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
                <BarChart2 className="text-purple-600" size={20} />
                <h3 className="font-bold text-slate-800">History ({history.length})</h3>
            </div>

            <div className="space-y-4">
                {history.map((attempt) => (
                    <div
                        key={attempt._id}
                        onClick={() => onSelectAttempt?.(attempt)}
                        className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow group cursor-pointer"
                    >
                        <div className="min-w-[150px]">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Date</span>
                            <div className="text-sm font-semibold text-slate-700">
                                {new Date(attempt.createdAt).toLocaleString('en-US', {
                                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                })}
                            </div>
                        </div>

                        <div className="flex-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Score</span>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-xl font-bold ${attempt.score === attempt.maxScore ? 'text-green-600' :
                                    attempt.score > (attempt.maxScore / 2) ? 'text-blue-600' : 'text-red-500'
                                    }`}>
                                    {attempt.score}
                                </span>
                                <span className="text-sm text-slate-400 font-medium">/ {attempt.maxScore}</span>
                            </div>
                        </div>

                        <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${attempt.score === attempt.maxScore ? 'bg-green-100 text-green-700' :
                                'bg-slate-100 text-slate-600'
                                }`}>
                                {attempt.score === attempt.maxScore ? 'Perfect' : 'Completed'}
                            </span>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 font-bold text-sm">
                            View Result &rarr;
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ReadingReorder = ({ question, setActiveSpeechQuestion, nextButton, previousButton, shuffleButton }) => {
    const { user } = useSelector((state) => state.auth);
    const [sourceItems, setSourceItems] = useState([]);
    const [targetItems, setTargetItems] = useState([]);
    const [result, setResult] = useState(null);
    const [isResultOpen, setIsResultOpen] = useState(false);
    const [viewAttempt, setViewAttempt] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);

    // Initialize
    useEffect(() => {
        if (question && question.sentences) {
            resetForm();
        }
    }, [question]);

    const resetForm = () => {
        if (!question) return;
        // Shuffle source items for display
        const items = [...question.sentences];
        // Fisher-Yates shuffle or simplified sort
        const shuffled = items.sort(() => Math.random() - 0.5);

        setSourceItems(shuffled);
        setTargetItems([]);
        setResult(null);
        setIsResultOpen(false);
        setViewAttempt(null);
    };

    const handleDragStart = (e, item, source) => {
        setDraggedItem({ item, source }); // source: 'source' or 'target'
        e.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, source }));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDropOnTarget = (e) => {
        e.preventDefault();
        if (!draggedItem) return;

        const { item, source } = draggedItem;

        if (source === 'source') {
            // Move from source to target
            setSourceItems(prev => prev.filter(i => i.id !== item.id));
            setTargetItems(prev => [...prev, item]);
        } else if (source === 'target') {
            // Check if dropped on another item for reordering could be complex
            // For now simple append if dropped on container. 
            // Better: implement sortable list logic later
        }
        setDraggedItem(null);
    };

    // Helper for dropping specifically into a position in target list
    // Not implemented fully here to keep it simple first

    const moveToTarget = (item) => {
        setSourceItems(prev => prev.filter(i => i.id !== item.id));
        setTargetItems(prev => [...prev, item]);
    }

    const moveToSource = (item) => {
        setTargetItems(prev => prev.filter(i => i.id !== item.id));
        setSourceItems(prev => [...prev, item]);
    }

    const handleSubmit = async () => {
        if (!user?._id) return;

        // userOrder needs to be array of IDs
        const userOrder = targetItems.map(item => item.id);

        const payload = {
            userId: user._id,
            questionId: question._id,
            userOrder
        };

        try {
            const res = await submitReadingReorderAttempt(payload);
            if (res.success) {
                setResult(res.data);
                setViewAttempt(res.data);
                setIsResultOpen(true);
            }
        } catch (error) {
            console.error("Submission failed", error);
        }
    };

    // Calculate filled status
    const totalItems = question?.sentences?.length || 0;
    const isSubmitDisabled = targetItems.length !== totalItems; // Must use all items? Usually yes in Reorder.


    return (
        <div className="max-w-6xl mx-auto space-y-6 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => setActiveSpeechQuestion(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Re-order Paragraph
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Reading</span>
                    </h1>
                </div>
            </div>

            {/* Main Interface: Split Pane */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[600px]">

                {/* SOURCE COLUMN */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-white">
                        <h3 className="font-bold text-slate-700">Source</h3>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto space-y-3">
                        {sourceItems.map((item) => (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item, 'source')}
                                onClick={() => moveToTarget(item)}
                                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-grab active:cursor-grabbing transition-all flex gap-4 group"
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    {/* Usually source doesn't have letters A/B/C fixed, but purely content */}
                                    {/* Or use item.id if it is A,B,C... */}
                                    <GripVertical size={16} />
                                </div>
                                <p className="text-slate-700 text-sm leading-relaxed select-none">{item.text}</p>
                            </div>
                        ))}
                        {sourceItems.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                <span className="text-sm">All items moved</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* TARGET COLUMN */}
                <div
                    className="bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col overflow-hidden"
                    onDragOver={handleDragOver}
                    onDrop={handleDropOnTarget}
                >
                    <div className="px-6 py-4 border-b border-blue-100 bg-blue-50">
                        <h3 className="font-bold text-blue-800">Your Answer</h3>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto space-y-3">
                        {targetItems.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <span className="text-sm">+ Drag here</span>
                            </div>
                        )}
                        {targetItems.map((item, index) => (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item, 'target')}
                                onClick={() => moveToSource(item)}
                                className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm cursor-grab active:cursor-grabbing flex gap-4"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 border border-blue-200 shadow-sm">
                                    {/* Dynamic Alphabet Index logic if needed, or just specific visual */}
                                    {String.fromCharCode(65 + index)}
                                </div>
                                <p className="text-slate-700 text-sm leading-relaxed select-none">{item.text}</p>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-white/50 border-t border-blue-100 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitDisabled}
                            className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center gap-2
                                ${isSubmitDisabled ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-primary-600 hover:bg-primary-700 hover:shadow-primary-200'}
                            `}
                        >
                            <CheckCircle size={20} />
                            Submit Answer
                        </button>
                    </div>
                </div>

            </div>

            {/* History Section */}
            {question && (
                <AttemptHistory
                    questionId={question._id}
                    currentAttemptId={result?._id}
                    onSelectAttempt={(a) => {
                        setViewAttempt(a);
                        setIsResultOpen(true);
                    }}
                />
            )}

            {/* Footer Nav */}
            <div className="flex items-center justify-center gap-6 py-6">
                <button onClick={previousButton} className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary-600 transition-colors group">
                    <div className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center bg-white shadow-sm group-hover:border-primary-200 group-hover:shadow-md transition-all"><ChevronLeft size={24} /></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Previous</span>
                </button>
                <button onClick={resetForm} className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary-600 transition-colors group">
                    <div className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center bg-white shadow-sm group-hover:border-primary-200 group-hover:shadow-md transition-all"><RefreshCw size={20} /></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Redo</span>
                </button>
                <button onClick={shuffleButton} className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary-600 transition-colors group">
                    <div className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center bg-white shadow-sm group-hover:border-primary-200 group-hover:shadow-md transition-all"><Shuffle size={20} /></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Shuffle</span>
                </button>
                <button onClick={nextButton} className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary-600 transition-colors group">
                    <div className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center bg-white shadow-sm group-hover:border-primary-200 group-hover:shadow-md transition-all"><ChevronRight size={24} /></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Next</span>
                </button>
            </div>

            {/* Result Modal */}
            {isResultOpen && viewAttempt && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity" onClick={() => setIsResultOpen(false)} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in zoom-in-50 duration-300">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <CheckCircle className="text-green-500" size={16} />
                                Result Analysis
                            </h3>
                            <button onClick={() => setIsResultOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1 bg-white">
                            {/* Score Header */}
                            <div className="flex flex-col items-center justify-center mb-4">
                                <div className="text-2xl font-black text-slate-800 mb-0.5">{viewAttempt.score} <span className="text-sm text-slate-400 font-medium">/ {viewAttempt.maxScore}</span></div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">Adjacent Pair Score</div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">

                                {/* LEFT COLUMN: CORRECT ORDER (SOURCE) */}
                                <div>
                                    <h4 className="font-bold text-xs text-slate-800 mb-2 pb-2 border-b border-slate-100">Correct Order</h4>
                                    <div className="space-y-0 relative">
                                        {/* Render items in CORRECT ORDER */}
                                        {question.correctOrder.map((itemId, idx) => {
                                            const item = question.sentences.find(s => s.id === itemId);
                                            const isLast = idx === question.correctOrder.length - 1;

                                            return (
                                                <div key={itemId} className="relative pb-3 last:pb-0">
                                                    {/* Connector Line (Green) - Only if not last */}
                                                    {!isLast && (
                                                        <div className="absolute left-4 top-8 bottom-0 w-0 border-l border-dashed border-green-500 z-0"></div>
                                                    )}

                                                    {/* Connector Icon (Green Check) - Only if not last */}
                                                    {!isLast && (
                                                        <div className="absolute left-4 -ml-1.5 top-[100%] -mt-2.5 z-10 w-3 h-3 rounded-full bg-green-100 text-green-600 flex items-center justify-center border border-green-200 shadow-sm">
                                                            <CheckCircle size={8} fill="currentColor" className="text-green-500" />
                                                        </div>
                                                    )}

                                                    {/* Card */}
                                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 relative z-10 flex gap-3 shadow-sm items-start">
                                                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-md shadow-blue-200 mt-0.5">
                                                            {itemId}
                                                        </div>
                                                        <div className="text-slate-700 leading-snug text-xs font-medium">
                                                            {item?.text}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: MY ANSWER */}
                                <div>
                                    <h4 className="font-bold text-xs text-slate-800 mb-2 pb-2 border-b border-slate-100">My Answer</h4>
                                    <div className="space-y-0 relative">
                                        {viewAttempt.userOrder.map((itemId, idx) => {
                                            const item = question.sentences.find(s => s.id === itemId);
                                            const isLast = idx === viewAttempt.userOrder.length - 1;

                                            // Determination of relation to NEXT item
                                            let isPairCorrect = false;
                                            if (!isLast) {
                                                const nextId = viewAttempt.userOrder[idx + 1];
                                                const pairStr = `${itemId}-${nextId}`;
                                                // Check result
                                                const pairResult = viewAttempt.pairResults.find(p => p.pair === pairStr);
                                                isPairCorrect = pairResult?.isCorrect;
                                            }

                                            return (
                                                <div key={idx} className="relative pb-3 last:pb-0">
                                                    {/* Connector Line - Only if not last */}
                                                    {!isLast && (
                                                        <div className={`absolute left-4 top-8 bottom-0 w-0 border-l border-dashed z-0 ${isPairCorrect ? 'border-green-500' : 'border-red-400'}`}></div>
                                                    )}

                                                    {/* Connector Icon - Only if not last */}
                                                    {!isLast && (
                                                        <div className={`absolute left-4 -ml-1.5 top-[100%] -mt-2.5 z-10 w-3 h-3 rounded-full flex items-center justify-center border shadow-sm ${isPairCorrect ? 'bg-green-100 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-500'}`}>
                                                            {isPairCorrect ?
                                                                <CheckCircle size={8} fill="currentColor" className="text-green-500" /> :
                                                                <X size={8} strokeWidth={3} />
                                                            }
                                                        </div>
                                                    )}

                                                    {/* Card */}
                                                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 relative z-10 flex gap-3 shadow-sm items-start">
                                                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-md shadow-blue-200 mt-0.5">
                                                            {itemId}
                                                        </div>
                                                        <div className="text-slate-700 leading-snug text-xs font-medium">
                                                            {item?.text}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={() => { setIsResultOpen(false); resetForm(); }} className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 text-xs">
                                <RefreshCw size={12} />
                                Practice Again
                            </button>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
};

export default ReadingReorder;
