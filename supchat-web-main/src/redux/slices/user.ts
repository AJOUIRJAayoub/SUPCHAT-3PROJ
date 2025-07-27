// supchat-web-main/src/redux/slices/user.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../types";

export interface UserSliceState {
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: UserSliceState = {
  user: null,
  isAuthenticated: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },

    resetUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, resetUser } = userSlice.actions;

export default userSlice.reducer;