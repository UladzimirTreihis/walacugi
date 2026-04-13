import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import newsReducer from "./newsSlice";
import eventsReducer from "./eventsSlice";
import equipmentReducer from "./equipmentSlice";
import checkoutReducer from "./checkoutSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    news: newsReducer,
    events: eventsReducer,
    equipment: equipmentReducer,
    checkout: checkoutReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
