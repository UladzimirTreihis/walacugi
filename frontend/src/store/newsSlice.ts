import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { NewsItem } from "../types";

const API_URL = process.env.REACT_APP_API_URL;

interface NewsState {
  items: NewsItem[];
  loading: boolean;
  error: string | null;
}

const initialState: NewsState = {
  items: [],
  loading: false,
  error: null
};

export const fetchNews = createAsyncThunk<NewsItem[]>("news/fetchNews", async () => {
  const response = await fetch(`${API_URL}/news`);
  if (!response.ok) {
    throw new Error("Failed to fetch news");
  }
  return response.json() as Promise<NewsItem[]>;
});

const newsSlice = createSlice({
  name: "news",
  initialState,
  reducers: {
    setNews: (state, action: PayloadAction<NewsItem[]>) => {
      state.items = action.payload;
    },
    deleteNews: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((news) => news._id !== action.payload);
    }
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
        state.error = action.error.message ?? "Unknown error";
      });
  }
});

export const { setNews, deleteNews } = newsSlice.actions;
export default newsSlice.reducer;
