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
  
  const [showInstruction, setShowInstruction] = useState(false);
  const [isExpandedFromTuck, setIsExpandedFromTuck] = useState(false);

  // Effect to show the instructional tooltip every 12 hours
  useEffect(() => {
    const INSTRUCTION_TIMESTAMP_KEY = 'aiButtonInstructionLastShown';
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    const lastShown = localStorage.getItem(INSTRUCTION_TIMESTAMP_KEY);
    const now = Date.now();

    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;

    if (!lastShown || now - parseInt(lastShown, 10) > TWELVE_HOURS_MS) {
      localStorage.setItem(INSTRUCTION_TIMESTAMP_KEY, now.toString());
      
      showTimer = setTimeout(() => {
        setShowInstruction(true);
        // Hide after animation duration to remove from DOM
        hideTimer = setTimeout(() => {
          setShowInstruction(false);
        }, 6000); // Animation is 6s long
      }, 1500); // Show after 1.5s delay
    }

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

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
        {showInstruction && (
            <div
                className={`
                    absolute whitespace-nowrap bg-tertiary text-sm font-medium
                    px-3 py-2 rounded-lg shadow-lg pointer-events-none animate-tooltip
                    right-full mr-3
                `}
            >
                <span className="relative z-10 text-primary">Tap or long press me</span>
                <div
                    className={`
                        absolute w-3 h-3 bg-tertiary transform rotate-45
                        right-[-6px] top-1/2 -translate-y-1/2
                    `}
                ></div>
            </div>
        )}
      <AIIcon className={`text-white transition-all ${isTuckedIn ? 'w-7 h-7' : 'w-8 h-8'}`} />
    </button>
  );
};

export default FloatingAIButton;