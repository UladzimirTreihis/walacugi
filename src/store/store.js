import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import newsReducer from "./newsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    news: newsReducer
  },
});
