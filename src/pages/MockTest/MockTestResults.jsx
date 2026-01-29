import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getUserFullMockTestResults,
    getUserReadingResults,
    getUserSpeakingResults,
    getUserWritingResults,
    getUserListeningResults
} from "../../services/api";

const MockTestResults = ({ activeMainTab, activeSubTab }) => {
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchResults();
    }, [activeMainTab, activeSubTab]);

    const fetchResults = async () => {
        setLoading(true);
        try {
            // Default to "Full Tests" if activeSubTab is null (initial load of Results tab)
            const currentTab = activeSubTab || "Full Tests";

            if (currentTab === "Full Tests") {
                const data = await getUserFullMockTestResults();
                setResults(data.data || []);
            } else if (currentTab === "Question Tests") {
                // Fetch ALL results but filter/identify them as Question Tests?
                // Actually, due to our backend change, we can fetch all speaking/listening/reading/writing results.
                // The ones with `testModel` as 'RS', 'DI', 'FIBL', etc. are question tests.
                // The ones with `testModel` as 'Speaking' or 'Listening' are Section tests.
                // Note: The backend endpoints return `SpeakingResult` documents.

                const [r, s, w, l] = await Promise.all([
                    getUserReadingResults(),
                    getUserSpeakingResults(),
                    getUserWritingResults(),
                    getUserListeningResults()
                ]);

                const combined = [
                    ...(r.data || []).map(i => ({ ...i, type: 'Reading', rawType: i.testModel || 'Reading' })),
                    ...(s.data || []).map(i => ({ ...i, type: 'Speaking', rawType: i.testModel || 'Speaking' })),
                    ...(w.data || []).map(i => ({ ...i, type: 'Writing', rawType: i.testModel || 'Writing' })),
                    ...(l.data || []).map(i => ({ ...i, type: 'Listening', rawType: i.testModel || 'Listening' }))
                ];

                // Filter for Question Tests (exclude generic Section tests)
                // Section tests usually have testModel = 'Speaking', 'Listening', etc.
                // Question tests have 'RS', 'DI', 'FIBL', etc.
                const questionTests = combined.filter(item =>
                    item.rawType !== 'Speaking' &&
                    item.rawType !== 'Listening' &&
                    item.rawType !== 'Reading' &&
                    item.rawType !== 'Writing'
                );

                questionTests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setResults(questionTests);

            } else if (currentTab === "Section Tests") {
                // Existing logic for Section Tests
                const [r, s, w, l] = await Promise.all([
                    getUserReadingResults(),
                    getUserSpeakingResults(),
                    getUserWritingResults(),
                    getUserListeningResults()
                ]);
                const combined = [
                    ...(r.data || []).map(i => ({ ...i, type: 'Reading', rawType: i.testModel || 'Reading' })),
                    ...(s.data || []).map(i => ({ ...i, type: 'Speaking', rawType: i.testModel || 'Speaking' })),
                    ...(w.data || []).map(i => ({ ...i, type: 'Writing', rawType: i.testModel || 'Writing' })),
                    ...(l.data || []).map(i => ({ ...i, type: 'Listening', rawType: i.testModel || 'Listening' }))
                ];

                // Filter for Section Tests (Only generic Section tests)
                const sectionTests = combined.filter(item =>
                    item.rawType === 'Speaking' ||
                    item.rawType === 'Listening' ||
                    item.rawType === 'Reading' ||
                    item.rawType === 'Writing'
                );

                sectionTests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setResults(sectionTests);
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
                                                    'bg-emerald-100 text-emerald-700' // Full Test
                                        }`}>
                                        {item.type || "Full Mock"}
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
