import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Employee, Payslip, OvertimeRecord, Allowance, Deduction, Settings } from '../types';
import PayslipViewer from './PayslipViewer';


interface PayslipEditModalProps {
    payslip: Payslip;
    employee: Employee;
    onSave: (updatedPayslip: Payslip) => void;
    onClose: () => void;
}

const PayslipEditModal: React.FC<PayslipEditModalProps> = ({ payslip, employee, onSave, onClose }) => {
    const [localPayslip, setLocalPayslip] = useState(payslip);
    const [allowances, setAllowances] = useState<Allowance[]>(employee.allowances);
    const [deductions, setDeductions] = useState<Deduction[]>(employee.deductions);
    const [basicSalary, setBasicSalary] = useState<number>(payslip.basicSalary);
    
    useEffect(() => {
        const totalAllowances = allowances.reduce((sum, item) => sum + item.amount, 0);
        const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
        const grossSalary = basicSalary + totalAllowances + localPayslip.overtimePay;
        const netSalary = grossSalary - totalDeductions - localPayslip.absentDeduction;
        
        setLocalPayslip(prev => ({
            ...prev,
            basicSalary,
            totalAllowances,
            totalDeductions,
            grossSalary,
            netSalary,
        }));
    }, [allowances, deductions, basicSalary, localPayslip.overtimePay, localPayslip.absentDeduction]);

    const handleItemChange = <T extends Allowance | Deduction>(index: number, field: keyof T, value: string, type: 'allowances' | 'deductions') => {
        const updater = type === 'allowances' ? setAllowances : setDeductions;
        updater(prev => {
            const items = [...prev];
            const currentItem = { ...items[index] };
            if (field === 'amount') {
                (currentItem as any)[field] = parseFloat(value) || 0;
            } else {
                (currentItem as any)[field] = value;
            }
            items[index] = currentItem;
            return items;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(localPayslip);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-5 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Edit Payslip for {payslip.employeeName}</h2>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="basicSalary" className="block text-sm font-medium text-gray-700">Basic Salary</label>
                        <input type="number" id="basicSalary" value={basicSalary} onChange={e => setBasicSalary(parseFloat(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2 text-lg">Allowances</h3>
                            {allowances.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 mb-2">
                                <input type="text" value={item.type} onChange={e => handleItemChange(index, 'type', e.target.value, 'allowances')} placeholder="Type" className="p-2 border rounded w-1/2"/>
                                <input type="number" value={item.amount} onChange={e => handleItemChange(index, 'amount', e.target.value, 'allowances')} placeholder="Amount" className="p-2 border rounded w-1/2"/>
                                </div>
                            ))}
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2 text-lg">Deductions</h3>
                            {deductions.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 mb-2">
                                <input type="text" value={item.type} onChange={e => handleItemChange(index, 'type', e.target.value, 'deductions')} placeholder="Type" className="p-2 border rounded w-1/2"/>
                                <input type="number" value={item.amount} onChange={e => handleItemChange(index, 'amount', e.target.value, 'deductions')} placeholder="Amount" className="p-2 border rounded w-1/2"/>
                                </div>
                            ))}
                             {localPayslip.absentDeduction > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-semibold mb-2">Absent Deduction</h4>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input type="text" value="Absent Deduction" readOnly className="p-2 border rounded w-1/2 bg-gray-100"/>
                                        <input type="number" value={localPayslip.absentDeduction} readOnly className="p-2 border rounded w-1/2 bg-gray-100"/>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">Save Changes</button>
                </div>
            </form>
        </div>
    );
};


interface SalaryProcessingProps {
  employees: Employee[];
  onProcess: (payslips: Payslip[], month: number, year: number) => void;
  overtimeRecords: OvertimeRecord[];
  settings: Settings;
}

interface DisplayPayslip extends Payslip {
  photo?: string;
}

const SalaryProcessing: React.FC<SalaryProcessingProps> = ({ employees, onProcess, overtimeRecords, settings }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);
  const [searchTerm, setSearchTerm] = useState('');
  const [payslipsToProcess, setPayslipsToProcess] = useState<DisplayPayslip[]>([]);
  const [viewingPayslip, setViewingPayslip] = useState<{ payslip: Payslip, employee: Employee } | null>(null);
  const [editingPayslip, setEditingPayslip] = useState<{ payslip: Payslip, employee: Employee } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  const processingTableRef = useRef<HTMLDivElement>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const absentDeductionsById = overtimeRecords
      .filter(r => {
          // Ensure the record has a valid ID for the absent employee
          if (!r.absentEmployeeId) return false;
          const recordDate = new Date(r.date);
          return recordDate.getFullYear() === year && recordDate.getMonth() === month;
      })
      .reduce((acc, r) => {
          // Group deductions strictly by the absent employee's unique ID
          const key = r.absentEmployeeId!;
          acc[key] = (acc[key] || 0) + r.totalAmount;
          return acc;
      }, {} as Record<string, number>);

    const calculated = employees.map(emp => {
      const monthlyOvertimePay = overtimeRecords
          .filter(r => {
              const recordDate = new Date(r.date);
              return r.employeeId === emp.id &&
                     recordDate.getFullYear() === year &&
                     recordDate.getMonth() === month;
          })
          .reduce((sum, r) => sum + r.totalAmount, 0);
      
      const totalAllowances = emp.allowances.reduce((sum, item) => sum + item.amount, 0);
      const totalDeductions = emp.deductions.reduce((sum, item) => sum + item.amount, 0);
      // Look up deductions strictly by the current employee's unique ID
      const absentDeduction = absentDeductionsById[emp.id] || 0;
      const grossSalary = emp.basicSalary + totalAllowances + monthlyOvertimePay;
      const netSalary = grossSalary - totalDeductions - absentDeduction;

      return {
        id: `payslip-${emp.id}-${month}-${year}`,
        employeeId: emp.id,
        employeeName: emp.name,
        photo: emp.photo,
        month,
        year,
        basicSalary: emp.basicSalary,
        totalAllowances,
        totalDeductions,
        overtimePay: monthlyOvertimePay,
        absentDeduction,
        grossSalary,
        netSalary,
        status: 'Pending',
      };
    });
    setPayslipsToProcess(calculated);
  }, [employees, month, year, overtimeRecords]);

  const filteredPayslips = useMemo(() => {
    if (!searchTerm) {
      return payslipsToProcess;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return payslipsToProcess.filter(p => {
        return Object.values(p).some(val => 
            String(val).toLowerCase().includes(lowercasedFilter)
        );
    });
  }, [payslipsToProcess, searchTerm]);

  const totals = useMemo(() => {
    return filteredPayslips.reduce((acc, p) => {
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
  }, [filteredPayslips]);


  const handleProcess = () => {
    const processedPayslips = payslipsToProcess.map(p => ({...p, status: 'Processed' as const}));
    onProcess(processedPayslips, month, year);
  };

  const handleDeleteFromBatch = (payslipId: string) => {
    if (window.confirm('Are you sure you want to remove this employee from this salary batch?')) {
        setPayslipsToProcess(prev => prev.filter(p => p.id !== payslipId));
    }
  };
  
  const handleUpdatePayslip = (updatedPayslip: Payslip) => {
      setPayslipsToProcess(prev => prev.map(p => p.id === updatedPayslip.id ? updatedPayslip as DisplayPayslip : p));
      setEditingPayslip(null);
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

      const payload = {
        type: 'salaryProcessingReport',
        month: months[month],
        year: year,
        data: reportData
      };

      await fetch(settings.googleSheetsUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      setSaveMessage(`Processing data for ${months[month]} ${year} sent to Google Sheets.`);
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      setSaveMessage('Failed to save report. Check console for details.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  const handleExportToCSV = () => {
    if (filteredPayslips.length === 0) {
        alert('No data to export.');
        return;
    }
    const headers = ['Sl.', 'Employee Name', 'Basic', 'Allowances', 'Overtime Pay', 'Deductions', 'Absent Deduction', 'Net Salary'];
    const csvContent = [
        headers.join(','),
        ...filteredPayslips.map((p, index) => [
            index + 1,
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
    link.setAttribute('download', `salary_processing_${months[month]}_${year}.csv`);
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
      printWindow.document.write(`<html><head><title>Salary Processing - ${months[month]} ${year}</title>`);
      printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
      printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none; } }</style>');
      printWindow.document.write('</head><body>');
      
      const headerHtml = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <h1 style="font-size: 36px; font-weight: bold;">Jabed Agro Food Processing Limited</h1>
            <p style="font-size: 14px;">Bscic, Industries Area-Jamalpur-2000</p>
            <h2 style="font-size: 20px; margin-top: 0.5rem; font-weight: 600;">Salary Of ${months[month]} ${year}</h2>
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
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US').format(amount);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex flex-wrap items-center gap-4 mb-6 border-b pb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="p-2 border rounded">
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="p-2 border rounded">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
           <div className="relative">
             <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-2 py-2 border rounded w-full"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap ml-0 md:ml-auto">
          <button onClick={handleExportToCSV} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">Export CSV</button>
          <button onClick={handlePrint} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm">Print</button>
          <button onClick={handleSaveToSheets} disabled={isSaving || !settings.googleSheetsUrl} className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors text-sm disabled:bg-gray-400">
            {isSaving ? 'Saving...' : 'Save to Sheets'}
          </button>
          <button
            onClick={handleProcess}
            className="w-full md:w-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:bg-gray-400"
            disabled={payslipsToProcess.length === 0}
          >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sl.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Basic</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Allowances</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Overtime Pay</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Absent Deduction</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Salary</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase no-print">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPayslips.map((p, index) => (
              <tr key={p.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
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
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{p.employeeName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(p.basicSalary)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 text-right">+{formatCurrency(p.totalAllowances)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600 text-right">+{formatCurrency(p.overtimePay)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 text-right">-{formatCurrency(p.totalDeductions)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 text-right">-{formatCurrency(p.absentDeduction)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold text-right">{formatCurrency(p.netSalary)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center space-x-2 no-print">
                    <button onClick={() => {
                        const employee = employees.find(e => e.id === p.employeeId);
                        if (employee) setViewingPayslip({ payslip: p, employee });
                    }} className="text-gray-600 hover:text-gray-900">View</button>
                    <button onClick={() => {
                        const employee = employees.find(e => e.id === p.employeeId);
                        if (employee) setEditingPayslip({ payslip: p, employee });
                    }} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    <button onClick={() => handleDeleteFromBatch(p.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-bold">
            <tr>
                <td className="px-4 py-4 text-left text-sm font-semibold text-gray-700 uppercase" colSpan={2}>Grand Total</td>
                <td className="px-4 py-4 text-right text-sm text-gray-700">{formatCurrency(totals.basicSalary)}</td>
                <td className="px-4 py-4 text-right text-sm text-gray-700">{formatCurrency(totals.totalAllowances)}</td>
                <td className="px-4 py-4 text-right text-sm text-gray-700">{formatCurrency(totals.overtimePay)}</td>
                <td className="px-4 py-4 text-right text-sm text-gray-700">{formatCurrency(totals.totalDeductions)}</td>
                <td className="px-4 py-4 text-right text-sm text-gray-700">{formatCurrency(totals.absentDeduction)}</td>
                <td className="px-4 py-4 text-right text-sm font-bold text-indigo-600">{formatCurrency(totals.netSalary)}</td>
                <td className="px-4 py-4 no-print"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {viewingPayslip && (
          <PayslipViewer 
            payslip={viewingPayslip.payslip}
            employee={viewingPayslip.employee}
            onClose={() => setViewingPayslip(null)}
          />
      )}
       {editingPayslip && (
          <PayslipEditModal
            payslip={editingPayslip.payslip}
            employee={editingPayslip.employee}
            onClose={() => setEditingPayslip(null)}
            onSave={handleUpdatePayslip}
          />
      )}

    </div>
  );
};

export default SalaryProcessing;