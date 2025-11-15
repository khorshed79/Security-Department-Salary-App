import React, { useState, useMemo, useEffect, useRef } from 'react';
import { OvertimeRecord, Employee, Settings } from '../types';

interface AbsenceRecord {
    id: string; // employeeId or employeeName
    absentEmployeeName: string;
    absentEmployeePhoto?: string;
    totalHours: number;
    totalDeduction: number;
    sourceRecords: OvertimeRecord[];
}

interface AbsentDeductionProps {
    overtimeRecords: OvertimeRecord[];
    employees: Employee[];
    onDeleteBulk: (recordIds: string[]) => void;
    onUpdateOvertime: (record: OvertimeRecord) => void;
    settings: Settings;
}

const REMARKS_STORAGE_KEY = 'factory_absence_remarks';

const AbsentDeduction: React.FC<AbsentDeductionProps> = ({ overtimeRecords, employees, onDeleteBulk, onUpdateOvertime, settings }) => {
    const [remarks, setRemarks] = useState<Record<string, string>>(() => {
        try {
            const saved = localStorage.getItem(REMARKS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string>('');
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        localStorage.setItem(REMARKS_STORAGE_KEY, JSON.stringify(remarks));
    }, [remarks]);

    const absenceRecords = useMemo<AbsenceRecord[]>(() => {
        const grouped: Record<string, { key: string; records: OvertimeRecord[] }> = {};

        overtimeRecords.forEach(rec => {
            // Group records strictly by the absent employee's unique ID.
            // This prevents issues if an employee's name is changed.
            if (rec.absentEmployeeId) {
                const key = rec.absentEmployeeId;
                if (!grouped[key]) {
                    grouped[key] = { key: key, records: [] };
                }
                grouped[key].records.push(rec);
            }
        });

        return Object.values(grouped).map(group => {
            // Find employee details strictly by their unique ID.
            const employee = employees.find(e => e.id === group.key);
            // Provide a more descriptive fallback if the employee has been deleted.
            const absentEmployeeName = employee?.name || group.records[0]?.absentEmployeeName || `Unknown (ID: ${group.key})`;
            const id = group.key; 

            const totalHours = group.records.reduce((sum, r) => sum + r.hours, 0);
            const totalDeduction = group.records.reduce((sum, r) => sum + r.totalAmount, 0);

            return {
                id,
                absentEmployeeName,
                absentEmployeePhoto: employee?.photo,
                totalHours,
                totalDeduction,
                sourceRecords: group.records,
            };
        }).sort((a,b) => a.absentEmployeeName.localeCompare(b.absentEmployeeName));
    }, [overtimeRecords, employees]);

    const totals = useMemo(() => {
        return absenceRecords.reduce((acc, record) => {
            acc.totalHours += record.totalHours;
            acc.totalDeduction += record.totalDeduction;
            return acc;
        }, { totalHours: 0, totalDeduction: 0 });
    }, [absenceRecords]);

    const [viewingRecord, setViewingRecord] = useState<AbsenceRecord | null>(null);

    const handleDelete = (record: AbsenceRecord) => {
        if (window.confirm(`Are you sure you want to delete all absence records for ${record.absentEmployeeName}? This will delete ${record.sourceRecords.length} related overtime entries.`)) {
            const idsToDelete = record.sourceRecords.map(r => r.id);
            onDeleteBulk(idsToDelete);
            
            setRemarks(prev => {
                const newRemarks = {...prev};
                record.sourceRecords.forEach(sourceRec => {
                    const remarkId = `${sourceRec.absentEmployeeName}-${sourceRec.date}`;
                    delete newRemarks[remarkId];
                });
                return newRemarks;
            });
        }
    };

    const handlePrint = () => {
        const tableNode = tableRef.current?.querySelector('table');
        if (!tableNode) return;
    
        const tableClone = tableNode.cloneNode(true) as HTMLTableElement;
        // Remove last column (Actions)
        Array.from(tableClone.rows).forEach(row => {
            row.deleteCell(-1);
        });
    
        const printWindow = window.open('', '', 'height=800,width=1200');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Absent Deduction Summary</title>');
            printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            printWindow.document.write('<style>body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } </style>');
            printWindow.document.write('<body class="p-4">');
            printWindow.document.write('<h2>Absent Deduction Summary</h2>');
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
        if (absenceRecords.length === 0) {
            alert('No data to export.');
            return;
        }
        const headers = ['Sl.', 'Employee Name', 'Total Hours Covered', 'Total Deduction'];
        const csvContent = [
            headers.join(','),
            ...absenceRecords.map((rec, index) => [
                index + 1,
                `"${rec.absentEmployeeName}"`,
                rec.totalHours,
                rec.totalDeduction,
            ].join(','))
        ].join('\n');
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `absent_deduction_summary_${date}.csv`);
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
        if (absenceRecords.length === 0) {
            setSaveMessage('There is no data to save.');
            setTimeout(() => setSaveMessage(''), 5000);
            return;
        }
    
        setIsSaving(true);
        setSaveMessage('');
        try {
            const payload = {
                type: 'absentDeductionSummary',
                data: absenceRecords.map((rec, index) => ({
                    sl: index + 1,
                    employeeName: rec.absentEmployeeName,
                    totalHours: rec.totalHours,
                    totalDeduction: rec.totalDeduction,
                }))
            };
            
            await fetch(settings.googleSheetsUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            setSaveMessage('Absent deduction summary sent to Google Sheets.');
        } catch (error) {
            console.error('Error saving to Google Sheets:', error);
            setSaveMessage('Failed to save data. Check console for details.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 5000);
        }
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US').format(amount);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
             <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800">Absent Deduction Summary</h2>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrint} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm">Print</button>
                    <button onClick={handleExportToCSV} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">Export CSV</button>
                    <button onClick={handleSaveToSheets} disabled={isSaving || !settings.googleSheetsUrl} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save to Sheets'}
                    </button>
                </div>
            </div>

            {saveMessage && (
                <div className={`mb-4 text-center p-2 rounded-lg text-sm ${saveMessage.includes('Failed') || saveMessage.includes('not configured') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {saveMessage}
                </div>
            )}

            <div className="overflow-x-auto" ref={tableRef}>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Sl.</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Employee</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">Total Hours</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase">Total Deduction</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-black">
                        {absenceRecords.map((rec, index) => (
                            <tr key={rec.id}>
                                <td className="px-4 py-4">{index + 1}</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center">
                                        <img src={rec.absentEmployeePhoto || 'https://via.placeholder.com/40'} alt={rec.absentEmployeeName} className="h-10 w-10 rounded-full object-cover" />
                                        <span className="ml-3 font-medium">{rec.absentEmployeeName}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-right">{rec.totalHours.toFixed(2)}</td>
                                <td className="px-4 py-4 text-right font-semibold">{formatCurrency(rec.totalDeduction)}</td>
                                <td className="px-4 py-4 text-center space-x-2">
                                    <button onClick={() => setViewingRecord(rec)} className="text-indigo-600 hover:text-indigo-900">View Details</button>
                                    <button onClick={() => handleDelete(rec)} className="text-red-600 hover:text-red-900">Delete All</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-100 border-t-2 border-gray-300 text-black">
                        <tr>
                            <td colSpan={2} className="px-4 py-3 text-right font-bold uppercase">Grand Total</td>
                            <td className="px-4 py-3 text-right font-bold">{totals.totalHours.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-bold">{formatCurrency(totals.totalDeduction)}</td>
                            <td className="px-4 py-3"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {viewingRecord && <DetailsModal 
                record={viewingRecord} 
                employees={employees}
                onClose={() => setViewingRecord(null)} 
                onUpdateOvertime={onUpdateOvertime}
                onDeleteBulk={onDeleteBulk}
                remarks={remarks}
                setRemarks={setRemarks}
            />}
        </div>
    );
};

interface DailyAbsenceRecord {
    id: string; // Composite key: 'employeeName-date'
    date: string;
    absentEmployeeName: string;
    totalHours: number;
    totalDeduction: number;
    remarks: string;
    sourceRecords: OvertimeRecord[];
}

interface DetailsModalProps {
    record: AbsenceRecord;
    employees: Employee[];
    onClose: () => void;
    onUpdateOvertime: (record: OvertimeRecord) => void;
    onDeleteBulk: (recordIds: string[]) => void;
    remarks: Record<string, string>;
    setRemarks: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const DetailsModal: React.FC<DetailsModalProps> = ({ record, employees, onClose, onUpdateOvertime, onDeleteBulk, remarks, setRemarks }) => {
    const [editingDailyRecord, setEditingDailyRecord] = useState<DailyAbsenceRecord | null>(null);

    const dailyRecords = useMemo<DailyAbsenceRecord[]>(() => {
        const groupedByDate: Record<string, OvertimeRecord[]> = {};
        record.sourceRecords.forEach(rec => {
            if (!groupedByDate[rec.date]) {
                groupedByDate[rec.date] = [];
            }
            groupedByDate[rec.date].push(rec);
        });

        return Object.entries(groupedByDate).map(([date, records]) => {
            const id = `${record.absentEmployeeName}-${date}`;
            return {
                id,
                date,
                absentEmployeeName: record.absentEmployeeName,
                totalHours: records.reduce((sum, r) => sum + r.hours, 0),
                totalDeduction: records.reduce((sum, r) => sum + r.totalAmount, 0),
                remarks: remarks[id] || '',
                sourceRecords: records,
            };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [record, remarks]);

    const handleSaveRemark = (oldRecordId: string, newRemark: string, newRecordId?: string) => {
        setRemarks(prev => {
            const newRemarks = {...prev};
            if (newRecordId && oldRecordId !== newRecordId) {
                delete newRemarks[oldRecordId];
            }
            const finalRecordId = newRecordId || oldRecordId;
            newRemarks[finalRecordId] = newRemark;
            return newRemarks;
        });
        setEditingDailyRecord(null);
    };

    const handleDeleteDaily = (dailyRec: DailyAbsenceRecord) => {
        if (window.confirm(`Are you sure you want to delete the absence record for ${dailyRec.absentEmployeeName} on ${dailyRec.date}?`)) {
            const idsToDelete = dailyRec.sourceRecords.map(r => r.id);
            onDeleteBulk(idsToDelete);
            
            setRemarks(prev => {
                const newRemarks = {...prev};
                delete newRemarks[dailyRec.id];
                return newRemarks;
            });
        }
    };
    
    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                    <div className="p-5 border-b flex justify-between items-center">
                        <h3 className="text-lg font-bold text-black">Details for {record.absentEmployeeName}</h3>
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Close</button>
                    </div>
                    <div className="p-5 overflow-y-auto text-black">
                        <p className="mb-4 text-black">The following is a breakdown of absences by date:</p>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase">Date</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-white uppercase">Total Hours</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-white uppercase">Total Deduction</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-white uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-black">
                                {dailyRecords.map(dailyRec => (
                                    <tr key={dailyRec.id}>
                                        <td className="px-3 py-2 font-medium">{dailyRec.date}</td>
                                        <td className="px-3 py-2 text-right">{dailyRec.totalHours.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right font-semibold">{new Intl.NumberFormat('en-US').format(dailyRec.totalDeduction)}</td>
                                        <td className="px-3 py-2 text-center space-x-2">
                                            <button onClick={() => setEditingDailyRecord(dailyRec)} className="text-blue-600 hover:text-blue-900">Edit</button>
                                            <button onClick={() => handleDeleteDaily(dailyRec)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {editingDailyRecord && <EditAbsenceModal record={editingDailyRecord} employees={employees} onUpdateOvertime={onUpdateOvertime} onSaveRemark={handleSaveRemark} onClose={() => setEditingDailyRecord(null)} />}
        </>
    )
}


interface EditAbsenceModalProps {
    record: DailyAbsenceRecord;
    employees: Employee[];
    onClose: () => void;
    onSaveRemark: (oldId: string, remark: string, newId?: string) => void;
    onUpdateOvertime: (record: OvertimeRecord) => void;
}

const EditAbsenceModal: React.FC<EditAbsenceModalProps> = ({ record, employees, onClose, onSaveRemark, onUpdateOvertime }) => {
    const [editedRecords, setEditedRecords] = useState<OvertimeRecord[]>(() => JSON.parse(JSON.stringify(record.sourceRecords)));
    const [remark, setRemark] = useState(record.remarks);
    const [date, setDate] = useState(record.date);
    const initialAbsentee = employees.find(e => e.id === record.sourceRecords[0]?.absentEmployeeId);
    const [absentEmployeeId, setAbsentEmployeeId] = useState(initialAbsentee?.id || '');


    const handleHoursChange = (recordId: string, newHours: number) => {
        setEditedRecords(prev => prev.map(rec => {
            if (rec.id === recordId) {
                const hours = newHours < 0 ? 0 : newHours;
                return { ...rec, hours, totalAmount: parseFloat((hours * rec.rate).toFixed(2)) };
            }
            return rec;
        }));
    };

    const handleSave = () => {
        const originalAbsenteeId = record.sourceRecords[0]?.absentEmployeeId;
        const hasDateChanged = date !== record.date;
        const hasAbsenteeChanged = absentEmployeeId !== originalAbsenteeId;
        
        const newAbsentEmployee = employees.find(e => e.id === absentEmployeeId);
        const newAbsentEmployeeName = newAbsentEmployee?.name || 'Unknown';

        editedRecords.forEach(updatedRec => {
            const originalRec = record.sourceRecords.find(r => r.id === updatedRec.id);
            const hasRecordChanged = JSON.stringify(originalRec) !== JSON.stringify(updatedRec);
            if (hasRecordChanged || hasDateChanged || hasAbsenteeChanged) {
                onUpdateOvertime({ 
                    ...updatedRec, 
                    date, 
                    absentEmployeeId: absentEmployeeId,
                    absentEmployeeName: newAbsentEmployeeName
                });
            }
        });

        const newRecordId = `${newAbsentEmployeeName}-${date}`;
        if (remark !== record.remarks || record.id !== newRecordId) {
            onSaveRemark(record.id, remark, newRecordId);
        }
        onClose();
    };


    const totals = useMemo(() => editedRecords.reduce((acc, sr) => {
        acc.totalHours += sr.hours;
        acc.totalPay += sr.totalAmount;
        return acc;
    }, { totalHours: 0, totalPay: 0 }), [editedRecords]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-5 border-b">
                    <h3 className="text-xl font-bold text-black">Edit Absence Record</h3>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Absent Employee</label>
                            <select value={absentEmployeeId} onChange={e => setAbsentEmployeeId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-800">
                                <option value="">Select Employee</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-2">Overtime Details</h4>
                        <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase">Employee</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-white uppercase">Hours</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-white uppercase">Pay</th>
                                </tr>
                            </thead>
                            <tbody className="text-black">
                                {editedRecords.map(sr => (
                                    <tr key={sr.id}>
                                        <td className="px-3 py-2">{sr.employeeName}</td>
                                        <td className="px-3 py-2 text-right">
                                            <input type="number" value={sr.hours} onChange={e => handleHoursChange(sr.id, parseFloat(e.target.value) || 0)} className="w-24 text-right p-1 border rounded bg-white text-gray-800" step="0.5" />
                                        </td>
                                        <td className="px-3 py-2 text-right">{new Intl.NumberFormat('en-US').format(sr.totalAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                             <tfoot className="bg-gray-100 font-bold text-black">
                                <tr>
                                    <td className="px-3 py-2 text-left">Total</td>
                                    <td className="px-3 py-2 text-right">{totals.totalHours.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right">{new Intl.NumberFormat('en-US').format(totals.totalPay)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div>
                        <label htmlFor="remark" className="block text-sm font-medium text-gray-700">Remark</label>
                        <textarea id="remark" value={remark} onChange={e => setRemark(e.target.value)} rows={3} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-800"></textarea>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Changes</button>
                </div>
            </div>
        </div>
    );
};


const ViewModal: React.FC<{ record: AbsenceRecord, onClose: () => void }> = ({ record, onClose }) => {
    const viewContentRef = useRef<HTMLDivElement>(null);

    const totals = useMemo(() => {
        return record.sourceRecords.reduce((acc, sr) => {
            acc.totalHours += sr.hours;
            acc.totalPay += sr.totalAmount;
            return acc;
        }, { totalHours: 0, totalPay: 0 });
    }, [record.sourceRecords]);

    const handlePrint = () => {
        const printContent = viewContentRef.current?.innerHTML;
        if (!printContent) return;
        const printWindow = window.open('', '', 'height=800,width=1000');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>Absence Details</title><style>
                body { font-family: sans-serif; color: black; } 
                table { width: 100%; border-collapse: collapse; margin-top: 1rem; } 
                thead { background-color: #f9fafb; } 
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } 
                tfoot { font-weight: bold; }
                .text-right { text-align: right; }
            </style></head><body>`);
            printWindow.document.write(printContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
        }
    };

    const handleExport = () => {
        const headers = ['Employee', 'Hours', 'Pay'];
        const csvContent = [
            headers.join(','),
            ...record.sourceRecords.map(rec => [ `"${rec.employeeName}"`, rec.hours, rec.totalAmount ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `absence_details_${record.absentEmployeeName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-5 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-black">Details for {record.absentEmployeeName}</h3>
                    <div>
                        <button onClick={handleExport} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm mr-2">Export</button>
                        <button onClick={handlePrint} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm mr-2">Print</button>
                    </div>
                </div>
                <div className="p-5 overflow-y-auto text-black" ref={viewContentRef}>
                    <p className="mb-4 text-black">The following employees performed overtime duty in place of the absent employee:</p>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase">Employee</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-white uppercase">Hours</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-white uppercase">Pay</th>
                            </tr>
                        </thead>
                        <tbody className="text-black">
                            {record.sourceRecords.map(sr => (
                                <tr key={sr.id}>
                                    <td className="px-3 py-2">{sr.employeeName}</td>
                                    <td className="px-3 py-2 text-right">{sr.hours.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right">{new Intl.NumberFormat('en-US').format(sr.totalAmount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold text-black">
                            <tr>
                                <td className="px-3 py-2 text-left">Total</td>
                                <td className="px-3 py-2 text-right">{totals.totalHours.toFixed(2)}</td>
                                <td className="px-3 py-2 text-right">{new Intl.NumberFormat('en-US').format(totals.totalPay)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Close</button>
                </div>
            </div>
        </div>
    );
};

export default AbsentDeduction;