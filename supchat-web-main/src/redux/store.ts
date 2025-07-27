// Frontend module
import storage from "redux-persist/lib/storage"; // ✅ localStorage for web
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

import userReducer from "./slices/user";
import { AuthApi } from "./apis/auth";
import { chatApi } from "./apis/chat";
import { messageApi } from "./apis/message";

const persistConfig = {
  key: "root",
  version: 1,
  storage, // ✅ This is now compatible with web
  blacklist: [
    "item",
    "tempState",
    AuthApi.reducerPath,
    chatApi.reducerPath,
    messageApi.reducerPath,
  ],
};

const rootReducer = combineReducers({
  user: userReducer,
  [AuthApi.reducerPath]: AuthApi.reducer,
  [chatApi.reducerPath]: chatApi.reducer,
  [messageApi.reducerPath]: messageApi.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(AuthApi.middleware, chatApi.middleware, messageApi.middleware),
});
