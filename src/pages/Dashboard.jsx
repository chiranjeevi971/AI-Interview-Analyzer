import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/reports");
      const data = await response.json();

      setReports(data.reports || []);
    } catch (error) {
      const localReports =
        JSON.parse(localStorage.getItem("interviewReports")) || [];

      setReports(localReports);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const deleteReport = async (reportId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this report?"
    );

    if (!confirmDelete) return;

    try {
      await fetch(`http://127.0.0.1:8000/reports/${reportId}`, {
        method: "DELETE",
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

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">
          AI Interview Analyzer
        </h1>

        <Link
          to="/"
          className="text-sm text-gray-600 hover:text-blue-600 font-medium"
        >
          Logout
        </Link>
      </nav>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back 👋
            </h2>
            <p className="text-gray-600 mt-2">
              Reports are loaded from MongoDB.
            </p>
          </div>

          <Link
            to="/setup"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 text-center"
          >
            Start New Interview
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-8 border shadow-sm">
            <p className="text-gray-600">Loading reports from MongoDB...</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-5 gap-6 mb-8">
              <StatCard title="Total Interviews" value={totalInterviews} />
              <StatCard title="Average Score" value={`${averageScore}%`} />
              <StatCard title="Best Score" value={`${bestScore}%`} />
              <StatCard
                title="Latest Confidence"
                value={`${latestConfidence}%`}
              />
              <StatCard
                title="Latest Eye Contact"
                value={`${latestEyeContact}%`}
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-xl font-bold mb-4">
                  Performance Overview
                </h3>

                {reports.length === 0 ? (
                  <p className="text-gray-600 text-sm">
                    Complete an interview to see your MongoDB saved reports.
                  </p>
                ) : (
                  <div className="space-y-5">
                    <ScoreBar label="Average Score" value={averageScore} />
                    <ScoreBar label="Best Score" value={bestScore} />
                    <ScoreBar
                      label="Latest Confidence"
                      value={latestConfidence}
                    />
                    <ScoreBar
                      label="Latest Eye Contact"
                      value={latestEyeContact}
                    />
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <h3 className="text-xl font-bold mb-4">Quick Tips</h3>

                <ul className="space-y-4 text-gray-700 text-sm">
                  <li>Speak answers in 60-90 seconds.</li>
                  <li>Use STAR method for HR questions.</li>
                  <li>Reduce filler words like um and actually.</li>
                  <li>Look near the camera to improve eye contact.</li>
                </ul>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border mt-8">
              <h3 className="text-xl font-bold mb-4">Previous Interviews</h3>

              {reports.length === 0 ? (
                <div className="border rounded-xl p-6 text-center bg-gray-50">
                  <p className="text-gray-600 mb-4">
                    No reports found in MongoDB.
                  </p>

                  <Link
                    to="/setup"
                    className="inline-block bg-blue-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-blue-700"
                  >
                    Take First Interview
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report._id || report.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border rounded-xl p-4"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {report.question || "Mock Interview"}
                        </h4>

                        <p className="text-sm text-gray-500">
                          {report.date || report.created_at} • Duration:{" "}
                          {report.duration || "00:00"}
                        </p>

                        <p className="text-sm text-gray-500">
                          Filler Words: {report.totalFillerWords ?? 0}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-blue-600">
                          Overall: {report.overallScore ?? 0}%
                        </span>

                        <span className="text-sm bg-gray-100 px-4 py-2 rounded-lg">
                          Confidence: {report.confidenceScore ?? 0}%
                        </span>

                        <span className="text-sm bg-purple-50 text-purple-700 px-4 py-2 rounded-lg">
                          Eye Contact: {report.eyeContactScore ?? 0}%
                        </span>

                        {report._id && (
                          <button
                            onClick={() => deleteReport(report._id)}
                            className="text-sm bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100"
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

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border">
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-3xl font-bold mt-2">{value}</h3>
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