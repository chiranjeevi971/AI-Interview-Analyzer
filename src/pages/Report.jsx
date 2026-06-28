import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { generatePDF } from "../utils/pdfGenerator";

function Report() {
  const location = useLocation();
  const report = location.state;
  const hasSavedRef = useRef(false);

  const aiFeedback = report?.aiFeedback;

  const technicalScore = aiFeedback?.technical_score ?? 0;
  const communicationScore = aiFeedback?.communication_score ?? 0;
  const confidenceScore =
    report?.confidenceScore ?? aiFeedback?.confidence_score ?? 0;
  const eyeContactScore = report?.eyeContactScore ?? 0;

  const overallScore = Math.round(
    (technicalScore + communicationScore + confidenceScore + eyeContactScore) / 4
  );

  const strengths = aiFeedback?.strengths || ["Complete one interview first."];
  const weaknesses = aiFeedback?.weaknesses || ["No weakness data available."];
  const suggestions =
    aiFeedback?.suggestions || ["Finish an interview to get suggestions."];

  const fullReportData = {
    ...report,
    technicalScore,
    communicationScore,
    confidenceScore,
    eyeContactScore,
    overallScore,
    strengths,
    weaknesses,
    suggestions,
    date: new Date().toLocaleString(),
  };

  useEffect(() => {
    if (!report || hasSavedRef.current) return;

    hasSavedRef.current = true;

    const saveReport = async () => {
      const token = localStorage.getItem("token");

      const newReport = {
        question: report.question,
        transcript: report.transcript,
        fillerWords: report.fillerWords,
        totalFillerWords: report.totalFillerWords,
        confidenceScore,
        eyeContactScore,
        technicalScore,
        communicationScore,
        overallScore,
        strengths,
        weaknesses,
        suggestions,
        duration: report.duration,
        date: new Date().toLocaleString(),
      };

      try {
        await fetch("http://127.0.0.1:8000/save-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newReport),
        });
      } catch (error) {
        console.log("Report save failed.");
      }
    };

    saveReport();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">
          AI Interview Analyzer
        </h1>

        <div className="flex gap-4">
          <Link
            to="/interview"
            className="text-sm text-gray-600 hover:text-blue-600 font-medium"
          >
            Practice Again
          </Link>

          <Link
            to="/dashboard"
            className="text-sm text-gray-600 hover:text-blue-600 font-medium"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Interview Report
        </h2>

        <p className="text-gray-600 mb-8">
          AI-generated performance summary based on your latest answer.
        </p>

        {!report && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
            <h3 className="font-bold text-yellow-800 mb-2">
              No interview data found
            </h3>
            <p className="text-yellow-700 text-sm">
              Please complete an interview first to generate a real report.
            </p>
          </div>
        )}

        <div className="bg-gray-900 text-white rounded-3xl p-8 mb-8">
          <p className="text-gray-400 mb-2">Overall Score</p>
          <h3 className="text-6xl font-bold mb-4">{overallScore}%</h3>
          <p className="text-gray-300">
            {overallScore >= 80
              ? "Excellent performance. Keep practicing to maintain consistency."
              : overallScore >= 60
              ? "Good performance. Focus on weak areas to improve further."
              : "Needs improvement. Practice answer structure and communication."}
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <ScoreCard title="Technical" score={technicalScore} />
          <ScoreCard title="Communication" score={communicationScore} />
          <ScoreCard title="Confidence" score={confidenceScore} />
          <ScoreCard title="Eye Contact" score={eyeContactScore} />
          <ScoreCard
            title="Filler Words"
            score={report?.totalFillerWords ?? 0}
            isCount
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="text-xl font-bold mb-5">Detailed Breakdown</h3>

              <div className="space-y-5">
                <Progress label="Technical Knowledge" value={technicalScore} />
                <Progress
                  label="Communication Clarity"
                  value={communicationScore}
                />
                <Progress label="Confidence Level" value={confidenceScore} />
                <Progress label="Eye Contact" value={eyeContactScore} />
              </div>
            </div>

            <Box title="Question Asked">
              {report?.question || "No question available."}
            </Box>

            <Box title="Your Transcript">
              {report?.transcript || "No transcript available."}
            </Box>

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="text-xl font-bold mb-5">
                Improvement Suggestions
              </h3>

              <div className="space-y-4">
                {suggestions.map((item, index) => (
                  <div
                    key={index}
                    className="border rounded-xl p-4 bg-gray-50 text-gray-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="text-xl font-bold mb-4">Filler Words</h3>

              <div className="text-5xl font-bold text-red-600 mb-2">
                {report?.totalFillerWords ?? 0}
              </div>

              {report?.fillerWords &&
              Object.keys(report.fillerWords).length > 0 ? (
                Object.entries(report.fillerWords).map(([word, count]) => (
                  <p key={word} className="text-sm text-gray-700">
                    {word}: {count}
                  </p>
                ))
              ) : (
                <p className="text-sm text-gray-700">
                  No filler words detected.
                </p>
              )}
            </div>

            <List title="Strengths" items={strengths} prefix="✓" />
            <List title="Weaknesses" items={weaknesses} prefix="•" />

            <button
              onClick={() => generatePDF(fullReportData)}
              disabled={!report}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-400"
            >
              Download PDF Report
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}

function ScoreCard({ title, score, isCount }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-3xl font-bold mt-2">
        {score}
        {!isCount && "%"}
      </h3>
    </div>
  );
}

function Progress({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
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

function Box({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="text-gray-700 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function List({ title, items, prefix }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>

      <ul className="space-y-3 text-sm text-gray-700">
        {items.map((item, index) => (
          <li key={index}>
            {prefix} {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Report;