import { useState } from "react";
import {
  BarChart2,
  Shuffle,
  Play,
  Info,
  Eye
} from "lucide-react";
// import axios from "axios"; // Removed direct axios import
import api from "../../services/api";

const ImageAttemptHistory = ({ question, onSelectAttempt, module }) => {
  const [activeTab, setActiveTab] = useState("my_answer");

  const [myAttempts] = useState(question?.lastAttempts || []);
  const [communityAttempts, setCommunityAttempts] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);

  const attempts =
    activeTab === "my_answer" ? myAttempts : communityAttempts;

  const fetchCommunity = async () => {
    if (communityAttempts.length) return;

    try {
      setLoadingCommunity(true);
      const { data } = await api.get(
        `/${module}/community/${question._id}`
      );
      console.log(data?.data)
      setCommunityAttempts(data?.data || []);
    } catch (err) {
      console.error("Error fetching community attempts", err);
    } finally {
      setLoadingCommunity(false);
    }
  };

  // /* ---------------- EMPTY STATE ---------------- */
  // if (!attempts.length && activeTab === "my_answer") {
  //   return (
  //     <div className="mt-10 font-sans">
  //       <div className="flex gap-6 border-b mb-6">
  //         <Tab label="My Answer" active />
  //       </div>

  //       <EmptyState
  //         title="No attempts yet"
  //         subtitle="Complete the exercise to see your history"
  //       />
  //     </div>
  //   );
  // }

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
          />
        ))}

        {!attempts.length && activeTab === "community" && !loadingCommunity && (
          <EmptyState
            title="No community answers yet"
            subtitle="Be the first one to attempt this question"
          />
        )}
      </div>
    </div>
  );
};

export default ImageAttemptHistory;

/* -------------------------------------------------------------------------- */
/*                              SUB COMPONENTS                                 */
/* -------------------------------------------------------------------------- */

const Tab = ({ label, icon, count, active, onClick }) => (
  <button
    onClick={onClick}
    className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${active
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

const AttemptCard = ({ attempt, module, onSelectAttempt }) => {
  const scoreMax = module === "short-answer" ? 1 : 16;

  return (
    <div
      onClick={() => onSelectAttempt?.(attempt)}
      className="bg-white rounded-3xl p-5 border shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md cursor-pointer"
    >
      {/* Date */}
      <div className="min-w-[150px] text-sm font-bold text-slate-600">
        {new Date(attempt.createdAt).toLocaleDateString()}
      </div>

      {/* Score */}
      <div className="flex-1 flex flex-col sm:flex-row gap-4 items-center">
        <div className="bg-slate-50 px-4 py-3 rounded-xl border">
          <div className="text-[10px] font-bold text-slate-400 uppercase">
            Score
          </div>
          <div className="text-2xl font-black text-purple-600">
            {attempt.score}
            <span className="text-xs text-slate-400">/{scoreMax}</span>
          </div>

          {module !== "short-answer" && (
            <div className="flex gap-4 mt-2 text-xs">
              <ScoreItem label="Content" value={attempt.content} />
              <ScoreItem label="Fluency" value={attempt.fluency} />
              <ScoreItem label="Pron" value={attempt.pronunciation} />
            </div>
          )}
        </div>

        {/* Audio */}
        {attempt.studentAudio?.url && (
          <audio
            controls
            src={attempt.studentAudio.url}
            className="flex-1 h-10"
            onClick={(e) => e.stopPropagation()}
          />
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
