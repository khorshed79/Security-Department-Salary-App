
import React, { useState, useRef, useEffect } from 'react';
import { SimpleEmployee } from '../types';
import { CATEGORIES, DUMMY_CATEGORIZED_EMPLOYEES } from '../constants';

interface CategoryEmployeeSelectorProps {
  onClose: () => void;
  onSelect: (employee: { name: string; photo?: string }) => void;
}

const CategoryEmployeeSelector: React.FC<CategoryEmployeeSelectorProps> = ({ onClose, onSelect }) => {
  const [categories, setCategories] = useState<string[]>(() => {
    try {
        const saved = localStorage.getItem('factory_categories');
        return saved ? JSON.parse(saved) : CATEGORIES;
    } catch (e) { return CATEGORIES; }
  });

  const [employees, setEmployees] = useState<Record<string, SimpleEmployee[]>>(() => {
    try {
        const saved = localStorage.getItem('factory_categorized_employees');
        return saved ? JSON.parse(saved) : DUMMY_CATEGORIZED_EMPLOYEES;
    } catch (e) { return DUMMY_CATEGORIZED_EMPLOYEES; }
  });

  useEffect(() => {
    localStorage.setItem('factory_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('factory_categorized_employees', JSON.stringify(employees));
  }, [employees]);


  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || '');
  
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editPhotoRef = useRef<HTMLInputElement>(null);

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [editingCategory, setEditingCategory] = useState<{ originalName: string; newName: string } | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<SimpleEmployee | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, forEditing: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (forEditing && editingEmployee) {
          setEditingEmployee({ ...editingEmployee, photo: result });
        } else {
          setImagePreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeName.trim() || !selectedCategory) return;

    const newEmployee: SimpleEmployee = {
      id: `simp-${new Date().getTime()}`,
      name: newEmployeeName.trim(),
      photo: imagePreview,
    };

    setEmployees(prev => ({
      ...prev,
      [selectedCategory]: [...(prev[selectedCategory] || []), newEmployee],
    }));

    setNewEmployeeName('');
    setImagePreview(undefined);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleAddCategory = () => {
      if (!newCategoryName.trim() || categories.includes(newCategoryName.trim())) {
        alert("Category name cannot be empty or a duplicate.");
        return;
      }
      const newCat = newCategoryName.trim();
      setCategories(prev => [...prev, newCat]);
      setEmployees(prev => ({...prev, [newCat]: []}));
      setNewCategoryName('');
      setIsManageModalOpen(false);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete the category "${catToDelete}" and all its employees? This action cannot be undone.`)) {
        const updatedCategories = categories.filter(c => c !== catToDelete);
        setCategories(updatedCategories);

        setEmployees(prev => {
            const newEmployees = { ...prev };
            delete newEmployees[catToDelete];
            return newEmployees;
        });

        if (selectedCategory === catToDelete) {
            setSelectedCategory(updatedCategories[0] || '');
        }
    }
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.newName.trim()) return;
    const { originalName, newName } = editingCategory;

    if (newName !== originalName && categories.includes(newName)) {
        alert('Category name already exists.');
        return;
    }

    setCategories(prev => prev.map(c => c === originalName ? newName : c));
    setEmployees(prev => {
        const newEmployeesState = { ...prev };
        if (originalName !== newName) {
            newEmployeesState[newName] = newEmployeesState[originalName] || [];
            delete newEmployeesState[originalName];
        }
        return newEmployeesState;
    });

    if (selectedCategory === originalName) {
        setSelectedCategory(newName);
    }
    setEditingCategory(null);
  };
  
  const handleDeleteEmployee = (empId: string) => {
      if(window.confirm('Are you sure you want to delete this employee?')) {
          setEmployees(prev => ({
              ...prev,
              [selectedCategory]: prev[selectedCategory]?.filter(e => e.id !== empId) || []
          }));
      }
  };

  const handleUpdateEmployee = () => {
    if (!editingEmployee) return;
    setEmployees(prev => ({
        ...prev,
        [selectedCategory]: prev[selectedCategory]?.map(e => e.id === editingEmployee.id ? editingEmployee : e) || []
    }));
    setEditingEmployee(null);
  };


  const renderEmployeeItem = (emp: SimpleEmployee) => {
    if (editingEmployee && editingEmployee.id === emp.id) {
        return ( // Edit State
            <li key={emp.id} className="p-2 border-2 border-indigo-500 rounded-lg flex items-center gap-4 transition-all">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {editingEmployee.photo ? <img src={editingEmployee.photo} alt={editingEmployee.name} className="w-full h-full object-cover"/> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    </div>
                    <input type="file" accept="image/*" ref={editPhotoRef} onChange={(e) => handleImageChange(e, true)} className="hidden"/>
                    <button type="button" onClick={() => editPhotoRef.current?.click()} className="absolute bottom-0 right-0 text-xs bg-black bg-opacity-50 text-white rounded-full p-1 leading-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                </div>
                <input type="text" value={editingEmployee.name} onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})} className="flex-grow p-1 border rounded text-sm"/>
                <div className="flex gap-2">
                    <button onClick={handleUpdateEmployee} className="text-green-600 hover:text-green-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
                    <button onClick={() => setEditingEmployee(null)} className="text-red-600 hover:text-red-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                </div>
            </li>
        );
    }
    return ( // Normal State
        <li key={emp.id} className="group p-2 border rounded-lg flex items-center gap-4 hover:shadow-md hover:border-indigo-500 transition-all">
            <div onClick={() => onSelect(emp)} className="cursor-pointer flex items-center gap-4 flex-grow">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {emp.photo ? <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover"/> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                </div>
                <p className="text-sm font-medium text-gray-800">{emp.name}</p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingEmployee({...emp})} className="text-blue-600 hover:text-blue-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                <button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-600 hover:text-red-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
            </div>
        </li>
    );
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Select Employee by Category</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>

        <div className="flex-grow flex overflow-hidden">
            {/* Left: Category List */}
            <div className="w-1/3 border-r overflow-y-auto p-4 bg-gray-50">
                <h3 className="font-semibold text-gray-700 mb-2 px-2">Categories</h3>
                <ul>
                    {categories.map(cat => (
                        <li key={cat} className="group text-sm">
                           {editingCategory?.originalName === cat ? (
                                <div className="flex items-center gap-2 p-2">
                                    <input type="text" value={editingCategory.newName} onChange={(e) => setEditingCategory({...editingCategory, newName: e.target.value})} className="flex-grow p-1 border rounded" />
                                    <button onClick={handleUpdateCategory} className="text-green-600 hover:text-green-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
                                    <button onClick={() => setEditingCategory(null)} className="text-red-600 hover:text-red-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                                </div>
                           ) : (
                                <div className={`flex justify-between items-center rounded p-2 ${selectedCategory === cat ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-200'}`}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); setSelectedCategory(cat); }} className="flex-grow">{cat}</a>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingCategory({ originalName: cat, newName: cat })} className="text-blue-600 hover:text-blue-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                                        <button onClick={() => handleDeleteCategory(cat)} className="text-red-600 hover:text-red-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                                    </div>
                                </div>
                           )}
                        </li>
                    ))}
                </ul>
                <button onClick={() => setIsManageModalOpen(true)} className="mt-4 w-full text-sm text-center py-2 bg-gray-200 hover:bg-gray-300 rounded font-medium text-gray-700">
                    Manage Categories
                </button>
            </div>

            {/* Right: Employees & Add Form */}
            <div className="w-2/3 flex flex-col">
                <div className="p-4 border-b">
                    <form onSubmit={handleAddEmployee} className="flex items-start gap-4">
                       <div className="flex flex-col items-center gap-2">
                           <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                           </div>
                           <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                           <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold">Photo</button>
                       </div>
                       <div className="flex-grow">
                           <input type="text" value={newEmployeeName} onChange={e => setNewEmployeeName(e.target.value)} placeholder={`Add employee to ${selectedCategory}...`} className="p-2 border rounded w-full mb-2" />
                           <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 font-semibold">Add Employee</button>
                       </div>
                    </form>
                </div>
                <div className="flex-grow overflow-y-auto p-4">
                    <ul className="space-y-2">
                        {(employees[selectedCategory] || []).length > 0 ? (
                             (employees[selectedCategory] || []).map(emp => renderEmployeeItem(emp))
                        ) : (
                            <li className="text-center text-gray-500 py-6">No employees in this category.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
      </div>
      
      {/* Manage Categories Modal */}
      {isManageModalOpen && (
          <div className="absolute inset-0 bg-black bg-opacity-30 z-70 flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg shadow-xl border w-full max-w-sm">
                  <h3 className="font-bold text-lg mb-4">Add New Category</h3>
                  <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Category Name" className="p-2 border rounded w-full mb-4"/>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setIsManageModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-semibold">Cancel</button>
                      <button onClick={handleAddCategory} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold">Add</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CategoryEmployeeSelector;
