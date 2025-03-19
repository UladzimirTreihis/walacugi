import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isAdmin: false,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.isAdmin = true;
      state.token = action.payload; // Store the token
    },
    logout: (state) => {
      state.isAdmin = false;
      state.token = null;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
