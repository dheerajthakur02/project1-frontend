import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getUserFullMockTestResults,
    getUserReadingResults,
    getUserSpeakingResults,
    getUserWritingResults,
    getUserListeningResults
} from "../../services/api";

const MockTestResults = ({ activeMainTab, activeSubTab, categoryFilter }) => {
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchResults();
    }, [activeMainTab, activeSubTab, categoryFilter]);

    const fetchResults = async () => {
        setLoading(true);
        // Clear previous results to avoid mixing types
        setResults([]);

        try {
            // Default to "Full Tests" if activeSubTab is null (initial load of Results tab)
            const currentTab = activeSubTab || "Full Tests";

            if (currentTab === "Full Tests") {
                const data = await getUserFullMockTestResults();
                setResults(data.data || []);
            } else if (currentTab === "Question Tests") {
                try {
                    const resultsSettled = await Promise.allSettled([
                        getUserReadingResults(),
                        getUserSpeakingResults(),
                        getUserWritingResults(),
                        getUserListeningResults()
                    ]);

                    const [rResult, sResult, wResult, lResult] = resultsSettled;

                    const rData = rResult.status === 'fulfilled' ? (rResult.value.data || []) : [];
                    const sData = sResult.status === 'fulfilled' ? (sResult.value.data || []) : [];
                    const wData = wResult.status === 'fulfilled' ? (wResult.value.data || []) : [];
                    const lData = lResult.status === 'fulfilled' ? (lResult.value.data || []) : [];

                    console.log("Raw Reading Data:", rData); // DEBUG
                    console.log("Raw Speaking Data:", sData); // DEBUG

                    const normalizeType = (type) => {
                        if (!type) return 'Unknown';
                        if (type === 'ReadingFIBDropdown') return 'FIBD';
                        if (type === 'FIBRW') return 'FIB';
                        if (type === 'ReadingFIBDragDrop') return 'FIBD'; // Drag & Drop -> FIBD
                        if (type === 'FIBD') return 'FIBD';
                        if (type === 'Reading') return 'Reading';
                        return type;
                    };

                    const combined = [
                        ...rData.map(i => {
                            const inferredModel = i.testModel || i.scores?.[0]?.questionType || 'Reading';
                            return { ...i, type: 'Reading', rawType: normalizeType(inferredModel) || 'Reading', originalModel: inferredModel };
                        }),
                        ...sData.map(i => {
                            const inferredModel = i.testModel || i.scores?.[0]?.questionType || 'Speaking';
                            return { ...i, type: 'Speaking', rawType: normalizeType(inferredModel) || 'Speaking', originalModel: inferredModel };
                        }),
                        ...wData.map(i => {
                            const inferredModel = i.testModel || i.scores?.[0]?.questionType || 'Writing';
                            return { ...i, type: 'Writing', rawType: normalizeType(inferredModel) || 'Writing', originalModel: inferredModel };
                        }),
                        ...lData.map(i => {
                            const inferredModel = i.testModel || i.scores?.[0]?.questionType || 'Listening';
                            return { ...i, type: 'Listening', rawType: normalizeType(inferredModel) || 'Listening', originalModel: inferredModel };
                        })
                    ];



                    // 1. Whitelist: Only include known Question Types
                    const VALID_QUESTION_TYPES = [
                        'RA', 'RS', 'DI', 'RL', 'SGD', 'RTS',
                        'WE', 'SWT',
                        'FIB', 'FIBD', 'RO', 'MCM', 'MCS', // Reading types (FIBD for Dropdown/DragDrop)
                        'WFD', 'SST', 'FIBL', 'HIW', 'HCS', 'SMW' // Listening types
                    ];

                    let questionTests = combined.filter(item =>
                        VALID_QUESTION_TYPES.includes(item.rawType)
                    );


                    // 2. Apply Type Filter
                    if (categoryFilter && categoryFilter !== "All" && categoryFilter !== "Q_ALL") {
                        questionTests = questionTests.filter(item => item.rawType === categoryFilter);
                    }

                    questionTests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setResults(questionTests);

                } catch (err) {
                    console.error("Error fetching question tests:", err);
                }

            } else if (currentTab === "Section Tests") {
                console.log("Fetching section tests...");
                // Existing logic for Section Tests
                try {
                    const resultsSettled = await Promise.allSettled([
                        getUserReadingResults(),
                        getUserSpeakingResults(),
                        getUserWritingResults(),
                        getUserListeningResults()
                    ]);

                    const [rResult, sResult, wResult, lResult] = resultsSettled;

                    // Log errors for rejected promises
                    if (rResult.status === 'rejected') console.error("Reading fetch failed:", rResult.reason);
                    if (sResult.status === 'rejected') console.error("Speaking fetch failed:", sResult.reason);
                    if (wResult.status === 'rejected') console.error("Writing fetch failed:", wResult.reason);
                    if (lResult.status === 'rejected') console.error("Listening fetch failed:", lResult.reason);

                    // Extract data or empty array if failed
                    const rData = rResult.status === 'fulfilled' ? (rResult.value.data || []) : [];
                    const sData = sResult.status === 'fulfilled' ? (sResult.value.data || []) : [];
                    const wData = wResult.status === 'fulfilled' ? (wResult.value.data || []) : [];
                    const lData = lResult.status === 'fulfilled' ? (lResult.value.data || []) : [];

                    console.log("Raw Responses (Settled):", { rData, sData, wData, lData });

                    const combined = [
                        ...rData.map(i => ({ ...i, type: 'Reading', rawType: i.testModel || 'Reading' })),
                        ...sData.map(i => ({ ...i, type: 'Speaking', rawType: i.testModel || 'Speaking' })),
                        ...wData.map(i => ({ ...i, type: 'Writing', rawType: i.testModel || 'Writing' })),
                        ...lData.map(i => ({ ...i, type: 'Listening', rawType: i.testModel || 'Listening' }))
                    ];

                    console.log("Combined Results (pre-filter):", combined);

                    // Filter for Section Tests (Only generic Section tests)
                    let sectionTests = combined.filter(item =>
                        item.rawType === 'Speaking' ||
                        item.rawType === 'Listening' ||
                        item.rawType === 'Reading' ||
                        item.rawType === 'Writing'
                    );

                    const normalizeType = (type) => {
                        if (!type) return 'Unknown';
                        if (type === 'ReadingFIBDropdown') return 'FIBD';
                        if (type === 'FIBRW') return 'FIB';
                        if (type === 'ReadingFIBDragDrop') return 'FIB';
                        if (type === 'Reading') return 'Reading';
                        // Add more mappings as implemented
                        return type;
                    }; console.log("Filtered Section Tests (Type Check):", sectionTests);

                    // --- Apply Category Filter ---
                    if (categoryFilter && categoryFilter !== "All") {
                        console.log("Applying category filter:", categoryFilter);
                        sectionTests = sectionTests.filter(item => item.type === categoryFilter);
                    }

                    sectionTests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    console.log("Final Results to Set:", sectionTests);
                    setResults(sectionTests);
                } catch (err) {
                    console.error("Error fetching section tests:", err);
                }
            }
        } catch (error) {
            console.error("Failed to fetch results", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to get title safely
    const getTestTitle = (item) => {
        return item.testId?.title ||
            item.testId?.name || // Fallback for Practice Questions
            item.fullMockTestId?.title ||
            item.readingId?.title ||
            item.writingId?.title ||
            item.listeningId?.title ||
            item.speakingTestId?.title ||
            "Untitled Test";
    };

    const handleViewResult = (item) => {
        const currentTab = activeSubTab || "Full Tests";
        if (currentTab === "Full Tests") {
            navigate(`/mocktest/full/result/${item._id}`);
        } else {
            // If it is a practice result (readaloud), we might want to route differently or just use section result view if compatible
            // But let's stick to standard section result for now
            navigate(`/mocktest/section/${item.type.toLowerCase()}/result/${item._id}`);
        }
    };


    if (loading) return <div className="p-8 text-center text-slate-500">Loading results...</div>;

    if (results.length === 0) return (
        <div className="p-12 text-center border rounded-xl bg-slate-50">
            <p className="text-slate-500 mb-4">No results found.</p>
            <button onClick={() => window.location.reload()} className="text-blue-600 font-semibold hover:underline">Refresh</button>
        </div>
    );

    return (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Test Name</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Type</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Date Taken</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Score</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {results.map((item) => (
                            <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {getTestTitle(item)}
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.type === 'Reading' ? 'bg-blue-100 text-blue-700' :
                                        (item.type === 'Speaking' || item.rawType === 'readaloud' || item.rawType === 'RL') ? 'bg-purple-100 text-purple-700' :
                                            item.type === 'Writing' ? 'bg-yellow-100 text-yellow-700' :
                                                item.type === 'Listening' ? 'bg-pink-100 text-pink-700' :
                                                    'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {item.rawType || "Full Mock"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-800">
                                    {item.overallScore}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleViewResult(item)}
                                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                                    >
                                        View Result
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MockTestResults;
