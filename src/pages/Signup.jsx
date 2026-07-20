import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const result = await signup(
        formData.name,
        formData.email,
        formData.password
      );

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message || "Signup failed.");
      }
    } catch (err) {
      setError("Unable to connect to the server.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex justify-center items-center px-6 overflow-hidden">
      <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-violet-600/20 blur-[120px] rounded-full animate-float"></div>
      <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="glass-panel w-full max-w-md rounded-3xl p-8 relative z-10 border-t-violet-500/30 border-t-2">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-100">Create Account</h1>
          <p className="text-slate-400 mt-2">
            Sign up to start practicing interviews with AI feedback.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium text-slate-300">Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              className="glass-input w-full text-white"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-slate-300">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="glass-input w-full text-white"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-slate-300">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              className="glass-input w-full text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 font-semibold text-lg mt-2"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-slate-400">Already have an account? <Link to="/login" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">Login</Link></p>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-slate-500 hover:text-cyan-400 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;