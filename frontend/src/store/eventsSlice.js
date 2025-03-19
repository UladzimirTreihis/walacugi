import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// const API_URL = process.env.REACT_APP_API_URL;
const API_URL = "https://walacugi-production.up.railway.app/api/events"
console.log("API URL: ", API_URL)
// Async thunk to fetch events
export const fetchEvents = createAsyncThunk("events/fetchEvents", async () => {
  try {
    console.log("Attempting response")
    const response = await fetch(`${API_URL}/events`);
    console.log("Response: ", response)
    if (!response.ok) throw new Error("Failed to fetch events");
    return await response.json();
  } catch (error) {
    throw error.message;
  }
});

const eventsSlice = createSlice({
  name: "events",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    setEvents: (state, action) => {
      state.items = action.payload;
    },
    deleteEvent: (state, action) => {
      state.items = state.items.filter((event) => event._id !== action.payload);
    },
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
        state.error = action.error.message;
      });
  },
});

export const { setEvents, deleteEvent } = eventsSlice.actions;
export default eventsSlice.reducer;
