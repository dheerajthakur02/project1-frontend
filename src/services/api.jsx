import axios from 'axios';

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;



// Add interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403 && error.response.data.message === "PRACTICE_LIMIT_REACHED") {
      window.dispatchEvent(new Event("practiceLimitReached"));
    }
    return Promise.reject(error);
  }
);


export const submitRepeatAttempt = async (attemptData) => {
  // attemptData should be a FormData object
  try {
    const response = await axios.post(
      `${API_BASE_URL}/repeat-sentence/submit`,
      attemptData,
      {
        headers: { "Content-Type": "multipart/form-data" }
      }
    );

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const submitSummarizeGroupAttempt = async (attemptData) => {
  // attemptData should be a FormData object
  try {
    const response = await axios.post(
      `${API_BASE_URL}/summarize-group/submit`,
      attemptData,
      {
        headers: { "Content-Type": "multipart/form-data" }
      }
    );

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};


export const submitReTellAttempt = async (attemptData) => {
  // attemptData should be a FormData object
  try {
    const response = await axios.post(
      `${API_BASE_URL}/retell-lecture/submit`,
      attemptData,
      {
        headers: { "Content-Type": "multipart/form-data" }
      }
    );

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};



export const submitShortAnswerAttempt = async (attemptData) => {
  // attemptData should be a FormData object
  try {
    const response = await axios.post(
      `${API_BASE_URL}/short-answer/submit`,
      attemptData,
      {
        headers: { "Content-Type": "multipart/form-data" }
      }
    );

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};


export const submitDescribeImageAttempt = async (formData) => {
  const res = await axios.post(
    `${API_BASE_URL}/image/attempts`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  console.log("response", res?.data)
  return res.data;
};

export const submitRespondSituationAttempt = async (formData) => {
  const res = await axios.post(
    `${API_BASE_URL}/respond-situation/submit`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  console.log("response", res?.data)
  return res.data;
};

export const submitReadAloudAttempt = async (attemptData) => {
  try {
    const response = await api.post(
      `/question/ra/submit`,
      attemptData
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const getReadAloudHistory = async (questionId) => {
  try {
    const response = await api.get(`/attempts/history/${questionId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const submitSummarizeWrittenAttempt = async (data) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/summarize-text/submit`,
      data
    );
    console.log("submitSummarizeWrittenAttempt response:", response.data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
}

export const submitEssayAttempt = async (data) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/essay/submit`,
      data
    );
    console.log("submitEssayAttempt response:", response.data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
}



export const submitReadingFIBDropdownAttempt = async (data) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/reading-fib-dropdown/submit`,
      data
    );
    console.log("submitReadingFIBDropdownAttempt response:", response.data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
}


export const getReadingFIBDropdownAttempts = async (questionId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reading-fib-dropdown/attempts/${questionId}`, {
      withCredentials: true
    });
    console.log("All previous attempts of FIB:", response.data)
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const submitReadingMultiChoiceMultiAnswerAttempt = async (data) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/reading-multi-choice-multi-answer/submit`,
      data
    );
    console.log("submitReadingMultiChoiceMultiAnswerAttempt response:", response.data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
}

export const getReadingMultiChoiceMultiAnswerAttempts = async (questionId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reading-multi-choice-multi-answer/attempts/${questionId}`, {
      withCredentials: true
    });
    console.log("All previous attempts of Reading Multi Choice:", response.data)
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const submitReadingMultiChoiceSingleAnswerAttempt = async (data) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/reading-multi-choice-single-answer/submit`,
      data
    );
    console.log("submitReadingMultiChoiceSingleAnswerAttempt response:", response.data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
}

export const getReadingMultiChoiceSingleAnswerAttempts = async (questionId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reading-multi-choice-single-answer/attempts/${questionId}`, {
      withCredentials: true
    });
    console.log("All previous attempts of Reading Multi Choice Single:", response.data)
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const submitReadingFIBDragDropAttempt = async (data) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/reading-fib-drag-drop/submit`,
      data
    );
    console.log("submitReadingFIBDragDropAttempt response:", response.data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
}

export const getReadingFIBDragDropAttempts = async (questionId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reading-fib-drag-drop/attempts/${questionId}`, {
      withCredentials: true
    });
    console.log("All previous attempts of Reading FIB Drag Drop:", response.data)
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const submitReadingReorderAttempt = async (data) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/reading-reorder/submit`,
      data
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
}

export const getReadingReorderAttempts = async (questionId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reading-reorder/attempts/${questionId}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};


export const submitSummarizeSpokenAttempt = async (attemptData) => {
  // attemptData should be a FormData object
  try {
    const response = await axios.post(
      `${API_BASE_URL}/sst/submit`,
      attemptData,
      {
        headers: { "Content-Type": "multipart/form-data" }
      }
    );

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const submitHighlightAttempt = async (attemptData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/hcs/submit`,
      attemptData
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const submitChooseSingleAnswerAttempt = async (attemptData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/choose-single-answer/submit`,
      attemptData
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
}

export const submitSelectMissingWordAttempt = async (attemptData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/select-missing-word/submit`,
      attemptData
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
}
export const submitHIWAttempt = async (attemptData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/hiw/submit`,
      attemptData
    );
    console.log(response)
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
}

export const getListeningFIBQuestions = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/listening-fib/questions/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const submitListeningFIBAttempt = async (attemptData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/listening-fib/submit`,
      attemptData
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};


export const getListeningMCQMultipleQuestions = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/listening-multi-choice-multi-answer/questions/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const submitListeningMCQMultipleAttempt = async (attemptData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/listening-multi-choice-multi-answer/submit`,
      attemptData
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const getWriteFromDictationQuestions = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/write-from-dictation/questions/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const submitWriteFromDictationAttempt = async (attemptData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/write-from-dictation/submit`,
      attemptData
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

/* ================= FULL MOCK TEST ================= */

export const createFullMockTest = async (testData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/mocktest/full`, testData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const getAllFullMockTests = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/mocktest/full`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

export const getFullMockTestById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/mocktest/full/${id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

/* ================= RESULTS ================= */

export const getUserFullMockTestResults = async () => {
  const res = await api.get("/mocktest/full/results/my");
  return res.data;
};

export const getUserReadingResults = async () => {
  const res = await api.get("/question/reading/results/my");
  return res.data;
};

export const getUserSpeakingResults = async () => {
  const res = await api.get("/question/speaking/results/my");
  return res.data;
};

export const getUserWritingResults = async () => {
  // writingRoute.js doesn't have /results/my yet, checking...
  // Actually, I missed adding the route to writingRoute.js in the plan execution.
  // I need to fix writingRoute.js too.
  // For now I will add this here assuming I will fix backend next.
  // Wait, writingRoute line 14: router.get("/result/:resultId", ...); 
  // It does NOT have /results/my. 
  // I need to add getting ALL results for user.
  // Let's assume endpoint /question/writing/results/my
  const res = await api.get("/question/writing/results/my");
  return res.data;
};


export const getUserListeningResults = async () => {
  const res = await api.get("/question/listening/result/my");
  return res.data;
};

export const fetchUserProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};
