import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (email === "" || password === "") {
      alert("Please fill all fields");
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-2 text-center">Welcome Back</h2>

        <p className="text-gray-500 text-center mb-6">
          Login to continue your interview practice
        </p>

        <input
          type="email"
          placeholder="Email address"
          className="w-full border border-gray-300 p-3 rounded-lg mb-4 outline-none focus:border-blue-600"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border border-gray-300 p-3 rounded-lg mb-4 outline-none focus:border-blue-600"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
          Login
        </button>

        <p className="text-center mt-5 text-sm text-gray-600">
          New user?{" "}
          <Link to="/signup" className="text-blue-600 font-medium">
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;