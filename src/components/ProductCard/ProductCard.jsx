import React from 'react';

const ProductCard = ({ title, subTitle, isSelected, onClick, colorTheme = 'blue' }) => {
    // Simple color mapping approach
    const themes = {
        blue: { bg: 'bg-primary-50', border: 'border-primary-200', circle: 'border-primary-500' },
        purple: { bg: 'bg-indigo-50', border: 'border-indigo-200', circle: 'border-indigo-500' },
        red: { bg: 'bg-rose-50', border: 'border-rose-200', circle: 'border-rose-500' },
        yellow: { bg: 'bg-amber-50', border: 'border-amber-200', circle: 'border-amber-500' },
        beige: { bg: 'bg-orange-50', border: 'border-orange-200', circle: 'border-orange-500' },
    };

    const theme = themes[colorTheme] || themes.blue;

    return (
        <div
            onClick={onClick}
            className={`relative cursor-pointer rounded-xl p-6 transition-all duration-200 border
        ${isSelected ? 'ring-2 ring-primary-500 shadow-lg' : 'hover:shadow-md'}
        ${theme.bg} ${isSelected ? 'border-primary-500' : theme.border}
      `}
        >
            <div className="flex items-start gap-4">
                {/* Radio Circle */}
                <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white ${isSelected ? 'border-primary-500' : theme.circle}`}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-sm leading-tight uppercase tracking-wide">
                        {title}
                    </h3>
                    {subTitle && (
                        <p className="text-slate-800 font-medium text-sm mt-1 uppercase tracking-wide">{subTitle}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
