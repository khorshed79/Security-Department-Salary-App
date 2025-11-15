import React, { useState, useEffect, useRef } from 'react';
import { Settings, Employee, Payslip, OvertimeRecord } from '../types';

interface EmployeeEditModalProps {
    employee: Employee | null;
    onSave: (employee: Partial<Employee>) => void;
    onClose: () => void;
}

// NOTE: This component is defined within Settings.tsx as it is only used here.
const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({ employee, onSave, onClose }) => {
    // State is managed with strings for numeric fields to allow free-form decimal input.
    const [formData, setFormData] = useState({
        name: employee?.name || '',
        designation: employee?.designation || '',
        department: employee?.department || '',
        photo: employee?.photo || undefined,
    });
    const [imagePreview, setImagePreview] = useState<string | undefined>(employee?.photo);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                setFormData(prev => ({ ...prev, photo: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Generic change handler for all text-based inputs.
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            alert('Employee name is required.');
            return;
        }
        // Basic Salary is no longer edited here.
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold text-gray-800">{employee ? 'Edit Employee Details' : 'Add New Employee'}</h2>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full bg-gray-200 mb-2 flex items-center justify-center overflow-hidden">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                )}
                            </div>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm px-3 py-1 bg-gray-100 border rounded-lg hover:bg-gray-200 font-medium">
                                Upload Photo
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                            </div>
                            <div>
                                <label htmlFor="designation" className="block text-sm font-medium text-gray-700">Designation</label>
                                <input type="text" id="designation" name="designation" value={formData.designation} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                             <div>
                                <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                                <input type="text" id="department" name="department" value={formData.department} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">
                            {employee ? 'Update Employee' : 'Save Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


interface SettingsProps {
    settings: Settings;
    onSave: (newSettings: Settings) => void;
    employees: Employee[];
    payslips: Payslip[];
    overtimeRecords: OvertimeRecord[];
    onAdd: (employee: Employee) => void;
    onUpdate: (employee: Employee) => void;
    onDelete: (employeeId: string) => void;
    onImportAllData: (data: any) => void;
}

const SettingsComponent: React.FC<SettingsProps> = ({ settings, onSave, employees, payslips, overtimeRecords, onAdd, onUpdate, onDelete, onImportAllData }) => {
    // Local state holds form values as strings to allow for free-form decimal input
    const [formState, setFormState] = useState({
        overtimeRate: String(settings.overtimeRate),
        overtimeMultiplier: String(settings.overtimeMultiplier),
        overtimeCalculationBasicSalary: String(settings.overtimeCalculationBasicSalary),
        workingDaysPerMonth: String(settings.workingDaysPerMonth),
        workingHoursPerDay: String(settings.workingHoursPerDay),
        googleSheetsUrl: settings.googleSheetsUrl
    });

    const [copyButtonText, setCopyButtonText] = useState('Copy Code');
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const importFileRef = useRef<HTMLInputElement>(null);

    // Syncs local state when the settings prop changes
    useEffect(() => {
        setFormState({
            overtimeRate: String(settings.overtimeRate),
            overtimeMultiplier: String(settings.overtimeMultiplier),
            overtimeCalculationBasicSalary: String(settings.overtimeCalculationBasicSalary),
            workingDaysPerMonth: String(settings.workingDaysPerMonth),
            workingHoursPerDay: String(settings.workingHoursPerDay),
            googleSheetsUrl: settings.googleSheetsUrl
        });
    }, [settings]);

    // Handles changes for all string-based inputs in the main settings form
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // Parses string values back to numbers before saving
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newSettings: Settings = {
            ...settings, // retain any settings not in the form
            overtimeRate: parseFloat(formState.overtimeRate) || 0,
            overtimeMultiplier: parseFloat(formState.overtimeMultiplier) || 0,
            overtimeCalculationBasicSalary: parseFloat(formState.overtimeCalculationBasicSalary) || 0,
            workingDaysPerMonth: parseFloat(formState.workingDaysPerMonth) || 0,
            workingHoursPerDay: parseFloat(formState.workingHoursPerDay) || 0,
            googleSheetsUrl: formState.googleSheetsUrl,
        };
        onSave(newSettings);
    };

    const openAddModal = () => {
        setEditingEmployee(null);
        setIsEmployeeModalOpen(true);
    };

    const openEditModal = (employee: Employee) => {
        setEditingEmployee(employee);
        setIsEmployeeModalOpen(true);
    };

    const closeModal = () => {
        setIsEmployeeModalOpen(false);
        setEditingEmployee(null);
    };
    
    const handleEmployeeSave = (employeeData: Partial<Employee>) => {
        if (editingEmployee) {
            // Do not update basic salary from here
            const { basicSalary, ...restOfData } = employeeData;
            onUpdate({ ...editingEmployee, ...restOfData });
        } else {
            const newEmployee: Employee = {
                id: `emp-${new Date().getTime()}`,
                employeeId: `F-${Math.floor(1000 + Math.random() * 9000)}`,
                name: employeeData.name || 'No Name',
                department: employeeData.department || 'N/A',
                designation: employeeData.designation || 'N/A',
                joiningDate: new Date().toISOString().split('T')[0],
                basicSalary: 0, // Salary must be set from the Employee page.
                photo: employeeData.photo,
                allowances: [],
                deductions: [],
            };
            onAdd(newEmployee);
        }
        closeModal();
    };

    const handleDeleteEmployee = (employeeId: string) => {
        if (window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
            onDelete(employeeId);
        }
    };
    
      const handleExportData = () => {
        const dataToExport = {
            settings,
            employees,
            payslips,
            overtimeRecords,
            factory_categories: JSON.parse(localStorage.getItem('factory_categories') || '[]'),
            factory_categorized_employees: JSON.parse(localStorage.getItem('factory_categorized_employees') || '{}')
        };
        
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.download = `factory_salary_data_${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
                const importedData = JSON.parse(text);
                onImportAllData(importedData);
            } catch (error: any) {
                alert(`Error importing file: ${error.message}`);
            } finally {
                // Reset file input to allow importing the same file again
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const googleAppsScriptCode = `function doPost(e) {
  try {
    var request = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Route request based on the payload's content
    if (request.type === 'salaryReport' && request.data) {
      return handleSalaryReport(ss, request);
    } else if (request.type === 'salaryProcessingReport' && request.data) {
      return handleSalaryProcessingReport(ss, request);
    } else if (request.type === 'multiMonthSalaryReport' && request.data) {
      return handleMultiMonthSalaryReport(ss, request);
    } else if (request.type === 'absentDeductionSummary' && request.data) {
      return handleAbsentDeductionSummary(ss, request);
    } else if (request.type === 'overtimeDetailsReport' && request.data) {
      return handleOvertimeDetailsReport(ss, request);
    } else if (request.type === 'userSignUp' && request.username) {
      return handleUserSignUp(ss, request);
    } else if (request.records) {
      return handleOvertimeRecords(ss, request);
    } else {
      throw new Error("Invalid request format. Missing 'type' or 'records' key.");
    }
  } catch (error) {
    Logger.log(error.toString());
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleMultiMonthSalaryReport(ss, data) {
  var months = data.months;
  var year = data.year;
  var payslips = data.data;
  var sheetName = "Salary " + months.join(", ") + " " + year;

  if (!payslips || !Array.isArray(payslips) || payslips.length === 0) {
    throw new Error("No payslip data found in the request.");
  }

  var sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet(sheetName, 0);
  }
  
  var headers = [
    "Sl.", "Employee ID", "Employee Name", "Department", "Designation", "Month",
    "Basic Salary", "Allowances", "Total Allowances", "Overtime Pay", "Gross Salary",
    "Deductions", "Absent Deduction", "Total Deductions", "Net Salary"
  ];

  var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  var rows = payslips.map(function(p, index) {
    var allowanceStr = p.allowances.map(function(a) { return a.type + ": " + a.amount; }).join("\\n");
    var deductionStr = p.deductions.map(function(d) { return d.type + ": " + d.amount; }).join("\\n");
    
    return [
      index + 1,
      p.employeeDisplayId,
      p.employeeName,
      p.department,
      p.designation,
      monthNames[p.month],
      p.basicSalary,
      allowanceStr,
      p.totalAllowances,
      p.overtimePay,
      p.grossSalary,
      deductionStr,
      p.absentDeduction,
      p.totalDeductions + p.absentDeduction,
      p.netSalary
    ];
  });

  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e5e7eb").setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
    
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows).setVerticalAlignment("top");
    sheet.getRange(2, 8, rows.length, 1).setWrap(true); // Allowances
    sheet.getRange(2, 12, rows.length, 1).setWrap(true); // Deductions
    headers.forEach(function(_, i) { sheet.autoResizeColumn(i + 1); });
  }

  return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Multi-month salary report for " + months.join(", ") + " " + year + " saved successfully." })).setMimeType(ContentService.MimeType.JSON);
}

function handleUserSignUp(ss, data) {
  var sheetName = "User Signups";
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName, 0);
    var headers = ["Username", "Signup Timestamp"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e5e7eb");
    sheet.setFrozenRows(1);
  }
  
  sheet.appendRow([data.username, new Date()]);
  
  return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "User signup recorded." })).setMimeType(ContentService.MimeType.JSON);
}


