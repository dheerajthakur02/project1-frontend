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


// You can add other services here like fetchQuestions, etc.