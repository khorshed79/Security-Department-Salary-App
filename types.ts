export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  designation: string;
  joiningDate: string;
  basicSalary: number;
  allowances: Allowance[];
  deductions: Deduction[];
  photo?: string; // To store the Base64 data URL of the image
}

export interface Allowance {
  type: string;
  amount: number;
}

export interface Deduction {
  type: string;
  amount: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  basicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  overtimePay: number;
  absentDeduction: number;
  grossSalary: number;
  netSalary: number;
  status: 'Processed' | 'Pending';
}

export interface User {
  username: string;
  password: string;
}

// FIX: Added the missing SimpleEmployee interface, which is used for categorized employee lists.
export interface SimpleEmployee {
  id: string;
  name: string;
  photo?: string;
}

export enum Page {
  Dashboard = 'Dashboard',
  EmployeeList = 'Employee List',
  EmployeeInformation = 'Employee Information',
  AbsentDeduction = 'Absent Deduction',
  Overtime = 'Overtime',
  OvertimeDetails = 'Overtime Details',
  SalaryProcessing = 'Salary Processing',
  SalaryProcessing2 = 'Salary Processing2',
  Reports = 'Reports & Payslips',
  NoteTaking = 'Note Taking',
  Settings = 'Settings',
}

// A generic key-value field for CV sections
export interface CVField {
  id: string;
  label: string;
  value: string;
}

// A more structured item for lists like education/experience
export interface CVListItem {
  id:string;
  title: string; // e.g., 'Bachelor of Design' or 'Digital Marketing Manager'
  subtitle: string; // e.g., 'Wardiere University' or 'Company Name | 123 Anywhere St.'
  dateRange: string; // e.g., '2006 - 2008' or 'Jan 2022 - Present'
  description?: string; // For work experience description
}

// Represents a whole section in the CV
export type CVSectionLayout = 'list' | 'grid' | 'tags' | 'paragraph';
export type CVSectionSide = 'left' | 'right';

export interface CVSection {
  id: string;
  title: string; // e.g., "EDUCATION", "WORK EXPERIENCE"
  layout: CVSectionLayout;
  side: CVSectionSide;
  items: (CVField | CVListItem)[];
}

// Replaces the old EmployeeCV to support dynamic sections
export interface EmployeeCV {
  employeeId: string;
  aboutMe: string; // Special field for the "About Me" paragraph
  sections: CVSection[];
}


export interface OvertimeRecord {
  id: string;
  employeeId: string; // The unique internal ID
  employeeDisplayId: string; // The user-facing ID like 'F-101'
  employeeName: string;
  department: string;
  designation: string;
  date: string; // YYYY-MM-DD
  hours: number;
  rate: number;
  totalAmount: number;
  absentEmployeeId?: string;
  absentEmployeeName?: string;
}

export interface Settings {
  overtimeMultiplier: number;
  overtimeRate: number;
  overtimeCalculationBasicSalary: number;
  workingDaysPerMonth: number;
  workingHoursPerDay: number;
  googleSheetsUrl: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Can be HTML for rich text
  color: string; // e.g., 'bg-yellow-200'
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}