function handleAbsentDeductionSummary(ss, data) {
  var sheetName = "Absent Deduction Summary";
  var sheet = ss.getSheetByName(sheetName);
  
  var headers = ["Sl.", "Employee Name", "Total Hours Covered", "Total Deduction"];
  var reportData = data.data;

  var rows = reportData.map(function(r) {
    return [r.sl, r.employeeName, r.totalHours, r.totalDeduction];
  });
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName, 0);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e5e7eb").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      headers.forEach(function(_, i) { sheet.autoResizeColumn(i + 1); });
    }
  } else {
    var numNewRows = rows.length;
    var numHeaderRows = 2; // One for a timestamp, one for a blank space
    
    sheet.insertRowsAfter(1, numNewRows + numHeaderRows);
    
    var timestamp = new Date();
    var timestampHeader = ["Report saved on: " + timestamp.toLocaleString(), "", "", ""];
    sheet.getRange(2, 1, 1, headers.length).setValues([timestampHeader]).setFontWeight("bold").setBackground("#d1fae5");

    sheet.getRange(3, 1, numNewRows, headers.length).setValues(rows);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Absent deduction summary saved successfully." })).setMimeType(ContentService.MimeType.JSON);
}

function handleOvertimeDetailsReport(ss, data) {
  var sheetName = "Overtime Details Report";
  var sheet = ss.getSheetByName(sheetName);
  
  var headers = ["Date", "Employee Name", "Department", "OT Hours", "OT Rate", "Total Pay", "In Place Of"];
  var reportData = data.data;

  var rows = reportData.map(function(r) {
    return [r.date, r.employeeName, r.employeeDepartment, r.hours, r.rate, r.totalAmount, r.absentEmployeeName || ""];
  });
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName, 0);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e5e7eb").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      headers.forEach(function(_, i) { sheet.autoResizeColumn(i + 1); });
    }
  } else {
    var numNewRows = rows.length;
    var numHeaderRows = 2; // One for a timestamp, one for a blank space
    
    sheet.insertRowsAfter(1, numNewRows + numHeaderRows);
    
    var timestamp = new Date();
    var timestampHeader = ["Report saved on: " + timestamp.toLocaleString(), "", "", "", "", "", ""];
    sheet.getRange(2, 1, 1, headers.length).setValues([timestampHeader]).setFontWeight("bold").setBackground("#d1fae5");

    sheet.getRange(3, 1, numNewRows, headers.length).setValues(rows);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Overtime details report saved successfully." })).setMimeType(ContentService.MimeType.JSON);
}

