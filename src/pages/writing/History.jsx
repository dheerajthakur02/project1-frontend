import { useState } from "react";
import {
  BarChart2,
  Shuffle,
  Eye,
  Info,
  CheckCircle,
  Target
} from "lucide-react";
import axios from "axios";

const WrittenAttemptHistory = ({ question, onSelectAttempt, module }) => {
  const [activeTab, setActiveTab] = useState("my_answer");

  const [myAttempts] = useState(question?.lastAttempts || []);
  const [communityAttempts, setCommunityAttempts] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);

  const attempts =
    activeTab === "my_answer" ? myAttempts : communityAttempts;

  /* ---------------- AI FEEDBACK ---------------- */
  const getAISuggestion = (score) => {
    if (score >= 11) {
      return {
        text: "Excellent work! Keep it up.",
        color: "text-green-700 bg-green-50 border-green-100",
        icon: <CheckCircle className="w-5 h-5 text-green-600" />
      };
    } else if (score >= 7) {
      return {
        text: "Good attempt. Focus more on key details.",
        color: "text-amber-700 bg-amber-50 border-amber-100",
        icon: <Target className="w-5 h-5 text-amber-600" />
      };
    } else {
      return {
        text: "Needs improvement. Work on clarity and structure.",
        color: "text-red-700 bg-red-50 border-red-100",
        icon: <Info className="w-5 h-5 text-red-600" />
      };
    }
  };

  /* ---------------- FETCH COMMUNITY ---------------- */
  const fetchCommunity = async () => {
    if (communityAttempts.length) return;

    try {
      setLoadingCommunity(true);
      const res = await axios.get(
        `/api/${module}/community/${question._id}`
      );

      // API returns questions array → pick first
      const data =
        res?.data?.data?.[0]?.communityAttempts || [];

      // Flatten user → attempts
      const flattened = data.flatMap((u) =>
        u.attempts.map((a) => ({
          ...a,
          user: u.user
        }))
      );

      setCommunityAttempts(flattened);
    } catch (err) {
      console.error("Error fetching community attempts", err);
    } finally {
      setLoadingCommunity(false);
    }
  };

  return (
    <div className="mt-12 font-sans">
      {/* ---------------- TABS ---------------- */}
      <div className="flex gap-6 border-b mb-6">
        <Tab
          label="My Answer"
          icon={<BarChart2 size={12} />}
          count={myAttempts.length}
          active={activeTab === "my_answer"}
          onClick={() => setActiveTab("my_answer")}
        />

        <Tab
          label="Community"
          icon={<Shuffle size={12} />}
          count={communityAttempts.length}
          active={activeTab === "community"}
          onClick={() => {
            setActiveTab("community");
            fetchCommunity();
          }}
        />
      </div>

      {/* ---------------- LOADER ---------------- */}
      {loadingCommunity && activeTab === "community" && (
        <div className="text-center py-8 text-slate-400 text-sm">
          Loading community answers...
        </div>
      )}

      {/* ---------------- ATTEMPTS LIST ---------------- */}
      <div className="space-y-4">
        {attempts.map((attempt, idx) => (
          <AttemptCard
            key={attempt._id || idx}
            attempt={attempt}
            module={module}
            onSelectAttempt={onSelectAttempt}
            aiSuggestion={getAISuggestion(attempt.score)}
          />
        ))}

        {!attempts.length && !loadingCommunity && (
          <EmptyState
            title={
              activeTab === "community"
                ? "No community answers yet"
                : "No attempts yet"
            }
            subtitle={
              activeTab === "community"
                ? "Be the first one to attempt this question"
                : "Complete the exercise to see your history"
            }
          />
        )}
      </div>
    </div>
  );
};

export default WrittenAttemptHistory;

/* -------------------------------------------------------------------------- */
/*                              SUB COMPONENTS                                 */
/* -------------------------------------------------------------------------- */

const Tab = ({ label, icon, count, active, onClick }) => (
  <button
    onClick={onClick}
    className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
      active
        ? "border-purple-600 text-purple-600"
        : "border-transparent text-slate-500 hover:text-slate-700"
    }`}
  >
    <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center">
      {icon}
    </div>
    {label}
    <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
      {count}
    </span>
  </button>
);

const AttemptCard = ({ attempt, module, onSelectAttempt, aiSuggestion }) => {
  const scoreMax = module === "essay" ? 16 : 15;

  return (
    <div
      onClick={() => onSelectAttempt?.(attempt)}
      className="bg-white rounded-3xl p-5 border shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md cursor-pointer"
    >
      {/* Date */}
      <div className="min-w-[150px] text-sm font-bold text-slate-600">
        {new Date(attempt.createdAt).toLocaleDateString()}
        {attempt.user?.name && (
          <div className="text-xs text-slate-400 mt-1">
            {attempt.user.name}
          </div>
        )}
      </div>

      {/* Score */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="bg-slate-50 px-4 py-3 rounded-xl border w-fit">
          <div className="text-[10px] font-bold text-slate-400 uppercase">
            Score
          </div>
          <div className="text-2xl font-black text-purple-600">
            {attempt.score}
            <span className="text-xs text-slate-400">/{scoreMax}</span>
          </div>

          <div className="flex gap-4 mt-2 text-xs">
            <ScoreItem label="Content" value={attempt.content} />
            <ScoreItem label="Grammar" value={attempt.grammar} />
            <ScoreItem label="Vocab" value={attempt.vocabulary} />
            {attempt.structure !== undefined && (
              <ScoreItem label="Structure" value={attempt.structure} />
            )}
            {attempt.form !== undefined && (
              <ScoreItem label="Form" value={attempt.form} />
            )}
          </div>
        </div>

        {/* AI Suggestion */}
        {aiSuggestion && (
          <div
            className={`flex items-center gap-3 text-xs px-4 py-2 rounded-xl border ${aiSuggestion.color}`}
          >
            {aiSuggestion.icon}
            {aiSuggestion.text}
          </div>
        )}
      </div>

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
  );
};

const ScoreItem = ({ label, value }) => (
  <div>
    <div className="font-bold text-slate-700">{value}</div>
    <div className="text-[9px] uppercase text-slate-400">{label}</div>
  </div>
);

const EmptyState = ({ title, subtitle }) => (
  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed">
    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border">
      <Info size={20} className="text-slate-300" />
    </div>
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <p className="text-xs mt-1 opacity-70">{subtitle}</p>
  </div>
);
