
import { Employee, Payslip, SimpleEmployee } from './types';

export const DUMMY_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    employeeId: 'F-101',
    name: 'Rahim Sheikh',
    department: 'Production',
    designation: 'Machine Operator',
    joiningDate: '2022-01-15',
    basicSalary: 15000,
    allowances: [
      { type: 'House Rent', amount: 3000 },
      { type: 'Medical', amount: 1000 },
      { type: 'Transport', amount: 500 },
    ],
    deductions: [
      { type: 'Provident Fund', amount: 1200 },
      { type: 'Food', amount: 1500 },
    ],
  },
  {
    id: 'emp-002',
    employeeId: 'F-102',
    name: 'Karim Mia',
    department: 'Packaging',
    designation: 'Packer',
    joiningDate: '2021-11-20',
    basicSalary: 12000,
    allowances: [
      { type: 'House Rent', amount: 2500 },
      { type: 'Medical', amount: 800 },
      { type: 'Transport', amount: 400 },
    ],
    deductions: [
      { type: 'Provident Fund', amount: 1000 },
       { type: 'Food', amount: 1500 },
    ],
  },
  {
    id: 'emp-003',
    employeeId: 'F-103',
    name: 'Fatema Begum',
    department: 'Quality Control',
    designation: 'Inspector',
    joiningDate: '2023-03-01',
    basicSalary: 18000,
    allowances: [
      { type: 'House Rent', amount: 4000 },
      { type: 'Medical', amount: 1200 },
      { type: 'Transport', amount: 600 },
    ],
    deductions: [
      { type: 'Provident Fund', amount: 1500 },
       { type: 'Food', amount: 1500 },
    ],
  },
];

export const DUMMY_PAYSLIPS: Payslip[] = []; // Initially empty, will be populated by processing

export const CATEGORIES: string[] = [
    'Administration',
    'Admin',
    'Maintenance',
    'Store',
    'Production (Bakery)',
    'Production (Beverage)',
    'Quality Control',
    'Distribution',
    'Security Dept.',
    'Transport Dept.',
];

export const DUMMY_CATEGORIZED_EMPLOYEES: Record<string, SimpleEmployee[]> = {
    'Administration': [{ id: 'simp-1', name: 'Mr. Admin' }],
    'Production (Bakery)': [
        { id: 'simp-2', name: 'Baker 1' },
        { id: 'simp-3', name: 'Baker 2' },
    ],
    'Security Dept.': [{ id: 'simp-4', name: 'Security Head' }],
};
