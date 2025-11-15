import React, { useState } from 'react';
import { Page } from '../types';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  onLogout: () => void;
}

const NavIcon: React.FC<{ page: Page | 'Employees' | 'Logout' }> = ({ page }) => {
  switch (page) {
    case Page.Dashboard:
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    case 'Employees':
    case Page.EmployeeList:
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    case Page.EmployeeInformation:
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h4a2 2 0 012 2v1m-4 0h4" /></svg>;
    case Page.AbsentDeduction:
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case Page.Overtime:
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case Page.OvertimeDetails:
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
    case Page.SalaryProcessing:
    case Page.SalaryProcessing2:
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 14h.01M12 17h.01M15 17h.01M9 10h.01M12 10h.01M15 10h.01M3 7l3-4 3 4M21 7l-3-4-3 4M3 21v-4a2 2 0 012-2h14a2 2 0 012 2v4M12 7v10" /></svg>;
    case Page.Reports:
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    case Page.NoteTaking:
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
    case Page.Settings:
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case 'Logout':
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
    default:
      return null;
  }
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, onLogout }) => {
  const employeePages = [Page.EmployeeList, Page.EmployeeInformation, Page.AbsentDeduction];
  const [isEmployeeMenuOpen, setIsEmployeeMenuOpen] = useState(employeePages.includes(activePage));

  const navItems = [
    Page.Dashboard,
    'Employees', // This is a placeholder for the collapsible menu
    Page.Overtime,
    Page.OvertimeDetails,
    Page.SalaryProcessing,
    Page.SalaryProcessing2,
    Page.Reports,
    Page.NoteTaking,
    Page.Settings,
  ];

  const handleNavClick = (page: Page) => {
    setActivePage(page);
    if (employeePages.includes(page)) {
        setIsEmployeeMenuOpen(true);
    }
  };

  const NavItem: React.FC<{ page: Page, isSubItem?: boolean }> = ({ page, isSubItem = false }) => (
    <a
        href="#"
        onClick={(e) => { e.preventDefault(); handleNavClick(page); }}
        className={`flex items-center py-2 my-1 transition-colors duration-200 ${isSubItem ? 'px-8' : 'px-4'} ${
            activePage === page
            ? 'bg-indigo-600 text-white'
            : 'text-gray-400 hover:bg-slate-700 hover:text-white'
        }`}
    >
        <NavIcon page={page} />
        <span className="mx-3 font-medium hidden md:block text-sm">{page}</span>
    </a>
  );

  return (
    <aside className="w-20 md:w-60 bg-slate-800 text-white flex flex-col transition-all duration-300">
      <div className="flex items-center justify-center md:justify-start md:px-4 h-14 border-b border-slate-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01V5M12 20v-1m0 1v.01M12 18v-1m0-1v-1m0-1v-1m0-1V9m1.401-1.401L12 6.182m-1.401 1.417L12 9.414m1.401 7.185L12 15.182m-1.401 1.417L12 17.414M6 12H4m2 0h.01M18 12h2m-2 0h-.01M7 15l-1.5 1.5M17 15l1.5 1.5M7 9l-1.5-1.5M17 9l1.5-1.5"/>
        </svg>
        <span className="ml-3 font-semibold text-lg hidden md:block">SalaryApp</span>
      </div>
      <nav className="flex-1 mt-4 overflow-y-auto">
        {navItems.map((item) => {
          if (item === 'Employees') {
            const isEmployeeSectionActive = employeePages.includes(activePage);
            return (
              <div key="employees-menu">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsEmployeeMenuOpen(!isEmployeeMenuOpen);
                  }}
                  className={`flex items-center justify-between py-2 px-4 my-1 transition-colors duration-200 ${
                    isEmployeeSectionActive
                      ? 'text-white'
                      : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <NavIcon page="Employees" />
                    <span className="mx-3 font-medium hidden md:block text-sm">Employees</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 hidden md:block ${isEmployeeMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isEmployeeMenuOpen ? 'max-h-60' : 'max-h-0'}`}>
                    <div className="bg-slate-900/50 pt-1">
                        {employeePages.map(page => <NavItem key={page} page={page} isSubItem />)}
                    </div>
                </div>
              </div>
            );
          }
          return <NavItem key={item} page={item as Page} />;
        })}
      </nav>
       <div className="mt-auto border-t border-slate-700">
          <a
              href="#"
              onClick={(e) => { e.preventDefault(); onLogout(); }}
              className="flex items-center py-3 px-4 transition-colors duration-200 text-gray-400 hover:bg-red-500 hover:text-white"
          >
              <NavIcon page="Logout" />
              <span className="mx-3 font-medium hidden md:block text-sm">Logout</span>
          </a>
      </div>
    </aside>
  );
};

export default Sidebar;