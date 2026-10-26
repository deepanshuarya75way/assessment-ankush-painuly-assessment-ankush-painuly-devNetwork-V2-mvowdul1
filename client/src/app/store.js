import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/auth/userSlice";

export const Store = configureStore({
    reducer: {
        user: userReducer
    }

})