import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import APEUniMockTest from "./SectionalTest/Speaking";
import APEUniWritingMockTest from "./SectionalTest/Writing";
import APEUniListeningTest from "./SectionalTest/Listening";
import ReadAloudMockTest from "./QuestionTest/ReadAloud";

export default function SecureExamWrapper() {
  const navigate = useNavigate();
  const { type } = useParams(); // RA / RS / HIW
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get("id");


  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);




  /* ================= FETCH QUESTION ================= */

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);

        // 🔥 BACKEND API (adjust if needed)
        const res = await api.get(
          `/${type.toLowerCase()}/${questionId}`
        );
        setQuestion(res.data.data);
      } catch (err) {
        console.error(err);
        // navigate("/mock-test");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
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
return (
  <>  
    {type === "speaking" ? <APEUniMockTest backendData={question} /> : type === "writing" ? <APEUniWritingMockTest backendData={question} /> : 
    type === "RA"?<ReadAloudMockTest backendData={question} />
    :<APEUniListeningTest backendData={question} />
    
    }
  </>
);

}
