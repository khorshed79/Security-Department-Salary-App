import React, { useState, useRef, useEffect } from 'react';

interface FloatingNoteButtonProps {
    onClick: () => void;
}

const FloatingNoteButton: React.FC<FloatingNoteButtonProps> = ({ onClick }) => {
    const getInitialPosition = () => {
        try {
            const savedPos = localStorage.getItem('floating_note_pos');
            if (savedPos) {
                const parsed = JSON.parse(savedPos);
                if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
                    return parsed;
                }
            }
        } catch (e) {
            console.error("Failed to parse floating button position", e);
        }
        // Return a temporary position, it will be corrected on mount.
        return { x: window.innerWidth - 80, y: window.innerHeight - 80 };
    };

    const [position, setPosition] = useState(getInitialPosition);
    const dragInfo = useRef({ isDragging: false, hasDragged: false });
    const buttonRef = useRef<HTMLButtonElement>(null);

    // This effect ensures the button is in the corner on first load if no position is saved.
    useEffect(() => {
        const setInitialPosition = () => {
             const savedPos = localStorage.getItem('floating_note_pos');
             if (!savedPos && buttonRef.current) {
                const buttonWidth = buttonRef.current.offsetWidth || 64;
                const buttonHeight = buttonRef.current.offsetHeight || 64;
                setPosition({ 
                    x: window.innerWidth - buttonWidth - 20, 
                    y: window.innerHeight - buttonHeight - 20 
                });
             }
        };
        // Run after initial render to make sure dimensions are available.
        setTimeout(setInitialPosition, 0); 
    }, []);

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (e.button !== 0) return; // Only drag with left mouse button
        e.preventDefault();

        dragInfo.current = { isDragging: true, hasDragged: false };
        const button = e.currentTarget;
        const startX = e.clientX;
        const startY = e.clientY;
        const offsetX = e.clientX - button.getBoundingClientRect().left;
        const offsetY = e.clientY - button.getBoundingClientRect().top;
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!dragInfo.current.isDragging) return;
            
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            // Only set hasDragged if moved beyond a threshold
            if (!dragInfo.current.hasDragged && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                 dragInfo.current.hasDragged = true;
            }

            let newX = moveEvent.clientX - offsetX;
            let newY = moveEvent.clientY - offsetY;

            const buttonWidth = button.offsetWidth;
            const buttonHeight = button.offsetHeight;
            newX = Math.max(10, Math.min(newX, window.innerWidth - buttonWidth - 10));
            newY = Math.max(10, Math.min(newY, window.innerHeight - buttonHeight - 10));

            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            dragInfo.current.isDragging = false;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            
            if (dragInfo.current.hasDragged) {
                 // Calculate final position from the mouseup event to avoid stale state
                let finalX = upEvent.clientX - offsetX;
                let finalY = upEvent.clientY - offsetY;
                const buttonWidth = button.offsetWidth;
                const buttonHeight = button.offsetHeight;
                finalX = Math.max(10, Math.min(finalX, window.innerWidth - buttonWidth - 10));
                finalY = Math.max(10, Math.min(finalY, window.innerHeight - buttonHeight - 10));
                
                // Set the state one last time and save to local storage
                const finalPos = { x: finalX, y: finalY };
                setPosition(finalPos);
                localStorage.setItem('floating_note_pos', JSON.stringify(finalPos));
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleClick = () => {
        if (!dragInfo.current.hasDragged) {
            onClick();
        }
    };

    return (
        <button
            ref={buttonRef}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            style={{ top: position.y, left: position.x }}
            className="fixed z-[1000] w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center cursor-move transform transition-transform hover:scale-110 active:scale-100"
            title="Open Notes"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        </button>
    );
};

export default FloatingNoteButton;