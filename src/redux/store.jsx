import { configureStore } from "@reduxjs/toolkit";
import questionReducer from "./slices/repeatSentenceSlice";
// import attemptReducer from "./slices/attemptSlice";

export const store = configureStore({
  reducer: {
    questions: questionReducer
   // attempts: attemptReducer
  }
});
