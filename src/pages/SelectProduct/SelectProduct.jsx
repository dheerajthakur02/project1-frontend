import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../../components/ProductCard/ProductCard';

const products = [
    { id: 'pte-academic', title: 'PTE', subTitle: 'Academic', theme: 'blue' },
    { id: 'pte-core', title: 'PTE', subTitle: 'Core', theme: 'blue' },
    { id: 'ielts-academic', title: 'IELTS', subTitle: 'Academic', theme: 'red' },
    { id: 'ielts-general', title: 'IELTS', subTitle: 'General', theme: 'red' },
    { id: 'duolingo', title: 'Dueolingo', subTitle: '', theme: 'yellow' },
    { id: 'celpip-general', title: 'CELPIP', subTitle: 'General', theme: 'beige' },
    { id: 'celpip-general-ls', title: 'CELPIP', subTitle: 'General-LS', theme: 'beige' },
];

const SelectProduct = () => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const navigate = useNavigate();

    const handleNext = () => {
        if (selectedProduct) {
            console.log('Proceeding with:', selectedProduct);
            navigate('/personal-details', { state: { selectedProduct } });
        }
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col items-center pt-8">
            {/* Page Header */}
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Select <span className="text-primary-600">Product</span>
                </h1>
                <p className="text-slate-500">Choose your exam</p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-4xl px-4">
                {products.map((product) => (
                    <div key={product.id} className={`${['duolingo'].includes(product.id) ? 'lg:col-span-2' : ''} flex justify-center`}>
                        {/* Note: Duolingo seems to span in the image or is just placed centrally. 
                 The image shows 4 items in top row, 3 in bottom row centered.
                 Flex wrap centering might differ.
                 I'll use a simple flex wrap layout for better centering.
             */}
                    </div>
                ))}
            </div>

            {/* Revised Grid using Flexbox for centering connection to image */}
            <div className="flex flex-wrap justify-center gap-6 w-full max-w-5xl px-4 mb-12">
                {products.map((product) => (
                    <div key={product.id} className="w-full md:w-[220px]">
                        <ProductCard
                            title={product.title}
                            subTitle={product.subTitle}
                            colorTheme={product.theme}
                            isSelected={selectedProduct === product.id}
                            onClick={() => setSelectedProduct(product.id)}
                        />
                    </div>
                ))}
            </div>

            {/* Footer Actions */}
            <div className="mt-8 flex flex-col items-center">
                <button
                    onClick={handleNext}
                    className="btn-primary min-w-[200px]"
                >
                    Next
                </button>

                <div className="mt-6 text-sm text-slate-500">
                    Already have an account? <Link to="/signin" className="font-semibold text-primary-600 hover:underline">Sign in</Link>
                </div>
                <div className="mt-2 text-xs text-slate-400 text-center max-w-xs">
                    By creating this account, you agree to our <a href="#" className="text-primary-600">privacy policy</a> and <a href="#" className="text-primary-600">terms of use</a>.
                </div>
            </div>
        </div>
    );
};

export default SelectProduct;
