import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Note } from '../types';

interface NoteTakingProps {
    notes: Note[];
    onAdd: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onUpdate: (note: Note) => void;
    onDelete: (noteId: string) => void;
}

const NOTE_COLORS = [
    'bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-red-100', 'bg-purple-100', 'bg-pink-100',
];

const NewNoteForm: React.FC<{ onAdd: NoteTakingProps['onAdd'] }> = ({ onAdd }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [color, setColor] = useState(NOTE_COLORS[0]);
    const formRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (formRef.current && !formRef.current.contains(event.target as Node)) {
                if (title || content) {
                    handleSubmit();
                }
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFocused, title, content]);

    const handleSubmit = () => {
        if (!title.trim() && !content.trim()) return;
        onAdd({ title, content, color });
        setTitle('');
        setContent('');
        setColor(NOTE_COLORS[0]);
    };

    return (
        <div ref={formRef} className="max-w-2xl mx-auto mb-8 p-4 bg-white rounded-lg shadow-lg text-gray-900">
            {isFocused && (
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full p-2 mb-2 text-lg font-semibold bg-transparent focus:outline-none"
                />
            )}
            <div
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setContent(e.currentTarget.innerHTML)}
                onFocus={() => setIsFocused(true)}
                data-placeholder="Take a note..."
                className={`w-full p-2 bg-transparent focus:outline-none min-h-[4rem] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400`}
            ></div>
            {isFocused && (
                <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2">
                        {NOTE_COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className={`w-6 h-6 rounded-full ${c} border-2 ${color === c ? 'border-indigo-500' : 'border-transparent'}`}
                            />
                        ))}
                    </div>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
                        Save
                    </button>
                </div>
            )}
        </div>
    );
};

const NoteCard: React.FC<{ note: Note; onUpdate: (note: Note) => void; onDelete: (noteId: string) => void; }> = ({ note, onUpdate, onDelete }) => {
    const titleRef = useRef<HTMLHeadingElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const updateTimeout = useRef<number | null>(null);

    const handleInput = () => {
        if (updateTimeout.current) {
            clearTimeout(updateTimeout.current);
        }
        updateTimeout.current = window.setTimeout(() => {
            onUpdate({
                ...note,
                title: titleRef.current?.innerText || '',
                content: contentRef.current?.innerHTML || '',
            });
        }, 500); // Debounce update
    };
    
    const handleColorChange = (newColor: string) => {
        onUpdate({ ...note, color: newColor });
    };

    return (
        <div className={`p-4 rounded-lg shadow-md flex flex-col break-inside-avoid ${note.color} text-gray-900`}>
             <h3
                ref={titleRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                className="font-bold text-lg mb-2 focus:outline-none focus:bg-white/50 p-1 rounded"
                dangerouslySetInnerHTML={{ __html: note.title }}
            ></h3>
            <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                className="flex-grow focus:outline-none focus:bg-white/50 p-1 rounded"
                dangerouslySetInnerHTML={{ __html: note.content }}
            ></div>
            <div className="mt-4 flex justify-between items-center opacity-50 hover:opacity-100 transition-opacity">
                 <div className="flex gap-1 group">
                    <button className="w-6 h-6 rounded-full bg-gray-500/30 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2-2H4a2 2 0 01-2-2v-4z" /></svg>
                    </button>
                    <div className="hidden group-hover:flex gap-1 absolute bg-white p-1 rounded-full shadow-md -translate-y-8">
                        {NOTE_COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => handleColorChange(c)}
                                className={`w-6 h-6 rounded-full ${c} border ${note.color === c ? 'border-gray-800' : 'border-transparent'}`}
                            />
                        ))}
                    </div>
                 </div>
                 <button onClick={() => onDelete(note.id)} className="w-6 h-6 rounded-full bg-gray-500/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </div>
    );
};

const NoteTaking: React.FC<NoteTakingProps> = ({ notes, onAdd, onUpdate, onDelete }) => {
    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [notes]);

    return (
        <div>
            <NewNoteForm onAdd={onAdd} />
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                {sortedNotes.map(note => (
                    <NoteCard key={note.id} note={note} onUpdate={onUpdate} onDelete={onDelete} />
                ))}
            </div>
        </div>
    );
};

export default NoteTaking;