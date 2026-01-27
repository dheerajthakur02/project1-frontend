import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import FeatherIcon from 'feather-icons-react';
import { Link } from 'react-router-dom';

export const About = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <div className="font-sans antialiased text-slate-800 bg-white selection:bg-blue-100">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              PAWAN <span className="text-blue-600">PTE</span>
            </h1>
          </div>
          <div className="hidden md:flex space-x-8 items-center">
            {["Home", "Courses", "About Us", "Vouchers", "Contact"].map(item => (
              <Link key={item} to={`/${item.toLowerCase().replace(/\s+/g, "")}`} className="text-sm font-semibold text-gray-600 hover:text-blue-600">
                {item}
              </Link>
            ))}
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
              Enroll Now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Image UI Style with Blue Theme */}
      <section className="relative py-20 overflow-hidden">
        {/* Floating Headshots like the reference image */}
        <img src="https://i.pravatar.cc/150?u=1" className="absolute top-10 left-10 md:left-24 w-14 h-14 rounded-full border-4 border-white shadow-xl z-10" alt="avatar" />
        <img src="https://i.pravatar.cc/150?u=2" className="absolute top-10 right-10 md:right-24 w-14 h-14 rounded-full border-4 border-white shadow-xl z-10" alt="avatar" />
        <img src="https://i.pravatar.cc/150?u=3" className="absolute bottom-10 left-20 md:left-48 w-14 h-14 rounded-full border-4 border-white shadow-xl z-10" alt="avatar" />
        <img src="https://i.pravatar.cc/150?u=4" className="absolute bottom-10 right-20 md:right-48 w-14 h-14 rounded-full border-4 border-white shadow-xl z-10" alt="avatar" />

        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
          <div data-aos="fade-right">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-6">
              Revolutionizing <span className="text-blue-500">PTE</span> <br />
              <span className="relative inline-block">
                preparation
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-blue-500 rounded-full"></div>
              </span> <br />
              through technology
            </h1>
          </div>
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-blue-50 border border-slate-50" data-aos="fade-left">
            <p className="text-gray-500 text-base leading-relaxed mb-8">
              At Pawan PTE, our mission is to revolutionize language preparation by providing innovative, accessible, and effective tools. Pioneering AI scoring in online English exam preparation, we empower students globally with platforms for PTE, IELTS, Duolingo & CELPIP.
            </p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
              Start Free Trial
            </button>
          </div>
        </div>
      </section>

      {/* Journey Intro */}
      <section className="pt-20 pb-10 text-center px-4">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">A Journey of Empowering PTE Success</h2>
        <p className="max-w-2xl mx-auto text-gray-500 text-sm">
          Alfa PTE, born from an established Australian training school, has transformed into a leading e-learning platform. Our team of experts leverages over 15 years of industry experience.
        </p>
      </section>

      {/* --- THE TIMELINE (Wavy Dashed Style) --- */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4 relative">
          
          {/* Vertical Dashed Line Path */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-blue-200 -translate-x-1/2 hidden md:block"></div>

          <div className="space-y-24">
            <TimelineItem 
              month="December" year="2018" 
              title="The Seed is Sown" 
              desc="Pawan PTE is born with the vision of transforming language preparation through high-end AI technology." 
              align="right"
              shade="blue-400"
            />
            <TimelineItem 
              month="July" year="2019" 
              title="Launching Our Learning Platform" 
              desc="We unveil our groundbreaking learning platform, offering an array of cutting-edge resources and tools to empower students." 
              align="left"
              shade="blue-500"
            />
            <TimelineItem 
              month="August" year="2020" 
              title="1,000 Strong Community" 
              desc="We celebrate our first 1,000 registered users, marking the beginning of a supportive global learning community." 
              align="right"
              shade="blue-600"
            />
            <TimelineItem 
              month="January" year="2022" 
              title="100,000 Dreams Take Flight" 
              desc="Our user base explodes to 100,000, empowering countless individuals on their PTE journeys toward success." 
              align="left"
              shade="blue-700"
            />
            <TimelineItem 
              month="March" year="2024" 
              title="1 Million Milestones!" 
              desc="We reach an incredible milestone - 1 million registered users! Signifying the trust students place in Pawan PTE." 
              align="right"
              shade="blue-800"
            />
          </div>
        </div>
      </section>

      {/* Founder Message - Boxed Style from Image */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-slate-700 mb-12">Message from Our Founder</h2>
          
          <div className="relative p-1 bg-blue-100 rounded-[3rem]">
            <div className="bg-white p-12 md:p-16 rounded-[2.8rem] text-center border-2 border-blue-50">
              <h3 className="text-3xl font-extrabold text-blue-600 mb-8">Welcome to Pawan PTE!</h3>
              <div className="max-w-4xl mx-auto text-gray-500 leading-relaxed space-y-6 text-base">
                <p>
                  When we started Pawan PTE, our vision was clear: to empower individuals from all walks of life with the tools, knowledge, and confidence they need to succeed in their language journey. 
                </p>
                <p>
                  From our humble beginnings to building a thriving community of over 1 million learners, our mission has remained the same: to make high-quality, accessible, and innovative learning solutions available to everyone.
                </p>
                <p className="font-bold text-slate-800 pt-4">
                  Thank you for being part of our journey. Together, we're not just preparing for exams—we're shaping futures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Blue Footer */}
        {/* Simple Footer */}
       {/* Footer - Based on Chandigarh Contact */}
      <footer className="bg-slate-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="text-xl font-bold mb-6 text-blue-400">Pawan PTE</h3>
            <p className="text-gray-400 text-sm leading-relaxed">India's trusted PTE mentor guiding you to 79+ and beyond.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase text-sm tracking-widest text-blue-400">Support</h4>
            <ul className="space-y-3 text-gray-400">
              <li><a href="/vouchers" className="hover:text-white">PTE Voucher</a></li>
              <li><a href="/mock-test" className="hover:text-white">Mock Test</a></li>
              <li><a href="/contact" className="hover:text-white">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase text-sm tracking-widest text-blue-400">Contact Details</h4>
            <div className="space-y-4 text-sm text-gray-400">
              <div className="flex items-center"><FeatherIcon icon="phone" size="18" className="mr-3 text-blue-500" /> +91 8222908523</div>
              <div className="flex items-center"><FeatherIcon icon="mail" size="18" className="mr-3 text-blue-500" /> pawanpteclasses@gmail.com</div>
              <div className="flex items-center"><FeatherIcon icon="map-pin" size="18" className="mr-3 text-blue-500" /> Chandigarh, India</div>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-6 uppercase text-sm tracking-widest text-blue-400">Socials</h4>
            <div className="flex space-x-4">
              <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-blue-600 transition-all"><FeatherIcon icon="instagram" /></a>
              <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-blue-600 transition-all"><FeatherIcon icon="facebook" /></a>
              <a href="#" className="bg-white/10 p-3 rounded-full hover:bg-blue-600 transition-all"><FeatherIcon icon="youtube" /></a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-white/10 text-center text-gray-500 text-xs">
          © 2026 Pawan PTE. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

// --- Timeline Component with Circular Date Node ---
const TimelineItem = ({ month, year, title, desc, align, shade }) => {
  const isRight = align === "right";

  return (
    <div className={`relative flex flex-col md:flex-row items-center justify-between ${isRight ? 'md:flex-row-reverse' : ''}`} data-aos="fade-up">
      {/* Date Circle Node */}
      <div className="absolute left-1/2 -translate-x-1/2 z-20 hidden md:block">
        <div className={`w-20 h-20 rounded-full bg-white border-2 border-dashed border-blue-400 flex flex-col items-center justify-center shadow-lg`}>
          <span className="text-[10px] font-bold uppercase text-slate-400">{month}</span>
          <span className="text-sm font-black text-blue-600">{year}</span>
        </div>
      </div>

      {/* Content Card */}
      <div className={`w-full md:w-[42%] ${isRight ? 'text-left' : 'text-right'}`}>
        <div className={`bg-white p-8 rounded-2xl border-t-4 border-blue-500 shadow-xl shadow-blue-50 transition-all hover:-translate-y-1`}>
          <h4 className="text-lg font-bold text-slate-800 mb-2">{title}</h4>
          <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
        </div>
      </div>

      {/* Spacer */}
      <div className="hidden md:block md:w-[42%]"></div>
    </div>
  );
};