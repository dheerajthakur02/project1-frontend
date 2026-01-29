import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/Admin/AdminLayout';
import axios from 'axios';
import { Trash2, Plus, Image as ImageIcon, Upload } from 'lucide-react';

const ManageDescribeImage = () => {
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
            const { data } = await axios.get('http://localhost:5000/api/image/all', { withCredentials: true });
            if (data.success) {
                setQuestions(data.data);
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
            alert("Title and Image file are required");
            return;
        }

        setSubmitting(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('image', selectedFile); // Matches upload.single('image')
        formData.append('difficulty', 'Medium');

        try {
            await axios.post('http://localhost:5000/api/image/questions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            setTitle('');
            setSelectedFile(null);
            document.getElementById('image-upload').value = null;

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
            // Note: Update endpoint likely needed for delete if not present, checking controller...
            // Assuming standard CRUD, but if delete route is missing in backend, this will fail.
            // Wait, looking at routes/imageRoutes.js, DELETE route is MISSING!
            // I will implement the UI but assume DELETE relies on a route implementation I might have missed or need to add.
            // Actually, checking previous file view of imageRoutes.js, there is NO delete route. 
            // I will add the delete logic in frontend but I must add the backend route too.
            alert("Delete functionality requires backend update");
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manage Describe Image</h1>
                    <p className="text-slate-500">Upload image questions for practice</p>
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
                                    placeholder="e.g. DI-Map-01"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Image File</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer relative group">
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-blue-500 transition-colors">
                                        {selectedFile ? (
                                            <div className="w-full text-center">
                                                <p className="text-sm font-bold text-green-600 truncate px-4">{selectedFile.name}</p>
                                                <p className="text-xs text-slate-400">Click to change</p>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload size={24} />
                                                <span className="text-sm font-medium">Click to upload image</span>
                                            </>
                                        )}
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
                            <ImageIcon className="mx-auto text-slate-300 mb-2" size={40} />
                            <p className="text-slate-500 font-medium">No questions added yet</p>
                        </div>
                    ) : (
                        questions.map((q) => (
                            <div key={q._id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
                                <div className="w-full sm:w-32 h-32 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                                    <img src={q.imageUrl} alt={q.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{q.title}</h3>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase mt-1 inline-block">{q.difficulty}</span>
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        {/* <button onClick={() => handleDelete(q._id)} className="text-red-400 hover:text-red-500 flex items-center gap-1 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                                            <Trash2 size={16} /> Delete
                                        </button> */}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default ManageDescribeImage;
