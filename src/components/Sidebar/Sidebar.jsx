import React from 'react';

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const steps = [
    { id: 1, label: 'Select Product', subLabel: 'Choose your exam' },
    { id: 2, label: 'Personal Details', subLabel: 'Enter your basic information' },
    { id: 3, label: 'Email Verification', subLabel: 'Verify your email' },
];

const Sidebar = ({ currentStep = 1 }) => {
    return (
        <div className="w-full md:w-80 bg-white p-8 md:min-h-screen border-r border-slate-100 flex flex-col">
            {/* Logo */}
            <div className="mb-12 flex items-center gap-2">
                <div className="w-8 h-8 text-primary-600 font-bold text-2xl">
                    {/* Simple Logo Placeholder */}
                    &lt;
                </div>
                <span className="text-2xl font-bold text-primary-700 tracking-tight">PTE Practice</span>
            </div>

            {/* Stepper */}
            <div className="flex flex-col relative">
                {steps.map((step, index) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = step.id < currentStep;
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={step.id} className="flex gap-4 relative">
                            {/* Connector Line */}
                            {!isLast && (
                                <div
                                    className={`absolute left-3.5 top-8 w-0.5 h-12 border-l-2 border-dashed ${isCompleted ? 'border-primary-500' : 'border-slate-200'}`}
                                />
                            )}

                            {/* Step Indicator */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-7 h-7 rounded flex items-center justify-center text-sm font-semibold z-10 
                    ${isActive
                                            ? 'bg-white border-2 border-primary-600 text-primary-600'
                                            : isCompleted
                                                ? 'bg-primary-600 text-white border-2 border-primary-600'
                                                : 'bg-white border-2 border-slate-300 text-slate-400'
                                        }`}
                                >
                                    {isCompleted ? <CheckIcon /> : step.id}
                                </div>
                            </div>

                            {/* Step Text */}
                            <div className={`pb-8 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                <h3 className={`font-semibold text-sm ${isActive ? 'text-primary-600' : 'text-slate-600'}`}>
                                    {step.label}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">{step.subLabel}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Sidebar;
