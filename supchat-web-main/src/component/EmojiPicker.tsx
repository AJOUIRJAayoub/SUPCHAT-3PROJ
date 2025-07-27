// React component EmojiPicker.tsx
import React from "react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const emojis = [
  "😀",
  "😂",
  "😍",
  "😎",
  "😭",
  "👍",
  "🙏",
  "💯",
  "🎉",
  "🔥",
  "😊",
  "❤️",
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
  return (
    <div className="p-2 border rounded-md bg-white shadow grid grid-cols-6 gap-1">
      {emojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="text-xl"
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiPicker;
