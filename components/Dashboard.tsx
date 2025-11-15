import React, { useEffect, useRef } from 'react';
import { Page, Employee, Payslip } from '../types';

interface DashboardProps {
    stats: {
        totalEmployees: number;
        totalSalaryPaid: number;
        totalOvertime: number;
        totalDeductions: number;
        topSalaryEarner: { name: string; amount: number };
        topOvertimeEarner: { name: string; amount: number };
        topDeductionPerson: { name: string; amount: number };
    };
    employees: Employee[];
    payslips: Payslip[];
    setActivePage: (page: Page) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
        <div className={`rounded-full p-3 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const TopPerformerCard: React.FC<{ title: string; name: string; amount: number; icon: React.ReactNode; color: string }> = ({ title, name, amount, icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-start space-x-4 transition-all duration-300 hover:shadow-xl hover:scale-105">
        <div className={`rounded-full p-4 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-semibold text-gray-500">{title}</p>
            <p className="text-lg font-bold text-gray-800 truncate" title={name}>{name}</p>
            <p className="text-xl font-semibold text-indigo-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount)}</p>
        </div>
    </div>
);

const QuickLink: React.FC<{ title: string; description: string; page: Page; icon: React.ReactNode; onClick: (page: Page) => void }> = ({ title, description, page, icon, onClick }) => (
    <button onClick={() => onClick(page)} className="bg-white p-6 rounded-xl shadow-lg text-left hover:shadow-2xl hover:scale-105 transform transition-all duration-300 flex flex-col justify-between">
        <div>
          <div className="text-indigo-500 mb-2">{icon}</div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
          <p className="text-gray-500 text-sm">{description}</p>
        </div>
        <div className="mt-4 text-indigo-600 font-semibold flex items-center">
            Proceed
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
        </div>
    </button>
);


const Dashboard: React.FC<DashboardProps> = ({ stats, employees, payslips, setActivePage }) => {
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(value);
  const monthlyPayoutChartRef = useRef<HTMLCanvasElement>(null);
  const departmentDistChartRef = useRef<HTMLCanvasElement>(null);
  const monthlyChartInstanceRef = useRef<any | null>(null);
  const departmentChartInstanceRef = useRef<any | null>(null);

  useEffect(() => {
    const Chart = (window as any).Chart;
    if (!Chart) {
        console.error("Chart.js is not loaded. Please ensure the CDN script tag is present in index.html.");
        return;
    }

    if (monthlyChartInstanceRef.current) {
        monthlyChartInstanceRef.current.destroy();
    }
    if (departmentChartInstanceRef.current) {
        departmentChartInstanceRef.current.destroy();
    }

    if (monthlyPayoutChartRef.current) {
        const labels: string[] = [];
        const data: number[] = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
            data.push(0);
        }

        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        payslips.forEach(p => {
            const payslipDate = new Date(p.year, p.month, 1);
            if (payslipDate >= sixMonthsAgo) {
                const monthDiff = (payslipDate.getFullYear() - sixMonthsAgo.getFullYear()) * 12 + (payslipDate.getMonth() - sixMonthsAgo.getMonth());
                if (monthDiff >= 0 && monthDiff < 6) {
                    data[monthDiff] += p.netSalary;
                }
            }
        });

        const ctx = monthlyPayoutChartRef.current.getContext('2d');
        if (ctx) {
            monthlyChartInstanceRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Total Salary Paid',
                        data: data,
                        backgroundColor: 'rgba(79, 70, 229, 0.8)',
                        borderColor: 'rgba(79, 70, 229, 1)',
                        borderRadius: 4,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value: any) {
                                    if (typeof value === 'number') {
                                        return '৳' + (value / 1000) + 'k';
                                    }
                                    return value;
                                }
                            }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    }

    if (departmentDistChartRef.current) {
        const departmentSalaries: Record<string, number> = {};
        payslips.forEach(p => {
            const employee = employees.find(e => e.id === p.employeeId);
            if (employee) {
                const dept = employee.department || 'Uncategorized';
                departmentSalaries[dept] = (departmentSalaries[dept] || 0) + p.netSalary;
            }
        });
        
        const labels = Object.keys(departmentSalaries);
        const data = Object.values(departmentSalaries);
        const backgroundColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899'];

        const ctx = departmentDistChartRef.current.getContext('2d');
        if (ctx) {
            departmentChartInstanceRef.current = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' }
                    }
                }
            });
        }
    }

    return () => {
        if (monthlyChartInstanceRef.current) {
            monthlyChartInstanceRef.current.destroy();
            monthlyChartInstanceRef.current = null;
        }
        if (departmentChartInstanceRef.current) {
            departmentChartInstanceRef.current.destroy();
            departmentChartInstanceRef.current = null;
        }
    };
}, [employees, payslips]);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Total Employees" 
            value={stats.totalEmployees}
            color="bg-blue-100 text-blue-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} 
        />
        <StatCard 
            title="Total Salary Paid" 
            value={formatCurrency(stats.totalSalaryPaid)}
            color="bg-green-100 text-green-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        />
        <StatCard 
            title="Total Overtime Paid" 
            value={formatCurrency(stats.totalOvertime)}
            color="bg-yellow-100 text-yellow-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard 
            title="Total Deductions" 
            value={formatCurrency(stats.totalDeductions)}
            color="bg-red-100 text-red-600"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top Performers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TopPerformerCard
                title="Highest Salary Earner"
                name={stats.topSalaryEarner.name}
                amount={stats.topSalaryEarner.amount}
                color="bg-green-100 text-green-600"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.25 2.25a.75.75 0 01.75.75v.5a.75.75 0 001.5 0v-.5a2.25 2.25 0 00-2.25-2.25H8.75a2.25 2.25 0 00-2.25 2.25v.5a.75.75 0 001.5 0v-.5a.75.75 0 01.75-.75h2.5zM12 7.5a.75.75 0 01.75.75v7.5a.75.75 0 01-1.5 0V8.25A.75.75 0 0112 7.5zM4.75 9.75a.75.75 0 000 1.5H6v1.5a.75.75 0 001.5 0V10.5h.25a.75.75 0 000-1.5H4.75zM9.25 9.75a.75.75 0 000 1.5H15v1.5a.75.75 0 001.5 0V10.5h.25a.75.75 0 000-1.5H9.25z" clipRule="evenodd" /></svg>}
              />
               <TopPerformerCard
                title="Highest Overtime Earner"
                name={stats.topOvertimeEarner.name}
                amount={stats.topOvertimeEarner.amount}
                color="bg-yellow-100 text-yellow-600"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M11.983 1.904a.75.75 0 00-1.292-.784l-5.25 9.25a.75.75 0 00.954 1.135l1.233-.561 1.09 1.908-4.01 2.316a.75.75 0 00.605 1.348l7.25-2.25a.75.75 0 00.413-1.01l-1.09-1.908 1.472.67a.75.75 0 00.954-1.135l-5.25-9.25z" /><path d="M9.25 11.5a.75.75 0 01.547-1.348l1-.5a.75.75 0 01.548 1.348l-1 .5a.75.75 0 01-.547-.5z" /></svg>}
              />
               <TopPerformerCard
                title="Highest Deduction"
                name={stats.topDeductionPerson.name}
                amount={stats.topDeductionPerson.amount}
                color="bg-red-100 text-red-600"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
              />
          </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <QuickLink
                title="Manage Employees"
                description="Add new employees or update existing information."
                page={Page.EmployeeList}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
                onClick={setActivePage}
              />
              <QuickLink
                title={Page.SalaryProcessing}
                description="Calculate and finalize monthly salaries."
                page={Page.SalaryProcessing}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                onClick={setActivePage}
              />
              <QuickLink
                title={Page.Reports}
                description="View salary reports and individual payslips."
                page={Page.Reports}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                onClick={setActivePage}
              />
          </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Salary Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-96">
              <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Monthly Salary Payout (Last 6 Months)</h3>
                  <div className="relative h-[calc(100%-2rem)] w-full">
                      <canvas ref={monthlyPayoutChartRef}></canvas>
                  </div>
              </div>
              <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Salary Distribution by Department</h3>
                  <div className="relative h-[calc(100%-2rem)] w-full">
                      <canvas ref={departmentDistChartRef}></canvas>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;