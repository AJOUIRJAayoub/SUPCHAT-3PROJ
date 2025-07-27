import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { BACKEND_URL } from "../src/constants/variables";
import type { Message, SocketMessage, SocketNotification } from "../src/redux/types";

// Define socket event types
interface ServerToClientEvents {
  "message received": (newMessage: Message) => void;
  "new notification": (notification: SocketNotification) => void;
  "user joined": (userId: string) => void;
  "user left": (userId: string) => void;
  typing: (userId: string) => void;
  "stop typing": (userId: string) => void;
  message: (msg: Message) => void;
  "receive-message": (data: SocketMessage) => void;
  userRemoved: (data: { chatId: string; userId: string }) => void;
}

interface ClientToServerEvents {
  setup: (userData: { _id: string }) => void;
  "join chat": (room: string) => void;
  "new message": (data: SocketMessage) => void;
  typing: (room: string) => void;
  "stop typing": (room: string) => void;
  message: (data: any) => void;
  userRemoved: (data: { groupAdmin: string; chatId: string; userId: string }) => void;
}

// Create typed socket instance
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(BACKEND_URL);