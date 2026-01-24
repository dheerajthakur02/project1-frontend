import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout/DashboardLayout";
import api from "../../services/api";

/* ================= CONFIG ================= */
const MAIN_TABS = ["Full Tests", "Section Tests", "Question Tests"];
const SECTION_TABS = ["All", "Speaking", "Writing", "Reading", "Listening"];
const QUESTION_TABS = [
  { id: "Q_ALL", label: "All", api: "all" },
  { id: "RA", label: "Read Aloud", api: "question/ra" },
  { id: "RS", label: "Repeat Sentence", api: "question/rs" },
  { id: "DI", label: "Describe Image", api: "question/di" },
  { id: "RL", label: "Re-tell Lecture", api: "question/rl" },
  { id: "SGD", label: "Summarize Group Discussion", api: "question/sgd" },
  { id: "RTS", label: "Re-tell Section", api: "question/rts" },
  { id: "WE", label: "Write Essay", api: "question/we" },
  { id: "SWT", label: "Summarize Written Text", api: "question/swt" },
  { id: "FIB", label: "Fill in the Blanks", api: "question/fib" },
  { id: "FIBD", label: "FIB Dropdown", api: "question/fibd" },
  { id: "RO", label: "Reading Order", api: "question/ro" },
  { id: "WFD", label: "Write from Dictation", api: "question/wfd" },
  { id: "SST", label: "Summarize Spoken Text", api: "question/sst" },
  { id: "FIB-L", label: "FIB Listening", api: "question/fib-l" },
  { id: "HIW", label: "Highlight Incorrect Words", api: "question/hiw" },
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
        const [speaking, writing, listening, reading] = await Promise.all([
          api.get("question/speaking"),
          api.get("question/writing"),
          api.get("question/listening"),
          api.get("question/reading"),
        ]);

        const combined = [
          ...(speaking.data?.data || []).map(q => ({ ...q, __section: "speaking" })),
          ...(writing.data?.data || []).map(q => ({ ...q, __section: "writing" })),
          ...(listening.data?.data || []).map(q => ({ ...q, __section: "listening" })),
          ...(reading.data?.data || []).map(q => ({ ...q, __section: "reading" })),
        ];

        setQuestions(combined);
      } else {
        const res = await api.get(`question/${section.toLowerCase()}`);
        setQuestions(
          (res.data?.data || []).map(q => ({ ...q, __section: section.toLowerCase() }))
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
        const requests = QUESTION_TABS.filter(t => t.id !== "Q_ALL").map(t => api.get(`/${t.api}`));
        const responses = await Promise.all(requests);
        const combined = responses.flatMap((res, idx) =>
          (res.data?.data || []).map(q => ({
            ...q,
            __questionType: QUESTION_TABS[idx + 1].id,
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

  /* ================= FETCH FULL MOCK TESTS ================= */

  const fetchFullMockTests = async () => {
    setLoading(true);
    setQuestions([]);
    try {
      const res = await api.get("/mocktest/full");
      // Backend returns { success: true, data: [...] }
      setQuestions(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= URL → STATE ================= */
  useEffect(() => {
    const module = searchParams.get("module");
    if (!module) {
      // Default to Full Tests if no module param
      if (activeMainTab === "Full Tests") {
        fetchFullMockTests();
      }
      return;
    }

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
  }, [searchParams, activeMainTab]);

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

  const handleQuestionNavigate = (q) => {
    if (q.__questionType) {
      navigate(`/question/${q.__questionType}?id=${q._id}`);
      return;
    }
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
                activeMainTab === tab ? "border-b-4 border-emerald-500 text-black" : "text-slate-400"
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
                label={tab.id}
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
            <p className="p-10 text-center text-slate-400">Select a category to view questions</p>
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
                  <h4 className="font-semibold">{q.title || q.name || "Untitled Question"}</h4>
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
        active ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
