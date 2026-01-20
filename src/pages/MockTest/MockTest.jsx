import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Trash2, ChevronRight } from 'lucide-react';

// Layout & Modules
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
// ... (keep all your existing module imports here)

function MockTest() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    // --- STATE ---
    const [activeMainTab, setActiveMainTab] = useState('Question Tests'); // Default to Question Tests per your image
    const [examType, setExamType] = useState('Academic'); // 'Academic' or 'Core'
    const [activeSubTab, setActiveSubTab] = useState('All');
    
    // UI state
    const [loading, setLoading] = useState(false);
    const [activeSpeechQuestion, setActiveSpeechQuestion] = useState(false);
    const [speechQuestion, setSpeechQuestion] = useState(null);

    // --- SUB-TAB CONFIGURATION ---
    const getSubTabs = () => {
        if (activeMainTab === 'Section Tests') {
            return ['All', 'Speaking', 'Writing', 'Reading', 'Listening'];
        }
        if (activeMainTab === 'Question Tests') {
            return ['All', 'RA', 'RS', 'DI', 'RL', 'SGD', 'RTS', 'WE', 'SWT', 'FIB', 'FIBD&D', 'RO', 'WFD', 'SST', 'FIB-L', 'HIW'];
        }
        return []; // Full Tests usually doesn't have sub-tabs in this UI
    };

    // --- FETCH LOGIC MAPPING ---
    // Mapping the shorthand UI codes to your existing fetch functions
    const handleSubTabClick = (tabId) => {
        setActiveSubTab(tabId);
        // Map shorthand to your fetchers
        const fetchMap = {
            'RA': fetchReadAloud,
            'RS': fetchRepeatSentences,
            'DI': fetchImageSentences,
            'RL': fetchReTellQuestion,
            'SST': fetchSummarizeSpokenText,
            'HIW': fetchHighlightIncorrectWords,
            'WE': fetchEssayQuestions,
            'SWT': fetchSummarizeWrittenText,
            // ... add others
        };
        if (fetchMap[tabId]) fetchMap[tabId]();
    };

    // --- COMPONENTS ---

    // 1. Promo Banner
    const Banner = () => (
        <div className="relative w-full h-40 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl overflow-hidden mb-8 text-white flex items-center px-12">
            <div className="z-10 space-y-2">
                <p className="text-sm font-medium bg-white/20 inline-block px-3 py-1 rounded-full">I APEUni PTE Scored Mock Test I</p>
                <h2 className="text-3xl font-bold">Real Test Experience and Scores</h2>
                <button className="bg-white text-blue-600 px-6 py-2 rounded-full font-bold text-sm mt-4">Read More &gt;</button>
            </div>
            <img src="https://via.placeholder.com/300x200" alt="banner" className="absolute right-0 bottom-0 h-full opacity-80" />
        </div>
    );

    // 2. My Tests Section
    const MyTests = () => (
        <div className="mb-10">
            <h3 className="text-lg font-bold text-slate-700 mb-4">My Tests</h3>
            <div className="space-y-3">
                {[1, 2].map((item) => (
                    <div key={item} className="bg-white p-5 rounded-2xl border flex items-center justify-between shadow-sm">
                        <div className="space-y-1">
                            <h4 className="font-bold text-slate-800 text-sm">【VIP Section Test】Listening Section Test 43B (7th Aug. new version)</h4>
                            <p className="text-xs text-slate-400">Submitted at: 2026-01-20 10:33</p>
                        </div>
                        <div className="flex gap-3 items-center">
                            <button className="p-2 text-red-400 bg-red-50 rounded-lg hover:bg-red-100 transition"><Trash2 size={18}/></button>
                            <button className="bg-[#4CC9F0] text-white px-8 py-2 rounded-xl font-bold text-sm shadow-md">Continue</button>
                        </div>
                    </div>
                ))}
                <div className="flex justify-end pt-2">
                    <button className="text-xs text-slate-400 flex items-center gap-1 font-medium">Show all tests <ChevronRight size={14}/></button>
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            {!activeSpeechQuestion ? (
                <div className="max-w-6xl mx-auto p-6">
                    <Banner />
                    <MyTests />

                    {/* Mock Tests Container */}
                    <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
                        
                          <div className="flex justify-center mb-8">
                                <div className="bg-slate-100 p-1 rounded-2xl flex w-[400px] relative overflow-hidden">
                                    <div 
                                        className={`absolute top-1 bottom-1 w-[49%] bg-[#00D1B2] rounded-xl transition-all duration-300 shadow-lg ${
                                            examType === 'Academic' ? 'left-1' : 'left-[50%]'
                                        }`}>    </div>
                                    <button 
                                        onClick={() => setExamType('Academic')}
                                        className={`flex-1 py-3 text-sm font-black z-10 transition-colors ${examType === 'Academic' ? 'text-white' : 'text-slate-400'}`}
                                    >
                                        PTE Academic / UKVI
                                    </button>
                                    <button 
                                        onClick={() => setExamType('Core')}
                                        className={`flex-1 py-3 text-sm font-black z-10 transition-colors ${examType === 'Core' ? 'text-white' : 'text-slate-400'}`}
                                    >
                                        PTE Core
                                    </button>
                                </div>
                            </div>

                        {/* 1. Main Tabs (Full / Section / Question) */}
                        <div className="flex border-b">
                            {['Full Tests', 'Section Tests', 'Question Tests'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveMainTab(tab);
                                        setActiveSubTab('All');
                                    }}
                                    className={`flex-1 py-5 text-sm font-bold transition-all relative ${
                                        activeMainTab === tab ? 'text-slate-800' : 'text-slate-400'
                                    }`}
                                >
                                    {tab}
                                    {activeMainTab === tab && (
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#00D1B2] rounded-t-full" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="p-8">
                            {/* 2. Exam Type Toggle (Academic vs Core) */}
                          

                            {/* 3. Dynamic Sub-Tabs */}
                            <div className="flex flex-wrap gap-3 mb-10">
                                {getSubTabs().map((sub) => (
                                    <button
                                        key={sub}
                                        onClick={() => handleSubTabClick(sub)}
                                        className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                                            activeSubTab === sub 
                                            ? 'bg-[#00D1B2] text-white shadow-lg scale-105' 
                                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                        }`}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>

                            {/* 4. Results / Questions List */}
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="text-center py-20 text-slate-400 animate-pulse">Fetching questions...</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Your table row mapping logic here */}
                                        <p className="text-center text-slate-300 text-sm font-medium italic">Select a category to view questions</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                renderActiveModule()
            )}
        </DashboardLayout>
    );
}

export default MockTest;