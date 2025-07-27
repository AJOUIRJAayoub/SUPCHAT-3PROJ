// Frontend module
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../BaseQuery";

export const AuthApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQuery,
  endpoints: (builder) => ({
    signup: builder.mutation({
      query({
        name,
        email,
        password,
        profilePicture,
      }: {
        name: string;
        email: string;
        password: string;
        profilePicture: string;
      }) {
        return {
          url: "/auth/register",
          method: "POST",
          body: { name, email, password, profilePicture },
        };
      },
    }),
    login: builder.mutation({
      query({ email, password }: { email: string; password: string }) {
        return {
          url: "/auth/login",
          method: "POST",
          body: { email, password },
        };
      },
    }),
    getUserByEmail: builder.query({
      query({ email }) {
        return {
          url: `/users/search?query=${email}&fields=email,name`,
          method: "GET",
        };
      },
    }),
    updateUser: builder.mutation({
      query({
        profilePicture,
        name,
      }: {
        profilePicture?: string;
        name: string;
      }) {
        return {
          url: `/users/profile/update`,
          method: "PATCH",
          body: { profilePicture: profilePicture, name: name },
        };
      },
    }),
    googleAuth: builder.mutation({
      query({ token }: { token: string }) {
        return {
          url: "/auth/google",
          method: "POST",
          body: { token },
        };
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useLazyGetUserByEmailQuery,
  useUpdateUserMutation,
  useGoogleAuthMutation,
} = AuthApi;
