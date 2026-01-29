import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/Admin/AdminLayout';
import axios from 'axios';
import { Trash2, Plus, Volume2, Upload } from 'lucide-react';

const ManageRepeatSentence = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            // Note: Adjust endpoint if needed based on backend routes
            const { data } = await axios.get('http://localhost:5000/api/repeat-sentence/all', { withCredentials: true });
            // The controller returns { success: true, data: [...] } usually
            if (data.success) {
                setQuestions(data.data);
            } else {
                // Fallback if structure is different (based on controller inspection)
                setQuestions(data);
            }
        } catch (error) {
            console.error("Failed to fetch questions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile || !title) {
            alert("Title and Audio file are required");
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('audio', selectedFile);
        formData.append('prepareTime', 3); // Default
        formData.append('answerTime', 15); // Default

        try {
            await axios.post('http://localhost:5000/api/repeat-sentence/add', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            setTitle('');
            setSelectedFile(null);
            // Reset file input manually if needed
            document.getElementById('audio-upload').value = null;

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
            await axios.delete(`http://localhost:5000/api/repeat-sentence/${id}`, { withCredentials: true });
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
                    <h1 className="text-2xl font-bold text-slate-800">Manage Repeat Sentence</h1>
                    <p className="text-slate-500">Upload audio questions for practice</p>
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
                                <label className="block text-sm font-bold text-slate-700 mb-1">Question Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. RS-001"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Audio File</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer relative">
                                    <input
                                        id="audio-upload"
                                        type="file"
                                        accept="audio/*,video/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-slate-500">
                                        <Upload size={24} />
                                        <span className="text-sm font-medium">
                                            {selectedFile ? selectedFile.name : "Click to upload audio"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? "Uploading..." : "Add Question"}
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
                            <Volume2 className="mx-auto text-slate-300 mb-2" size={40} />
                            <p className="text-slate-500 font-medium">No questions added yet</p>
                        </div>
                    ) : (
                        questions.map((q) => (
                            <div key={q._id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Volume2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{q.title}</h3>
                                        {/* Audio Player Preview */}
                                        <audio controls src={q.audioUrl} className="h-8 mt-2 w-64" />
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(q._id)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default ManageRepeatSentence;
