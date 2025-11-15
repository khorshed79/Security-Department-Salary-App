import React, { useState, useMemo, useEffect } from 'react';
import { Page, Employee, Payslip, OvertimeRecord, Settings, EmployeeCV, CVSection, CVField, CVListItem, Note, User } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import SalaryProcessing from './components/SalaryProcessing';
import SalaryProcessing2 from './components/SalaryProcessing2';
import Reports from './components/Reports';
import { DUMMY_EMPLOYEES, DUMMY_PAYSLIPS } from './constants';
import Overtime from './components/Overtime';
import OvertimeDetails from './components/OvertimeDetails';
import SettingsComponent from './components/Settings';
import EmployeeInformation from './components/EmployeeInformation';
import AbsentDeduction from './components/AbsentDeduction';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import NoteTaking from './components/NoteTaking';
import FloatingNoteButton from './components/FloatingNoteButton';


const DEFAULT_SETTINGS: Settings = {
  overtimeMultiplier: 2,
  overtimeRate: 0,
  overtimeCalculationBasicSalary: 9500,
  workingDaysPerMonth: 30,
  workingHoursPerDay: 8,
  googleSheetsUrl: '',
};

const DUMMY_NOTES: Note[] = [
    {
        id: 'note-1',
        title: 'Meeting Agenda',
        content: '<ul><li>Discuss Q3 performance.</li><li>Plan for the upcoming production cycle.</li><li>Review safety protocols.</li></ul>',
        color: 'bg-blue-100',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'note-2',
        title: 'Urgent: Machine Maintenance',
        content: 'Conveyor belt C-4 is making a strange noise. Needs to be checked by the maintenance team ASAP.',
        color: 'bg-red-200',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

// This function creates a default CV structure based on the new template.
const createDefaultCV = (employeeId: string): EmployeeCV => ({
    employeeId,
    aboutMe: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pharetra in lorem at laoreet. Donec hendrerit libero eget est tempor, quis tempus arcu elementum. In elementum elit at dui tristique feugiat. Mauris convallis, mi at mattis malesuada, neque nulla volutpat dolor, hendrerit faucibus eros nibh ut nunc.',
    sections: [
        // RIGHT SIDE
        { id: 'work', title: 'WORK EXPERIENCE', layout: 'list', side: 'right', items: [] },
        { id: 'references', title: 'REFERENCES', layout: 'grid', side: 'right', items: [] },
        // LEFT SIDE
        { id: 'education', title: 'EDUCATION', layout: 'list', side: 'left', items: [] },
        { id: 'expertise', title: 'EXPERTISE', layout: 'tags', side: 'left', items: [] },
        { id: 'language', title: 'LANGUAGE', layout: 'tags', side: 'left', items: [
             { id: `lang-${Date.now()}-1`, label: 'English', value: '' },
             { id: `lang-${Date.now()}-2`, label: 'French', value: '' },
        ] },
    ]
});


// This function migrates old CV data to the new section-based format.
const migrateCVData = (oldCV: any): EmployeeCV => {
    // If it has 'sections', it's likely already in the new format or empty.
    if (!oldCV || Array.isArray(oldCV.sections)) {
        return oldCV;
    }

    const newCV: EmployeeCV = createDefaultCV(oldCV.employeeId);
    
    // Create a contact section from old fields
    const contactItems: CVField[] = [
        { id: 'phone', label: 'Phone', value: oldCV.contactNo || '' },
        { id: 'email', label: 'Email', value: oldCV.email || '' },
        { id: 'address', label: 'Address', value: oldCV.presentAddress || '' },
    ].filter(item => item.value);
    newCV.sections.unshift({ id: 'contact', title: 'CONTACT', layout: 'grid', side: 'left', items: contactItems });

    // Migrate education
    const educationSection = newCV.sections.find(s => s.id === 'education');
    if (educationSection && oldCV.educationalQualifications) {
        educationSection.items = oldCV.educationalQualifications.map((edu: any): CVListItem => ({
            id: edu.id || `edu-${Date.now()}`,
            title: edu.degree || '',
            subtitle: edu.institution || '',
            dateRange: edu.year || '',
            description: ''
        }));
    }

    // Migrate work experience
    const workSection = newCV.sections.find(s => s.id === 'work');
    if (workSection && oldCV.workExperience) {
        workSection.items = oldCV.workExperience.map((exp: any): CVListItem => ({
            id: exp.id || `work-${Date.now()}`,
            title: exp.position || '',
            subtitle: exp.company || '',
            dateRange: exp.duration || '',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pharetra in lorem at laoreet.'
        }));
    }
    
    // Collect other personal details into a new section
    const personalDetailsItems: CVField[] = [
        { id: 'father', label: "Father's Name", value: oldCV.fatherName || '' },
        { id: 'mother', label: "Mother's Name", value: oldCV.motherName || '' },
        { id: 'dob', label: 'Date of Birth', value: oldCV.dateOfBirth || '' },
        { id: 'gender', label: 'Gender', value: oldCV.gender || '' },
        { id: 'marital', label: 'Marital Status', value: oldCV.maritalStatus || '' },
        { id: 'nationality', label: 'Nationality', value: oldCV.nationality || '' },
        { id: 'nid', label: 'NID', value: oldCV.nid || '' },
        { id: 'religion', label: 'Religion', value: oldCV.religion || '' },
        { id: 'perm-addr', label: 'Permanent Address', value: oldCV.permanentAddress || '' },
    ].filter(item => item.value);

    if (personalDetailsItems.length > 0) {
        const personalDetailsSection: CVSection = {
            id: 'personal',
            title: 'PERSONAL DETAILS',
            layout: 'grid',
            side: 'right',
            items: personalDetailsItems
        };
        newCV.sections.push(personalDetailsSection);
    }
    
    return newCV;
};


const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.Dashboard);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('factory_authenticated_user'));
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [loginError, setLoginError] = useState('');
  
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const savedUsers = localStorage.getItem('factory_users');
      return savedUsers ? JSON.parse(savedUsers) : [];
    } catch (error) {
      console.error("Failed to parse users from localStorage", error);
      return [];
    }
  });
  
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const savedEmployees = localStorage.getItem('factory_employees');
      return savedEmployees ? JSON.parse(savedEmployees) : DUMMY_EMPLOYEES;
    } catch (error) {
      console.error("Failed to parse employees from localStorage", error);
      return DUMMY_EMPLOYEES;
    }
  });

  const [payslips, setPayslips] = useState<Payslip[]>(() => {
    try {
      const savedPayslips = localStorage.getItem('factory_payslips');
      return savedPayslips ? JSON.parse(savedPayslips) : DUMMY_PAYSLIPS;
    } catch (error) {
      console.error("Failed to parse payslips from localStorage", error);
      return DUMMY_PAYSLIPS;
    }
  });

  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>(() => {
    try {
      const saved = localStorage.getItem('factory_overtime_records');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to parse overtime records from localStorage", error);
      return [];
    }
  });
  
  const [employeeCVs, setEmployeeCVs] = useState<EmployeeCV[]>(() => {
    try {
      const saved = localStorage.getItem('factory_employee_cvs');
      const parsed = saved ? JSON.parse(saved) : [];
      // Apply migration to each loaded CV
      return parsed.map(migrateCVData);
    } catch (error) {
      console.error("Failed to parse employee CVs from localStorage", error);
      return [];
    }
  });

  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('factory_settings');
      const parsed = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (error) {
      console.error("Failed to parse settings from localStorage", error);
      return DEFAULT_SETTINGS;
    }
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('factory_notes');
      return saved ? JSON.parse(saved) : DUMMY_NOTES;
    } catch (error) {
      console.error("Failed to parse notes from localStorage", error);
      return DUMMY_NOTES;
    }
  });
  
  useEffect(() => {
    localStorage.setItem('factory_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('factory_payslips', JSON.stringify(payslips));
  }, [payslips]);

  useEffect(() => {
    localStorage.setItem('factory_overtime_records', JSON.stringify(overtimeRecords));
  }, [overtimeRecords]);
  
  useEffect(() => {
    localStorage.setItem('factory_employee_cvs', JSON.stringify(employeeCVs));
  }, [employeeCVs]);

  useEffect(() => {
    localStorage.setItem('factory_settings', JSON.stringify(settings));
  }, [settings]);
  
  useEffect(() => {
    localStorage.setItem('factory_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('factory_notes', JSON.stringify(notes));
  }, [notes]);


  const handleLogin = (username: string, password: string): boolean => {
    // Check for demo user first
    if (username === 'admin' && password === 'password') {
      setIsAuthenticated(true);
      localStorage.setItem('factory_authenticated_user', username);
      setLoginError('');
      return true;
    }

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setIsAuthenticated(true);
      localStorage.setItem('factory_authenticated_user', username);
      setLoginError('');
      return true;
    }

    setLoginError('Invalid username or password.');
    return false;
  };

  const handleSignUp = async (username: string, password: string): Promise<boolean> => {
    if (users.some(u => u.username === username)) {
      return false; // User already exists
    }

    setUsers(prev => [...prev, { username, password }]);

    // Log the signup to Google Sheets (without the password)
    if (settings.googleSheetsUrl) {
      try {
        const payload = { type: 'userSignUp', username };
        await fetch(settings.googleSheetsUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        console.error('Failed to log signup to Google Sheets:', error);
        // We don't block the signup if this fails, just log the error.
      }
    }

    return true;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('factory_authenticated_user');
    setAuthView('login');
  };


  const handleAddEmployee = (employee: Employee) => {
    setEmployees([employee, ...employees]);
  };
  
  const handleBulkAddEmployees = (newEmployees: Employee[]) => {
    const existingIds = new Set(employees.map(e => e.employeeId));
    const uniqueNewEmployees = newEmployees.filter(ne => !existingIds.has(ne.employeeId));
    setEmployees(prev => [...uniqueNewEmployees, ...prev]);
    alert(`${uniqueNewEmployees.length} new employees imported successfully. ${newEmployees.length - uniqueNewEmployees.length} duplicates were ignored.`);
  };

  const handleUpdateEmployee = (updatedEmployee: Employee) => {
    setEmployees(
      employees.map((emp) =>
        emp.id === updatedEmployee.id ? updatedEmployee : emp
      )
    );
  };

  const handleDeleteEmployee = (employeeId: string) => {
    setEmployees(employees.filter((emp) => emp.id !== employeeId));
    setPayslips(payslips.filter((slip) => slip.employeeId !== employeeId));
    setEmployeeCVs(employeeCVs.filter(cv => cv.employeeId !== employeeId));
    
    // Handle overtime records:
    // 1. Remove records where the deleted employee DID the overtime.
    // 2. Clear the absentee link if the deleted employee WAS absent.
    setOvertimeRecords(prevRecords => {
        return prevRecords
            .filter(rec => rec.employeeId !== employeeId)
            .map(rec => {
                if (rec.absentEmployeeId === employeeId) {
                    return {
                        ...rec,
                        absentEmployeeId: undefined,
                        absentEmployeeName: 'N/A (Deleted Employee)'
                    };
                }
                return rec;
            });
    });
  };

  const handleProcessSalaries = (newPayslips: Payslip[], month: number, year: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    // Remove any existing payslips for the same month and year
    const existingPayslipsFiltered = payslips.filter(p => p.month !== month || p.year !== year);
    
    // Add the newly processed payslips
    setPayslips([...existingPayslipsFiltered, ...newPayslips]);
    
    alert(`Salaries for ${months[month]} ${year} have been successfully processed and recorded.`);
    setActivePage(Page.Reports);
  };

  const handleAddNote = (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...note,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const handleUpdateNote = (note: Note) => {
    setNotes(prev => prev.map(n => n.id === note.id ? { ...note, updatedAt: new Date().toISOString() } : n));
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };
  
  const handleImportAllData = (data: any) => {
    if (window.confirm('This action will overwrite all current application data. Do you want to proceed?')) {
        if(data.employees) setEmployees(data.employees);
        if(data.payslips) setPayslips(data.payslips);
        if(data.overtimeRecords) setOvertimeRecords(data.overtimeRecords);
        if(data.employeeCVs) setEmployeeCVs(data.employeeCVs.map(migrateCVData));
        if(data.settings) setSettings(data.settings);
        if(data.notes) setNotes(data.notes);
        if(data.users) setUsers(data.users);
        if (data.factory_categories) localStorage.setItem('factory_categories', JSON.stringify(data.factory_categories));
        if (data.factory_categorized_employees) localStorage.setItem('factory_categorized_employees', JSON.stringify(data.factory_categorized_employees));
        alert('Data successfully imported. The page will now reload.');
        window.location.reload();
    }
  };
  
  const stats = useMemo(() => {
    const totalSalaryPaid = payslips.reduce((sum, slip) => sum + slip.netSalary, 0);
    const totalOvertime = payslips.reduce((sum, slip) => sum + slip.overtimePay, 0);
    const totalDeductions = payslips.reduce((sum, slip) => sum + slip.totalDeductions + slip.absentDeduction, 0);

    let topSalaryEarner = { name: 'N/A', amount: 0 };
    if (payslips.length > 0) {
      const topSlip = [...payslips].sort((a, b) => b.netSalary - a.netSalary)[0];
      topSalaryEarner = { name: topSlip.employeeName, amount: topSlip.netSalary };
    }
    
    let topOvertimeEarner = { name: 'N/A', amount: 0 };
     if (payslips.length > 0) {
      const topOTSlip = [...payslips].filter(p => p.overtimePay > 0).sort((a,b) => b.overtimePay - a.overtimePay)[0];
      if (topOTSlip) {
          topOvertimeEarner = { name: topOTSlip.employeeName, amount: topOTSlip.overtimePay };
      }
    }
    
    let topDeductionPerson = { name: 'N/A', amount: 0 };
     if (payslips.length > 0) {
      const topDeductionSlip = [...payslips].sort((a,b) => (b.totalDeductions + b.absentDeduction) - (a.totalDeductions + a.absentDeduction))[0];
      if (topDeductionSlip) {
          topDeductionPerson = { name: topDeductionSlip.employeeName, amount: topDeductionSlip.totalDeductions + topDeductionSlip.absentDeduction };
      }
    }

    return {
      totalEmployees: employees.length,
      totalSalaryPaid,
      totalOvertime,
      totalDeductions,
      topSalaryEarner,
      topOvertimeEarner,
      topDeductionPerson,
    };
  }, [employees.length, payslips]);

  const handleSaveCV = (cv: EmployeeCV) => {
    setEmployeeCVs(prev => {
        const existing = prev.find(p => p.employeeId === cv.employeeId);
        if (existing) {
            return prev.map(p => p.employeeId === cv.employeeId ? cv : p);
        }
        return [...prev, cv];
    });
  };

  const renderPage = () => {
    switch (activePage) {
      case Page.Dashboard:
        return <Dashboard stats={stats} employees={employees} payslips={payslips} setActivePage={setActivePage} />;
      case Page.EmployeeList:
        return <EmployeeList employees={employees} onAdd={handleAddEmployee} onUpdate={handleUpdateEmployee} onDelete={handleDeleteEmployee} onBulkAdd={handleBulkAddEmployees} />;
      case Page.SalaryProcessing:
        return <SalaryProcessing employees={employees} onProcess={handleProcessSalaries} overtimeRecords={overtimeRecords} settings={settings}/>;
      case Page.SalaryProcessing2:
        return <SalaryProcessing2 employees={employees} onProcess={handleProcessSalaries} overtimeRecords={overtimeRecords} settings={settings} />;
      case Page.Reports:
        return <Reports payslips={payslips} employees={employees} settings={settings} />;
      case Page.Overtime:
        return <Overtime employees={employees} onSave={(records) => setOvertimeRecords(prev => [...prev, ...records])} settings={settings}/>;
      case Page.OvertimeDetails:
        return <OvertimeDetails 
            overtimeRecords={overtimeRecords} 
            employees={employees} 
            onDelete={(id) => setOvertimeRecords(prev => prev.filter(r => r.id !== id))} 
            onUpdate={(record) => setOvertimeRecords(prev => prev.map(r => r.id === record.id ? record : r))} 
            settings={settings} />;
      case Page.Settings:
        return <SettingsComponent 
          settings={settings} 
          onSave={setSettings} 
          employees={employees}
          payslips={payslips}
          overtimeRecords={overtimeRecords}
          onAdd={handleAddEmployee}
          onUpdate={handleUpdateEmployee}
          onDelete={handleDeleteEmployee}
          onImportAllData={handleImportAllData}
        />;
      case Page.EmployeeInformation:
        return <EmployeeInformation 
            employees={employees} 
            employeeCVs={employeeCVs} 
            onSave={handleSaveCV} 
            onUpdateEmployee={handleUpdateEmployee}
        />;
      case Page.AbsentDeduction:
        const handleUpdateOvertimeRecord = (record: OvertimeRecord) => {
            setOvertimeRecords(prev => prev.map(r => r.id === record.id ? record : r));
        };
        const handleDeleteBulkOvertime = (ids: string[]) => {
            setOvertimeRecords(prev => prev.filter(r => !ids.includes(r.id)));
        };
        return <AbsentDeduction 
            overtimeRecords={overtimeRecords} 
            employees={employees} 
            onDeleteBulk={handleDeleteBulkOvertime} 
            onUpdateOvertime={handleUpdateOvertimeRecord}
            settings={settings}
        />;
      case Page.NoteTaking:
        return <NoteTaking notes={notes} onAdd={handleAddNote} onUpdate={handleUpdateNote} onDelete={handleDeleteNote} />;
      default:
        return <Dashboard stats={stats} employees={employees} payslips={payslips} setActivePage={setActivePage} />;
    }
  };
  
  if (!isAuthenticated) {
    if (authView === 'signup') {
      return <SignUpPage onSignUp={handleSignUp} onSwitchToLogin={() => setAuthView('login')} settings={settings} />;
    }
    return <LoginPage onLogin={handleLogin} onSwitchToSignUp={() => setAuthView('signup')} loginError={loginError} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
      <main className="flex-1 p-4 overflow-y-auto">
         <header className="mb-4 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">{activePage}</h1>
        </header>
        {renderPage()}
        <FloatingNoteButton onClick={() => setActivePage(Page.NoteTaking)} />
      </main>
    </div>
  );
};

// FIX: Added default export for the App component.
export default App;