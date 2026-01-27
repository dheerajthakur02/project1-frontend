import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import FeatherIcon from 'feather-icons-react';
import { Link } from 'react-router-dom';

export const Contact = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <div className="font-sans antialiased text-slate-800 bg-slate-50/30">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              PAWAN <span className="text-blue-600">PTE</span>
            </h1>
          </div>

          <div className="hidden md:flex space-x-8 items-center">
            {["Home", "Courses", "About Us", "Vouchers", "Contact"].map(item => (
             <Link
                key={item}
                to={`/${item.toLowerCase().replace(/\s+/g, "")}`}
                className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors"
                >
                {item}
                </Link>
            ))}
            <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
              Enroll Now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Matched Image Pattern */}
      <section className="px-4 pt-10">
        <div className="max-w-7xl mx-auto bg-blue-600 rounded-[2rem] relative overflow-hidden py-16 md:py-24 text-center text-white shadow-2xl shadow-blue-200">
          {/* Geometric Background Shapes (Simulating the image) */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/30 rotate-45 -translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-400/20 rounded-full translate-x-10 translate-y-10"></div>
          <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-white/10 rotate-12"></div>
          
          <div className="relative z-10" data-aos="zoom-in">
            <h1 className="text-4xl md:text-5xl font-black mb-4">Get in Touch</h1>
            <p className="text-blue-100 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              Contact us for support, inquiries, or feedback. We're here to help and answer your questions.
            </p>
          </div>
        </div>
      </section>

      {/* Office Location Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Find Our <span className="text-blue-600">Office Location</span></h2>
            <p className="text-slate-500 mt-4 text-sm max-w-2xl mx-auto">
              Locate our office with ease using our detailed address, map, and directions provided for your convenience.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Address Card */}
            <div className="lg:col-span-4 bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col justify-between" data-aos="fade-right">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-5 bg-orange-100 flex items-center justify-center rounded-sm overflow-hidden">🇮🇳</div>
                  <h3 className="font-bold text-xl">India (Headquarter)</h3>
                </div>
                
                <div className="flex items-start gap-3 mb-8">
                  <FeatherIcon icon="map-pin" className="text-blue-600 mt-1" size="20" />
                  <div>
                    <h4 className="font-bold text-slate-800">Address</h4>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                      SCO 123, Sector 17, Chandigarh, <br /> Near Main Market, 160017
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h4 className="font-bold mb-4">Our <span className="text-blue-600">Branches</span></h4>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">🇮🇳 India</div>
                  
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="lg:col-span-8 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white" data-aos="fade-left">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d109741.02912911311!2d76.69348873246835!3d30.73506264436677!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390fed0be6609603%3A0x34a3df0174473d11!2sChandigarh!5e0!3m2!1sen!2sin!4v1700000000000" 
                className="w-full h-[400px] grayscale hover:grayscale-0 transition-all duration-700"
                allowFullScreen="" 
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900">Contact us</h2>
            <p className="text-slate-500 mt-4 text-sm max-w-lg mx-auto leading-relaxed">
              Stuck with study plans? Gurully's support heroes can save the day! Contact them via call, WhatsApp, or email.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ActionCard 
              icon="phone" 
              title="Call" 
              subtitle="Get support: 9 AM - 7 PM (Mon-Fri)" 
              value="(+91) 82229-08523" 
              link="tel:+918222908523"
              delay="0"
            />
            <ActionCard 
              icon="mail" 
              title="Email" 
              subtitle="Get a response within 24-48 hours" 
              value="pawanpteclasses@gmail.com" 
              link="mailto:pawanpteclasses@gmail.com"
              delay="100"
            />
            <ActionCard 
              icon="message-circle" 
              title="WhatsApp" 
              subtitle="Get support: 9 AM - 7 PM (Mon-Fri)" 
              value="(+91) 82229-08523" 
              link="https://wa.me/918222908523"
              delay="200"
            />
          </div>
        </div>
      </section>

      {/* CTA Section - Matched Image Pattern */}
      <section className="px-4 pb-20 pt-10">
        <div className="max-w-7xl mx-auto bg-blue-600 rounded-[2rem] relative overflow-hidden py-12 text-center text-white shadow-2xl shadow-blue-200">
          <div className="absolute top-0 left-0 w-32 h-full bg-blue-500/20 -skew-x-12 -translate-x-10"></div>
          <div className="absolute top-0 right-0 w-32 h-full bg-blue-700/20 skew-x-12 translate-x-10"></div>
          
          <div className="relative z-10" data-aos="zoom-in-up">
            <h2 className="text-3xl md:text-4xl font-black">Take a Free Mock Test Now!</h2>
          </div>
        </div>
      </section>

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

// --- Action Card Component ---
const ActionCard = ({ icon, title, subtitle, value, link, delay }) => (
  <div 
    className="group bg-white rounded-2xl p-10 text-center shadow-xl shadow-slate-100 border-t-4 border-blue-600 hover:-translate-y-3 transition-all duration-300 relative overflow-hidden"
    data-aos="fade-up"
    data-aos-delay={delay}
  >
    {/* Decorative background circle on hover */}
    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
    
    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
      <FeatherIcon icon={icon} size="24" />
    </div>
    
    <h3 className="text-xl font-black mb-2 text-slate-800">{title}</h3>
    <p className="text-slate-400 text-[13px] mb-4 font-medium">{subtitle}</p>
    
    <a href={link} className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
      {value}
    </a>
  </div>
);