function handleOvertimeRecords(ss, data) {
  var sheetName = "Overtime Records";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  var records = data.records;
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error("No overtime records found in the request.");
  }

  var headers = [
    "Serial No.", "Record ID", "Date", "Employee ID", "Employee Name", 
    "Designation", "Department", "OT Hours", "OT Rate", "Total OT Pay", "Duty Absent"
  ];
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  
  // To avoid duplicates, get existing record IDs from the sheet
  var existingRecordIds = sheet.getLastRow() > 1 ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().flat() : [];
  var newRecords = records.filter(function(r) { return existingRecordIds.indexOf(r.id) === -1; });
  
  if (newRecords.length === 0) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "No new overtime records to add." })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var rows = newRecords.map(function(r) {
    return [
      "", // Placeholder for Serial No.
      r.id, r.date, r.employeeDisplayId, r.employeeName, r.designation,
      r.department, r.hours, r.rate, r.totalAmount, r.absentEmployeeName || ""
    ];
  });
  
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
  }
  
  // Recalculate all serial numbers to ensure they are correct
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var serialNos = [];
    for (var i = 1; i < lastRow; i++) {
        serialNos.push([i]);
    }
    sheet.getRange(2, 1, serialNos.length, 1).setValues(serialNos);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": newRecords.length + " new overtime records added." })).setMimeType(ContentService.MimeType.JSON);
}

