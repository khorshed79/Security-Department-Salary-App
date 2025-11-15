import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Employee, OvertimeRecord, Settings } from '../types';

// NOTE: This modal component is defined within OvertimeDetails.tsx as it is only used here.
// It displays a detailed breakdown of a single employee's overtime records.
interface EmployeeOvertimeViewerProps {
    employeeId: string;
    employees: Employee[];
    records: OvertimeRecord[];
    onClose: () => void;
    onDelete: (recordId: string) => void;
    onEditRecord: (record: OvertimeRecord) => void;
}

const EmployeeOvertimeViewer: React.FC<EmployeeOvertimeViewerProps> = ({ employeeId, employees, records, onClose, onDelete, onEditRecord }) => {
    const modalContentRef = useRef<HTMLDivElement>(null);

    const employee = useMemo(() => {
        return employees.find(emp => emp.id === employeeId);
    }, [employees, employeeId]);

    const employeeRecords = useMemo(() => {
        return records.filter(rec => rec.employeeId === employeeId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [records, employeeId]);

    const totals = useMemo(() => {
        return employeeRecords.reduce((acc, record) => {
            acc.totalHours += record.hours;
            acc.totalPay += record.totalAmount;
            return acc;
        }, { totalHours: 0, totalPay: 0 });
    }, [employeeRecords]);
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US').format(amount);

    const handlePrint = () => {
        const printContent = modalContentRef.current?.innerHTML;
        if (printContent) {
            const printWindow = window.open('', '', 'height=800,width=1000');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Overtime Details</title>');
                printWindow.document.write('<style>body { font-family: sans-serif; color: black; } table { width: 100%; border-collapse: collapse; } thead, tfoot { background-color: #f9fafb; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } .header { display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #ddd; padding-bottom: 1rem; margin-bottom: 1rem; } .header img { height: 4rem; width: 4rem; border-radius: 50%; } .font-bold { font-weight: bold; } .text-right { text-align: right; } </style>');
                printWindow.document.write('</head><body>');
                printWindow.document.write(printContent);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.print();
            }
        }
    };
    
    const handleExport = () => {
        if (!employee || employeeRecords.length === 0) return;
        
        const headers = ['Date', 'OT Hours', 'OT Rate', 'Total Pay', 'Absent Employee'];
        const csvContent = [
            headers.join(','),
            ...employeeRecords.map(rec => [
                rec.date,
                rec.hours,
                rec.rate,
                rec.totalAmount,
                `"${rec.absentEmployeeName || ''}"`
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `overtime_${employee.name.replace(/\s/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (!employee) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h2 className="text-lg font-bold text-gray-800">Overtime Details</h2>
                    <div>
                        <button onClick={handleExport} className="mr-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">Export</button>
                        <button onClick={handlePrint} className="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">Print</button>
                        <button onClick={onClose} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm">Close</button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-6">
                    <div ref={modalContentRef}>
                        <div className="header flex items-center gap-4 border-b pb-4 sticky top-0 bg-white z-10">
                            <div className="flex-shrink-0 h-16 w-16">
                                {employee.photo ? (
                                    <img className="h-16 w-16 rounded-full object-cover" src={employee.photo} alt={employee.name} />
                                ) : (
                                    <span className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-black">{employee.name}</h3>
                                <p className="text-black">{employee.designation} - {employee.department}</p>
                                <p className="text-sm text-black">Employee ID: {employee.employeeId}</p>
                            </div>
                        </div>
                        
                        <h4 className="text-md font-semibold text-black my-4">Overtime Record</h4>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Hours</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Pay</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">In Place of</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {employeeRecords.map(rec => (
                                    <tr key={rec.id}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-black">{rec.date}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-black text-right">{rec.hours}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-black text-right">{formatCurrency(rec.rate)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-black text-right">{formatCurrency(rec.totalAmount)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-black">{rec.absentEmployeeName}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">
                                            <button onClick={() => onEditRecord(rec)} className="text-blue-600 hover:text-blue-900 mr-3">
                                                Edit
                                            </button>
                                            <button onClick={() => onDelete(rec.id)} className="text-red-600 hover:text-red-900">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100 border-t-2 border-gray-300 sticky bottom-0">
                                <tr>
                                    <td className="px-4 py-3 text-left text-sm font-bold text-black uppercase">Total</td>
                                    <td className="px-4 py-3 text-right text-sm font-bold text-black">{totals.totalHours.toFixed(2)}</td>
                                    <td className="px-4 py-3"></td>
                                    <td className="px-4 py-3 text-right text-sm font-bold text-black">{formatCurrency(totals.totalPay)}</td>
                                    <td className="px-4 py-3" colSpan={2}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface OvertimeEditModalProps {
    record: OvertimeRecord;
    employees: Employee[];
    onClose: () => void;
    onSave: (updatedData: { date: string; hours: number; absentEmployeeId?: string; absentEmployeeName?: string }) => void;
}

const OvertimeEditModal: React.FC<OvertimeEditModalProps> = ({ record, employees, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        date: record.date,
        hours: record.hours,
        absentEmployeeId: record.absentEmployeeId || employees.find(e => e.name === record.absentEmployeeName)?.id || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'hours' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const absentEmployee = employees.find(e => e.id === formData.absentEmployeeId);
        onSave({
            date: formData.date,
            hours: formData.hours,
            absentEmployeeId: formData.absentEmployeeId,
            absentEmployeeName: absentEmployee?.name || ''
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-5 border-b">
                        <h2 className="text-xl font-bold text-gray-800">Edit Overtime for {record.employeeName}</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="hours" className="block text-sm font-medium text-gray-700">Overtime Hours</label>
                            <input
                                type="number"
                                id="hours"
                                name="hours"
                                value={formData.hours}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                min="0"
                                step="0.5"
                            />
                        </div>
                         <div>
                            <label htmlFor="absent-employee" className="block text-sm font-medium text-gray-700">Duty Absent</label>
                            <select
                                id="absent-employee"
                                name="absentEmployeeId"
                                value={formData.absentEmployeeId}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            >
                                <option value="">Select Employee</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                     <div className="p-4 bg-gray-50 border-t flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


interface OvertimeDetailsProps {
    overtimeRecords: OvertimeRecord[];
    employees: Employee[];
    onDelete: (recordId: string) => void;
    onUpdate: (record: OvertimeRecord) => void;
    settings: Settings;
}

const OvertimeDetails: React.FC<OvertimeDetailsProps> = ({ overtimeRecords, employees, onDelete, onUpdate, settings }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(null);
    const [editingRecord, setEditingRecord] = useState<OvertimeRecord | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string>('');
    const tableRef = useRef<HTMLDivElement>(null);

    const employeeMap = useMemo(() => {
        const map = new Map<string, Employee>();
        employees.forEach(emp => map.set(emp.id, emp));
        return map;
    }, [employees]);

    const filteredRecords = useMemo(() => {
        return overtimeRecords
            .map(record => {
                const employee = employeeMap.get(record.employeeId);
                return {
                    ...record,
                    employeeName: record.employeeName || employee?.name || 'Unknown',
                    employeeDepartment: record.department || employee?.department || 'N/A',
                    employeePhoto: employee?.photo,
                };
            })
            .filter(record => 
                record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.date.includes(searchTerm)
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [overtimeRecords, employeeMap, searchTerm]);
    
    const totals = useMemo(() => {
        return filteredRecords.reduce((acc, record) => {
            acc.totalHours += record.hours;
            acc.totalPay += record.totalAmount;
            return acc;
        }, { totalHours: 0, totalPay: 0 });
    }, [filteredRecords]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US').format(amount);

    const handleViewDetails = (employeeId: string) => {
        setViewingEmployeeId(employeeId);
    };

    const handleCloseModal = () => {
        setViewingEmployeeId(null);
    };

    const handlePrint = () => {
        const tableNode = tableRef.current?.querySelector('table');
        if (!tableNode) return;
    
        const tableClone = tableNode.cloneNode(true) as HTMLTableElement;
        Array.from(tableClone.rows).forEach(row => {
            if(row.cells.length > 1) { 
                row.deleteCell(-1); // Delete 'Action' column
            }
        });
    
        const printWindow = window.open('', '', 'height=800,width=1200');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Overtime Details</title>');
            printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            printWindow.document.write('<style>body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } </style>');
            printWindow.document.write('<body class="p-4">');
            printWindow.document.write('<h2>Overtime Details</h2>');
            printWindow.document.write(tableClone.outerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    const handleExportToCSV = () => {
        if (filteredRecords.length === 0) {
            alert('No data to export.');
            return;
        }
        const headers = ['Date', 'Employee Name', 'Department', 'OT Hours', 'OT Rate', 'Total Pay', 'In Place Of'];
        const csvContent = [
            headers.join(','),
            ...filteredRecords.map(rec => [
                rec.date,
                `"${rec.employeeName}"`,
                `"${rec.employeeDepartment}"`,
                rec.hours,
                rec.rate,
                rec.totalAmount,
                `"${rec.absentEmployeeName || ''}"`
            ].join(','))
        ].join('\n');
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `overtime_details_report_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSaveToSheets = async () => {
        if (!settings.googleSheetsUrl) {
            setSaveMessage('Google Sheets URL is not configured in Settings.');
            setTimeout(() => setSaveMessage(''), 5000);
            return;
        }
        if (filteredRecords.length === 0) {
            setSaveMessage('There is no data to save.');
            setTimeout(() => setSaveMessage(''), 5000);
            return;
        }
    
        setIsSaving(true);
        setSaveMessage('');
        try {
            const payload = {
                type: 'overtimeDetailsReport',
                data: filteredRecords,
            };
            
            await fetch(settings.googleSheetsUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            setSaveMessage('Overtime details report sent to Google Sheets.');
        } catch (error) {
            console.error('Error saving to Google Sheets:', error);
            setSaveMessage('Failed to save data. Check console for details.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 5000);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col h-[calc(100vh-10rem)]">
            <div className="flex-shrink-0 flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800">Overtime History</h2>
                 <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Search by name or date..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <button onClick={handlePrint} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm">Print</button>
                    <button onClick={handleExportToCSV} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">Export CSV</button>
                    <button onClick={handleSaveToSheets} disabled={isSaving || !settings.googleSheetsUrl} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save to Sheets'}
                    </button>
                </div>
            </div>

             {saveMessage && (
                <div className={`-mt-2 mb-4 text-center p-2 rounded-lg text-sm ${saveMessage.includes('Failed') || saveMessage.includes('not configured') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {saveMessage}
                </div>
            )}

            <div className="flex-grow overflow-auto" ref={tableRef}>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OT Hours</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">OT Rate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Pay</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRecords.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-500">No overtime records found.</td>
                            </tr>
                        ) : (
                            filteredRecords.map(record => (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                            {record.employeePhoto ? (
                                                <img className="h-10 w-10 rounded-full object-cover" src={record.employeePhoto} alt={record.employeeName} />
                                            ) : (
                                                <span className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                </span>
                                            )}
                                            </div>
                                            <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.employeeDepartment}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">{record.hours}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(record.rate)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold text-left">{formatCurrency(record.totalAmount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button onClick={() => handleViewDetails(record.employeeId)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                            View
                                        </button>
                                        <button onClick={() => setEditingRecord(record)} className="text-blue-600 hover:text-blue-900 mr-3">
                                            Edit
                                        </button>
                                        <button onClick={() => onDelete(record.id)} className="text-red-600 hover:text-red-900">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {filteredRecords.length > 0 && (
                        <tfoot className="bg-gray-100 border-t-2 border-gray-300 sticky bottom-0">
                            <tr>
                                <td colSpan={3} className="px-6 py-3 text-left text-sm font-bold text-black uppercase">Total</td>
                                <td className="px-6 py-3 text-left text-sm font-bold text-black">{totals.totalHours.toFixed(2)}</td>
                                <td className="px-6 py-3"></td>
                                <td className="px-6 py-3 text-left text-sm font-bold text-black">{formatCurrency(totals.totalPay)}</td>
                                <td className="px-6 py-3"></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {viewingEmployeeId && (
                <EmployeeOvertimeViewer
                    employeeId={viewingEmployeeId}
                    employees={employees}
                    records={overtimeRecords}
                    onClose={handleCloseModal}
                    onDelete={onDelete}
                    onEditRecord={setEditingRecord}
                />
            )}

            {editingRecord && (
                <OvertimeEditModal
                    record={editingRecord}
                    employees={employees}
                    onClose={() => setEditingRecord(null)}
                    onSave={(updatedData) => {
                        const rate = editingRecord.rate;
                        const totalAmount = (updatedData.hours || 0) * rate;
                        onUpdate({ 
                            ...editingRecord, 
                            ...updatedData,
                            totalAmount: parseFloat(totalAmount.toFixed(2))
                        });
                        setEditingRecord(null);
                    }}
                />
            )}
        </div>
    );
};

export default OvertimeDetails;