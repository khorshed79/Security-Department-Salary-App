import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Employee, Payslip, OvertimeRecord, Settings } from '../types';

interface SalaryProcessing2Props {
  employees: Employee[];
  onProcess: (payslips: Payslip[], month: number, year: number) => void;
  overtimeRecords: OvertimeRecord[];
  settings: Settings;
}

interface DisplayPayslip extends Payslip {
  photo?: string;
}

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Custom Dropdown for Month Selection
const MonthSelector: React.FC<{
    label: string;
    selectedMonths: number[];
    onToggleMonth: (monthIndex: number) => void;
}> = ({ label, selectedMonths, onToggleMonth }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const getButtonText = () => {
        if (selectedMonths.length === 0) return label;
        if (selectedMonths.length === 1) return months[selectedMonths[0]];
        if (selectedMonths.length === months.length) return 'All Months';
        return `${selectedMonths.length} months selected`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 border rounded w-full md:w-48 text-left bg-white flex justify-between items-center text-gray-900"
            >
                <span>{getButtonText()}</span>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg border max-h-60 overflow-y-auto">
                    <ul>
                        {months.map((month, index) => (
                            <li key={index} className="px-3 py-2 hover:bg-gray-100">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedMonths.includes(index)}
                                        onChange={() => onToggleMonth(index)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="ml-3 text-sm text-gray-700">{month}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


const SalaryProcessing2: React.FC<SalaryProcessing2Props> = ({ employees, onProcess, overtimeRecords, settings }) => {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState<number>(currentYear);
    const [sourceMonths, setSourceMonths] = useState<number[]>([]);
    const [finalizationMonth, setFinalizationMonth] = useState<number>(new Date().getMonth());
    const [payslipsToProcess, setPayslipsToProcess] = useState<DisplayPayslip[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string>('');
    const processingTableRef = useRef<HTMLDivElement>(null);
    
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const handleMonthToggle = (monthIndex: number) => {
        setSourceMonths(prev =>
            prev.includes(monthIndex)
                ? prev.filter(m => m !== monthIndex)
                : [...prev, monthIndex].sort((a,b) => a-b)
        );
    };

    const handleGenerate = () => {
        if (sourceMonths.length === 0) {
            alert('Please select at least one source month.');
            return;
        }

        const summarizedPayslips = employees.map(emp => {
            let totalOvertimePay = 0;
            let totalAbsentDeduction = 0;

            sourceMonths.forEach(month => {
                // Sum overtime for the employee from the selected source month
                totalOvertimePay += overtimeRecords
                    .filter(r => {
                        const recordDate = new Date(r.date);
                        return r.employeeId === emp.id && recordDate.getFullYear() === year && recordDate.getMonth() === month;
                    })
                    .reduce((sum, r) => sum + r.totalAmount, 0);

                // Sum absence deductions for the employee from the selected source month
                totalAbsentDeduction += overtimeRecords
                    .filter(r => {
                        if (!r.absentEmployeeId) return false;
                        const recordDate = new Date(r.date);
                        return r.absentEmployeeId === emp.id && recordDate.getFullYear() === year && recordDate.getMonth() === month;
                    })
                    .reduce((sum, r) => sum + r.totalAmount, 0);
            });
            
            // Get single-month base salary, allowances, and deductions.
            const singleMonthAllowances = emp.allowances.reduce((sum, item) => sum + item.amount, 0);
            const singleMonthDeductions = emp.deductions.reduce((sum, item) => sum + item.amount, 0);
            
            // Final Calculation:
            // Gross Salary = Single month's basic salary & allowances + summarized overtime pay.
            const finalGrossSalary = emp.basicSalary + singleMonthAllowances + totalOvertimePay;
            // Net Salary = Gross Salary - (Single month's deductions + summarized absence deductions).
            const finalNetSalary = finalGrossSalary - singleMonthDeductions - totalAbsentDeduction;


            return {
                id: `payslip-${emp.id}-${finalizationMonth}-${year}`,
                employeeId: emp.id,
                employeeName: emp.name,
                photo: emp.photo,
                month: finalizationMonth, 
                year,
                basicSalary: emp.basicSalary,
                totalAllowances: singleMonthAllowances,
                totalDeductions: singleMonthDeductions,
                overtimePay: totalOvertimePay,
                absentDeduction: totalAbsentDeduction,
                grossSalary: finalGrossSalary, 
                netSalary: finalNetSalary,
                status: 'Pending',
            };
        });

        setPayslipsToProcess(summarizedPayslips.sort((a,b) => a.employeeName.localeCompare(b.employeeName)));
    };
    
    const handleProcess = () => {
        const processedPayslips = payslipsToProcess.map(p => ({...p, status: 'Processed' as const}));
        onProcess(processedPayslips, finalizationMonth, year);
    };
    
    const handleExportToCSV = () => {
        if (payslipsToProcess.length === 0) {
            alert('No data to export.');
            return;
        }
        const headers = ['Employee Name', 'Basic', 'Allowances', 'Summarized Overtime Pay', 'Deductions', 'Summarized Absent Ded.', 'Net Salary (Total)'];
        const csvContent = [
            headers.join(','),
            ...payslipsToProcess.map(p => [
                `"${p.employeeName}"`,
                p.basicSalary,
                p.totalAllowances,
                p.overtimePay,
                p.totalDeductions,
                p.absentDeduction,
                p.netSalary,
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        const monthName = months[finalizationMonth];
        link.setAttribute('download', `salary_summary_${monthName}_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const handlePrint = () => {
        const printContent = processingTableRef.current?.innerHTML;
        if (!printContent) return;

        const printWindow = window.open('', '', 'height=800,width=1200');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>Salary Processing - ${year}</title>`);
            printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none; } }</style>');
            printWindow.document.write('</head><body>');
            
            const monthStr = months[finalizationMonth];
            const title = `Salary of Security Department (${monthStr}-${year})`;

            const headerHtml = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="font-size: 36px; font-weight: bold;">Jabed Agro Food Processing Limited</h1>
                    <p style="font-size: 14px;">Bscic, Industrial Area-Jamalpur-2000</p>
                    <h2 style="font-size: 20px; margin-top: 0.5rem; font-weight: 600;">${title}</h2>
                </div>
            `;
            printWindow.document.write(headerHtml);

            printWindow.document.write(printContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };
    
    const handleSaveToSheets = async () => {
        if (!settings.googleSheetsUrl) {
          setSaveMessage('Google Sheets URL is not configured in Settings.');
          setTimeout(() => setSaveMessage(''), 5000);
          return;
        }
        if (payslipsToProcess.length === 0) {
          setSaveMessage('There is no data to save.');
          setTimeout(() => setSaveMessage(''), 5000);
          return;
        }

        setIsSaving(true);
        setSaveMessage('');
        try {
          const reportData = payslipsToProcess.map(p => {
            const emp = employees.find(e => e.id === p.employeeId);
            return {
              ...p,
              allowances: emp?.allowances || [],
              deductions: emp?.deductions || [],
              employeeDisplayId: emp?.employeeId || '',
              department: emp?.department || '',
              designation: emp?.designation || '',
            };
          });

          // Re-using the salaryProcessingReport type as it fits the data structure
          const payload = {
            type: 'salaryProcessingReport',
            month: months[finalizationMonth],
            year: year,
            data: reportData
          };

          await fetch(settings.googleSheetsUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          setSaveMessage(`Processing data for ${months[finalizationMonth]} ${year} sent to Google Sheets.`);
        } catch (error) {
          console.error('Error saving to Google Sheets:', error);
          setSaveMessage('Failed to save report. Check console for details.');
        } finally {
          setIsSaving(false);
          setTimeout(() => setSaveMessage(''), 5000);
        }
    };

    const totals = useMemo(() => {
        return payslipsToProcess.reduce((acc, p) => {
            acc.basicSalary += p.basicSalary;
            acc.totalAllowances += p.totalAllowances;
            acc.overtimePay += p.overtimePay;
            acc.totalDeductions += p.totalDeductions;
            acc.absentDeduction += p.absentDeduction;
            acc.netSalary += p.netSalary;
            return acc;
        }, {
            basicSalary: 0,
            totalAllowances: 0,
            overtimePay: 0,
            totalDeductions: 0,
            absentDeduction: 0,
            netSalary: 0,
        });
    }, [payslipsToProcess]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US').format(amount);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex flex-wrap items-center gap-4 mb-6 border-b pb-4">
                <div className='flex flex-col'>
                    <label className='text-xs font-semibold text-gray-500 mb-1'>Year (for all months)</label>
                    <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="p-2 border rounded">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                 <div className='flex flex-col'>
                    <label className='text-xs font-semibold text-gray-500 mb-1'>Source Month(s)</label>
                    <MonthSelector label="Select Source Months" selectedMonths={sourceMonths} onToggleMonth={handleMonthToggle} />
                </div>
                <div className='flex flex-col'>
                    <label className='text-xs font-semibold text-gray-500 mb-1'>Finalization Month</label>
                    <select value={finalizationMonth} onChange={e => setFinalizationMonth(parseInt(e.target.value))} className="p-2 border rounded bg-white text-gray-900">
                        {months.map((m, i) => <option key={i} value={i} className="text-black">{m}</option>)}
                    </select>
                </div>
                <button onClick={handleGenerate} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 self-end">
                    Generate
                </button>
                <div className="flex-grow"></div>
                 <div className="flex items-center gap-2 flex-wrap self-end">
                    <button onClick={handleExportToCSV} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm">Export CSV</button>
                    <button onClick={handlePrint} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm">Print</button>
                    <button onClick={handleSaveToSheets} disabled={isSaving || !settings.googleSheetsUrl} className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 text-sm disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save to Sheets'}
                    </button>
                    <button
                        onClick={handleProcess}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                        disabled={payslipsToProcess.length === 0}
                    >
                        Finalize Salaries
                    </button>
                </div>
            </div>

             {saveMessage && (
                <div className={`mb-4 text-center p-2 rounded-lg ${saveMessage.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {saveMessage}
                </div>
            )}

             <div className="overflow-x-auto" ref={processingTableRef}>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Basic</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Allowances</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Overtime Pay (Sum)</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Absent Ded. (Sum)</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Salary (Total)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {payslipsToProcess.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-10 text-gray-500">Select months and click 'Generate' to see data.</td></tr>
                        ) : (
                            payslipsToProcess.map((p) => (
                            <tr key={p.id}>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            {p.photo ? (
                                                <img className="h-10 w-10 rounded-full object-cover" src={p.photo} alt={p.employeeName} />
                                            ) : (
                                                <span className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                </span>
                                            )}
                                        </div>
                                        <div className="ml-4 font-medium text-gray-900">{p.employeeName}</div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(p.basicSalary)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 text-right">+{formatCurrency(p.totalAllowances)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600 text-right">+{formatCurrency(p.overtimePay)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 text-right">-{formatCurrency(p.totalDeductions)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 text-right">-{formatCurrency(p.absentDeduction)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold text-right">{formatCurrency(p.netSalary)}</td>
                            </tr>
                            ))
                        )}
                    </tbody>
                    {payslipsToProcess.length > 0 && (
                        <tfoot className="bg-gray-50 font-bold">
                            <tr>
                                <td className="px-4 py-4 text-left text-sm font-semibold text-gray-700 uppercase">Grand Total</td>
                                <td className="px-4 py-4 text-right text-sm text-gray-700">{formatCurrency(totals.basicSalary)}</td>
                                <td className="px-4 py-4 text-right text-sm text-gray-700">{formatCurrency(totals.totalAllowances)}</td>
                                <td className="px-4 py-4 text-right text-sm text-gray-700">{formatCurrency(totals.overtimePay)}</td>
                                <td className="px-4 py-4 text-right text-sm text-gray-700">{formatCurrency(totals.totalDeductions)}</td>
                                <td className="px-4 py-4 text-right text-sm text-gray-700">{formatCurrency(totals.absentDeduction)}</td>
                                <td className="px-4 py-4 text-right text-sm font-bold text-indigo-600">{formatCurrency(totals.netSalary)}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
             </div>
        </div>
    );
};

export default SalaryProcessing2;