function handleSalaryProcessingReport(ss, data) {
  var month = data.month;
  var year = data.year;
  var payslips = data.data;
  var sheetName = "Salary Processing " + month + " " + year;

  if (!payslips || !Array.isArray(payslips) || payslips.length === 0) {
    throw new Error("No payslip data found in the request.");
  }

  var sheet = ss.getSheetByName(sheetName);
  
  var headers = [
    "Sl.", "Employee ID", "Employee Name", "Department", "Designation",
    "Basic Salary", "Allowances", "Total Allowances", "Overtime Pay", "Gross Salary",
    "Deductions", "Absent Deduction", "Total Deductions", "Net Salary"
  ];

  var rows = payslips.map(function(p, index) {
    var allowanceStr = p.allowances.map(function(a) { return a.type + ": " + a.amount; }).join("\\n");
    var deductionStr = p.deductions.map(function(d) { return d.type + ": " + d.amount; }).join("\\n");
    
    return [
      index + 1,
      p.employeeDisplayId,
      p.employeeName,
      p.department,
      p.designation,
      p.basicSalary,
      allowanceStr,
      p.totalAllowances,
      p.overtimePay,
      p.grossSalary,
      deductionStr,
      p.absentDeduction,
      p.totalDeductions + p.absentDeduction,
      p.netSalary
    ];
  });

  if (!sheet) {
    // Sheet doesn't exist, create it and add data for the first time
    sheet = ss.insertSheet(sheetName, 0);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e5e7eb").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows).setVerticalAlignment("top");
      sheet.getRange(2, 7, rows.length, 1).setWrap(true); // Allowances
      sheet.getRange(2, 11, rows.length, 1).setWrap(true); // Deductions
      headers.forEach(function(_, i) { sheet.autoResizeColumn(i + 1); });
    }
  } else {
    // Sheet exists, insert new data at the top, pushing old data down
    var numNewRows = rows.length;
    var numHeaderRows = 2; // One for a timestamp, one for a blank space
    
    // Insert rows right after the main header (at row 2)
    sheet.insertRowsAfter(1, numNewRows + numHeaderRows);
    
    // Add a timestamp for this save operation
    var timestamp = new Date();
    var timestampHeader = ["Report saved on: " + timestamp.toLocaleString(), "", "", "", "", "", "", "", "", "", "", "", "", ""];
    sheet.getRange(2, 1, 1, headers.length).setValues([timestampHeader]).setFontWeight("bold").setBackground("#d1fae5");

    // Add new data starting from row 3
    sheet.getRange(3, 1, numNewRows, headers.length).setValues(rows).setVerticalAlignment("top");
    
    // Apply formatting to new rows
    sheet.getRange(3, 7, numNewRows, 1).setWrap(true); // Allowances
    sheet.getRange(3, 11, numNewRows, 1).setWrap(true); // Deductions
  }

  return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Salary processing report for " + month + " " + year + " saved successfully." })).setMimeType(ContentService.MimeType.JSON);
}

