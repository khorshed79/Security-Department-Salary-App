
import React, { useState, useMemo, useRef } from 'react';
import { Employee } from '../types';
import EmployeeForm from './EmployeeForm';

interface EmployeeListProps {
  employees: Employee[];
  onAdd: (employee: Employee) => void;
  onUpdate: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
  onBulkAdd: (employees: Employee[]) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onAdd, onUpdate, onDelete, onBulkAdd }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);

  const openAddModal = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleSave = (employee: Employee) => {
    if (editingEmployee) {
      onUpdate(employee);
    } else {
      onAdd(employee);
    }
    closeModal();
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleExportToCSV = () => {
    const headers = ['employeeId', 'name', 'department', 'designation', 'joiningDate', 'basicSalary'];
    const csvContent = [
      headers.join(','),
      ...employees.map(emp => [
        `"${emp.employeeId}"`,
        `"${emp.name}"`,
        `"${emp.department}"`,
        `"${emp.designation}"`,
        emp.joiningDate,
        emp.basicSalary,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'employees.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    importFileRef.current?.click();
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = ['employeeId', 'name', 'department', 'designation', 'joiningDate', 'basicSalary'];
        
        if(!requiredHeaders.every(h => headers.includes(h))) {
            throw new Error('CSV file is missing required headers.');
        }

        const newEmployees: Employee[] = lines.slice(1).map((line, index) => {
          const data = line.split(',');
          const employeeData: any = {};
          headers.forEach((header, i) => {
             employeeData[header] = data[i]?.trim().replace(/"/g, '');
          });

          if (!employeeData.employeeId || !employeeData.name) {
              throw new Error(`Row ${index + 2} is missing required employeeId or name.`);
          }
          
          return {
            id: `emp-imported-${new Date().getTime()}-${index}`,
            employeeId: employeeData.employeeId,
            name: employeeData.name,
            department: employeeData.department,
            designation: employeeData.designation,
            joiningDate: employeeData.joiningDate,
            basicSalary: parseFloat(employeeData.basicSalary) || 0,
            allowances: [],
            deductions: [],
          };
        });
        onBulkAdd(newEmployees);
      } catch (error: any) {
        alert(`Error importing file: ${error.message}`);
      } finally {
        // Reset file input
        if (event.target) {
          event.target.value = '';
        }
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full md:w-auto flex-grow">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
            <input type="file" ref={importFileRef} onChange={handleFileImport} accept=".csv" className="hidden" />
            <button onClick={handleImportClick} className="w-full md:w-auto bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Import
            </button>
             <button onClick={handleExportToCSV} className="w-full md:w-auto bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export
            </button>
            <button
              onClick={openAddModal}
              className="w-full md:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
            >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              New Employee
            </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No.</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Salary</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employees.findIndex(e => e.id === employee.id) + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {employee.photo ? (
                        <img className="h-10 w-10 rounded-full object-cover" src={employee.photo} alt={employee.name} />
                      ) : (
                        <span className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </span>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.employeeId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.department}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.designation}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{new Intl.NumberFormat('en-US').format(employee.basicSalary)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                  <button onClick={() => openEditModal(employee)} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                  <button 
                    onClick={() => {
                        if (window.confirm('Are you sure you want to delete this employee? This will also remove all their associated payslip records.')) {
                            onDelete(employee.id);
                        }
                    }} 
                    className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && <EmployeeForm employee={editingEmployee} onSave={handleSave} onClose={closeModal} onDelete={onDelete} />}
    </div>
  );
};

export default EmployeeList;