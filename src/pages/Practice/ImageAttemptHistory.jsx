import { useState } from "react";
import { BarChart2, Shuffle, Play, Info, Eye } from "lucide-react";

const ImageAttemptHistory = ({ question, onSelectAttempt, module }) => {
  const [activeTab, setActiveTab] = useState("my_answer");
  const attempts = question?.lastAttempts || [];

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

  /* ---------------- EMPTY STATE ---------------- */
  if (!attempts.length) {
    return (
      <div className="mt-10 font-sans">
        <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
          <button className="pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 border-purple-600 text-purple-600">
            <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center">
              <BarChart2 size={12} />
            </div>
            My Answer
            <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">0</span>
          </button>
        </div>

        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border">
            <Info size={20} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium">No attempts yet</p>
          <p className="text-xs mt-1 opacity-70">
            Complete the exercise to see your history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 font-sans">
      {/* ---------------- TABS ---------------- */}
      <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("my_answer")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "my_answer"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center">
            <BarChart2 size={12} />
          </div>
          My Answer
          <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{attempts.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("community")}
          className="pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 border-transparent text-slate-400 cursor-not-allowed"
        >
          <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center">
            <Shuffle size={12} />
          </div>
          Community
        </button>
      </div>

      {/* ---------------- ATTEMPT LIST ---------------- */}
      <div className="space-y-4">
        {attempts.map((attempt, idx) => (
          <div
            key={idx}
            onClick={() => onSelectAttempt?.(attempt)}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            {/* Date */}
            <div className="min-w-[180px]">
              <span className="text-sm font-bold text-slate-600">
                {new Date(attempt.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Score and Details */}
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 w-full">
              <div className="bg-slate-50 px-4 py-3 rounded-xl border w-full sm:w-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Score</span>
                <div className="flex items-baseline gap-1">
                {module === "short-answer" ? (
                  <span
                    className={`text-2xl font-black ${
                      attempt.score >= 1
                        ? "text-green-600"
                        : attempt.score >= 0.5
                        ? "text-yellow-600"
                        : "text-red-500"
                    }`}
                  >
                    {attempt.score}
                  </span>
                ) : (
                  <span
                    className={`text-2xl font-black ${
                      attempt.score >= 13
                        ? "text-green-600"
                        : attempt.score >= 9
                        ? "text-yellow-600"
                        : "text-red-500"
                    }`}
                  >
                    {attempt.score}
                  </span>)}
                  <span className="text-xs text-slate-400">{module === "short-answer" ? "/1" : "/16"}</span>
                </div>

             {module !== "short-answer" && (   <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <div>
                    <span className="font-bold text-slate-700">{attempt.content}</span>
                    <div className="text-[9px] uppercase">Content</div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">{attempt.fluency}</span>
                    <div className="text-[9px] uppercase">Fluency</div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">{attempt.pronunciation}</span>
                    <div className="text-[9px] uppercase">Pron</div>
                  </div>
                </div>)}
              </div>

              {/* Audio Player */}
              <div className="flex-1 bg-slate-50 px-4 py-2.5 rounded-full border flex items-center gap-3 w-full">
                <button className="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-purple-600 hover:text-white transition">
                  <Play size={12} fill="currentColor" />
                </button>
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-400">Audio</span>
              </div>
            </div>

            {/* View Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectAttempt?.(attempt);
              }}
              className="p-2 text-slate-300 hover:text-purple-600"
            >
              <Eye size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageAttemptHistory;
