import { configureStore } from "@reduxjs/toolkit";
import questionReducer from "./slices/repeatSentenceSlice";
import authReducer from "./slices/authSlice.js"
// import attemptReducer from "./slices/attemptSlice";

export const store = configureStore({
  reducer: {
    questions: questionReducer,
   // attempts: attemptReducer
    auth:authReducer
  }
});
