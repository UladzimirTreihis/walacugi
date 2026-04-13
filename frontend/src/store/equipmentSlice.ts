import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { EquipmentModelItem } from "../types";

const API_URL = process.env.REACT_APP_API_URL;

interface EquipmentState {
  items: EquipmentModelItem[];
  loading: boolean;
  error: string | null;
}

const initialState: EquipmentState = {
  items: [],
  loading: false,
  error: null
};

export const fetchEquipment = createAsyncThunk<EquipmentModelItem[]>("equipment/fetchEquipment", async () => {
  const response = await fetch(`${API_URL}/equipment`);
  if (!response.ok) {
    throw new Error("Failed to fetch equipment");
  }
  return response.json() as Promise<EquipmentModelItem[]>;
});

const equipmentSlice = createSlice({
  name: "equipment",
  initialState,
  reducers: {
    setEquipment: (state, action: PayloadAction<EquipmentModelItem[]>) => {
      state.items = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEquipment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEquipment.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEquipment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Unknown error";
      });
  }
});

export const { setEquipment } = equipmentSlice.actions;
export default equipmentSlice.reducer;
