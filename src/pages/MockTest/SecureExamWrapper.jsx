import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

// Question Test Components
import APEUniMockTest from "./SectionalTest/Speaking";
import APEUniWritingMockTest from "./SectionalTest/Writing";
import APEUniListeningTest from "./SectionalTest/Listening";
import APEUniReadingTest from "./SectionalTest/Reading";
import ReadAloudMockTest from "./QuestionTest/ReadAloud";
import ReTellLectureMockTest from "./QuestionTest/ReTell";
import DescribeImageMockTest from "./QuestionTest/DescribeImage";
import RepeatSentenceMockTest from "./QuestionTest/RepeatSentence";
import SSTGroup from "./QuestionTest/SSTGroup";
import HIWGroup from "./QuestionTest/HIWGroup";
import SGDGroup from "./QuestionTest/SGDGroup";
import WriteEssay from "./QuestionTest/WriteEssay";
import SWT from "./QuestionTest/SWT";
import FIBR from "./QuestionTest/FIBR";
import FIBDMockTest from "./QuestionTest/FIBDMockTest";
import RO from "./QuestionTest/RO";
import  WFD  from "./QuestionTest/WFD";
import  FIBL  from "./QuestionTest/FIBL";
import RTS from "./QuestionTest/RTS";




export default function SecureExamWrapper() {
  const navigate = useNavigate();
  const { type } = useParams(); 
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get("id");

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= MAP TYPES TO COMPONENTS ================= */
 const COMPONENT_MAP = {
  speaking: APEUniMockTest,
  writing: APEUniWritingMockTest,
  reading: APEUniReadingTest,
  listening: APEUniListeningTest,
  RA: ReadAloudMockTest,
  RL: ReTellLectureMockTest,
  DI: DescribeImageMockTest,
  RS: RepeatSentenceMockTest,
  SST: SSTGroup,
  HIW: HIWGroup,
  SGD: SGDGroup,
  WE: WriteEssay,
  SWT: SWT,
  FIB: FIBR,
  FIBD: FIBDMockTest,
  RO: RO,
  WFD: WFD,
  FIBL: FIBL,
  RTS: RTS
};


  /* ================= FETCH QUESTION ================= */
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const res = await api.get(`question/${type.toLowerCase()}/${questionId}`);
        setQuestion(res.data.data);
      } catch (err) {
        console.error(err);
        // navigate("/mock-test"); // optionally redirect if not found
      } finally {
        setLoading(false);
      }
    };

    if (questionId && type) fetchQuestion();
  }, [type, questionId]);

  /* ================= UI ================= */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-400">
        Loading question...
      </div>
    );
  }

  if (!question) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        Question not found
      </div>
    );
  }

  // dynamically select the component
  const QuestionComponent = COMPONENT_MAP[type] || APEUniReadingTest;

  return <QuestionComponent backendData={question} />;
}
