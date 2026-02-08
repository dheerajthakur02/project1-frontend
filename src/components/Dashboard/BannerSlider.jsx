import React, { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Layout, Loader } from 'lucide-react';
import api from '../../services/api';

const BannerSlider = () => {
    const [banners, setBanners] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await api.get('/banner/list');
                if (response.data.success) {
                    setBanners(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch banners", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length === 0) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners]);

    if (loading) {
        return (
            <div className="w-full mt-6 mb-6 min-h-[220px] flex items-center justify-center bg-slate-100 rounded-3xl animate-pulse">
                <Loader className="animate-spin text-slate-400" />
            </div>
        );
    }

    if (banners.length === 0) return null; // Don't show if no banners

    const slide = banners[currentSlide];

    return (
        <div className="w-full mt-6 mb-6">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-md group">

                {/* Image */}
                <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-[200px] object-cover"
                />

                {/* Slider Dots - Visible on hover */}
                {banners.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 p-1.5 rounded-full bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`w-2 h-2 rounded-full transition-all ${currentSlide === index ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BannerSlider;
