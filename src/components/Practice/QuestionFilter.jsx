import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react';

const QuestionFilter = ({ filters, onFilterChange, onReset }) => {
    const [openDropdown, setOpenDropdown] = useState(null);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = (key) => {
        setOpenDropdown(openDropdown === key ? null : key);
    };

    const handleSelect = (key, value) => {
        // Special handling for Prediction boolean mapping
        if (key === 'prediction') {
            onFilterChange(key, value === 'Prediction Only');
        } else {
            onFilterChange(key, value);
        }
        setOpenDropdown(null);
    };

    const options = {
        Prediction: ['All', 'Prediction Only'],
        Difficulty: ['All', 'Easy', 'Medium', 'Hard'],
        Status: ['All', 'Practiced', 'Not Practiced']
    };

    return (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center gap-4" ref={dropdownRef}>
            <div className="flex items-center gap-2 text-slate-500 border-r border-slate-200 pr-4">
                <SlidersHorizontal size={18} />
                <span className="font-semibold text-sm">Filters</span>
            </div>

            {Object.keys(options).map((key) => {
                const valueKey = key.toLowerCase(); // prediction, difficulty, status

                let displayValue = filters[valueKey];
                if (valueKey === 'prediction') {
                    displayValue = filters[valueKey] ? 'Prediction Only' : 'All';
                }

                return (
                    <div key={key} className="relative">
                        <button
                            onClick={() => toggleDropdown(key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${displayValue !== 'All'
                                ? 'bg-primary-50 text-primary-700 border-primary-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                        >
                            <span className="text-slate-500">{key}:</span>
                            <span className="font-bold">
                                {displayValue}
                            </span>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${openDropdown === key ? 'rotate-180' : ''}`} />
                        </button>

                        {openDropdown === key && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {options[key].map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => handleSelect(valueKey, option)}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-between ${displayValue === option
                                            ? 'text-primary-600 bg-primary-50'
                                            : 'text-slate-600'
                                            }`}
                                    >
                                        {option}
                                        {(displayValue === option) && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary-600"></span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            <div className="flex-1"></div>

            {(filters.prediction || filters.difficulty !== 'All' || filters.status !== 'All') && (
                <button
                    onClick={onReset}
                    className="flex items-center gap-1.5 text-red-500 text-sm font-semibold hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <RotateCcw size={14} />
                    Reset Filter
                </button>
            )}
        </div>
    );
};

export default QuestionFilter;
