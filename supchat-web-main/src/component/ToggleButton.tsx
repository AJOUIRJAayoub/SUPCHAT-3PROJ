import { useState } from "react";

interface ToggleButtonProps {
  initialValue: boolean;
  label?: string;
  onToggle?: (value: boolean) => void;
}

const ToggleButton = ({ initialValue, label, onToggle }: ToggleButtonProps) => {
  console.log("value is ", initialValue);
  const [enabled, setEnabled] = useState(initialValue);

  const handleToggle = () => {
    const newState = !enabled;
    setEnabled(newState);
    onToggle && onToggle(newState);
  };

  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-gray-700 font-medium">{label}</span>}
      <button
        onClick={handleToggle}
        className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
          enabled ? "bg-blue-500" : "bg-gray-300"
        }`}
      >
        <div
          className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
            enabled ? "translate-x-6" : "translate-x-0"
          }`}
        ></div>
      </button>
    </div>
  );
};

export default ToggleButton;