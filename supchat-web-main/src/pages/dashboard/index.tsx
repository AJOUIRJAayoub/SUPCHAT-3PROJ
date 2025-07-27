import { useEffect, useRef, useState } from "react";
import {
  FaSearch,
  FaUserCircle,
  FaBars,
  FaTimes,
  FaUserFriends,
  FaPaperclip,
  FaSmile,
} from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import { socket } from "../../../script/socket";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../redux/types";
import type { Chat, Message, User } from "../../redux/types";
import { resetUser } from "../../redux/slices/user";
import { useLazyGetUserByEmailQuery } from "../../redux/apis/auth";
import CreateChannelModal from "../../component/ChannelModal";
import { toast } from "react-toastify";
import {
  useLazyGetChatsQuery,
  useCreateChatMutation,
  useGetPrivateChatMutation,
  useLazyReceiveInviteQuery,
  useAcceptInviteMutation,
  useRejectInviteMutation,
} from "../../redux/apis/chat";
import {
  useLazyGetMessagesQuery,
  useLazyGetUnreadMessagesQuery,
  useMarAsSeenMutation,
} from "../../redux/apis/message";
import Modal from "../../component/NewGroup";
import ProfileModal from "../../component/profileModal";
import ProfileDetailModal from "../../component/profileDetailModal";
import InfoModal from "../../component/UsersModal";
import infoIcon from "../../assets/icons/info_Icon.png";
import { uploadToCloudinary } from "../../../script/cloudinaryUpload";
import EmojiPicker from "../../component/EmojiPicker";

