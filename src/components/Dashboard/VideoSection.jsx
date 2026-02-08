import React, { useEffect, useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import api from '../../services/api';

// Helper to extract YouTube Thumbnail
const getYouTubeThumbnail = (url) => {
    if (!url) return null;
    let videoId = null;

    // Handle standard watch URLs
    const match = url.match(/[?&]v=([^&]+)/);
    if (match) {
        videoId = match[1];
    }
    // Handle short URLs (youtu.be)
    else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
    // Handle embed URLs
    else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0];
    }

    if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    return null; // or a generic placeholder image
};

const VideoCard = ({ video }) => {
    const handleClick = () => {
        if (video.videoUrl) {
            window.open(video.videoUrl, '_blank');
        }
    };

    const thumbnailUrl = video.thumbnail || getYouTubeThumbnail(video.videoUrl);

    return (
        <div
            onClick={handleClick}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 flex flex-col h-full"
        >
            <div className="relative overflow-hidden aspect-video">
                <img
                    src={thumbnailUrl || "https://via.placeholder.com/640x360?text=No+Thumbnail"}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-primary-600 shadow-lg scale-90 group-hover:scale-100 transition-transform">
                        <Play fill="currentColor" size={20} className="ml-1" />
                    </div>
                </div>
                {/* Badge if needed */}
                {video.category === 'Latest Update' && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        NEW
                    </div>
                )}
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800 mb-2 line-clamp-2 text-base">
                        {video.title}
                    </h3>
                </div>

                <button className="mt-3 w-full flex items-center justify-center gap-2 font-semibold rounded-xl py-2.5 transition-colors bg-blue-50 hover:bg-blue-100 text-blue-600">
                    Watch Video
                    <ExternalLink size={16} />
                </button>
            </div>
        </div>
    );
};

const VideoSection = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                // Try fetching from API
                const { data } = await api.get('/videos/list');
                if (data.success) {
                    setVideos(data.data);
                }
            } catch (error) {
                console.log("Error fetching videos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, []);

    if (loading) return null; // Or a skeleton loader
    if (videos.length === 0) return null; // Don't show section if no videos

    return (
        <div className="mt-8">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Latest Updates</h2>
                    <p className="text-slate-500 text-sm mt-1">Stay updated with the latest PTE trends and tips</p>
                </div>
                {/* Optional "View All" button matching screenshot */}
                <button className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors">
                    View All
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map(video => (
                    <VideoCard key={video._id} video={video} />
                ))}
            </div>
        </div>
    );
};

export default VideoSection;
