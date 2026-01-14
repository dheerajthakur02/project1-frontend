import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../redux/slices/authSlice"; // ✅ adjust path if needed

const MailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const SignIn = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // ✅ use name attribute to update state
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // ✅ safer than reading text then parsing manually
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Login failed");
      }

      /**
       * ✅ Expected backend response shape:
       * { user: { name: "..." , ... }, token: "..." }
       * If your response shape is different, update these two lines accordingly.
       */
      const user = data.data;
      const token = null; // Token is httpOnly cookie

      // ✅ store in redux
      dispatch(setCredentials({ user, token }));

      // ✅ optional: persist for refresh
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left Side */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-primary-50 p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-xl shadow-primary-500/20">
            &lt;
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            PTE Practice
          </h1>
          <p className="text-slate-500 text-lg max-w-md mx-auto">
            Your gateway to academic excellence.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex flex-col justify-center items-center p-8 md:p-16 lg:p-24 bg-white relative">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <span className="text-2xl font-bold text-primary-600">
              &lt; Gurully
            </span>
          </div>

          <div className="mb-10 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mx-auto mb-4 rotate-[-45deg]">
              <span className="text-2xl font-bold">&lt;</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">
              Student <span className="text-primary-600">Sign In</span>
            </h2>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <MailIcon />
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@example.com"
                  className="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>

            <div className="flex justify-end mb-8">
              <Link
                to="#"
                className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-lg shadow-lg shadow-primary-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/select-product"
              className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

