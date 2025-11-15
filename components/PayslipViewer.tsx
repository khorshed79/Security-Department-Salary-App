import React, { useRef } from 'react';
import { Payslip, Employee } from '../types';

interface PayslipViewerProps {
  payslip: Payslip;
  employee: Employee;
  onClose: () => void;
}

const PayslipViewer: React.FC<PayslipViewerProps> = ({ payslip, employee, onClose }) => {
  const payslipRef = useRef<HTMLDivElement>(null);
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US').format(amount);

  const handlePrint = () => {
    const printContent = payslipRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Pay Slip</title>');
        printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
        printWindow.document.write(`
          <style>
            @page {
              size: A4;
              margin: 0.5in 0.6in 0.5in 0.8in; /* top right bottom left */
            }
            body {
              font-family: sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .payslip-container {
              padding: 0.5rem;
              color: #111827; /* Tailwind gray-900 */
            }
          </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<div class="payslip-container">${printContent}</div>`);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        // Use a timeout to ensure styles are applied before printing
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    }
  };

  const handleExportToCSV = () => {
    const data = [
      ['Item', 'Type', 'Amount'],
      ['', '', ''],
      ['Employee Name', `"${employee.name}"`, ''],
      ['Employee ID', `"${employee.employeeId}"`, ''],
      ['Department', `"${employee.department}"`, ''],
      ['Designation', `"${employee.designation}"`, ''],
      ['Pay Period', `"${months[Number(payslip.month)]} ${payslip.year}"`, ''],
      ['', '', ''],
      ['--- EARNINGS ---', '', ''],
      ['Basic Salary', 'Earning', payslip.basicSalary],
      ...employee.allowances.map(a => [`"${a.type}"`, 'Earning', a.amount]),
      ...(payslip.overtimePay > 0 ? [['Overtime Pay', 'Earning', payslip.overtimePay]] : []),
      ['Gross Salary', 'Total', payslip.grossSalary],
      ['', '', ''],
      ['--- DEDUCTIONS ---', '', ''],
      ...employee.deductions.map(d => [`"${d.type}"`, 'Deduction', d.amount]),
      ...(payslip.absentDeduction > 0 ? [['Absent Deduction', 'Deduction', payslip.absentDeduction]] : []),
      ['Total Deductions', 'Total', payslip.totalDeductions + payslip.absentDeduction],
      ['', '', ''],
      ['Net Salary', 'Total', payslip.netSalary],
    ];

    const csvContent = data.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `payslip_${employee.name.replace(/\s+/g, '_')}_${months[Number(payslip.month)]}_${payslip.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!payslipRef.current) {
      alert('Could not capture payslip.');
      return;
    }

    // The element to capture is the *first child* of the scrollable container,
    // which holds the full, unclipped content.
    const elementToCapture = payslipRef.current.firstChild as HTMLElement;
    if (!elementToCapture) {
        alert('Payslip content not found for capture.');
        return;
    }
    
    if (typeof (window as any).html2canvas !== 'function') {
        alert('Sharing library is not available. Please try again later.');
        return;
    }

    try {
      // Pass the actual content element to html2canvas, not the scrollable container.
      const canvas = await (window as any).html2canvas(elementToCapture, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      
      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) {
            alert('Failed to create payslip image.');
            return;
        }

        const file = new File([blob], `payslip_${employee.name.replace(/\s+/g, '_')}.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Payslip for ${employee.name}`,
              text: `Here is the payslip for ${months[Number(payslip.month)]} ${payslip.year}.`,
            });
          } catch (error) {
            if ((error as DOMException).name !== 'AbortError') {
              console.error('Error sharing:', error);
              alert('An error occurred while trying to share.');
            }
          }
        } else {
            alert('This feature is best used on a mobile device to share directly to apps like WhatsApp. The payslip image will be downloaded instead.');
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `payslip_${employee.name.replace(/\s+/g, '_')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }
      }, 'image/png');

    } catch (error) {
      console.error('Error generating payslip image:', error);
      alert('Failed to generate payslip image.');
    }
  };
  
  const earnings = [
    { description: 'Basic Salary', amount: payslip.basicSalary },
    ...employee.allowances.map(a => ({ description: a.type, amount: a.amount })),
    ...(payslip.overtimePay > 0 ? [{ description: 'Overtime Pay', amount: payslip.overtimePay }] : [])
  ];

  const deductions = [
    ...employee.deductions.map(d => ({ description: d.type, amount: d.amount })),
    ...(payslip.absentDeduction > 0 ? [{ description: 'Absent Deduction', amount: payslip.absentDeduction }] : [])
  ];

  const PayslipContent = () => (
    <div className="text-gray-900">
      <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Jabed Agro Food Processing Limited</h1>
          <p className="text-sm">Bscic, Industrial Area- Jamalpur-2000</p>
          <h3 className="text-2xl font-semibold mt-2">Salary Slip ({months[Number(payslip.month)]}-{payslip.year})</h3>
      </div>

      <div className="flex items-center gap-4 border rounded-lg p-4 mb-4">
          <div className="flex-shrink-0 h-20 w-20">
              {employee.photo ? (
                  <img className="h-20 w-20 rounded-full object-cover" src={employee.photo} alt={employee.name} />
              ) : (
                  <span className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </span>
              )}
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-black">
              <div><strong>Employee Name:</strong> {employee.name}</div>
              <div><strong>Designation:</strong> {employee.designation}</div>
              <div><strong>Employee ID:</strong> {employee.employeeId}</div>
              <div><strong>Department:</strong> {employee.department}</div>
          </div>
      </div>
      
      <table className="w-full text-sm border">
        <thead className="bg-gray-100 text-black">
            <tr>
                <th className="p-2 border text-left">Sl.</th>
                <th className="p-2 border text-left">Description</th>
                <th className="p-2 border text-right">Earnings</th>
                <th className="p-2 border text-right">Deductions</th>
            </tr>
        </thead>
        <tbody className="text-black">
            {earnings.map((item, index) => (
                <tr key={`earn-${index}`}>
                    <td className="p-2 border">{index + 1}</td>
                    <td className="p-2 border">{item.description}</td>
                    <td className="p-2 border text-right">{formatCurrency(item.amount)}</td>
                    <td className="p-2 border"></td>
                </tr>
            ))}
            {deductions.map((item, index) => (
                 <tr key={`deduct-${index}`}>
                    <td className="p-2 border">{earnings.length + index + 1}</td>
                    <td className="p-2 border">{item.description}</td>
                    <td className="p-2 border"></td>
                    <td className="p-2 border text-right">{formatCurrency(item.amount)}</td>
                </tr>
            ))}
        </tbody>
        <tfoot className="font-bold bg-gray-50 text-black">
            <tr>
                <td colSpan={2} className="p-2 border text-right">Total</td>
                <td className="p-2 border text-right">{formatCurrency(payslip.grossSalary)}</td>
                <td className="p-2 border text-right">{formatCurrency(payslip.totalDeductions + payslip.absentDeduction)}</td>
            </tr>
             <tr>
                <td colSpan={3} className="p-2 border text-right">Net Salary</td>
                <td className="p-2 border text-right text-indigo-700">{formatCurrency(payslip.netSalary)}</td>
            </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 className="text-lg font-bold text-gray-800">Payslip - {months[Number(payslip.month)]}, {payslip.year}</h2>
          <div>
            <button onClick={handleShare} className="mr-2 px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm">Share</button>
            <button onClick={handleExportToCSV} className="mr-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">Export</button>
            <button onClick={handlePrint} className="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">Print</button>
            <button onClick={onClose} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm">Close</button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto p-6" ref={payslipRef}>
           <PayslipContent />
        </div>
      </div>
    </div>
  );
};

export default PayslipViewer;