import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Employee, EmployeeCV, CVSection, CVField, CVListItem, CVSectionLayout, CVSectionSide } from '../types';

// Helper to create a default CV structure for a new employee
const createDefaultCV = (employeeId: string): EmployeeCV => ({
    employeeId,
    aboutMe: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pharetra in lorem at laoreet. Donec hendrerit libero eget est tempor, quis tempus arcu elementum. In elementum elit at dui tristique feugiat. Mauris convallis, mi at mattis malesuada, neque nulla volutpat dolor, hendrerit faucibus eros nibh ut nunc.',
    sections: [
        { id: `sec-${Date.now()}-work`, title: 'WORK EXPERIENCE', layout: 'list', side: 'right', items: [] },
        { id: `sec-${Date.now()}-ref`, title: 'REFERENCES', layout: 'grid', side: 'right', items: [] },
        { id: `sec-${Date.now()}-contact`, title: 'CONTACT', layout: 'grid', side: 'left', items: [
            { id: `field-${Date.now()}-1`, label: 'Phone', value: '+123-456-7890' },
            { id: `field-${Date.now()}-2`, label: 'Email', value: 'hello@reallygreatsite.com' },
            { id: `field-${Date.now()}-3`, label: 'Website', value: 'www.reallygreatsite.com' },
            { id: `field-${Date.now()}-4`, label: 'Address', value: '123 Anywhere St., Any City' },
        ]},
        { id: `sec-${Date.now()}-edu`, title: 'EDUCATION', layout: 'list', side: 'left', items: [] },
        { id: `sec-${Date.now()}-exp`, title: 'EXPERTISE', layout: 'tags', side: 'left', items: [] },
        { id: `sec-${Date.now()}-lang`, title: 'LANGUAGE', layout: 'tags', side: 'left', items: [
             { id: `field-${Date.now()}-5`, label: 'English', value: '' },
             { id: `field-${Date.now()}-6`, label: 'French', value: '' },
        ] },
    ]
});


const CVPreview: React.FC<{ employee: Employee, employeeCV: EmployeeCV }> = ({ employee, employeeCV }) => {

    const renderSection = (section: CVSection) => {
        return (
            <div key={section.id} className="mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3" dangerouslySetInnerHTML={{ __html: section.title }}></h3>
                {section.layout === 'grid' && (
                    <div className="space-y-2 text-sm">
                        {section.items.map(item => 'label' in item && (
                            <div key={item.id}>
                                <p className="font-semibold" dangerouslySetInnerHTML={{ __html: item.label }}></p>
                                <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: item.value }}></p>
                            </div>
                        ))}
                    </div>
                )}
                {section.layout === 'list' && (
                     <div className="space-y-4 relative border-l-2 border-gray-200 ml-3">
                         {section.items.map(item => 'title' in item && (
                            <div key={item.id} className="pl-5 relative">
                                <div className="absolute h-3 w-3 bg-indigo-600 rounded-full ring-white ring-2" style={{left: '-26px', top: '8px'}}></div>
                                <p className="text-xs text-gray-500">{item.dateRange}</p>
                                <p className="font-bold text-gray-800" dangerouslySetInnerHTML={{ __html: item.title }}></p>
                                <p className="text-sm font-semibold text-gray-600" dangerouslySetInnerHTML={{ __html: item.subtitle }}></p>
                                {item.description && <p className="text-sm text-gray-500 mt-1" dangerouslySetInnerHTML={{ __html: item.description }}></p>}
                            </div>
                         ))}
                    </div>
                )}
                 {section.layout === 'tags' && (
                    <div className="space-y-1 text-sm">
                        {section.items.map(item => 'label' in item && (
                            <p key={item.id} dangerouslySetInnerHTML={{ __html: item.label }}></p>
                        ))}
                    </div>
                )}
            </div>
        )
    };

    return (
        <div className="w-full bg-white text-gray-800 p-8">
            <div className="h-24 bg-rose-100 -mx-8 -mt-8"></div>
            <div className="flex -mt-20">
                {/* Left Column */}
                <div className="w-2/5 pr-8">
                     <div className="w-32 h-32 rounded-full overflow-hidden mb-6 ring-4 ring-white">
                        {employee.photo ? 
                            <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover" /> :
                            <div className="w-full h-full bg-gray-300"></div>
                        }
                    </div>
                    {employeeCV.sections.filter(s => s.side === 'left').map(renderSection)}
                </div>
                {/* Right Column */}
                <div className="w-3/5 pl-4">
                    <h1 className="text-4xl font-bold uppercase">{employee.name}</h1>
                    <p className="text-lg text-gray-600 tracking-wider mb-6">{employee.designation}</p>
                    
                    <div className="mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">ABOUT ME</h3>
                        <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{__html: employeeCV.aboutMe}}></p>
                    </div>
                    {employeeCV.sections.filter(s => s.side === 'right').map(renderSection)}
                </div>
            </div>
        </div>
    )
}

