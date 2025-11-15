
import React, { useState, useRef } from 'react';
import { Employee, Allowance, Deduction } from '../types';
import CategoryEmployeeSelector from './CategoryEmployeeSelector';

interface EmployeeFormProps {
  employee: Employee | null;
  onSave: (employee: Employee) => void;
  onClose: () => void;
  onDelete: (employeeId: string) => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onSave, onClose, onDelete }) => {
  const [formData, setFormData] = useState<Employee>(
    employee || {
      id: '',
      employeeId: '',
      name: '',
      department: '',
      designation: '',
      joiningDate: '',
      basicSalary: 0,
      allowances: [],
      deductions: [],
      photo: undefined,
    }
  );
  
  const [imagePreview, setImagePreview] = useState<string | undefined>(employee?.photo);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData({ ...formData, photo: result });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleEmployeeSelect = (selected: { name: string; photo?: string }) => {
    setFormData(prev => ({ ...prev, name: selected.name, photo: selected.photo }));
    if (selected.photo) {
      setImagePreview(selected.photo);
    } else {
      setImagePreview(undefined);
    }
    setIsCategorySelectorOpen(false);
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'basicSalary' ? parseFloat(value) || 0 : value });
  };
  
  const handleItemChange = <T extends Allowance | Deduction>(
    index: number, 
    field: keyof T, 
    value: string, 
    type: 'allowances' | 'deductions'
  ) => {
    const items = [...formData[type]];
    const currentItem = items[index];
    if (field === 'amount') {
        (currentItem as any)[field] = parseFloat(value) || 0;
    } else {
        (currentItem as any)[field] = value;
    }
    setFormData({ ...formData, [type]: items });
  };

  const addItem = (type: 'allowances' | 'deductions') => {
    const newItem = { type: '', amount: 0 };
    setFormData({ ...formData, [type]: [...formData[type], newItem] });
  };

  const removeItem = (index: number, type: 'allowances' | 'deductions') => {
    const items = formData[type].filter((_, i) => i !== index);
    setFormData({ ...formData, [type]: items });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: employee ? employee.id : `emp-${new Date().getTime()}` });
  };

  const handleDelete = () => {
    if (employee && window.confirm('Are you sure you want to delete this employee? This will also remove all their associated payslip records.')) {
        onDelete(employee.id);
        onClose();
    }
  };


  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">{employee ? 'Edit Employee Information' : 'Add New Employee'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Image Upload Section */}
              <div className="lg:col-span-1 flex flex-col items-center">
                <div className="w-48 h-48 rounded-full bg-gray-200 mb-4 flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Employee" className="w-full h-full object-cover" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  )}
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gray-100 border rounded-lg hover:bg-gray-200 text-sm font-medium">
                  Upload Photo
                </button>
              </div>

              {/* Form Fields Section */}
              <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                       <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="p-3 border rounded-lg w-full" required />
                       <button type="button" onClick={() => setIsCategorySelectorOpen(true)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-100 text-indigo-600 rounded-full p-1.5 hover:bg-indigo-200 transition-colors" aria-label="Select employee from category">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                       </button>
                    </div>
                    <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} placeholder="Employee ID" className="p-3 border rounded-lg" required />
                    <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="Department" className="p-3 border rounded-lg" required />
                    <input type="text" name="designation" value={formData.designation} onChange={handleChange} placeholder="Designation" className="p-3 border rounded-lg" required />
                    <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className="p-3 border rounded-lg text-gray-500" required />
                    <input type="number" name="basicSalary" value={formData.basicSalary} onChange={handleChange} placeholder="Basic Salary" className="p-3 border rounded-lg" required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2 text-lg">Allowances</h3>
                      {formData.allowances.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <input type="text" value={item.type} onChange={e => handleItemChange(index, 'type', e.target.value, 'allowances')} placeholder="Type" className="p-2 border rounded w-1/2"/>
                          <input type="number" value={item.amount} onChange={e => handleItemChange(index, 'amount', e.target.value, 'allowances')} placeholder="Amount" className="p-2 border rounded w-1/2"/>
                          <button type="button" onClick={() => removeItem(index, 'allowances')} className="text-red-500 hover:text-red-700 p-2">&times;</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addItem('allowances')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">+ Add Allowance</button>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-lg">Deductions</h3>
                      {formData.deductions.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <input type="text" value={item.type} onChange={e => handleItemChange(index, 'type', e.target.value, 'deductions')} placeholder="Type" className="p-2 border rounded w-1/2"/>
                          <input type="number" value={item.amount} onChange={e => handleItemChange(index, 'amount', e.target.value, 'deductions')} placeholder="Amount" className="p-2 border rounded w-1/2"/>
                          <button type="button" onClick={() => removeItem(index, 'deductions')} className="text-red-500 hover:text-red-700 p-2">&times;</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addItem('deductions')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">+ Add Deduction</button>
                    </div>
                  </div>
              </div>
            </div>
          </form>
          <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
            <div>
                {employee && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
                    >
                        Delete Employee
                    </button>
                )}
            </div>
            <div className="flex gap-4">
                <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition-colors">Cancel</button>
                <button type="submit" onClick={handleSubmit} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors">
                    {employee ? 'Update Employee' : 'Save Employee'}
                </button>
            </div>
          </div>
        </div>
      </div>
      {isCategorySelectorOpen && <CategoryEmployeeSelector onClose={() => setIsCategorySelectorOpen(false)} onSelect={handleEmployeeSelect} />}
    </>
  );
};

export default EmployeeForm;