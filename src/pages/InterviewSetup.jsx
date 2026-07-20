import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../config";

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

  const templates = [
    { name: "Google SWE", role: "Software Engineer", type: "Coding (DSA)", difficulty: "Hard", questions: "5" },
    { name: "Amazon SDET", role: "Software Engineer", type: "Technical", difficulty: "Medium", questions: "6" },
    { name: "Meta Frontend", role: "Frontend Developer", type: "Technical", difficulty: "Hard", questions: "5" },
  ];

  const applyTemplate = (template) => {
    setFormData((prev) => ({
      ...prev,
      role: template.role,
      type: template.type,
      difficulty: template.difficulty,
      questions: template.questions,
    }));
  };

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
      const response = await fetch(`${API_URL}/upload-resume`, {
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
      const response = await fetch(`${API_URL}/generate-questions`, {
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

      navigate(formData.type === "Coding (DSA)" ? "/coding-interview" : "/interview", {
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

      navigate(formData.type === "Coding (DSA)" ? "/coding-interview" : "/interview", {
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
    <div className="min-h-screen bg-slate-900 text-slate-100 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-float"></div>

      <nav className="glass-panel border-b-0 mx-4 mt-4 rounded-2xl px-8 py-4 flex justify-between items-center relative z-10">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Antigravity AI
        </h1>

        <Link
          to="/dashboard"
          className="text-sm text-slate-300 hover:text-cyan-400 font-medium transition-colors"
        >
          Back to Dashboard
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto p-8 relative z-10">
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold text-slate-100">
            Interview Setup
          </h2>
          <p className="text-slate-400 mt-2">
            Customize your mock interview and optionally upload your resume for
            personalized questions.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <form
            onSubmit={handleStart}
            className="lg:col-span-2 glass-panel p-8 rounded-3xl border-t-cyan-500/30 border-t-2"
          >
            <div className="mb-8">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Templates</p>
              <div className="flex flex-wrap gap-3">
                {templates.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="px-4 py-2 bg-slate-800/50 text-cyan-400 hover:bg-slate-700/50 rounded-xl text-sm font-medium border border-cyan-500/20 hover:border-cyan-500/50 transition-all"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

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
                  "Coding (DSA)",
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

            <div className="mt-8 border border-dashed border-slate-700 rounded-2xl p-6 bg-slate-800/30">
              <h3 className="font-semibold text-slate-200 mb-2">
                Upload Resume PDF
              </h3>

              <p className="text-sm text-slate-400 mb-4">
                Optional: Upload your resume to generate personalized interview
                questions from your skills and projects.
              </p>

              <input
                type="file"
                accept="application/pdf"
                onChange={handleResumeUpload}
                className="w-full glass-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20"
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
                <div className="mt-4 border border-cyan-500/20 bg-cyan-500/5 rounded-xl p-4">
                  <p className="text-sm font-medium text-cyan-400 mb-2">
                    Resume text extracted successfully
                  </p>
                  <p className="text-xs text-slate-400">
                    {resumeText.slice(0, 250)}...
                  </p>
                </div>
              )}

              {resumeError && (
                <p className="text-sm text-red-400 mt-3">{resumeError}</p>
              )}
            </div>

            <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-200 mb-2">
                Selected Interview
              </h3>

              <p className="text-sm text-cyan-400">
                {formData.role} • {formData.type} • {formData.difficulty} •{" "}
                {formData.questions} Questions • {formData.duration} Minutes
              </p>

              {resumeText && (
                <p className="text-sm text-emerald-400 mt-2 flex items-center gap-2">
                  <span>✅</span> Resume-based question generation enabled.
                </p>
              )}
            </div>

            <button
              disabled={loading || resumeLoading}
              className="mt-8 w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Generating Questions..." : "Start Interview"}
            </button>
          </form>

          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border-t-violet-500/30 border-t-2">
              <h3 className="text-xl font-bold mb-4 text-slate-100">Before You Start</h3>

              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex gap-2"><span className="text-cyan-400">🎤</span> Make sure your microphone is working.</li>
                <li className="flex gap-2"><span className="text-violet-400">🤫</span> Sit in a quiet place.</li>
                <li className="flex gap-2"><span className="text-blue-400">📷</span> Keep your camera at eye level.</li>
                <li className="flex gap-2"><span className="text-emerald-400">🗣️</span> Answer clearly and avoid rushing.</li>
              </ul>
            </div>

            <div className="glass-panel p-6 rounded-3xl border-t-emerald-500/30 border-t-2">
              <h3 className="text-xl font-bold mb-4 text-slate-100">What AI Will Analyze</h3>

              <div className="space-y-3 text-sm text-slate-400">
                <p className="flex justify-between"><span>Technical Quality</span> <span className="text-cyan-400">●●●</span></p>
                <p className="flex justify-between"><span>Communication</span> <span className="text-violet-400">●●●</span></p>
                <p className="flex justify-between"><span>Filler Words</span> <span className="text-emerald-400">●●●</span></p>
                <p className="flex justify-between"><span>Confidence</span> <span className="text-blue-400">●●●</span></p>
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
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="glass-input w-full text-slate-100"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-slate-800 text-slate-100">
            {name === "duration" ? `${option} minutes` : option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default InterviewSetup;