import React from 'react';
import { Employee, OvertimeRecord } from '../types';

interface GoogleSheetsExportProps {
    overtimeRecords: OvertimeRecord[];
    employees: Employee[];
}

const GoogleSheetsExport: React.FC<GoogleSheetsExportProps> = ({ overtimeRecords, employees }) => {
    const employeeMap = new Map<string, Employee>();
    // FIX: Changed `map` to `employeeMap` to correctly reference the Map object declared above.
    employees.forEach(emp => employeeMap.set(emp.id, emp));

    const handleExportToCSV = () => {
        if (overtimeRecords.length === 0) {
            alert('No overtime records to export.');
            return;
        }

        const headers = ['Date', 'Employee ID', 'Employee Name', 'Department', 'Overtime Hours', 'Hourly Rate (BDT)', 'Total Pay (BDT)'];
        
        const csvContent = [
            headers.join(','),
            ...overtimeRecords.map(record => {
                const employee = employeeMap.get(record.employeeId);
                return [
                    record.date,
                    `"${employee?.employeeId || 'N/A'}"`,
                    `"${employee?.name || 'Unknown'}"`,
                    `"${employee?.department || 'N/A'}"`,
                    record.hours,
                    record.rate,
                    record.totalAmount,
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `overtime_records_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto">
            <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.789-2.756 9.356-1.749-2.567-2.756-5.839-2.756-9.356s1.007-6.789 2.756-9.356C10.991 4.211 12 7.483 12 11z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517 1.009 6.789 2.756 9.356 1.749-2.567 2.756-5.839 2.756-9.356s-1.007-6.789-2.756-9.356C13.009 4.211 12 7.483 12 11z" />
                </svg>
                <h2 className="mt-4 text-2xl font-bold text-gray-800">Export Overtime Data</h2>
                <p className="mt-2 text-gray-600">
                    Directly saving to Google Sheets from the browser is not supported for security reasons.
                    Instead, you can export all saved overtime records as a CSV file, which can be easily imported into Google Sheets or any other spreadsheet software.
                </p>
            </div>
            
            <div className="mt-8 text-center">
                <button
                    onClick={handleExportToCSV}
                    className="w-full md:w-auto bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors flex items-center justify-center mx-auto text-base"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download All Overtime Records (.csv)
                </button>
            </div>
        </div>
    );
};

export default GoogleSheetsExport;