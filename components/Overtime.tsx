

import React, { useState, useMemo, useRef } from 'react';
import { Employee, OvertimeRecord, Settings } from '../types';

interface OvertimeProps {
  employees: Employee[];
  onSave: (records: OvertimeRecord[]) => void;
  settings: Settings;
}

interface CalculationItem extends Employee {
  hours: number;
}

const EmployeeCard: React.FC<{ employee: Employee; onSelect: () => void; }> = ({ employee, onSelect }) => (
    <div
        onClick={onSelect}
        className="bg-white rounded-lg shadow-md p-3 flex flex-col items-center justify-center text-center cursor-pointer aspect-square transition-all duration-200 hover:shadow-xl hover:scale-105"
    >
        <div className="w-16 h-16 rounded-full bg-gray-200 mb-2 flex items-center justify-center overflow-hidden">
            {employee.photo ? (
                <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover" />
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            )}
        </div>
        <p className="font-semibold text-sm text-gray-800">{employee.name}</p>
        <p className="text-xs text-gray-500">{employee.employeeId}</p>
    </div>
);

const Overtime: React.FC<OvertimeProps> = ({ employees, onSave, settings }) => {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [calculationItems, setCalculationItems] = useState<CalculationItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [absentEmployeeId, setAbsentEmployeeId] = useState<string>('');
    const [saveMessage, setSaveMessage] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const tableRef = useRef<HTMLDivElement>(null);


    const categories = useMemo(() => {
        const allDepartments = employees.map(emp => emp.department);
        return ['All', ...Array.from(new Set(allDepartments)).sort()];
    }, [employees]);


    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesCategory = selectedCategory === 'All' || emp.department === selectedCategory;
            const matchesSearch = (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                   emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [employees, searchTerm, selectedCategory]);

    const getOvertimeRate = (): number => {
        if (settings.overtimeRate && settings.overtimeRate > 0) {
            return settings.overtimeRate;
        }
        const basicSalary = settings.overtimeCalculationBasicSalary;
        const { workingDaysPerMonth, workingHoursPerDay, overtimeMultiplier } = settings;
        if (!basicSalary || workingDaysPerMonth === 0 || workingHoursPerDay === 0) return 0;
        const dailySalary = basicSalary / workingDaysPerMonth;
        const hourlyRate = dailySalary / workingHoursPerDay;
        return hourlyRate * overtimeMultiplier;
    };

    const handleAddOrIncrement = (employee: Employee) => {
        setCalculationItems(prev => {
            const existingItem = prev.find(item => item.id === employee.id);
            if (existingItem) {
                return prev.map(item => 
                    item.id === employee.id ? { ...item, hours: item.hours + 1 } : item
                );
            } else {
                return [...prev, { ...employee, hours: 1 }];
            }
        });
    };

    const handleRemoveEmployee = (employeeId: string) => {
        setCalculationItems(prev => prev.filter(item => item.id !== employeeId));
    };

    const handleHoursChange = (employeeId: string, hours: number) => {
        setCalculationItems(prev =>
            prev.map(item => item.id === employeeId ? { ...item, hours: hours < 0 ? 0 : hours } : item)
        );
    };

    const handleClearAll = () => {
        // The confirmation dialog is removed to ensure the action is always performed.
        // This is a more direct approach and avoids potential issues with the confirm dialog.
        setCalculationItems([]);
        setAbsentEmployeeId('');
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setSearchTerm('');
        setSelectedCategory('All');
    };

    const generateRecords = (): OvertimeRecord[] => {
        const recordsToSave = calculationItems.filter(item => item.hours > 0);
        if (recordsToSave.length === 0) {
            setSaveMessage('Please add employees and enter their overtime hours before saving.');
            setTimeout(() => setSaveMessage(''), 5000);
            return [];
        }
        if (!absentEmployeeId) {
             setSaveMessage('Please select the employee who was absent for the duty before saving.');
             setTimeout(() => setSaveMessage(''), 5000);
            return [];
        }
        
        const absentEmployee = employees.find(e => e.id === absentEmployeeId);

        return recordsToSave.map(item => {
            const rate = getOvertimeRate();
            const totalAmount = item.hours * rate;
            return {
                id: `ot-${item.id}-${new Date().getTime()}`,
                employeeId: item.id,
                employeeDisplayId: item.employeeId,
                employeeName: item.name,
                department: item.department,
                designation: item.designation,
                date: selectedDate,
                hours: item.hours,
                rate: parseFloat(rate.toFixed(2)),
                totalAmount: parseFloat(totalAmount.toFixed(2)),
                absentEmployeeId: absentEmployeeId,
                absentEmployeeName: absentEmployee?.name || '',
            };
        });
    };

    const handleSave = async () => {
        const recordsToSave = generateRecords();
        if (recordsToSave.length === 0) {
            return;
        }

        onSave(recordsToSave);

        if (settings.googleSheetsUrl) {
            setIsSaving(true);
            setSaveMessage('');
            try {
                const payload = { records: recordsToSave };
                await fetch(settings.googleSheetsUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                setSaveMessage(`${recordsToSave.length} records sent to Google Sheets.`);
            } catch (error) {
                console.error('Error saving to Google Sheets:', error);
                setSaveMessage('Failed to save to Sheets. Check console.');
            } finally {
                setIsSaving(false);
                setTimeout(() => setSaveMessage(''), 5000);
            }
        }

        setCalculationItems([]);
        setAbsentEmployeeId('');
        alert('Overtime records saved successfully!');
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-10rem)]">
            {/* Left side: Employee Selection */}
            <div className="bg-white p-4 rounded-xl shadow-lg flex flex-col">
                <div className="flex-shrink-0 flex flex-col md:flex-row gap-2 mb-4">
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="p-2 border rounded-lg w-full md:w-auto">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        />
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredEmployees.map(emp => (
                            <EmployeeCard key={emp.id} employee={emp} onSelect={() => handleAddOrIncrement(emp)} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side: Calculation */}
            <div className="bg-white p-4 rounded-xl shadow-lg flex flex-col">
                <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-center gap-4 mb-4 pb-4 border-b">
                    <div className='flex items-center gap-2'>
                        <label htmlFor="overtime-date" className="font-semibold text-gray-700">Date:</label>
                        <input type="date" id="overtime-date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="p-2 border rounded-lg" />
                    </div>
                     <div className='flex items-center gap-2'>
                        <label htmlFor="absent-employee" className="font-semibold text-gray-700">Duty Absent:</label>
                        <select id="absent-employee" value={absentEmployeeId} onChange={e => setAbsentEmployeeId(e.target.value)} className="p-2 border rounded-lg w-full md:w-48">
                            <option value="">Select Employee</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div ref={tableRef} className="flex-grow overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hours</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Est. Pay</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {calculationItems.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Select employees from the left panel.</td></tr>
                            ) : (
                                calculationItems.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                            <div className="text-xs text-gray-500">{item.employeeId}</div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <input type="number" value={item.hours} onChange={e => handleHoursChange(item.id, parseFloat(e.target.value) || 0)} className="w-20 text-center p-1 border rounded" />
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-700">
                                            {new Intl.NumberFormat('en-US').format(item.hours * getOvertimeRate())}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-center">
                                            <button onClick={() => handleRemoveEmployee(item.id)} className="text-red-500 hover:text-red-700 text-xl leading-none">&times;</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex-shrink-0 pt-4 border-t mt-auto">
                     {saveMessage && (
                        <div className={`mb-2 text-center p-2 rounded-lg text-sm ${saveMessage.includes('Failed') || saveMessage.includes('Please') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {saveMessage}
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <button onClick={handleClearAll} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold text-sm">Clear All</button>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Total Hours: <span className="font-bold">{calculationItems.reduce((sum, i) => sum + i.hours, 0).toFixed(2)}</span></p>
                            <p className="text-lg text-gray-800 font-bold">Total Pay: {new Intl.NumberFormat('en-US').format(calculationItems.reduce((sum, i) => sum + (i.hours * getOvertimeRate()), 0))}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-bold disabled:bg-gray-400"
                    >
                        {isSaving ? 'Saving...' : 'Save Overtime Records'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Overtime;