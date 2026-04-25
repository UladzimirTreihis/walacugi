import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { NewsItem } from "../types";
import { normalizeLang } from "../utils/langUrl";

const API_URL = process.env.REACT_APP_API_URL;

interface NewsState {
  items: NewsItem[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  pages: Record<string, NewsItem[]>;
  loadingPages: Record<string, boolean>;
  lang: string;
}

const initialState: NewsState = {
  items: [],
  loading: false,
  error: null,
  page: 1,
  limit: 4,
  totalItems: 0,
  totalPages: 1,
  pages: {},
  loadingPages: {},
  lang: "be"
};

export interface FetchNewsArgs {
  page?: number;
  limit?: number;
  silent?: boolean;
  lang?: string;
}

export interface NewsPageResponse {
  items: NewsItem[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export const fetchNews = createAsyncThunk<NewsPageResponse, FetchNewsArgs | undefined>(
  "news/fetchNews",
  async (args) => {
    const page = args?.page ?? 1;
    const limit = args?.limit ?? 4;
    const lang = normalizeLang(args?.lang ?? null) ?? "be";
    const response = await fetch(`${API_URL}/news?page=${page}&limit=${limit}&lang=${lang}`);
  if (!response.ok) {
    throw new Error("Failed to fetch news");
  }
    return response.json() as Promise<NewsPageResponse>;
  }
);

const newsSlice = createSlice({
  name: "news",
  initialState,
  reducers: {
    setNews: (state, action: PayloadAction<NewsPageResponse>) => {
      state.items = action.payload.items;
      state.page = action.payload.page;
      state.limit = action.payload.limit;
      state.totalItems = action.payload.totalItems;
      state.totalPages = action.payload.totalPages;
      const key = `${state.lang}:${action.payload.page}`;
      state.pages[key] = action.payload.items;
    },
    setNewsFromCache: (state, action: PayloadAction<{ page: number; lang: string }>) => {
      const key = `${action.payload.lang}:${action.payload.page}`;
      const cachedItems = state.pages[key];
      if (!cachedItems) return;
      state.items = cachedItems;
      state.page = action.payload.page;
      state.lang = action.payload.lang;
    },
    deleteNews: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((news) => news._id !== action.payload);
      Object.keys(state.pages).forEach((pageKey) => {
        const pageNum = Number(pageKey);
        state.pages[pageNum] = state.pages[pageNum].filter((news) => news._id !== action.payload);
      });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNews.pending, (state, action) => {
        const page = action.meta.arg?.page ?? 1;
        const lang = normalizeLang(action.meta.arg?.lang ?? null) ?? "be";
        const key = `${lang}:${page}`;
        const isSilent = !!action.meta.arg?.silent;
        state.error = null;
        state.loadingPages[key] = true;
        if (!isSilent) {
          state.loading = true;
        }
      })
      .addCase(fetchNews.fulfilled, (state, action) => {
        const page = action.payload.page;
        const lang = normalizeLang(action.meta.arg?.lang ?? null) ?? "be";
        const key = `${lang}:${page}`;
        state.loadingPages[key] = false;
        state.loading = false;
        state.items = action.payload.items;
        state.page = action.payload.page;
        state.lang = lang;
        state.limit = action.payload.limit;
        state.totalItems = action.payload.totalItems;
        state.totalPages = action.payload.totalPages;
        state.pages[key] = action.payload.items;
      })
      .addCase(fetchNews.rejected, (state, action) => {
        const page = action.meta.arg?.page ?? 1;
        const lang = normalizeLang(action.meta.arg?.lang ?? null) ?? "be";
        const key = `${lang}:${page}`;
        state.loadingPages[key] = false;
        state.loading = false;
        state.error = action.error.message ?? "Unknown error";
      });
  }
});

export const { setNews, setNewsFromCache, deleteNews } = newsSlice.actions;
export default newsSlice.reducer;
