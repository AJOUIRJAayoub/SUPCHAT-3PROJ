// supchat-web-main/src/component/UsersModal.tsx
import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import "./modal.css";
import { toast } from "react-toastify";
import {
  useAddMemberMutation,
  useRemoveMemberMutation,
  useSendGroupInviteMutation,
  useSetPermissionMutation,
  useDeleteChatMutation,
} from "../redux/apis/chat";
import { useSelector } from "react-redux";
import type { RootState, User, Chat } from "../redux/types";
import ToggleButton from "./ToggleButton";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  searchFriends: (search: string) => Promise<User[] | undefined>;
  chat: Chat | null;
  setChat: React.Dispatch<React.SetStateAction<Chat | User | null>>;
  userids: string[];
  isAdmin: boolean;
  socket: (adminId: string) => void;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
}

const InfoModal = ({
  isOpen,
  onClose,
  children,
  searchFriends,
  chat,
  userids,
  isAdmin,
  setChat,
  socket,
  setChats,
}: ModalProps) => {
  const user = useSelector((state: RootState) => state.user.user);
  const [setPermission] = useSetPermissionMutation();
  const [addMember] = useAddMemberMutation();
  const [removeMember] = useRemoveMemberMutation();
  const [deleteChat] = useDeleteChatMutation();
  const [sendGroupInvite] = useSendGroupInviteMutation();
  
  const [searchName, setSearchName] = useState<string>("");
  const [displayUsers, setDisplayUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const inviteMember = async (userId: string) => {
    if (!chat) return;
    
    try {
      if (userids.includes(userId)) {
        toast("This user is already added");
        return;
      }
      
      await sendGroupInvite({
        groupId: chat._id,
        invitedUser: userId,
      }).unwrap();
      
      userids.push(userId);

      const response = await addMember({
        chatId: chat._id,
        userIdToAdd: userId,
      }).unwrap();
      
      if (response?.data) {
        setChat(response.data);
      }
      toast("User invited.");
    } catch (e: any) {
      toast(e?.data?.message || "Error occurred");
      console.log("error occurred inviting member", e);
    }
  };

  const removeUser = async (userId: string, message: string) => {
    if (!chat) return;
    
    try {
      const response = await removeMember({
        chatId: chat._id,
        userIdToRemove: userId,
      }).unwrap();

      if (response?.data) {
        setChat(response.data);
      }
      
      if (chat.groupAdmin?._id) {
        socket(chat.groupAdmin._id);
      }
      
      toast(message);
    } catch (e: any) {
      toast(e?.data?.message || "Error occurred");
      console.log("error occurred removing user", e);
    }
  };

  const clearAll = () => {
    setDisplayUsers(false);
    setSearchName("");
    setUsers([]);
  };

  useEffect(() => {
    const getUser = async () => {
      const foundUsers = await searchFriends(searchName);
      if (foundUsers) {
        setUsers(foundUsers);
      }
    };
    
    if (searchName !== "") {
      setDisplayUsers(true);
      getUser();
    }
  }, [searchName, searchFriends]);

  if (!isOpen || !chat) return null;

  return (
    <div className="modal-overlay z-150">
      <div className="modal-content flex flex-col gap-2 w-[350px] relative">
        {children}
        {isAdmin && (
          <>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
              }}
              placeholder="Search members to invite"
              required
            />
            {displayUsers && (
              <div className="absolute top-25 border border-gray-300 rounded-md w-[290px] p-4 h-max-40 overflow-y-auto z-30 bg-white">
                <div
                  className="w-full flex justify-end cursor-pointer"
                  onClick={() => setDisplayUsers(false)}
                >
                  <FaTimes />
                </div>
                {users?.length > 0 ? (
                  users.map((item, index) => (
                    <div key={item._id || index} className="w-full flex flex-row justify-between items-center mt-4">
                      <div className="flex flex-row gap-2 items-center">
                        <div className="rounded-[50px] h-10 w-10 overflow-hidden">
                          <img
                            src={item.profilePicture || "https://i.pravatar.cc/40"}
                            className="w-full h-full object-cover"
                            alt={item.name || "User"}
                          />
                        </div>
                        <p>{item.name}</p>
                      </div>
                      <div
                        className="p-1 px-2 rounded-md bg-primary text-center text-white cursor-pointer"
                        onClick={() => {
                          setDisplayUsers(false);
                          inviteMember(item._id);
                        }}
                      >
                        Invite
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No records found</p>
                )}
              </div>
            )}
          </>
        )}
        {isAdmin && (
          <div>
            <ToggleButton
              initialValue={chat.onlyAdminCanMessage || false}
              onToggle={async (value: boolean) => {
                try {
                  await setPermission({
                    chatId: chat._id,
                    value: value,
                  }).unwrap();
                  setChat({ ...chat, onlyAdminCanMessage: value });
                } catch (e: any) {
                  toast(e?.data?.message || "Error updating permission");
                }
              }}
              label="Only admin can message"
            />
          </div>
        )}
        <p className="font-lg font-bold mt-8">Members</p>
        {chat.users?.length > 0 ? (
          chat.users.map((item: User) => (
            <div key={item._id} className="w-full flex flex-row justify-between items-center mt-6">
              <div className="flex flex-row gap-2 items-center">
                <div className="rounded-[50px] h-10 w-10 overflow-hidden">
                  <img
                    src={item.profilePicture || "https://i.pravatar.cc/40"}
                    className="w-full h-full object-cover"
                    alt={item.name || "User"}
                  />
                </div>
                {chat.groupAdmin?._id !== item._id ? (
                  <p>{item.name}</p>
                ) : (
                  <div>
                    <p>{item.name}</p>
                    <p className="text-xs text-primary">Admin</p>
                  </div>
                )}
              </div>
              {isAdmin && chat.groupAdmin?._id !== item._id && (
                <div
                  className="p-1 px-2 rounded-md bg-red-300 text-center text-white cursor-pointer"
                  onClick={() => {
                    removeUser(item._id, "User removed.");
                  }}
                >
                  Remove
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="font-bold text-center mb-4">No one is here</p>
        )}
        {!isAdmin && user && (
          <button
            type="button"
            onClick={() => {
              removeUser(user.id, "Group Left.");
              setChat(null);
              clearAll();
            }}
            className="w-full bg-red-400 text-white py-2 rounded-lg hover:bg-red-600 transition mt-4"
          >
            Leave Group
          </button>
        )}
        {isAdmin && (
          <button
            type="button"
            onClick={async () => {
              try {
                await deleteChat(chat._id).unwrap();
                setChats((prev: Chat[]) => prev.filter((c) => c._id !== chat._id));
                setChat(null);
                clearAll();
                onClose();
              } catch (e: any) {
                toast(e?.data?.message || "Error deleting channel");
              }
            }}
            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition mt-4"
          >
            Delete Channel
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            onClose();
            clearAll();
          }}
          className="w-full bg-[var(--color-primary)] text-white py-2 rounded-lg hover:bg-blue-600 transition mt-4"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default InfoModal;