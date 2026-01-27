import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import feather from "feather-icons";
import { Link } from "react-router-dom";

const Home = () => {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    feather.replace();
  }, []);

  return (
    <div className="font-sans antialiased text-gray-800">

      {/* NAVBAR */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Pawan PTE</h1>

          <div className="hidden md:flex space-x-6">
            {["Home", "Courses", "About Us", "Vouchers", "Contact"].map(item => (
             <Link
                key={item}
                to={`/${item.toLowerCase().replace(/\s+/g, "")}`}
                className="text-gray-600 hover:text-indigo-600"
                >
                {item}
                </Link>

            ))}
            <a href="#" className="bg-indigo-600 text-white px-5 py-2 rounded-md">
              Enroll Now
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <div data-aos="fade-right">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Ace Your PTE Score with Pawan PTE
            </h1>
            <p className="text-lg mb-8 opacity-90">
              Learn smart, practice with AI, and score high in your PTE exam.
            </p>
            <div className="flex gap-4">
              <button className="bg-white text-indigo-600 px-6 py-3 rounded-md font-medium">
                Start Learning
              </button>
              <button className="border border-white px-6 py-3 rounded-md">
                Learn More
              </button>
            </div>
          </div>

          <img
            data-aos="fade-left"
            src="http://static.photos/education/1024x576/1"
            alt="Students"
            className="rounded-xl shadow-xl"
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            AI-Powered PTE Modules
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { title: "Speaking", icon: "mic" },
              { title: "Writing", icon: "edit" },
              { title: "Listening", icon: "headphones" },
              { title: "Reading", icon: "book" },
            ].map((item, i) => (
              <div
                key={item.title}
                data-aos="fade-up"
                data-aos-delay={i * 100}
                className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition"
              >
                <i data-feather={item.icon} className="w-8 h-8 text-indigo-600 mb-4"></i>
                <h3 className="text-xl font-semibold">{item.title} Module</h3>
                <p className="text-gray-600 mt-2">
                  AI scoring, instant feedback & analytics.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Our Courses
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Foundation", price: "$120" },
              { name: "Intensive", price: "$300" },
              { name: "Mastery", price: "$499" },
            ].map(course => (
              <div
                key={course.name}
                data-aos="fade-up"
                className="bg-white p-8 rounded-xl shadow-md"
              >
                <h3 className="text-2xl font-bold mb-4">{course.name}</h3>
                <p className="text-3xl font-bold mb-6">{course.price}/month</p>
                <button className="w-full bg-indigo-600 text-white py-3 rounded-md">
                  Enroll Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Ready to Start Your PTE Journey?
        </h2>
        <button className="bg-white text-indigo-600 px-8 py-3 rounded-md font-medium">
          Book Free Trial
        </button>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-10 text-center">
        <p>© 2025 Pawan PTE. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default Home;
