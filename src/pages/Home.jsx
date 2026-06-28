import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5">
        <h1 className="text-2xl font-bold">AI Interview Analyzer</h1>

        <div className="flex gap-4">
          <Link to="/login" className="text-gray-300 hover:text-white">
            Login
          </Link>
          <Link
            to="/signup"
            className="bg-blue-600 px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center text-center px-6 py-24">
        <p className="text-blue-400 font-medium mb-4">
          AI-Powered Mock Interview Platform
        </p>

        <h2 className="text-5xl font-bold max-w-4xl leading-tight mb-6">
          Improve your interview performance with AI feedback
        </h2>

        <p className="text-gray-400 max-w-2xl text-lg mb-8">
          Practice technical and HR interviews. Get instant feedback on your
          answers, communication, filler words, confidence, and improvement
          areas.
        </p>

        <div className="flex gap-4">
          <Link
            to="/signup"
            className="bg-blue-600 px-7 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Start Practicing
          </Link>

          <Link
            to="/login"
            className="border border-gray-600 px-7 py-3 rounded-lg font-medium hover:bg-gray-800"
          >
            Login
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 px-8 pb-20 max-w-6xl mx-auto">
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h3 className="text-xl font-semibold mb-3">Technical Score</h3>
          <p className="text-gray-400">
            AI checks your answer correctness, depth, and explanation quality.
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h3 className="text-xl font-semibold mb-3">Communication Score</h3>
          <p className="text-gray-400">
            Analyze clarity, filler words, sentence structure, and confidence.
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h3 className="text-xl font-semibold mb-3">Improvement Report</h3>
          <p className="text-gray-400">
            Get personalized suggestions after every mock interview.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Home;