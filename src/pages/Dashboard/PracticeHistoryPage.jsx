import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import PracticedHistory from '../../components/Dashboard/PracticedHistory';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PracticeHistoryPage = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Reusing dashboard data endpoint since it aggregates everything we need
                const { data } = await api.get('/dashboard/data');
                if (data.success) {
                    setHistory(data.data.history);
                }
            } catch (error) {
                console.error("Failed to fetch history", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 font-bold"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <h1 className="text-2xl font-bold text-slate-800 mb-6">Full Practice History</h1>

                {loading ? (
                    <div className="text-center py-20 text-slate-400">Loading history...</div>
                ) : (
                    <div className="min-h-[600px]">
                        {/* Render history with NO limit */}
                        <PracticedHistory history={history} limit={0} />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PracticeHistoryPage;
