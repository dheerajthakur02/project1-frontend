import React, { useState, useEffect } from "react";
import api from "../../../services/api";

export default function RO({ backendData }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [globalTimeLeft, setGlobalTimeLeft] = useState(45 * 60); // 45 Minutes
  const [sourceList, setSourceList] = useState([]);
  const [targetList, setTargetList] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // Track which item is clicked for arrow controls

  const [userAnswers, setUserAnswers] = useState({}); // { [questionIdx]: [id1, id2...] }
  const [isFinished, setIsFinished] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  const questions = backendData?.reorderQuestions || [];
  const currentQuestion = questions[currentIdx];

  // Global Timer
  useEffect(() => {
    if (globalTimeLeft <= 0 || isFinished) return;
    const timer = setInterval(() => setGlobalTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [globalTimeLeft, isFinished]);

  // Initialize Source and Target lists when question changes
  useEffect(() => {
    if (currentQuestion) {
      // Shuffling the sentences for the source side
      const shuffled = [...currentQuestion.sentences].sort(() => Math.random() - 0.5);
      setSourceList(shuffled);
      setTargetList([]);
      setSelectedId(null);
    }
  }, [currentIdx, currentQuestion]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // --- LOGIC HANDLERS ---

  const moveRight = (id) => {
    const item = sourceList.find((s) => s.id === id);
    if (!item) return;
    setSourceList(sourceList.filter((s) => s.id !== id));
    setTargetList([...targetList, item]);
    setSelectedId(id);
  };

  const moveLeft = (id) => {
    const item = targetList.find((s) => s.id === id);
    if (!item) return;
    setTargetList(targetList.filter((s) => s.id !== id));
    setSourceList([...sourceList, item]);
    setSelectedId(id);
  };

  const moveUp = () => {
    const idx = targetList.findIndex((s) => s.id === selectedId);
    if (idx <= 0) return;
    const newList = [...targetList];
    [newList[idx], newList[idx - 1]] = [newList[idx - 1], newList[idx]];
    setTargetList(newList);
  };

  const moveDown = () => {
    const idx = targetList.findIndex((s) => s.id === selectedId);
    if (idx < 0 || idx === targetList.length - 1) return;
    const newList = [...targetList];
    [newList[idx], newList[idx + 1]] = [newList[idx + 1], newList[idx]];
    setTargetList(newList);
  };

  // --- DRAG AND DROP HANDLERS ---
  const onDragStart = (e, id, from) => {
    e.dataTransfer.setData("id", id);
    e.dataTransfer.setData("from", from);
  };

  const onDropToTarget = (e) => {
    const id = e.dataTransfer.getData("id");
    const from = e.dataTransfer.getData("from");
    if (from === "source") moveRight(id);
  };

  const onDropToSource = (e) => {
    const id = e.dataTransfer.getData("id");
    const from = e.dataTransfer.getData("from");
    if (from === "target") moveLeft(id);
  };

  const saveCurrentAnswer = () => {
    // Save ordered IDs
    const currentOrder = targetList.map(t => t.id);
    setUserAnswers(prev => ({
      ...prev,
      [currentIdx]: currentOrder
    }));
    return { ...userAnswers, [currentIdx]: currentOrder }; // Return updated state proxy
  };

  const handleNext = () => {
    const updatedAnswers = saveCurrentAnswer();

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      submitTest(updatedAnswers);
    }
  };

  const submitTest = async (finalAnswers) => {
    setIsFinished(true);
    setIsLoadingResult(true);
    try {
      const { data } = await api.post("/question/ro/submit", {
        testId: backendData._id || questions[0]?._id,
        answers: finalAnswers
      });
      if (data.success) {
        setTestResult(data.data);
      }
    } catch (err) {
      console.error("Submit Error:", err);
    } finally {
      setIsLoadingResult(false);
    }
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
        {isLoadingResult ? (
          <div className="text-xl font-bold text-[#008199]">Calculating Scores...</div>
        ) : (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Test Result</h1>
            <div className="p-8 border rounded-lg bg-blue-50 shadow-md inline-block">
              <div className="text-4xl font-bold text-[#008199] mb-2">{testResult?.overallScore || 0} / {testResult?.totalMaxScore || 0}</div>
              <div className="text-gray-600 uppercase tracking-wide text-sm font-semibold">Your Score</div>
            </div>
            <div className="mt-10">
              <button
                onClick={() => window.location.reload()}
                className="bg-[#008199] text-white px-8 py-3 rounded uppercase font-bold text-sm shadow hover:bg-[#006b81] transition-colors"
              >
                Retake Practice
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!currentQuestion) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col font-sans select-none overflow-hidden text-gray-800">
      {/* Header */}
      <div className="bg-[#eeeeee] border-b border-gray-300">
        <div className="px-4 py-2 flex justify-between items-center">
          <span className="text-xl text-gray-700 font-medium">Pawan PTE Mock Test</span>
          <div className="flex flex-col items-end text-[13px] text-gray-600">
            <div className="flex items-center gap-1 font-semibold">
              <span className="material-icons-outlined text-base">schedule</span>
              <span>Time Remaining {formatTime(globalTimeLeft)}</span>
            </div>
            <span>{currentIdx + 1} of {questions.length}</span>
          </div>
        </div>
        <div className="h-9 bg-[#008199]"></div>
      </div>

      {/* Main Content */}
      <div className="flex-grow bg-white p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <p className="text-[13px] mb-8">
            The text boxes below have been placed in a random order. Restore the original order by dragging the text boxes.
          </p>

          <div className="flex items-center justify-center gap-4 mt-4">
            {/* SOURCE BOX */}
            <div className="flex flex-col items-center flex-1">
              <span className="text-[13px] font-bold mb-2">Source</span>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDropToSource}
                className="w-full min-h-[400px] border-2 border-black p-4 flex flex-col gap-3 bg-white shadow-sm"
              >
                {sourceList.map((s, index) => (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, s.id, "source")}
                    onClick={() => setSelectedId(s.id)}
                    className={`p-3 border border-gray-300 rounded text-[14px] cursor-pointer hover:bg-gray-50 transition-colors shadow-sm
                        ${selectedId === s.id ? 'bg-[#e6f7ff] border-[#1890ff] ring-1 ring-[#1890ff]' : 'bg-gray-50'}`}
                  >
                    {s.text}
                  </div>
                ))}
              </div>
            </div>

            {/* MIDDLE CONTROLS */}
            <div className="flex flex-col gap-4 px-2">
              <button
                onClick={() => moveRight(selectedId)}
                className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 shadow-sm transition-colors text-gray-600 hover:text-[#008199]"
                title="Move Right"
              >
                <span className="material-icons text-2xl">arrow_forward</span>
              </button>
              <button
                onClick={() => moveLeft(selectedId)}
                className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 shadow-sm transition-colors text-gray-600 hover:text-[#008199]"
                title="Move Left"
              >
                <span className="material-icons text-2xl">arrow_back</span>
              </button>
            </div>

            {/* TARGET BOX */}
            <div className="flex flex-col items-center flex-1">
              <span className="text-[13px] font-bold mb-2">Target</span>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDropToTarget}
                className="w-full min-h-[400px] border-2 border-black p-4 flex flex-col gap-3 bg-white shadow-sm"
              >
                {targetList.map((s, idx) => (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, s.id, "target")}
                    onClick={() => setSelectedId(s.id)}
                    className={`p-3 border border-gray-300 rounded text-[14px] cursor-pointer hover:bg-gray-50 transition-colors shadow-sm
                        ${selectedId === s.id ? 'bg-[#e6f7ff] border-[#1890ff] ring-1 ring-[#1890ff]' : 'bg-white'}`}
                  >
                    <span className="font-bold text-[#008199] mr-2">{idx + 1})</span>
                    {s.text}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT CONTROLS */}
            <div className="flex flex-col gap-4 px-2">
              <button
                onClick={moveUp}
                className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 shadow-sm transition-colors text-gray-600 hover:text-[#008199]"
                title="Move Up"
              >
                <span className="material-icons text-2xl">arrow_upward</span>
              </button>
              <button
                onClick={moveDown}
                className="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 shadow-sm transition-colors text-gray-600 hover:text-[#008199]"
                title="Move Down"
              >
                <span className="material-icons text-2xl">arrow_downward</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="h-16 bg-[#eeeeee] border-t border-gray-300 flex items-center justify-between px-6">
        <button className="bg-white border border-gray-400 px-6 py-1.5 rounded-sm text-sm text-gray-700 hover:bg-gray-100 font-medium">
          Save and Exit
        </button>
        <button
          onClick={handleNext}
          className="bg-[#008199] text-white px-10 py-1.5 rounded-md text-sm font-bold shadow-md hover:bg-[#006b81] tracking-wide"
        >
          {currentIdx === questions.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}