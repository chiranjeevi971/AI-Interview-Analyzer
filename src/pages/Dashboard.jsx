import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const deleteReport = async (reportId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this report?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      await fetch(`${API_URL}/reports/${reportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setReports((prevReports) =>
        prevReports.filter((report) => report._id !== reportId)
      );
    } catch (error) {
      alert("Failed to delete report. Please try again.");
    }
  };

  const totalInterviews = reports.length;

  const averageScore =
    totalInterviews > 0
      ? Math.round(
          reports.reduce((sum, report) => sum + (report.overallScore || 0), 0) /
            totalInterviews
        )
      : 0;

  const bestScore =
    totalInterviews > 0
      ? Math.max(...reports.map((report) => report.overallScore || 0))
      : 0;

  const latestConfidence =
    totalInterviews > 0 ? reports[0].confidenceScore ?? 0 : 0;

  const latestEyeContact =
    totalInterviews > 0 ? reports[0].eyeContactScore ?? 0 : 0;

  const latestSpeakingAnalytics =
    totalInterviews > 0 ? reports[0].speakingAnalytics || {} : {};

  const latestWPM = latestSpeakingAnalytics.words_per_minute ?? 0;
  const latestSpeakingPace =
    latestSpeakingAnalytics.speaking_pace ?? "Pending";

  const chartData = [...reports].reverse().map((r, index) => ({
    name: `Int ${index + 1}`,
    Score: r.overallScore || 0,
    Tech: r.technicalScore || 0,
    Comm: r.communicationScore || 0,
  }));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-violet-600/10 blur-[120px] rounded-full animate-float"></div>
      
      <nav className="glass-panel border-b-0 mx-4 mt-4 rounded-2xl px-8 py-4 flex justify-between items-center relative z-10">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Antigravity AI Dashboard
        </h1>

        <button
          onClick={handleLogout}
          className="text-sm text-slate-300 hover:text-cyan-400 font-medium transition-colors"
        >
          Logout
        </button>
      </nav>

      <main className="p-8 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-100">
              Welcome back 👋
            </h2>
            <p className="text-slate-400 mt-2">
              Your private interview reports are loaded securely.
            </p>
          </div>

          <Link
            to="/setup"
            className="btn-primary px-8 py-3 rounded-xl font-medium text-center"
          >
            Start New Interview
          </Link>
        </div>

        {loading ? (
          <div className="glass-panel rounded-2xl p-8 text-center border-t-cyan-500/30 border-t-2">
            <p className="text-cyan-400 animate-pulse font-medium">Loading your AI reports...</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-6 gap-6 mb-10">
              <StatCard title="Total Interviews" value={totalInterviews} borderColor="border-blue-500/30" />
              <StatCard title="Average Score" value={`${averageScore}%`} borderColor="border-cyan-500/30" />
              <StatCard title="Best Score" value={`${bestScore}%`} borderColor="border-emerald-500/30" />
              <StatCard
                title="Latest Confidence"
                value={`${latestConfidence}%`}
                borderColor="border-violet-500/30"
              />
              <StatCard
                title="Latest Eye Contact"
                value={`${latestEyeContact}%`}
                borderColor="border-indigo-500/30"
              />
              <StatCard title="Latest WPM" value={latestWPM} borderColor="border-fuchsia-500/30" />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-panel p-8 rounded-3xl border-t-blue-500/30 border-t-2">
                <h3 className="text-xl font-bold mb-6 text-slate-100">
                  Performance Overview
                </h3>

                {reports.length === 0 ? (
                  <p className="text-slate-400 text-sm">
                    Complete an interview to see your progress chart.
                  </p>
                ) : (
                  <div className="h-80 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#1e293b", borderRadius: "12px", border: "1px solid #334155", color: "#f8fafc", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                        <Line type="monotone" dataKey="Score" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: "#0ea5e9" }} activeDot={{ r: 6, fill: "#fff" }} />
                        <Line type="monotone" dataKey="Tech" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} />
                        <Line type="monotone" dataKey="Comm" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: "#8b5cf6" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="glass-panel p-8 rounded-3xl border-t-violet-500/30 border-t-2">
                <h3 className="text-xl font-bold mb-6 text-slate-100">Quick Tips</h3>

                <ul className="space-y-4 text-slate-400 text-sm">
                  <li className="flex gap-3"><span className="text-cyan-400">⚡</span> Speak answers in 60-90 seconds.</li>
                  <li className="flex gap-3"><span className="text-violet-400">⭐</span> Use STAR method for HR questions.</li>
                  <li className="flex gap-3"><span className="text-emerald-400">🎙️</span> Reduce filler words like um and actually.</li>
                  <li className="flex gap-3"><span className="text-blue-400">👁️</span> Look near the camera to improve eye contact.</li>
                </ul>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl mt-10 border-t-cyan-500/30 border-t-2">
              <h3 className="text-2xl font-bold mb-6 text-slate-100">Previous Interviews</h3>

              {reports.length === 0 ? (
                <div className="border border-slate-700/50 rounded-2xl p-8 text-center bg-slate-800/20">
                  <p className="text-slate-400 mb-6 text-lg">
                    No private reports found.
                  </p>

                  <Link
                    to="/setup"
                    className="btn-primary inline-block px-6 py-3"
                  >
                    Take First Interview
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report._id || report.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors rounded-2xl p-5"
                    >
                      <div>
                        <h4 className="font-bold text-slate-100 text-lg">
                          {report.question || "Mock Interview"}
                        </h4>

                        <p className="text-sm text-slate-400 mt-1">
                          {report.date || report.created_at} • Duration:{" "}
                          {report.duration || "00:00"}
                        </p>

                        <div className="flex gap-4 mt-2 text-sm text-slate-400">
                          <p>Filler Words: <span className="text-rose-400 font-medium">{report.totalFillerWords ?? 0}</span></p>
                          <p>WPM: <span className="text-cyan-400 font-medium">{report.speakingAnalytics?.words_per_minute ?? 0}</span></p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-cyan-400 bg-cyan-900/30 border border-cyan-500/20 px-4 py-2 rounded-xl">
                          Score: {report.overallScore ?? 0}%
                        </span>

                        <span className="text-sm font-medium text-violet-400 bg-violet-900/30 border border-violet-500/20 px-4 py-2 rounded-xl">
                          Confidence: {report.confidenceScore ?? 0}%
                        </span>

                        <button
                          onClick={() => navigate("/report", { state: { ...report, isSavedFromDb: true } })}
                          className="text-sm btn-primary px-4 py-2"
                        >
                          View Report
                        </button>

                        {report._id && (
                          <button
                            onClick={() => deleteReport(report._id)}
                            className="text-sm btn-danger px-4 py-2"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, borderColor = "border-slate-700/50" }) {
  return (
    <div className={`glass-panel p-6 rounded-3xl border-t-2 ${borderColor} hover:-translate-y-1 transition-transform duration-300`}>
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      <h3 className="text-3xl font-bold mt-3 text-slate-100">{value}</h3>
    </div>
  );
}

function ScoreBar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between mb-2 text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>

      <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
        <div
          className="bg-blue-600 h-full rounded-full"
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}

export default Dashboard;