import React, { useRef, useState, useEffect } from 'react';
import { AIIcon } from './icons/NavIcons';

interface FloatingAIButtonProps {
  onClick: () => void;
  onLongPress: () => void;
  isTucked?: boolean;
}

const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onClick, onLongPress, isTucked }) => {
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const [isExpandedFromTuck, setIsExpandedFromTuck] = useState(false);

  // Reset expanded state if the button is no longer meant to be tucked
  useEffect(() => {
    if (!isTucked) {
      setIsExpandedFromTuck(false);
    }
  }, [isTucked]);
  
  // Auto-collapse the expanded edge button after 5 seconds, on outside click, or on scroll
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsExpandedFromTuck(false);
      }
    };

    const handleScroll = () => {
        setIsExpandedFromTuck(false);
    };

    if (isTucked && isExpandedFromTuck) {
      timer = setTimeout(() => {
        setIsExpandedFromTuck(false);
      }, 5000);
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isTucked, isExpandedFromTuck]);


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
    if (longPressTriggered.current) {
      return;
    }
    if (isTucked && !isExpandedFromTuck) {
      setIsExpandedFromTuck(true);
    } else {
      onClick();
    }
  };
  
  const isFullyVisible = !isTucked || isExpandedFromTuck;
  const isTuckedIn = isTucked && !isExpandedFromTuck;

  const baseClasses = "fixed z-50 bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center border-4 border-secondary transform active:scale-95 transition-all duration-300 ease-in-out ai-button-animated shadow-lg";
  
  const dynamicClasses = isTuckedIn
    ? 'bottom-24 -right-7 w-12 h-20 rounded-l-full justify-center pl-2 hover:right-0'
    : 'bottom-24 right-4 w-16 h-16 rounded-full hover:scale-105';

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      className={`${baseClasses} ${dynamicClasses}`}
      aria-label="AI Assistant"
    >
      <AIIcon className={`text-white transition-all ${isTuckedIn ? 'w-7 h-7' : 'w-8 h-8'}`} />
    </button>
  );
};

export default FloatingAIButton;