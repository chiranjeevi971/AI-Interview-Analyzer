import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function InterviewSetup() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeError, setResumeError] = useState("");

  const [formData, setFormData] = useState({
    role: "Software Engineer",
    type: "Technical",
    difficulty: "Medium",
    questions: "5",
    duration: "30",
    language: "English",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setResumeError("Please upload only a PDF resume.");
      return;
    }

    setResumeLoading(true);
    setResumeError("");
    setResumeText("");
    setResumeFileName(file.name);

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload-resume", {
        method: "POST",
        body: uploadData,
      });

      if (!response.ok) {
        throw new Error("Resume upload failed");
      }

      const data = await response.json();

      setResumeText(data.resume_text || "");
    } catch (error) {
      setResumeError("Failed to upload or extract resume text.");
    } finally {
      setResumeLoading(false);
    }
  };

  const handleStart = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          resume_text: resumeText,
        }),
      });

      const data = await response.json();

      navigate("/interview", {
        state: {
          questions: data.questions,
          setup: formData,
          resumeText,
        },
      });
    } catch (error) {
      const fallbackQuestions = [
        "Tell me about yourself.",
        "Explain one project from your resume.",
        "What are your strengths?",
        "Why should we hire you?",
        "Where do you see yourself in five years?",
      ];

      navigate("/interview", {
        state: {
          questions: fallbackQuestions,
          setup: formData,
          resumeText,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">
          AI Interview Analyzer
        </h1>

        <Link
          to="/dashboard"
          className="text-sm text-gray-600 hover:text-blue-600 font-medium"
        >
          Back to Dashboard
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Interview Setup
          </h2>
          <p className="text-gray-600 mt-2">
            Customize your mock interview and optionally upload your resume for
            personalized questions.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <form
            onSubmit={handleStart}
            className="lg:col-span-2 bg-white rounded-2xl shadow-sm border p-8"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <InputSelect
                label="Select Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                options={[
                  "Software Engineer",
                  "Frontend Developer",
                  "Backend Developer",
                  "AI/ML Engineer",
                  "Data Analyst",
                  "Technical Consulting Engineer",
                  "Network Engineer",
                ]}
              />

              <InputSelect
                label="Interview Type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                options={[
                  "Technical",
                  "HR",
                  "Mixed",
                  "Project Based",
                  "Communication Round",
                ]}
              />

              <InputSelect
                label="Difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                options={["Easy", "Medium", "Hard"]}
              />

              <InputSelect
                label="Number of Questions"
                name="questions"
                value={formData.questions}
                onChange={handleChange}
                options={["3", "5", "7", "10"]}
              />

              <InputSelect
                label="Duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                options={["15", "30", "45", "60"]}
              />

              <InputSelect
                label="Language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                options={["English", "Hindi", "Telugu"]}
              />
            </div>

            <div className="mt-8 border border-dashed border-gray-300 rounded-2xl p-6 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">
                Upload Resume PDF
              </h3>

              <p className="text-sm text-gray-600 mb-4">
                Optional: Upload your resume to generate personalized interview
                questions from your skills and projects.
              </p>

              <input
                type="file"
                accept="application/pdf"
                onChange={handleResumeUpload}
                className="w-full border border-gray-300 rounded-xl p-3 bg-white"
              />

              {resumeLoading && (
                <p className="text-sm text-blue-600 mt-3">
                  Extracting resume text...
                </p>
              )}

              {resumeFileName && !resumeLoading && !resumeError && (
                <p className="text-sm text-green-600 mt-3">
                  Uploaded: {resumeFileName}
                </p>
              )}

              {resumeText && (
                <div className="mt-4 bg-white border rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Resume text extracted successfully
                  </p>
                  <p className="text-xs text-gray-500">
                    {resumeText.slice(0, 250)}...
                  </p>
                </div>
              )}

              {resumeError && (
                <p className="text-sm text-red-600 mt-3">{resumeError}</p>
              )}
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <h3 className="font-semibold text-blue-900 mb-2">
                Selected Interview
              </h3>

              <p className="text-sm text-blue-800">
                {formData.role} • {formData.type} • {formData.difficulty} •{" "}
                {formData.questions} Questions • {formData.duration} Minutes
              </p>

              {resumeText && (
                <p className="text-sm text-blue-800 mt-2">
                  Resume-based question generation enabled.
                </p>
              )}
            </div>

            <button
              disabled={loading || resumeLoading}
              className="mt-8 w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Generating Questions..." : "Start Interview"}
            </button>
          </form>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="text-xl font-bold mb-4">Before You Start</h3>

              <ul className="space-y-3 text-sm text-gray-700">
                <li>Make sure your microphone is working.</li>
                <li>Sit in a quiet place.</li>
                <li>Keep your camera at eye level.</li>
                <li>Answer clearly and avoid rushing.</li>
                <li>Try to explain with examples.</li>
              </ul>
            </div>

            <div className="bg-gray-900 text-white rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-3">What AI Will Analyze</h3>

              <div className="space-y-3 text-sm text-gray-300">
                <p>Technical answer quality</p>
                <p>Communication clarity</p>
                <p>Filler words</p>
                <p>Confidence level</p>
                <p>Resume-based relevance</p>
                <p>Improvement suggestions</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InputSelect({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-blue-600"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {name === "duration" ? `${option} minutes` : option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default InterviewSetup;