// Rich Text Editor Toolbar
const ToolbarButton: React.FC<{ onClick: (e: React.MouseEvent) => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
    <button type="button" title={title} onMouseDown={e => e.preventDefault()} onClick={onClick} className="p-2 hover:bg-gray-700 rounded transition-colors duration-150">
        {children}
    </button>
);

const RichTextToolbar: React.FC<{ activeElement: HTMLElement | null }> = ({ activeElement }) => {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: -9999, left: -9999 });

    useEffect(() => {
        if (activeElement) {
            const rect = activeElement.getBoundingClientRect();
            const toolbarRect = toolbarRef.current?.getBoundingClientRect();
            let top = rect.top - (toolbarRect?.height || 50) - 5 + window.scrollY;
            if (top < 0) { // If there's no space on top, show below
                top = rect.bottom + 5 + window.scrollY;
            }
            setPosition({ top, left: rect.left + window.scrollX });
        }
    }, [activeElement]);
    
    if (!activeElement) return null;

    const handleCommand = (command: string, value: string | null = null) => {
        activeElement.focus();
        document.execCommand(command, false, value);
        activeElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    };

    const handleLineHeight = (value: string) => {
        activeElement.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        let element = range.commonAncestorContainer.nodeType === 3 ? range.commonAncestorContainer.parentElement : (range.commonAncestorContainer as HTMLElement);
        while (element && window.getComputedStyle(element).display !== 'block') {
            element = element.parentElement;
        }
        if (element && element.closest('[contenteditable="true"]')) {
            element.style.lineHeight = value;
            activeElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        }
    };

    return ReactDOM.createPortal(
        <div
            ref={toolbarRef}
            className="rich-text-toolbar fixed z-[100] bg-gray-800 text-white p-1 rounded-lg shadow-xl flex items-center gap-0.5 flex-wrap"
            style={{ top: `${position.top}px`, left: `${position.left}px`, transition: 'top 0.1s, left 0.1s' }}
        >
            <ToolbarButton onClick={() => handleCommand('bold')} title="Bold">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.49 3.994a.75.75 0 01.956.28l4.004 8.008a.75.75 0 01-.663 1.112h-2.28a.75.75 0 00-.75.75v3.25a.75.75 0 01-1.5 0V6.44l-1.92-3.838a.75.75 0 01.28-1.04l2.873-1.436zM5.5 13.25a.75.75 0 01.75-.75h2.28a.75.75 0 00.663-1.112L5.188 3.38a.75.75 0 00-1.236.832l3.626 7.252v3.036a.75.75 0 00.75.75h.172z" clipRule="evenodd"></path></svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => handleCommand('italic')} title="Italic">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5.75 3a.75.75 0 000 1.5h1.966l-3.33 10.002A.75.75 0 005.25 16h3.5a.75.75 0 000-1.5H6.783l3.33-10.002A.75.75 0 009.25 3h-3.5z"></path></svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => handleCommand('underline')} title="Underline">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3.5a.75.75 0 00-1.5 0V11a3.5 3.5 0 007 0V3.5a.75.75 0 00-1.5 0V11a2 2 0 01-4 0V3.5zM15 3.5a.75.75 0 00-1.5 0V11a3.5 3.5 0 007 0V3.5a.75.75 0 00-1.5 0V11a2 2 0 01-4 0V3.5zM4 16.5a.75.75 0 000 1.5h12a.75.75 0 000-1.5H4z"></path></svg>
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-600 mx-1"></div>
            <ToolbarButton onClick={() => handleCommand('justifyLeft')} title="Align Left">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 5.25A.75.75 0 012.75 4.5h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 5.25zm0 5A.75.75 0 012.75 9.5h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm.75 4.25a.75.75 0 000 1.5h14.5a.75.75 0 000-1.5H2.75z" clipRule="evenodd"></path></svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => handleCommand('justifyCenter')} title="Align Center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 5.25A.75.75 0 012.75 4.5h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 5.25zM5 10.25A.75.75 0 015.75 9.5h8.5a.75.75 0 010 1.5h-8.5A.75.75 0 015 10.25zm-2.25 4a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd"></path></svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => handleCommand('justifyRight')} title="Align Right">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.75 4.5a.75.75 0 000 1.5h14.5a.75.75 0 000-1.5H2.75zm0 5a.75.75 0 000 1.5h14.5a.75.75 0 000-1.5H2.75zm0 5a.75.75 0 000 1.5h14.5a.75.75 0 000-1.5H2.75z" clipRule="evenodd"></path></svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => handleCommand('justifyFull')} title="Justify">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 5.25A.75.75 0 012.75 4.5h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 5.25zm0 5A.75.75 0 012.75 9.5h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm.75 4.25a.75.75 0 000 1.5h14.5a.75.75 0 000-1.5H2.75z" clipRule="evenodd"></path></svg>
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-600 mx-1"></div>
            <ToolbarButton onClick={() => handleCommand('increaseFontSize')} title="Increase Font Size">A+</ToolbarButton>
            <ToolbarButton onClick={() => handleCommand('decreaseFontSize')} title="Decrease Font Size">A-</ToolbarButton>
            <div className="w-px h-6 bg-gray-600 mx-1"></div>
            <div className="relative">
                <ToolbarButton onClick={() => {}} title="Text Color"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM15.25 5.5a.75.75 0 00-1.06-1.06l-1.062 1.06a.75.75 0 001.061 1.062l1.06-1.06zM4.75 5.5a.75.75 0 011.06-1.06l1.062 1.06a.75.75 0 11-1.061 1.062l-1.06-1.06zM10 15.25a.75.75 0 01-.75-.75V13a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM8.05 13.5h3.9a.75.75 0 010 1.5h-3.9a.75.75 0 010-1.5z"></path></svg></ToolbarButton>
                <input type="color" onChange={e => handleCommand('foreColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <div className="relative">
                <ToolbarButton onClick={() => {}} title="Fill Color"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 3.5A2.5 2.5 0 018.5 1h3A2.5 2.5 0 0114 3.5v.255a.75.75 0 01-1.5 0V3.5a1 1 0 00-1-1h-3a1 1 0 00-1 1v.255a.75.75 0 01-1.5 0V3.5zM3 7.5A2.5 2.5 0 015.5 5h9A2.5 2.5 0 0117 7.5v5A2.5 2.5 0 0114.5 15h-3.25a.75.75 0 010 1.5h3.25A4 4 0 0018.5 12.5v-5A4 4 0 0014.5 4h-9A4 4 0 001.5 7.5v5A4 4 0 005.5 16.5h3.25a.75.75 0 010 1.5H5.5A2.5 2.5 0 013 12.5v-5z" clipRule="evenodd"></path></svg></ToolbarButton>
                <input type="color" onChange={e => handleCommand('backColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <select onChange={e => handleLineHeight(e.target.value)} onMouseDown={e => e.preventDefault()} className="bg-gray-800 text-white p-2 rounded text-sm focus:outline-none">
                <option value="">Spacing</option>
                <option value="1">1.0</option>
                <option value="1.5">1.5</option>
                <option value="2">2.0</option>
                <option value="2.5">2.5</option>
            </select>
        </div>,
        document.body
    );
};

// Editable Div Component
interface EditableDivProps {
    html: string;
    onChange: (html: string) => void;
    onFocus: (e: React.FocusEvent<HTMLDivElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLDivElement>) => void;
    className?: string;
    placeholder?: string;
}

const EditableDiv: React.FC<EditableDivProps> = ({ html, onChange, onFocus, onBlur, className, placeholder }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(false);

    useEffect(() => {
        const isEmpty = !ref.current?.textContent && !ref.current?.querySelector('img');
        setIsPlaceholderVisible(isEmpty);
    }, [html]);

    return (
        <div className="relative">
            {isPlaceholderVisible && placeholder && <div className="absolute top-2 left-2 text-gray-400 pointer-events-none">{placeholder}</div>}
            <div
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                className={className}
                onInput={e => onChange(e.currentTarget.innerHTML)}
                onFocus={onFocus}
                onBlur={onBlur}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
};


// CV Editor Modal
interface CVFormModalProps {
  employee: Employee;
  employeeCV: EmployeeCV | undefined;
  onSave: (cv: EmployeeCV) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onClose: () => void;
}

const CVFormModal: React.FC<CVFormModalProps> = ({ employee, employeeCV, onSave, onUpdateEmployee, onClose }) => {
  const [formData, setFormData] = useState<EmployeeCV>(
    employeeCV || createDefaultCV(employee.id)
  );
  const [localEmployee, setLocalEmployee] = useState<Employee>(employee);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeEditable, setActiveEditable] = useState<HTMLElement | null>(null);

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => setActiveEditable(e.currentTarget);
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      setTimeout(() => {
          if (!document.activeElement?.closest('.rich-text-toolbar')) {
              setActiveEditable(null);
          }
      }, 150);
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLocalEmployee(prev => ({ ...prev, photo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => { dragItem.current = position; };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => { dragOverItem.current = position; };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    setFormData(prev => {
        const newSections = [...prev.sections];
        const dragItemContent = newSections.splice(dragItem.current!, 1)[0];
        newSections.splice(dragOverItem.current!, 0, dragItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        return { ...prev, sections: newSections };
    });
  };

  const handleSectionChange = (sectionIndex: number, field: keyof CVSection, value: any) => {
      setFormData(prev => {
          const newSections = [...prev.sections];
          (newSections[sectionIndex] as any)[field] = value;
          return {...prev, sections: newSections};
      })
  };

  const handleItemChange = (sectionIndex: number, itemIndex: number, field: string, value: string) => {
      setFormData(prev => {
          const newSections = [...prev.sections];
          const section = { ...newSections[sectionIndex] };
          const newItems = [...section.items];
          const item = { ...newItems[itemIndex] };
          (item as any)[field] = value;
          newItems[itemIndex] = item;
          section.items = newItems;
          newSections[sectionIndex] = section;
          return { ...prev, sections: newSections };
      })
  };

  const addItem = (sectionIndex: number) => {
      setFormData(prev => {
          const newSections = [...prev.sections];
          const section = { ...newSections[sectionIndex] };
          const newItem = section.layout === 'list' 
            ? { id: `item-${Date.now()}`, title: 'New Title', subtitle: 'New Subtitle', dateRange: 'Date Range', description: 'Description' }
            : { id: `item-${Date.now()}`, label: 'New Label', value: 'New Value' };
          section.items = [...section.items, newItem];
          newSections[sectionIndex] = section;
          return { ...prev, sections: newSections };
      });
  };

  const removeItem = (sectionIndex: number, itemIndex: number) => {
      setFormData(prev => {
          const newSections = [...prev.sections];
          const section = { ...newSections[sectionIndex] };
          const newItems = section.items.filter((_, i) => i !== itemIndex);
          section.items = newItems;
          newSections[sectionIndex] = section;
          return { ...prev, sections: newSections };
      });
  };

    const removeSection = (sectionIndex: number) => {
        if (window.confirm("Are you sure you want to delete this entire section?")) {
            setFormData(prev => ({
                ...prev,
                sections: prev.sections.filter((_, i) => i !== sectionIndex)
            }));
        }
    };
  
    const addSection = (title: string, layout: CVSectionLayout, side: CVSectionSide) => {
        const newSection: CVSection = {
            id: `sec-${Date.now()}`,
            title,
            layout,
            side,
            items: []
        };
        setFormData(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEmployee(localEmployee);
    onSave(formData);
    onClose();
  };

  const renderItemFields = (sectionIndex: number, item: CVField | CVListItem, itemIndex: number) => {
    const section = formData.sections[sectionIndex];
    if (section.layout === 'list' && 'title' in item) { // CVListItem
        return (
            <div className="space-y-3 p-3 bg-white border rounded-md">
                <input value={item.dateRange} onChange={e => handleItemChange(sectionIndex, itemIndex, 'dateRange', e.target.value)} placeholder="e.g., 2008 - 2012" className="p-2 border rounded w-full bg-white text-gray-900"/>
                <EditableDiv html={item.title} onChange={html => handleItemChange(sectionIndex, itemIndex, 'title', html)} onFocus={handleFocus} onBlur={handleBlur} placeholder="e.g., Bachelor of Design" className="p-2 border rounded w-full bg-white text-gray-900 font-bold"/>
                <EditableDiv html={item.subtitle} onChange={html => handleItemChange(sectionIndex, itemIndex, 'subtitle', html)} onFocus={handleFocus} onBlur={handleBlur} placeholder="e.g., University Name" className="p-2 border rounded w-full bg-white text-gray-900"/>
                <EditableDiv html={item.description || ''} onChange={html => handleItemChange(sectionIndex, itemIndex, 'description', html)} onFocus={handleFocus} onBlur={handleBlur} placeholder="Description of role or studies..." className="p-2 border rounded w-full bg-white text-gray-900 min-h-[70px]"/>
            </div>
        );
    } else if ('label' in item) { // CVField
        const isTagLayout = section.layout === 'tags';
        return (
             <div className="flex items-center gap-2 w-full p-2 bg-white border rounded-md">
                <EditableDiv html={item.label} onChange={html => handleItemChange(sectionIndex, itemIndex, 'label', html)} onFocus={handleFocus} onBlur={handleBlur} placeholder="Label" className="p-2 border rounded flex-1 bg-white text-gray-900"/>
                {!isTagLayout && <EditableDiv html={item.value} onChange={html => handleItemChange(sectionIndex, itemIndex, 'value', html)} onFocus={handleFocus} onBlur={handleBlur} placeholder="Value" className="p-2 border rounded flex-1 bg-white text-gray-900"/>}
            </div>
        );
    }
    return null;
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-2 text-gray-900">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full flex flex-col">
        <header className="p-5 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold">Edit CV: {employee.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </header>
        
        <div className="flex-grow flex flex-row overflow-hidden">
            <main className="w-1/2 overflow-y-auto p-6 space-y-6 border-r" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                 <div>
                    <h3 className="text-xl font-semibold mb-2 text-indigo-700">Profile Photo</h3>
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {localEmployee.photo ? <img src={localEmployee.photo} alt="Employee" className="w-full h-full object-cover" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                        </div>
                        <input type="file" accept="image/*" ref={photoInputRef} onChange={handleImageChange} className="hidden" />
                        <button type="button" onClick={() => photoInputRef.current?.click()} className="px-4 py-2 bg-gray-100 border rounded-lg hover:bg-gray-200 text-sm font-medium"> Upload Photo </button>
                    </div>
                </div>
                <div>
                     <h3 className="text-xl font-semibold mb-2 text-indigo-700">About Me</h3>
                     <EditableDiv html={formData.aboutMe} onChange={html => setFormData(prev => ({...prev, aboutMe: html}))} onFocus={handleFocus} onBlur={handleBlur} placeholder="Write a brief paragraph..." className="p-2 border rounded w-full bg-white text-gray-900 min-h-[96px]" />
                </div>
                {formData.sections.map((section, sectionIndex) => (
                    <div key={section.id} draggable onDragStart={(e) => handleDragStart(e, sectionIndex)} onDragEnter={(e) => handleDragEnter(e, sectionIndex)} className="p-4 border-2 border-dashed rounded-lg bg-gray-50 cursor-move">
                        <div className="flex justify-between items-center mb-4">
                            <EditableDiv html={section.title} onChange={html => handleSectionChange(sectionIndex, 'title', html)} onFocus={handleFocus} onBlur={handleBlur} className="text-xl font-semibold text-indigo-700 bg-transparent focus:outline-none focus:ring-0 p-1" />
                             <div className="flex items-center gap-4">
                                <select value={section.side} onChange={e => handleSectionChange(sectionIndex, 'side', e.target.value)} className="p-1 border rounded text-sm bg-white text-gray-900">
                                    <option value="left">Left Column</option>
                                    <option value="right">Right Column</option>
                                </select>
                                 <button type="button" onClick={() => removeSection(sectionIndex)} className="text-red-500 hover:text-red-700 text-sm font-medium">&times; Delete Section</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {section.items.map((item, itemIndex) => (
                                <div key={item.id} className="flex items-start gap-2">
                                    <div className="flex-grow">{renderItemFields(sectionIndex, item, itemIndex)}</div>
                                    <button type="button" onClick={() => removeItem(sectionIndex, itemIndex)} className="text-red-500 hover:text-red-700 p-2 text-xl leading-none mt-1">&times;</button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => addItem(sectionIndex)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 mt-3">+ Add Item</button>
                    </div>
                ))}
                 <button onClick={() => setIsCategoryModalOpen(true)} className="w-full mt-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition-colors"> + Add New Section </button>
            </main>

            <aside className="w-1/2 bg-gray-200 p-4 overflow-y-auto">
                <div className="bg-white shadow-lg mx-auto">
                    <CVPreview employee={localEmployee} employeeCV={formData} />
                </div>
            </aside>
        </div>

        <footer className="p-4 bg-gray-50 border-t flex justify-end gap-4 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold">Cancel</button>
            <button type="button" onClick={handleSubmit} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">Save Information</button>
        </footer>
      </div>
      <RichTextToolbar activeElement={activeEditable} />
    </div>
    {isCategoryModalOpen && <AddCategoryModal onAdd={addSection} onClose={() => setIsCategoryModalOpen(false)} />}
    </>
  );
};

// Add Category Modal
const AddCategoryModal: React.FC<{onAdd: (title: string, layout: CVSectionLayout, side: CVSectionSide) => void, onClose: () => void}> = ({ onAdd, onClose }) => {
    const [title, setTitle] = useState('');
    const [layout, setLayout] = useState<CVSectionLayout>('grid');
    const [side, setSide] = useState<CVSectionSide>('right');
    
    const handleAdd = () => {
        if (!title.trim()) {
            alert("Please enter a title for the section.");
            return;
        }
        onAdd(title, layout, side);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-gray-900">
                <h3 className="font-bold text-lg mb-4">Add New Section</h3>
                <div className="space-y-4">
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Section Title (e.g., Awards)" className="p-2 border rounded w-full bg-white text-gray-900" />
                     <div>
                        <label className="text-sm">Layout Type</label>
                        <select value={layout} onChange={e => setLayout(e.target.value as CVSectionLayout)} className="p-2 border rounded w-full bg-white text-gray-900">
                            <option value="grid">Grid (Label-Value Pairs)</option>
                            <option value="list">List (Title, Subtitle, etc.)</option>
                            <option value="tags">Tags (Labels Only)</option>
                        </select>
                    </div>
                     <div>
                        <label className="text-sm">Preview Column</label>
                        <select value={side} onChange={e => setSide(e.target.value as CVSectionSide)} className="p-2 border rounded w-full bg-white text-gray-900">
                            <option value="left">Left (Narrow)</option>
                            <option value="right">Right (Wide)</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-semibold">Cancel</button>
                    <button onClick={handleAdd} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold">Add</button>
                </div>
            </div>
        </div>
    );
};


// CV Preview Modal
const CVPreviewModal: React.FC<{ employee: Employee, employeeCV: EmployeeCV, onClose: () => void }> = ({ employee, employeeCV, onClose }) => {
    const cvRef = React.useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = cvRef.current?.innerHTML;
        if (!printContent) return;

        const printWindow = window.open('', '', 'height=1123,width=794'); // A4 dimensions
        if (!printWindow) {
            alert('Could not open print window. Please disable your pop-up blocker.');
            return;
        }

        printWindow.document.write(`<html><head><title>CV - ${employee.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @page {
              size: A4;
              margin: 0.5in 1in 0.5in 1in; /* top right bottom left */
            }
            body { 
                font-family: sans-serif;
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important;
            }
            @media print {
             * {
                color: black !important;
                background-color: transparent !important;
             }
             .bg-rose-100 {
                 background-color: #ffe4e6 !important;
             }
             .ring-white {
                 --tw-ring-color: white !important;
             }
             .bg-indigo-600 {
                 background-color: #4f46e5 !important;
             }
            }
        </style></head><body>`);
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        };
    };

    return (        
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <header className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">CV Preview</h2>
          <div>
            <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 mr-2">Print</button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Close</button>
          </div>
        </header>
        <main className="flex-grow overflow-y-auto bg-gray-200 p-8">
            <div ref={cvRef} className="w-full bg-white shadow-lg text-gray-800">
               <CVPreview employee={employee} employeeCV={employeeCV} />
            </div>
        </main>
      </div>
    </div>);
};

// Main Component
interface EmployeeInformationProps {
  employees: Employee[];
  employeeCVs: EmployeeCV[];
  onSave: (cv: EmployeeCV) => void;
  onUpdateEmployee: (employee: Employee) => void;
}

const EmployeeInformation: React.FC<EmployeeInformationProps> = ({ employees, employeeCVs, onSave, onUpdateEmployee }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalView, setModalView] = useState<'edit' | 'preview' | null>(null);

  const employeeCVMap = useMemo(() => {
    const map = new Map<string, EmployeeCV>();
    employeeCVs.forEach(cv => map.set(cv.employeeId, cv));
    return map;
  }, [employeeCVs]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);
  
  const handleOpenModal = (employee: Employee, view: 'edit' | 'preview') => {
      setSelectedEmployee(employee);
      setModalView(view);
  }

  const handleCloseModal = () => {
      setSelectedEmployee(null);
      setModalView(null);
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Manage Employee Information</h2>
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border rounded-lg w-1/3"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEmployees.map(employee => (
              <tr key={employee.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {employee.photo ? 
                        <img className="h-10 w-10 rounded-full object-cover" src={employee.photo} alt={employee.name} /> :
                        <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                      }
                    </div>
                    <div className="ml-4 font-medium text-gray-900">{employee.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.employeeId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.designation}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                  <button onClick={() => handleOpenModal(employee, 'edit')} className="text-indigo-600 hover:text-indigo-900">Add/Edit Info</button>
                  <button onClick={() => handleOpenModal(employee, 'preview')} className="text-green-600 hover:text-green-900">Preview CV</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEmployee && modalView === 'edit' && (
        <CVFormModal
          employee={selectedEmployee}
          employeeCV={employeeCVMap.get(selectedEmployee.id)}
          onSave={onSave}
          onUpdateEmployee={onUpdateEmployee}
          onClose={handleCloseModal}
        />
      )}
      {selectedEmployee && modalView === 'preview' && (
          <CVPreviewModal
            employee={selectedEmployee}
            employeeCV={employeeCVMap.get(selectedEmployee.id) || createDefaultCV(selectedEmployee.id)}
            onClose={handleCloseModal}
          />
      )}
    </div>
  );
};

export default EmployeeInformation;
