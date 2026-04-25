import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { EventItem } from "../types";
import { normalizeLang } from "../utils/langUrl";

const API_URL = process.env.REACT_APP_API_URL;

interface EventsState {
  items: EventItem[];
  loading: boolean;
  error: string | null;
}

const initialState: EventsState = {
  items: [],
  loading: false,
  error: null
};

export const fetchEvents = createAsyncThunk<EventItem[], string | undefined>("events/fetchEvents", async (langArg) => {
  const lang = normalizeLang(langArg ?? null) ?? "be";
  const response = await fetch(`${API_URL}/events?lang=${lang}`);
  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }
  return response.json() as Promise<EventItem[]>;
});

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    setEvents: (state, action: PayloadAction<EventItem[]>) => {
      state.items = action.payload;
    },
    deleteEvent: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((event) => event._id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Unknown error";
      });
  }
});

export const { setEvents, deleteEvent } = eventsSlice.actions;
export default eventsSlice.reducer;
