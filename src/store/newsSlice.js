import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = process.env.REACT_APP_API_URL; // Get API URL from .env

// Async thunk to fetch news
export const fetchNews = createAsyncThunk("news/fetchNews", async () => {
  try {
    const response = await fetch(`${API_URL}/news`);
    if (!response.ok) throw new Error("Failed to fetch news");
    return await response.json();
  } catch (error) {
    throw error.message;
  }
});

const newsSlice = createSlice({
  name: "news",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    setNews: (state, action) => {
      state.items = action.payload;
    },
    deleteNews: (state, action) => {
      state.items = state.items.filter((news) => news._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNews.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setNews, deleteNews } = newsSlice.actions;
export default newsSlice.reducer;
