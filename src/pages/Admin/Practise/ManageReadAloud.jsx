import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/Admin/AdminLayout';
import axios from 'axios';
import { Trash2, Plus, BookOpen } from 'lucide-react';


const ManageReadAloud = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        text: '',
        difficulty: 'medium'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/read-aloud');
            if (data.success) {
                setQuestions(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch questions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post('http://localhost:5000/api/read-aloud', formData, { withCredentials: true });
            setFormData({ name: '', text: '', difficulty: 'medium' });
            fetchQuestions();
            alert('Question added successfully');
        } catch (error) {
            console.error("Error adding question", error);
            alert('Failed to add question');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/read-aloud/${id}`, { withCredentials: true });
            setQuestions(questions.filter(q => q._id !== id));
        } catch (error) {
            console.error("Delete failed", error);
            alert('Failed to delete question');
        }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manage Read Aloud</h1>
                    <p className="text-slate-500">Add or remove practice questions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Question Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-8">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Plus className="text-blue-600" size={20} /> Add New Question
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Question Name/Title</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="e.g. Science & Technology 01"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Text Content</label>
                                <textarea
                                    name="text"
                                    required
                                    rows="6"
                                    placeholder="Enter the text to be read aloud..."
                                    value={formData.text}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Difficulty</label>
                                <select
                                    name="difficulty"
                                    value={formData.difficulty}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="difficult">Difficult</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? "Adding..." : "Add Question"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Question List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="font-bold text-slate-700 mb-4">Existing Questions ({questions.length})</h2>
                    {loading ? (
                        <p className="text-center text-slate-500 py-10">Loading...</p>
                    ) : questions.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
                            <BookOpen className="mx-auto text-slate-300 mb-2" size={40} />
                            <p className="text-slate-500 font-medium">No questions added yet</p>
                        </div>
                    ) : (
                        questions.map((q) => (
                            <div key={q._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-slate-800">{q.name}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">{q.difficulty}</span>
                                            <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">{q.id}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(q._id)} className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-full transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                    "{q.text}"
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default ManageReadAloud;
