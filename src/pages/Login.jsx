import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
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

    if (!formData.email || !formData.password) {
      setError("Please enter email and password.");
      setLoading(false);
      return;
    }

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message || "Login failed.");
      }
    } catch (err) {
      setError("Unable to connect to the server.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex justify-center items-center px-6 overflow-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full animate-float"></div>
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-violet-600/20 blur-[120px] rounded-full animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="glass-panel w-full max-w-md rounded-3xl p-8 relative z-10 border-t-cyan-500/30 border-t-2">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-100">Welcome Back</h1>
          <p className="text-slate-400 mt-2">
            Login to continue your interview practice.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="Enter your password"
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-slate-400">Don't have an account? <Link to="/signup" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">Create Account</Link></p>
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

export default Login;