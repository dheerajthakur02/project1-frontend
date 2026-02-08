import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/Admin/AdminLayout';
import api from '../../services/api';
import { Trash2, Upload, Plus } from 'lucide-react';

const ManageBanners = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [title, setTitle] = useState('');

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const { data } = await api.get('/banner/list');
            if (data.success) {
                setBanners(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch banners", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile || !title) {
            alert("Please select a file and enter a title");
            return;
        }
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('title', title);

        try {
            await api.post('/banner/create', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            fetchBanners();
            setSelectedFile(null);
            setTitle(''); // Reset title
            alert('Banner uploaded successfully');
        } catch (error) {
            console.error("Upload failed", error);
            alert('Upload failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/banner/${id}`);
            setBanners(banners.filter(b => b._id !== id));
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    return (
        <AdminLayout>
            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-slate-800">Manage Banners</h2>
                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Banner Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input type="file" onChange={handleFileChange} className="border p-2 rounded-lg" />
                        <button onClick={handleUpload} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                            <Upload size={18} /> Upload
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {banners.map((banner) => (
                            <div key={banner._id} className="relative group rounded-xl overflow-hidden shadow-md">
                                <img src={banner.image} alt={banner.title} className="w-full h-40 object-cover" />
                                <div className="absolute bottom-0 left-0 w-full bg-black/50 p-2 text-white text-sm font-bold truncate">
                                    {banner.title}
                                </div>
                                <button
                                    onClick={() => handleDelete(banner._id)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default ManageBanners;
