// Frontend module
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../BaseQuery";

export const messageApi = createApi({
  reducerPath: "messageAPI",
  baseQuery: baseQuery,
  endpoints: (builder) => ({
    createMessage: builder.mutation({
      query({
        users,
        isGroupChat,
        chatName,
        groupAdmin,
      }: {
        users: any;
        isGroupChat: boolean;
        chatName: string;
        groupAdmin: string;
      }) {
        return {
          url: "/message",
          method: "POST",
          body: { users, isGroupChat, chatName, groupAdmin },
        };
      },
    }),
    getMessages: builder.query({
      query({ chatId }: { chatId: string }) {
        return {
          url: `/message/${chatId}`,
          method: "GET",
        };
      },
    }),
    getUnreadMessages: builder.query({
      query({ chatId }: { chatId: string }) {
        return {
          url: `/message/unread/${chatId}`,
          method: "GET",
        };
      },
    }),
    marAsSeen: builder.mutation({
      query({ messageIds }: { messageIds: any }) {
        return {
          url: `/message/seen`,
          method: "PUT",
          body: { messageIds: messageIds },
        };
      },
    }),
  }),
});

export const {
  useCreateMessageMutation,
  useLazyGetMessagesQuery,
  useLazyGetUnreadMessagesQuery,
  useMarAsSeenMutation,
} = messageApi;
