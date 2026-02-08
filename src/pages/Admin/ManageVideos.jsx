import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/Admin/AdminLayout';
import { Trash2, Video, Plus, ExternalLink, Loader } from 'lucide-react';

const ManageVideos = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        videoUrl: '',
        category: 'Speaking', // Default
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch Videos
    const fetchVideos = async () => {
        try {
            const { data } = await api.get('/videos/list');
            if (data.success) {
                setVideos(data.data);
            }
        } catch (error) {
            console.error("Error fetching videos", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    // Handle Input Change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Submit Video
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Basic YouTube Thumbnail Extraction
            let thumbnail = '';
            const videoIdMatch = formData.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^?&]+)/);
            if (videoIdMatch) {
                thumbnail = `https://img.youtube.com/vi/${videoIdMatch[1]}/hqdefault.jpg`;
            }

            console.log("Submitting video to: /api/videos/add");
            await api.post('/videos/add', {
                ...formData,
                thumbnail
            });

            setFormData({ title: '', description: '', videoUrl: '', category: 'Speaking' });
            fetchVideos(); // Refresh list
            alert('Video added successfully!');
        } catch (error) {
            console.error("Error adding video", error);
            alert('Failed to add video');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Video
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this video?")) return;
        try {
            await api.delete(`/videos/${id}`);
            setVideos(videos.filter(v => v._id !== id));
        } catch (error) {
            console.error("Failed to delete video", error);
        }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manage Videos</h1>
                    <p className="text-slate-500">Add or remove YouTube video resources</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Video Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-8">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Plus className="text-blue-600" size={20} /> Add New Video
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Video Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    placeholder="e.g. Describe Image Strategies"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">YouTube URL</label>
                                <input
                                    type="url"
                                    name="videoUrl"
                                    required
                                    placeholder="https://youtu.be/..."
                                    value={formData.videoUrl}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                >
                                    <option value="Speaking">Speaking</option>
                                    <option value="Writing">Writing</option>
                                    <option value="Reading">Reading</option>
                                    <option value="Listening">Listening</option>
                                    <option value="General">General Tips</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    placeholder="Brief description..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
                            >
                                {submitting ? <Loader className="animate-spin" /> : "Add Video Resource"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Video List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="font-bold text-slate-700 mb-4">Existing Videos ({videos.length})</h2>
                    {loading ? (
                        <div className="text-center py-10"><Loader className="animate-spin text-blue-500 mx-auto" /></div>
                    ) : videos.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
                            <Video className="mx-auto text-slate-300 mb-2" size={40} />
                            <p className="text-slate-500 font-medium">No videos added yet</p>
                        </div>
                    ) : (
                        videos.map((video) => (
                            <div key={video._id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-4 hover:shadow-md transition-shadow group">
                                <div className="w-32 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                                    {video.thumbnail ? (
                                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400"><Video size={24} /></div>
                                    )}
                                    <a href={video.videoUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ExternalLink className="text-white" size={20} />
                                    </a>
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-800 line-clamp-1">{video.title}</h3>
                                        <button onClick={() => handleDelete(video._id)} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{video.category}</span>
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{video.description}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default ManageVideos;
