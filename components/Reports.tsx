import React, { useState, useMemo, useRef } from 'react';
import { Payslip, Employee, Settings } from '../types';
import PayslipViewer from './PayslipViewer';

interface ReportsProps {
  payslips: Payslip[];
  employees: Employee[];
  settings: Settings;
}

const Reports: React.FC<ReportsProps> = ({ payslips, employees, settings }) => {
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const tableRef = useRef<HTMLDivElement>(null);

  const handleViewPayslip = (payslip: Payslip) => {
    const employee = employees.find(emp => emp.id === payslip.employeeId);
    if (employee) {
        setSelectedPayslip(payslip);
        setSelectedEmployee(employee);
    }
  };

  const closeModal = () => {
    setSelectedPayslip(null);
    setSelectedEmployee(null);
  };
  
  const months = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);

  const availableYears = useMemo(() => {
      const years = new Set(payslips.map(p => p.year));
      // FIX: The `year` property from a payslip could be a string if loaded from localStorage.
      // Explicitly convert `a` and `b` to numbers before sorting to prevent type errors.
      return Array.from(years).sort((a,b) => Number(b) - Number(a));
  }, [payslips]);

  const filteredPayslips = useMemo(() => {
    return payslips
        .filter(p => {
            // FIX: Ensure comparison is between numbers, as `p.year` could be a string from localStorage.
            const yearMatch = selectedYear === 'all' || Number(p.year) === parseInt(selectedYear);
            // FIX: Ensure comparison is between numbers, as `p.month` could be a string from localStorage.
            const monthMatch = selectedMonth === 'all' || Number(p.month) === parseInt(selectedMonth);
            const searchMatch = searchTerm === '' || p.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
            return yearMatch && monthMatch && searchMatch;
        })
        // FIX: Ensure year and month are treated as numbers for correct sorting.
        .sort((a,b) => Number(b.year) - Number(a.year) || Number(b.month) - Number(a.month));
  }, [payslips, searchTerm, selectedYear, selectedMonth]);

  const totals = useMemo(() => {
    return filteredPayslips.reduce((acc, p) => {
        acc.netSalary += p.netSalary;
        return acc;
    }, { netSalary: 0 });
  }, [filteredPayslips]);

  const handleSaveToSheets = async () => {
    if (!settings.googleSheetsUrl) {
        setSaveMessage('Google Sheets URL is not configured in Settings.');
        setTimeout(() => setSaveMessage(''), 5000);
        return;
    }
    if (filteredPayslips.length === 0) {
        setSaveMessage('There are no payslips in the current filter to save.');
         setTimeout(() => setSaveMessage(''), 5000);
        return;
    }

    const firstPayslip = filteredPayslips[0];
    // FIX: Ensure comparison is between numbers.
    const isSingleMonthYear = filteredPayslips.every(p => Number(p.month) === Number(firstPayslip.month) && Number(p.year) === Number(firstPayslip.year));

    if (!isSingleMonthYear) {
        setSaveMessage('Please filter by a single month and year to generate a report.');
         setTimeout(() => setSaveMessage(''), 5000);
        return;
    }
    
    setIsSaving(true);
    setSaveMessage('');
    try {
        const reportData = filteredPayslips.map(p => {
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
            type: 'salaryReport',
            // FIX: Ensure month is a number for array indexing.
            month: months[Number(reportData[0].month)],
            year: reportData[0].year,
            data: reportData
        };

        // Note: 'no-cors' mode means we won't get a response back, but the request will be sent.
        // This is a common requirement for simple Google Apps Script web apps.
        await fetch(settings.googleSheetsUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        setSaveMessage(`Report for ${months[Number(firstPayslip.month)]} ${firstPayslip.year} sent to Google Sheets.`);

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
    const headers = ['Month', 'Employee Name', 'Net Salary', 'Status'];
    const csvContent = [
        headers.join(','),
        ...filteredPayslips.map(p => [
            `${months[Number(p.month)]} ${p.year}`,
            `"${p.employeeName}"`,
            p.netSalary,
            p.status
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `processed_payslips_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printContent = tableRef.current?.innerHTML;
    if (!printContent) return;

    let title = 'Salary Report';
    if (selectedMonth !== 'all' && selectedYear !== 'all') {
        title = `Salary Of ${months[Number(selectedMonth)]} ${selectedYear}`;
    } else if (selectedYear !== 'all') {
        title = `Salary Report for ${selectedYear}`;
    }

    const printWindow = window.open('', '', 'height=800,width=1200');
    if (printWindow) {
        printWindow.document.write(`<html><head><title>Processed Payslips</title>`);
        printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
        printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none; } }</style>');
        printWindow.document.write('</head><body>');
        
        const headerHtml = `
            <div style="text-align: center; margin-bottom: 2rem;">
                <h1 style="font-size: 36px; font-weight: bold;">Jabed Agro Food Processing Limited</h1>
                <p style="font-size: 14px;">Bscic, Industries Area-Jamalpur-2000</p>
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
        }, 250);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US').format(amount);

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 border-b pb-4">
          <h2 className="text-lg font-bold text-gray-800 flex-shrink-0">Processed Payslip List</h2>
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto md:justify-end">
              <input 
                  type="text" 
                  placeholder="Search by name..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)}
                  className="px-2 py-1.5 border rounded-md text-sm"
              />
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-2 py-1.5 border rounded-md text-sm">
                  <option value="all">All Months</option>
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="px-2 py-1.5 border rounded-md text-sm">
                  <option value="all">All Years</option>
                  {availableYears.map(y => <option key={y as React.Key} value={y}>{y}</option>)}
              </select>
              <div className="flex items-center gap-2">
                {saveMessage && (
                    <span className={`text-sm font-medium transition-opacity duration-300 ${saveMessage.includes('Failed') || saveMessage.includes('not configured') || saveMessage.includes('Please filter') ? 'text-red-600' : 'text-green-600'}`}>
                        {saveMessage}
                    </span>
                )}
               <button onClick={handleExportToCSV} className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                  Export
               </button>
               <button onClick={handlePrint} className="bg-gray-600 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 flex items-center gap-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                  Print
               </button>
               <button 
                onClick={handleSaveToSheets} 
                disabled={isSaving || !settings.googleSheetsUrl}
                className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                title={!settings.googleSheetsUrl ? "Configure Google Sheets URL in settings to enable this feature." : ""}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg>
                  {isSaving ? 'Saving...' : 'Save to Sheets'}
              </button>
              </div>
          </div>
      </div>
      <div ref={tableRef}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase no-print">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">No payslips found for the selected criteria.</td>
                </tr>
              ) : (
                  filteredPayslips.map(p => {
                    const employee = employees.find(e => e.id === p.employeeId);
                    return (
                      <tr key={p.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{months[Number(p.month)]} {p.year}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {employee?.photo ? (
                                <img className="h-10 w-10 rounded-full object-cover" src={employee.photo} alt={p.employeeName} />
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
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 font-semibold text-right">{formatCurrency(p.netSalary)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              p.status === 'Processed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-center no-print">
                          <button onClick={() => handleViewPayslip(p)} className="text-indigo-600 hover:text-indigo-900">View</button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
            {filteredPayslips.length > 0 && (
              <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                  <tr>
                      <td colSpan={2} className="px-4 py-2 text-right text-sm font-medium text-gray-700 uppercase">Grand Total</td>
                      <td className="px-4 py-2 text-right text-sm font-semibold text-gray-800">{formatCurrency(totals.netSalary)}</td>
                      <td colSpan={2} className="px-4 py-2"></td>
                  </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      {selectedPayslip && selectedEmployee && (
        <PayslipViewer 
          payslip={selectedPayslip} 
          employee={selectedEmployee} 
          onClose={closeModal} 
        />
      )}
    </div>
  );
};

export default Reports;