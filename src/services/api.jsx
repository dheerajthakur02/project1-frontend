import axios from 'axios';

const API_BASE_URL = "http://localhost:5000/api";

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



// You can add other services here like fetchQuestions, etc.