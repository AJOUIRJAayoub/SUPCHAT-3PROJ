// supchat-web-main/src/redux/types.ts

import { store } from "./store";

// Redux store types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// User types
export interface User {
  id: string;
  _id: string; // MongoDB ID
  name: string;
  email: string;
  profilePicture?: string;
  token?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserState {
  user: User | null;
  isAuthenticated: boolean;
}

// Chat types
export interface Chat {
  _id: string;
  name?: string;
  chatName?: string; // Alternative name property
  isGroupChat: boolean;
  isChannel?: boolean;
  users: User[];
  latestMessage?: Message;
  groupAdmin?: User;
  createdAt: string;
  updatedAt: string;
  unreadMessages?: number;
  profilePicture?: string;
  onlyAdminCanMessage?: boolean;
}

// Message types
export interface Message {
  _id: string;
  sender: User;
  content: string;
  chat: string | Chat;
  readBy?: User[];
  seenBy?: User[];
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
}

// API Error types
export interface ApiError {
  data?: {
    message: string;
    error?: string;
  };
  status?: number;
}

// Socket types
export interface SocketMessage {
  room: string;
  message: Message;
}

export interface SocketNotification {
  chatId: string;
  message: Message;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  profilePicture?: string;
}

export interface CreateChatFormData {
  userId?: string;
  users?: string[];
  name?: string;
  isGroupChat?: boolean;
}

export interface SendMessageFormData {
  content: string;
  chatId: string;
}

// Component Props types
export interface ToggleButtonProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export interface ChatItemProps {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
}

export interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
}

// Cloudinary types
export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}