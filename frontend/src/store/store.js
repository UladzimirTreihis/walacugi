import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import newsReducer from "./newsSlice";
import eventsReducer from "./eventsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    news: newsReducer,
    events: eventsReducer
  },
});
