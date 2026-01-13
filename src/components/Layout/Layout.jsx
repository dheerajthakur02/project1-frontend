import React from 'react';
import Sidebar from '../Sidebar/Sidebar';

const Layout = ({ children, currentStep = 1 }) => {
    return (
        <div className="flex bg-slate-50 min-h-screen font-sans">
            <Sidebar currentStep={currentStep} />
            <main className="flex-1 flex flex-col">
                {/* Header/Top Bar placeholder if needed, usually empty in this design */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