const ChatDashboard = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [
    getUserByEmail,
    { isError, isSuccess, error },
  ] = useLazyGetUserByEmailQuery();
  const [searchChats, setSearchChats] = useState("");
  const [originalChats, setOriginalChats] = useState<Chat[]>([]);
  const [receiveInvite] = useLazyReceiveInviteQuery();
  const [getUnreadMessages] = useLazyGetUnreadMessagesQuery();
  const [marAsSeen] = useMarAsSeenMutation();
  const [acceptInvite] = useAcceptInviteMutation();
  const [rejectInvite] = useRejectInviteMutation();
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isProfileDetailVisible, setIsProfileDetailVisible] = useState(false);
  const [activeProfileData, setActiveProfileData] = useState<Partial<User>>({});
  const [isInfoModalVIsible, setIsInfoModalVisible] = useState<boolean>(false);
  const [isCreateChannelVisible, setCreateChannelVisible] = useState<boolean>(false);
  const [getChats] = useLazyGetChatsQuery();
  const [getMessages] = useLazyGetMessagesQuery();
  const [getPrivateChat] = useGetPrivateChatMutation();

  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const dispatch = useDispatch();
  const [selectedChat, setSelectedChat] = useState<Chat | User | null>(null);
  const [friendSearch, setFriendSearch] = useState<string>("");
  const [displayFriendsList, setDisplayFriendsList] = useState<boolean>(false);
  const [searchedFriendsList, setSearchedFriendsList] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [selectedChatID, setSelectedChatId] = useState<string>("");
  const [newGroupModal, setNewGroupModal] = useState<boolean>(false);
  const [isSideBarVisible, setIsSideBarVisible] = useState(false);
  const [groupStatus, setGroupStatus] = useState<string>("");
  const [receivedInviteId, setReceiveInviteid] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef(messages);
  const selectedChatIdRef = useRef(selectedChatID);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [imageFile, setIMageFile] = useState<File | null>(null);

  // Helper function to check if selected item is a Chat
  const isChat = (item: Chat | User | null): item is Chat => {
    return item !== null && '_id' in item && 'isGroupChat' in item;
  };

  const logout = () => {
    dispatch(resetUser());
  };

  const addChatToChats = async (chat: User) => {
    setDisplayFriendsList(false);
    if (chat?._id === user?.id) {
      toast("cannot add your self");
      return;
    }
    try {
      const response = await getPrivateChat({ userId: chat._id }).unwrap();
      if (response.status === "success") {
        const exists = chats.find((item) => item?._id === response.data._id);
        if (!exists) {
          setChats([response.data, ...chats]);
          setOriginalChats([response.data, ...chats]);
        }
      }
    } catch (e: any) {
      toast(e?.data?.message || "Error occurred");
    }
  };

  const getUnreadMessagesCount = async (chatid: string) => {
    try {
      const response = await getUnreadMessages({ chatId: chatid }).unwrap();
      return response?.data?.unreadMessages || 0;
    } catch (e: any) {
      console.log("error occurred getting unread messages", e);
      return 0;
    }
  };

  const getChatFunction = async () => {
    try {
      const response = await getChats({}).unwrap();
      const chatss = await Promise.all(
        response?.data?.map(async (item: Chat) => {
          const data = await getUnreadMessagesCount(item?._id);
          return { ...item, unreadMessages: data };
        })
      );

      setChats(chatss);
      setOriginalChats(chatss);
      setSelectedChat(null);
      
      if (selectedChat !== null && isChat(selectedChat)) {
        const filtered = chatss.filter(
          (item) => item?._id === selectedChat._id
        );
        if (filtered.length > 0) {
          setSelectedChat(filtered[0]);
        }
      }
    } catch (e: any) {
      toast(e?.data?.message || "Error occurred getting chats");
    }
  };

  const messageCountIncrement = (chatId: string) => {
    setChats((prev) => {
      return prev.map((item) => {
        if (item._id === chatId) {
          return { ...item, unreadMessages: (item.unreadMessages || 0) + 1 };
        }
        return item;
      });
    });
  };

  const getMessagesFunction = async (chatId: string, isGroupChat: boolean) => {
    try {
      if (isGroupChat) {
        const response = await receiveInvite({ id: chatId }).unwrap();
        setReceiveInviteid(response?.data[0]?._id || "");
        if (response?.data[0]?.status === "pending") {
          setGroupStatus("pending");
        } else if (response?.data[0]?.status === "accepted") {
          setGroupStatus("accepted");
        } else if (response?.data[0]?.status === "rejected") {
          setGroupStatus("rejected");
        }
      }
      if (!isGroupChat) {
        setGroupStatus("");
        setReceiveInviteid("");
      }
      const response = await getMessages({ chatId: chatId }).unwrap();
      if (response.status === "success") {
        setMessages(response?.data || []);
      } else {
        toast("Error occurred fetching messages");
      }
    } catch (e: any) {
      toast(e?.data?.message || "Error occurred");
    }
  };

  const filterChats = () => {
    if (searchChats.trim() === "") {
      setChats(originalChats);
    } else {
      const filteredList = originalChats.filter((item) =>
        item?.users?.some((user) =>
          user?.name?.toLowerCase().includes(searchChats.toLowerCase())
        )
      );
      setChats(filteredList);
    }
  };

  useEffect(() => {
    filterChats();
  }, [searchChats]);

  useEffect(() => {
    getChatFunction();
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🟢 Connected to socket:", socket.id);
      if (user?.id) {
        socket.emit("setup", { _id: user.id });
      }
    });

    socket.on("message", (msg: Message) => {
      console.log("New message:", msg);
    });

    socket.on("userRemoved", (data: { chatId: string; userId: string }) => {
      console.log("received data", data);
      getChatFunction();
    });

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected from socket");
    });

    socket.on("receive-message", (data: any) => {
      console.log("📥 Real-time message received:", data?.chat?._id);
      if (selectedChatIdRef.current === data?.chat._id) {
        const updatedMessages = [...messagesRef.current, data];
        setMessages(updatedMessages);
      } else {
        toast("Message Received");
        messageCountIncrement(data?.chat._id);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("message");
      socket.off("disconnect");
      socket.off("receive-message");
      socket.off("userRemoved");
    };
  }, [user]);

  const senMessage = async () => {
    if (message.trim() === "" || !user?.id) {
      return;
    }
    let imageUrl = "";
    if (selectedImage !== "" && imageFile) {
      const uploadedUrl = await uploadToCloudinary(imageFile);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }
    setMessage("");
    setSelectedImage("");
    setIMageFile(null);

    const messageData = {
      sender: user.id,
      receiverId: isChat(selectedChat)
        ? selectedChat.users
            .filter((item) => item._id !== user.id)
            .map((item) => item._id)
        : [(selectedChat as User)?._id],
      chat: selectedChatID,
      content: message,
      imageUrl: imageUrl,
      seenBy: [user.id],
    };

    socket.emit("message", messageData);

    const newMessage: Message = {
      _id: Date.now().toString(),
      sender: {
        _id: user.id,
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        profilePicture: user.profilePicture,
      },
      chat: selectedChatID,
      content: message,
      seenBy: [{
        _id: user.id,
        id: user.id,
        name: user.name || "",
        email: user.email || "",
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageUrl: imageUrl,
    };

    setMessages([...messages, newMessage]);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const searchFriendEmail = async (friendSearch: string) => {
    setDisplayFriendsList(true);
    try {
      const result = await getUserByEmail({ email: friendSearch }).unwrap();
      setSearchedFriendsList(result?.data?.users || []);
      return result?.data?.users;
    } catch (e: any) {
      toast(e?.data?.message || "Error occurred");
    }
  };

  const searchFriends = async (friendSearch: string) => {
    try {
      const result = await getUserByEmail({ email: friendSearch }).unwrap();
      return result?.data?.users || [];
    } catch (e: any) {
      toast(e?.data?.message || "Error occurred");
      return [];
    }
  };

  const currentMessageCountZero = (chatId: string) => {
    setChats((prev) => {
      return prev.map((item) => {
        if (item._id === chatId) {
          return { ...item, unreadMessages: 0 };
        }
        return item;
      });
    });
  };

  const markAsSeenFunction = async (messageIds: string[]) => {
    try {
      await marAsSeen({ messageIds: messageIds }).unwrap();
    } catch (e) {
      console.log("Error occurred", e);
    }
  };

  const AcceptInvitation = async (id: string) => {
    try {
      const response = await acceptInvite({ id: id }).unwrap();
      if (response.status === "success") {
        setGroupStatus("");
        setReceiveInviteid("");
      }
    } catch (e: any) {
      toast(e?.data?.message || "Error occurred");
    }
  };

  const RejectInvitation = async (id: string) => {
    try {
      const response = await rejectInvite({ id: id }).unwrap();
      if (response.status === "success") {
        setGroupStatus("");
        setSelectedChat(null);
        setMessages([]);
        if (isChat(selectedChat)) {
          setChats((prev) =>
            prev.filter((item) => item._id !== selectedChat._id)
          );
          toast("You rejected to join that group");
          if (selectedChat.groupAdmin?._id) {
            socket.emit("userRemoved", {
              groupAdmin: selectedChat.groupAdmin._id,
              chatId: selectedChat._id,
              userId: user?.id || ""
            });
          }
        }
        setReceiveInviteid("");
      }
    } catch (e: any) {
      toast(e?.data?.message || "Error occurred");
    }
  };

  const sendMessageToAdmin = (adminID: string) => {
    socket.emit("userRemoved", {
      groupAdmin: adminID,
      chatId: isChat(selectedChat) ? selectedChat._id : "",
      userId: user?.id || ""
    });
  };

  useEffect(() => {
    if (friendSearch !== "") {
      searchFriendEmail(friendSearch);
    }
  }, [friendSearch]);

  useEffect(() => {
    if (isError && error) {
      toast((error as any)?.data?.message || "An error occurred");
    }
  }, [isError, isSuccess, error]);

  useEffect(() => {
    selectedChatIdRef.current = selectedChatID;
    messagesRef.current = messages;
    messageEndRef?.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });

    const notSeenMessagesIds = messages
      .filter((item) => {
        if (user?.id && !item?.seenBy?.some(u => u._id === user.id)) {
          return true;
        }
        return false;
      })
      .map((item) => item._id);

    if (notSeenMessagesIds.length > 0) {
      markAsSeenFunction(notSeenMessagesIds);
    }
  }, [messages, selectedChatID]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setIMageFile(file);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <ProfileModal
        isOpen={isProfileModalVisible}
        onClose={() => setIsProfileModalVisible(false)}
      />
      <CreateChannelModal
        isOpen={isCreateChannelVisible}
        onClose={() => setCreateChannelVisible(false)}
        searchFriends={searchFriends}
        setChats={setChats}
        chats={chats}
      >
        <p>Create Channel</p>
      </CreateChannelModal>
      <InfoModal
        isOpen={isInfoModalVIsible}
        onClose={() => setIsInfoModalVisible(false)}
        searchFriends={searchFriends}
        chat={isChat(selectedChat) ? selectedChat : null}
        userids={isChat(selectedChat) ? selectedChat.users.map((item) => item._id) : []}
        isAdmin={isChat(selectedChat) && user?.id ? selectedChat.groupAdmin?._id === user.id : false}
        setChat={setSelectedChat}
        socket={sendMessageToAdmin}
        setChats={setChats}
      >
        <p></p>
      </InfoModal>
      <ProfileDetailModal
        isOpen={isProfileDetailVisible}
        onClose={() => setIsProfileDetailVisible(false)}
        name={activeProfileData?.name || ""}
        imageURL={activeProfileData?.profilePicture || ""}
        email={activeProfileData?.email || ""}
      />
      
      {/* Header */}
      <div className="bg-dark text-light p-3 sm:p-4 flex justify-between items-center shadow-md w-full">
        <div
          className="block md:hidden cursor-pointer p-2"
          onClick={() => setIsSideBarVisible(!isSideBarVisible)}
        >
          {isSideBarVisible ? <FaTimes size={20} /> : <FaBars size={20} />}
        </div>

        <div
          className={`border border-primary rounded-lg items-center p-2 gap-2 relative mx-2 sm:mx-4 flex-1 max-w-xs sm:max-w-sm ${
            isSideBarVisible ? "hidden" : "flex"
          } md:flex`}
        >
          <FaSearch className="text-muted text-sm" />
          <input
            type="text"
            placeholder="Search users"
            onChange={(e) => setFriendSearch(e.target.value)}
            className="w-full bg-dark text-light text-sm placeholder:text-xs sm:placeholder:text-sm outline-none"
          />
        </div>

        {displayFriendsList && (
          <div className="absolute top-16 sm:top-20 left-0 sm:right-10 border border-gray-300 rounded-md w-[calc(100vw-1rem)] sm:w-[290px] max-w-[320px] p-3 sm:p-4 max-h-60 sm:max-h-80 overflow-y-auto z-30 bg-white">
            <div
              className="w-full flex justify-end mb-2"
              onClick={() => setDisplayFriendsList(false)}
            >
              <FaTimes className="cursor-pointer" />
            </div>
            {searchedFriendsList?.length > 0 ? (
              searchedFriendsList.map((item, index) => (
                <div
                  key={index}
                  className="w-full flex flex-row justify-between items-center mt-3 sm:mt-4"
                >
                  <div className="flex flex-row gap-2 items-center flex-1 min-w-0">
                    <div className="rounded-full h-8 w-8 sm:h-10 sm:w-10 overflow-hidden flex-shrink-0">
                      <img
                        src={item?.profilePicture || "https://i.pravatar.cc/40"}
                        className="w-full h-full object-cover"
                        alt={item?.name || "User"}
                      />
                    </div>
                    <p className="text-sm sm:text-base truncate">
                      {item?.name}
                    </p>
                  </div>
                  <div
                    className="p-1 px-2 sm:px-3 rounded-md bg-primary text-center text-white cursor-pointer text-xs sm:text-sm flex-shrink-0 ml-2"
                    onClick={() => addChatToChats(item)}
                  >
                    Add
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-center">No records found</p>
            )}
          </div>
        )}

        <div
          className="flex items-center gap-2 cursor-pointer relative"
          onClick={() => setIsLogoutVisible(!isLogoutVisible)}
        >
          <img
            src={user?.profilePicture || "https://i.pravatar.cc/40"}
            alt="Profile"
            className="rounded-full w-8 h-8 sm:w-10 sm:h-10 object-cover"
          />
          <p className="text-xs sm:text-sm font-bold hidden sm:block truncate max-w-20">
            {user?.name || ""}
          </p>
        </div>

        {isLogoutVisible && (
          <div
            className="rounded-md p-2 absolute top-14 sm:top-16 right-2 z-10 bg-white border border-gray-300 shadow-lg flex flex-col"
            onClick={logout}
          >
            <button
              className="text-white text-sm hover:bg-blue-300 py-2 px-4 rounded bg-primary"
              onClick={(e) => {
                e.stopPropagation();
                setIsProfileModalVisible(true);
              }}
            >
              Profile
            </button>
            <button className="text-red-400 text-sm hover:bg-gray-300 py-2 px-4 rounded">
              Logout
            </button>
          </div>
        )}

        <Modal
          isOpen={newGroupModal}
          onClose={() => setNewGroupModal(false)}
          searchFriends={searchFriends}
          chats={chats}
          setChats={setChats}
        >
          <p className="font-bold text-lg text-center">New Group</p>
        </Modal>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Chat List */}
        <div className="w-1/3 lg:w-1/4 xl:w-1/5 hidden md:block border-r border-primary p-3 sm:p-4 flex flex-col bg-dark">
          <div className="relative mb-4">
            <FaSearch className="absolute left-3 top-3 text-muted text-sm" />
            <input
              type="text"
              placeholder="Search chats"
              value={searchChats}
              onChange={(e) => setSearchChats(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark text-light border border-primary rounded-lg text-sm"
            />
          </div>

          <div className="flex flex-col gap-2 h-full overflow-y-auto">
            <button
              type="button"
              onClick={() => setNewGroupModal(true)}
              className="w-full bg-primary text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition text-sm font-medium"
            >
              Create Group +
            </button>
            <button
              type="button"
              onClick={() => setCreateChannelVisible(true)}
              className="w-full bg-primary text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition text-sm font-medium"
            >
              Create a Channel +
            </button>

            {chats.length > 0 ? (
              chats.map((chat) => {
                const filteredUser = chat.users.find(
                  (item) => item._id !== user?.id
                );
                return (
                  <div
                    key={chat._id}
                    onClick={() => {
                      setSelectedChatId(chat._id);
                      currentMessageCountZero(chat._id);
                      if (chat.isGroupChat || chat.isChannel) {
                        setSelectedChat(chat);
                      } else {
                        const otherUser = chat.users.find((item) => item._id !== user?.id);
                        if (otherUser) {
                          setSelectedChat(otherUser);
                        }
                      }
                      getMessagesFunction(chat._id, chat.isGroupChat);
                    }}
                    className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-100 cursor-pointer justify-between border border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      {chat.isGroupChat || chat.isChannel ? (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gray-300 flex-shrink-0">
                          <FaUserFriends className="text-sm sm:text-base" />
                        </div>
                      ) : (
                        <img
                          src={filteredUser?.profilePicture || "https://i.pravatar.cc/40"}
                          alt={filteredUser?.name || "User"}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <span className="text-light font-medium text-sm sm:text-base truncate">
                        {chat.isGroupChat || chat.isChannel
                          ? chat.isChannel
                            ? `Channel ${chat.chatName || chat.name}`
                            : `Group ${chat.chatName || chat.name}`
                          : filteredUser?.name}
                      </span>
                    </div>
                    {(chat.unreadMessages || 0) > 0 && (
                      <div className="rounded-full bg-primary w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-white text-xs flex-shrink-0">
                        {chat.unreadMessages}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted">No Chats Yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sidebar */}
        {isSideBarVisible && (
          <>
            <div
              className="fixed inset-0 bg-white bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsSideBarVisible(false)}
            />

            <div className="fixed left-0 top-0 h-full w-4/5 max-w-sm md:hidden bg-dark border-r border-primary p-4 flex flex-col z-50 pt-20">
              <div className="relative mb-4">
                <FaSearch className="absolute left-3 top-3 text-muted text-sm" />
                <input
                  type="text"
                  placeholder="Search chats"
                  value={searchChats}
                  onChange={(e) => setSearchChats(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark text-light border border-primary rounded-lg text-sm"
                />
              </div>

              <div className="flex flex-col gap-2 overflow-y-auto flex-1">
                <button
                  type="button"
                  onClick={() => {
                    setNewGroupModal(true);
                    setIsSideBarVisible(false);
                  }}
                  className="w-full bg-primary text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                >
                  Create Group +
                </button>

                {chats.length > 0 ? (
                  chats.map((chat) => {
                    const filteredUser = chat.users.find(
                      (item) => item._id !== user?.id
                    );
                    return (
                      <div
                        key={chat._id}
                        onClick={() => {
                          setIsSideBarVisible(false);
                          setSelectedChatId(chat._id);
                          currentMessageCountZero(chat._id);
                          if (chat.isGroupChat || chat.isChannel) {
                            setSelectedChat(chat);
                          } else {
                            const otherUser = chat.users.find((item) => item._id !== user?.id);
                            if (otherUser) {
                              setSelectedChat(otherUser);
                            }
                          }
                          getMessagesFunction(chat._id, chat.isGroupChat);
                        }}
                        className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-100 cursor-pointer justify-between border border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {chat.isGroupChat || chat.isChannel ? (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-300 flex-shrink-0">
                              <FaUserFriends />
                            </div>
                          ) : (
                            <img
                              src={filteredUser?.profilePicture || "https://i.pravatar.cc/40"}
                              alt={filteredUser?.name || "User"}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          )}
                          <span className="text-light font-medium text-sm truncate">
                            {chat.isGroupChat || chat.isChannel
                              ? chat.isChannel
                                ? `Channel ${chat.chatName || chat.name}`
                                : `Group ${chat.chatName || chat.name}`
                              : filteredUser?.name}
                          </span>
                        </div>
                        {(chat.unreadMessages || 0) > 0 && (
                          <div className="rounded-full bg-primary w-6 h-6 flex items-center justify-center text-white text-xs flex-shrink-0">
                            {chat.unreadMessages}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-muted">No Chats Yet</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {!selectedChat ? (
            <div className="flex flex-col h-full items-center justify-center text-muted p-4">
              <FaUserCircle className="text-4xl sm:text-6xl mb-4" />
              <p className="text-lg sm:text-xl text-center">No chat selected</p>
              <p className="text-sm sm:text-base text-center mt-2 md:hidden">
                Tap the menu to see your chats
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:p-4 flex items-center justify-between gap-3 border-b border-primary bg-dark">
                <div className="flex flex-row items-center gap-2">
                  {isChat(selectedChat) ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gray-300 flex-shrink-0">
                      <FaUserFriends className="text-sm sm:text-base" />
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setActiveProfileData(selectedChat);
                        setIsProfileDetailVisible(true);
                      }}
                    >
                      <img
                        src={selectedChat.profilePicture || "https://i.pravatar.cc/40"}
                        alt={selectedChat.name || "User"}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                      />
                    </div>
                  )}
                  <span className="text-light font-semibold text-sm sm:text-base truncate">
                    {isChat(selectedChat)
                      ? selectedChat.isChannel
                        ? `Channel ${selectedChat.chatName || selectedChat.name}`
                        : `Group ${selectedChat.chatName || selectedChat.name}`
                      : selectedChat.name}
                  </span>
                </div>
                {isChat(selectedChat) && (
                  <div
                    onClick={() => setIsInfoModalVisible(true)}
                    className="cursor-pointer"
                  >
                    <img src={infoIcon} className="h-4 w-4" alt="Info" />
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 p-3 sm:p-4 space-y-2 overflow-y-auto bg-dark">
                {groupStatus === "pending" ? (
                  <div className="h-full w-full flex flex-col gap-4 justify-center items-center p-4">
                    <p className="text-center text-sm sm:text-base">
                      You are invited to join this group
                    </p>
                    <div className="flex flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => AcceptInvitation(receivedInviteId)}
                        className="px-4 sm:px-6 bg-primary text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => RejectInvitation(receivedInviteId)}
                        className="px-4 sm:px-6 bg-gray-300 text-black py-2 rounded-lg hover:bg-gray-600 hover:text-white transition text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ) : messages.length > 0 ? (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex flex-row w-full items-end gap-2 ${
                          msg?.sender?._id === user?.id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {msg?.sender._id !== user?.id && (
                          <div
                            className="flex justify-center items-center bg-gray-300 p-1 rounded-[50px] w-10 h-10 overflow-hidden object-contain"
                            onClick={() => {
                              setIsProfileDetailVisible(true);
                              setActiveProfileData(msg.sender);
                            }}
                          >
                            <img src={msg.sender.profilePicture || "https://i.pravatar.cc/40"} alt="User" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] sm:max-w-xs p-3 rounded-lg text-sm sm:text-base ${
                            msg?.sender?._id === user?.id
                              ? "bg-primary text-white rounded-br-sm"
                              : "bg-gray-300 text-black rounded-bl-sm"
                          }`}
                        >
                          {msg.imageUrl && (
                            <img src={msg.imageUrl} className="w-16 h-16" alt="Message attachment" />
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-[10px]">
                            {msg.createdAt.split("T")[0] +
                              " / " +
                              msg.createdAt.split("T")[1].split(":")[0] +
                              ":" +
                              msg.createdAt.split("T")[1].split(":")[1]}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messageEndRef} />
                  </>
                ) : (
                  <div className="h-full w-full flex justify-center items-center">
                    <p className="text-sm sm:text-base text-muted">
                      No Messages Yet
                    </p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              {isChat(selectedChat) &&
              selectedChat.onlyAdminCanMessage &&
              selectedChat.groupAdmin?._id !== user?.id ? (
                <div className="w-full flex items-center justify-center mb-8 text-primary">
                  <p>Only Admin can message</p>
                </div>
              ) : (
                <>
                  {selectedImage && (
                    <div className="flex w-[50%] justify-center self-center">
                      <img
                        src={selectedImage}
                        className="max-w-full max-h-[400px]"
                        alt="Selected"
                      />
                    </div>
                  )}
                  <div className="p-3 sm:p-4 border-t border-primary bg-dark flex items-center gap-2 relative">
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 z-10">
                        <EmojiPicker onSelect={handleEmojiSelect} />
                      </div>
                    )}
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                      <FaSmile />
                    </button>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          senMessage();
                        }
                      }}
                      placeholder="Type a message"
                      className="flex-1 px-3 sm:px-4 py-2 rounded-lg text-light bg-dark border border-primary focus:outline-none focus:border-blue-500 transition text-sm sm:text-base"
                    />
                    <div>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <FaPaperclip />
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                    <button
                      className="p-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition flex-shrink-0"
                      onClick={senMessage}
                    >
                      <FiSend className="text-sm sm:text-base" />
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatDashboard;