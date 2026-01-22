import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout/DashboardLayout";
import api from "../../services/api";

/* ================= CONFIG ================= */

const MAIN_TABS = ["Full Tests", "Section Tests", "Question Tests"];

const SECTION_TABS = ["All", "Speaking", "Writing", "Listening"];

const QUESTION_TABS = [
  { id: "Q_ALL", label: "All", api: "all" },
  { id: "RA", label: "Read Aloud", api: "ra" },
  { id: "RS", label: "Repeat Sentence", api: "rs" },
  { id: "DI", label: "Describe Image", api: "di" },
  { id: "RL", label: "Re-tell Lecture", api: "rl" },
  { id: "SST", label: "Summarize Spoken Text", api: "sst" },
  { id: "HIW", label: "Highlight Incorrect Words", api: "hiw" },
];

/* ================= COMPONENT ================= */

export default function MockTest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeMainTab, setActiveMainTab] = useState("Full Tests");
  const [activeSubTab, setActiveSubTab] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH SECTION TESTS ================= */

  const fetchSectionQuestions = async (section) => {
    setLoading(true);
    setQuestions([]);

    try {
      if (section === "All") {
        const [speaking, writing, listening] = await Promise.all([
          api.get("/speaking"),
          api.get("/writing"),
          api.get("/listening"),
        ]);

        const speakingQ = (speaking.data?.data || []).map(q => ({
          ...q,
          __section: "speaking",
        }));

        const writingQ = (writing.data?.data || []).map(q => ({
          ...q,
          __section: "writing",
        }));

        const listeningQ = (listening.data?.data || []).map(q => ({
          ...q,
          __section: "listening",
        }));

        setQuestions([...speakingQ, ...writingQ, ...listeningQ]);
      } else {
        const res = await api.get(`/${section.toLowerCase()}`);
        setQuestions(
          (res.data?.data || []).map(q => ({
            ...q,
            __section: section.toLowerCase(),
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH QUESTION TESTS ================= */

  const fetchQuestionType = async (tab) => {
    setLoading(true);
    setQuestions([]);

    try {
      if (tab.id === "Q_ALL") {
        const requests = QUESTION_TABS
          .filter(t => t.id !== "Q_ALL")
          .map(t => api.get(`/${t.api}`));

        const responses = await Promise.all(requests);

        const combined = responses.flatMap((res, idx) =>
          (res.data?.data || []).map(q => ({
            ...q,
            __questionType: QUESTION_TABS[idx + 1].id, // RA, RS, etc.
          }))
        );

        setQuestions(combined);
      } else {
        const res = await api.get(`/${tab.api}`);
        setQuestions(
          (res.data?.data || []).map(q => ({
            ...q,
            __questionType: tab.id,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= URL → STATE ================= */

  useEffect(() => {
    const module = searchParams.get("module");
    if (!module) return;

    if (SECTION_TABS.includes(module)) {
      setActiveMainTab("Section Tests");
      setActiveSubTab(module);
      fetchSectionQuestions(module);
      return;
    }

    const qTab = QUESTION_TABS.find(q => q.id === module);
    if (qTab) {
      setActiveMainTab("Question Tests");
      setActiveSubTab(qTab.id);
      fetchQuestionType(qTab);
    }
  }, [searchParams]);

  /* ================= HANDLERS ================= */

  const handleMainTabClick = (tab) => {
    setActiveMainTab(tab);
    setActiveSubTab(null);
    setQuestions([]);
    navigate("/mock-test");
  };

  const handleSectionClick = (section) => {
    setActiveSubTab(section);
    navigate(`/mock-test?module=${section}`);
  };

  const handleQuestionClick = (tab) => {
    setActiveSubTab(tab.id);
    navigate(`/mock-test?module=${tab.id}`);
  };

  /* ================= CORRECT NAVIGATION ================= */

  const handleQuestionNavigate = (q) => {
    // Question Tests → RA / RS / DI / etc.
    if (q.__questionType) {
      navigate(`/question/${q.__questionType}?id=${q._id}`);
      return;
    }

    // Section Tests → speaking / writing / listening
    navigate(`/question/${q.__section}?id=${q._id}`);
  };

  /* ================= UI ================= */

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* MAIN TABS */}
        <div className="flex border-b">
          {MAIN_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => handleMainTabClick(tab)}
              className={`flex-1 py-4 font-bold ${
                activeMainTab === tab
                  ? "border-b-4 border-emerald-500 text-black"
                  : "text-slate-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SUB TABS */}
        <div className="flex flex-wrap gap-3">
          {activeMainTab === "Section Tests" &&
            SECTION_TABS.map(tab => (
              <SubTab
                key={tab}
                label={tab}
                active={activeSubTab === tab}
                onClick={() => handleSectionClick(tab)}
              />
            ))}

          {activeMainTab === "Question Tests" &&
            QUESTION_TABS.map(tab => (
              <SubTab
                key={tab.id}
                label={tab.label}
                active={activeSubTab === tab.id}
                onClick={() => handleQuestionClick(tab)}
              />
            ))}
        </div>

        {/* QUESTIONS */}
        <div className="bg-white border rounded-xl overflow-hidden">
          {loading ? (
            <p className="p-10 text-center text-slate-400">Loading…</p>
          ) : questions.length === 0 ? (
            <p className="p-10 text-center text-slate-400">
              Select a category to view questions
            </p>
          ) : (
            questions.map((q, index) => (
              <div
                key={q._id}
                onClick={() => handleQuestionNavigate(q)}
                className="flex justify-between items-center p-4 border-b hover:bg-slate-50 cursor-pointer"
              >
                <div>
                  <p className="text-xs text-slate-400">
                    {q.__questionType || q.__section} • Question {index + 1}
                  </p>
                  <h4 className="font-semibold">
                    {q.title || q.name || "Untitled Question"}
                  </h4>
                </div>
                <span className="px-3 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">
                  {q.difficulty || "Medium"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ================= SUB TAB ================= */

function SubTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-full text-xs font-bold transition ${
        active
          ? "bg-emerald-500 text-white"
          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
