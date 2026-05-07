import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  isAdmin: boolean;
  csrfToken: string | null;
}

const initialState: AuthState = {
  isAdmin: false,
  csrfToken: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ csrfToken: string | null }>) => {
      state.isAdmin = true;
      state.csrfToken = action.payload.csrfToken;
    },
    setCsrfToken: (state, action: PayloadAction<string | null>) => {
      state.csrfToken = action.payload;
    },
    logout: (state) => {
      state.isAdmin = false;
      state.csrfToken = null;
    }
  }
});

export const { login, logout, setCsrfToken } = authSlice.actions;
export default authSlice.reducer;
