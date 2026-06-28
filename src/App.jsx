import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import InterviewSetup from "./pages/InterviewSetup.jsx";
import InterviewRoom from "./pages/InterviewRoom.jsx";
import Report from "./pages/Report.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/setup" element={<InterviewSetup />} />
      <Route path="/interview" element={<InterviewRoom />} />
      <Route path="/report" element={<Report />} />
    </Routes>
  );
}

export default App;