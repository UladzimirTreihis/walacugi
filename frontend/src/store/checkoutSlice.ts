import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CheckoutItem } from "../types";

interface CheckoutState {
  items: CheckoutItem[];
}

const initialState: CheckoutState = {
  items: []
};

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    addToCheckout: (state, action: PayloadAction<CheckoutItem>) => {
      const exists = state.items.some(
        (item) =>
          item.unitId === action.payload.unitId &&
          item.startDate === action.payload.startDate &&
          item.endDate === action.payload.endDate
      );
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    removeFromCheckout: (state, action: PayloadAction<{ unitId: string; startDate: string; endDate: string }>) => {
      state.items = state.items.filter(
        (item) =>
          !(
            item.unitId === action.payload.unitId &&
            item.startDate === action.payload.startDate &&
            item.endDate === action.payload.endDate
          )
      );
    },
    clearCheckout: (state) => {
      state.items = [];
    },
    hydrateCheckout: (state, action: PayloadAction<CheckoutItem[]>) => {
      state.items = action.payload;
    }
  }
});

export const { addToCheckout, removeFromCheckout, clearCheckout, hydrateCheckout } = checkoutSlice.actions;
export default checkoutSlice.reducer;
