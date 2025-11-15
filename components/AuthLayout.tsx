import React from 'react';

const AuthLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8 flex items-center justify-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1m0-1V4m0 2.01V5M12 20v-1m0 1v.01M12 18v-1m0-1v-1m0-1v-1m0-1V9m1.401-1.401L12 6.182m-1.401 1.417L12 9.414m1.401 7.185L12 15.182m-1.401 1.417L12 17.414M6 12H4m2 0h.01M18 12h2m-2 0h-.01M7 15l-1.5 1.5M17 15l1.5 1.5M7 9l-1.5-1.5M17 9l1.5-1.5"/>
            </svg>
            <h1 className="text-3xl font-bold text-gray-800">SalaryApp</h1>
        </div>
        <div className="bg-white rounded-xl shadow-2xl p-8 transform transition-all hover:scale-[1.01]">
            <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">{title}</h2>
            {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
