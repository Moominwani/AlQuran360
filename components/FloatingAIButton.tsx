import React, { useRef } from 'react';
import { AIIcon } from './icons/NavIcons';

interface FloatingAIButtonProps {
  onClick: () => void;
  onLongPress: () => void;
}

const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onClick, onLongPress }) => {
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const handleMouseDown = () => {
    longPressTriggered.current = false;
    longPressTimeout.current = setTimeout(() => {
      longPressTriggered.current = true;
      onLongPress();
    }, 500); // 500ms for long press
  };

  const handleMouseUp = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
  };

  const handleClick = () => {
    if (!longPressTriggered.current) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      className="fixed bottom-24 right-4 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center border-4 border-secondary transform hover:scale-105 active:scale-95 transition-all ai-button-animated shadow-lg"
      aria-label="AI Assistant"
    >
      <AIIcon className="w-8 h-8 text-white" />
    </button>
  );
};

export default FloatingAIButton;
