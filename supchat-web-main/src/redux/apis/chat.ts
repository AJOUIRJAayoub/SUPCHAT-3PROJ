// Frontend module
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../BaseQuery";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: baseQuery,
  endpoints: (builder) => ({
    createChat: builder.mutation({
      query({
        users,
        isGroupChat,
        chatName,
        groupAdmin,
        createChat,
        onlyAdminCanMessage,
        isChannel,
      }: {
        users: any;
        isGroupChat: boolean;
        chatName: string;
        groupAdmin: string;
        createChat: boolean;
        onlyAdminCanMessage: boolean;
        isChannel: boolean;
      }) {
        return {
          url: "/chat",
          method: "POST",
          body: {
            users,
            isGroupChat,
            chatName,
            groupAdmin,
            createChat,
            onlyAdminCanMessage,
            isChannel,
          },
        };
      },
    }),
    getChats: builder.query({
      query() {
        return {
          url: "/chat",
          method: "GET",
        };
      },
    }),
    getPrivateChat: builder.mutation({
      query({ userId }: { userId: string }) {
        return {
          url: `/chat/private/${userId}`,
          method: "GET",
        };
      },
    }),
    setPermission: builder.mutation({
      query({ chatId, value }: { chatId: string; value: boolean }) {
        return {
          url: "/chat/update-admin-permission",
          method: "PATCH",
          body: { chatId, value },
        };
      },
    }),

    addMember: builder.mutation({
      query({ chatId, userIdToAdd }: { chatId: string; userIdToAdd: string }) {
        return {
          url: "/chat/adduser",
          method: "POST",
          body: { chatId, userIdToAdd },
        };
      },
    }),
    removeMember: builder.mutation({
      query({
        chatId,
        userIdToRemove,
      }: {
        chatId: string;
        userIdToRemove: string;
      }) {
        return {
          url: "/chat/removeUser/fromgroup",
          method: "POST",
          body: { chatId, userIdToRemove },
        };
      },
    }),
    sendGroupInvite: builder.mutation({
      query({
        groupId,
        invitedUser,
      }: {
        groupId: string;
        invitedUser: string;
      }) {
        return {
          url: "/groupinvite",
          method: "POST",
          body: { group: groupId, invitedUser: invitedUser },
        };
      },
    }),
    receiveInvite: builder.query({
      query({ id }: { id: string }) {
        return {
          url: `/groupinvite/received/${id}`,
          method: "GET",
        };
      },
    }),
    acceptInvite: builder.mutation({
      query({ id }) {
        return {
          url: `/groupinvite/accept/${id}`,
          method: "PUT",
        };
      },
    }),
    rejectInvite: builder.mutation({
      query({ id }) {
        return {
          url: `/groupinvite/reject/${id}`,
          method: "PUT",
        };
      },
    }),
    deleteChat: builder.mutation({
      query: (id: string) => ({ url: `/chat/${id}`, method: "DELETE" }),
    }),
  }),
});

export const {
  useCreateChatMutation,
  useLazyGetChatsQuery,
  useLazyReceiveInviteQuery,
  useSendGroupInviteMutation,
  useAcceptInviteMutation,
  useRejectInviteMutation,
  useSetPermissionMutation,
  useRemoveMemberMutation,
  useAddMemberMutation,
  useDeleteChatMutation,
  useGetPrivateChatMutation,
} = chatApi;
