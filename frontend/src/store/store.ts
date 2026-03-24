import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import newsReducer from "./newsSlice";
import eventsReducer from "./eventsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    news: newsReducer,
    events: eventsReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