function handleSalaryReport(ss, data) {
  var month = data.month;
  var year = data.year;
  var payslips = data.data;
  var sheetName = "Salary " + month + " " + year;

  if (!payslips || !Array.isArray(payslips) || payslips.length === 0) {
    throw new Error("No payslip data found in the request.");
  }

  var sheet = ss.getSheetByName(sheetName);
  
  var headers = [
    "Sl.", "Employee ID", "Employee Name", "Department", "Designation",
    "Basic Salary", "Allowances", "Total Allowances", "Overtime Pay", "Gross Salary",
    "Deductions", "Absent Deduction", "Total Deductions", "Net Salary"
  ];

  var rows = payslips.map(function(p, index) {
    var allowanceStr = p.allowances.map(function(a) { return a.type + ": " + a.amount; }).join("\\n");
    var deductionStr = p.deductions.map(function(d) { return d.type + ": " + d.amount; }).join("\\n");
    
    return [
      index + 1,
      p.employeeDisplayId,
      p.employeeName,
      p.department,
      p.designation,
      p.basicSalary,
      allowanceStr,
      p.totalAllowances,
      p.overtimePay,
      p.grossSalary,
      deductionStr,
      p.absentDeduction,
      p.totalDeductions + p.absentDeduction,
      p.netSalary
    ];
  });

  if (!sheet) {
    // Sheet doesn't exist, create it and add data for the first time
    sheet = ss.insertSheet(sheetName, 0);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e5e7eb").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows).setVerticalAlignment("top");
      sheet.getRange(2, 7, rows.length, 1).setWrap(true); // Allowances
      sheet.getRange(2, 11, rows.length, 1).setWrap(true); // Deductions
      headers.forEach(function(_, i) { sheet.autoResizeColumn(i + 1); });
    }
  } else {
    // Sheet exists, insert new data at the top, pushing old data down
    var numNewRows = rows.length;
    var numHeaderRows = 2; // One for a timestamp, one for a blank space
    
    // Insert rows right after the main header (at row 2)
    sheet.insertRowsAfter(1, numNewRows + numHeaderRows);
    
    // Add a timestamp for this save operation
    var timestamp = new Date();
    var timestampHeader = ["Report saved on: " + timestamp.toLocaleString(), "", "", "", "", "", "", "", "", "", "", "", "", ""];
    sheet.getRange(2, 1, 1, headers.length).setValues([timestampHeader]).setFontWeight("bold").setBackground("#d1fae5");

    // Add new data starting from row 3
    sheet.getRange(3, 1, numNewRows, headers.length).setValues(rows).setVerticalAlignment("top");
    
    // Apply formatting to new rows
    sheet.getRange(3, 7, numNewRows, 1).setWrap(true); // Allowances
    sheet.getRange(3, 11, numNewRows, 1).setWrap(true); // Deductions
  }

  return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Salary report for " + month + " " + year + " saved successfully." })).setMimeType(ContentService.MimeType.JSON);
}`;

    const handleCopyCode = () => {
        navigator.clipboard.writeText(googleAppsScriptCode.trim())
            .then(() => {
                setCopyButtonText('Copied!');
                setTimeout(() => setCopyButtonText('Copy Code'), 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                setCopyButtonText('Failed to copy');
            });
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* General Settings Form */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">General Settings</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="overtimeRate" className="block text-sm font-medium text-gray-700">Fixed Overtime Rate (per hour)</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                name="overtimeRate"
                                id="overtimeRate"
                                value={formState.overtimeRate}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">If &gt; 0, this rate is used for all employees. Else, rate is based on salary.</p>
                        </div>
                         <div>
                            <label htmlFor="overtimeMultiplier" className="block text-sm font-medium text-gray-700">Overtime Rate Multiplier</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                name="overtimeMultiplier"
                                id="overtimeMultiplier"
                                value={formState.overtimeMultiplier}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                            <p className="mt-1 text-xs text-gray-500">Used if fixed rate is 0. (e.g., 2 for double rate).</p>
                        </div>
                        <div>
                            <label htmlFor="overtimeCalculationBasicSalary" className="block text-sm font-medium text-gray-700">Basic Salary for OT Calculation</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                name="overtimeCalculationBasicSalary"
                                id="overtimeCalculationBasicSalary"
                                value={formState.overtimeCalculationBasicSalary}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                             <p className="mt-1 text-xs text-gray-500">This salary is used as the base for all OT calculations.</p>
                        </div>
                        <div>
                            <label htmlFor="workingDaysPerMonth" className="block text-sm font-medium text-gray-700">Working Days Per Month</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                name="workingDaysPerMonth"
                                id="workingDaysPerMonth"
                                value={formState.workingDaysPerMonth}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                         <div>
                            <label htmlFor="workingHoursPerDay" className="block text-sm font-medium text-gray-700">Working Hours Per Day</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                name="workingHoursPerDay"
                                id="workingHoursPerDay"
                                value={formState.workingHoursPerDay}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    </div>
                     <div className="pt-4">
                        <label htmlFor="googleSheetsUrl" className="block text-sm font-medium text-gray-700">Google Sheets Web App URL</label>
                        <input
                            type="url"
                            name="googleSheetsUrl"
                            id="googleSheetsUrl"
                            value={formState.googleSheetsUrl}
                            onChange={handleChange}
                            placeholder="https://script.google.com/macros/s/..."
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                         <p className="mt-1 text-xs text-gray-500">Leave blank to disable direct saving to Google Sheets from the Overtime page.</p>
                    </div>

                    <div className="text-right pt-4">
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
                        >
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
            
             {/* Data Management Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Data Management</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Export all your application data into a single file for backup or to transfer to another computer. 
                    Importing data will overwrite everything currently in the app.
                </p>
                <div className="flex flex-col md:flex-row gap-4">
                     <input type="file" ref={importFileRef} onChange={handleFileImport} accept=".json" className="hidden" />
                    <button
                        onClick={handleExportData}
                        className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center justify-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export All Data
                    </button>
                    <button
                        onClick={handleImportClick}
                        className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors flex items-center justify-center"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Import All Data
                    </button>
                </div>
            </div>

            {/* Employee Management Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-800">Employee Management</h2>
                    <p className="text-sm text-gray-500">Note: Basic salary is managed on the main Employees page.</p>
                    <button
                        onClick={openAddModal}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        New Employee
                    </button>
                </div>
                <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {employees.map((emp) => (
                                <tr key={emp.id} className="hover:bg-gray-50">
                                     <td className="px-4 py-2">
                                        <div className="h-10 w-10 flex-shrink-0">
                                            {emp.photo ? (
                                                <img className="h-10 w-10 rounded-full object-cover" src={emp.photo} alt={emp.name} />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{emp.designation}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{emp.department}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{new Intl.NumberFormat('en-US').format(emp.basicSalary)}</td>
                                    <td className="px-4 py-3 text-center text-sm space-x-2">
                                        <button onClick={() => openEditModal(emp)} className="text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                                        <button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isEmployeeModalOpen && <EmployeeEditModal employee={editingEmployee} onSave={handleEmployeeSave} onClose={closeModal} />}
            
            {/* Google Apps Script Section */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                 <h2 className="text-xl font-bold text-gray-800 mb-2">Google Sheets Integration</h2>
                 <p className="text-sm text-gray-600 mb-4">To save overtime data directly to a Google Sheet, follow these steps:</p>
                 <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 mb-6">
                     <li>Open a new Google Sheet.</li>
                     <li>Go to <code className="bg-gray-200 p-1 rounded text-xs">Extensions &gt; Apps Script</code>.</li>
                     <li>Delete any existing code in the <code className="bg-gray-200 p-1 rounded text-xs">Code.gs</code> file and paste the code below.</li>
                     <li>Click the "Deploy" button, select "New deployment".</li>
                     <li>For "Select type", choose "Web app".</li>
                     <li>In the "Who has access" dropdown, select "Anyone".</li>
                     <li>Click "Deploy". You will need to authorize the script.</li>
                     <li>Copy the provided "Web app URL" and paste it into the settings field above.</li>
                 </ol>
                 
                 <div className="bg-gray-800 rounded-lg p-4 relative">
                     <button onClick={handleCopyCode} className="absolute top-2 right-2 bg-gray-600 text-white px-3 py-1 text-xs rounded hover:bg-gray-500 transition-colors">
                         {copyButtonText}
                     </button>
                     <pre className="text-sm text-white overflow-x-auto"><code className="language-javascript">{googleAppsScriptCode.trim()}</code></pre>
                 </div>
            </div>

        </div>
    );
};

export default SettingsComponent;