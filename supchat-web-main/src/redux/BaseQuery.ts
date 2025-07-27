// Frontend module
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "../constants/variables";

export const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any)?.user?.user?.token;
    if (token && token !== "") {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});
