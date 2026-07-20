import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 overflow-hidden relative">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full animate-float"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/20 blur-[120px] rounded-full animate-float" style={{ animationDelay: '3s' }}></div>

      <nav className="flex items-center justify-between px-8 py-6 relative z-10 glass-panel border-b-0 mx-4 mt-4 rounded-2xl">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Antigravity AI
        </h1>

        <div className="flex gap-4 items-center">
          <Link to="/login" className="text-slate-300 hover:text-cyan-400 font-medium transition-colors">
            Login
          </Link>
          <Link
            to="/signup"
            className="btn-primary px-6 py-2"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center text-center px-6 py-32 relative z-10">
        <div className="inline-block px-4 py-1.5 rounded-full glass-panel border-cyan-500/30 text-cyan-300 font-medium text-sm mb-6 shadow-[0_0_15px_rgba(8,145,178,0.3)]">
          ✨ Next-Generation AI Interview Platform
        </div>

        <h2 className="text-5xl md:text-7xl font-extrabold max-w-5xl leading-tight mb-8 tracking-tight">
          Master your interviews with <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 animate-gradient-x bg-[length:200%_auto]">real-time AI insights</span>
        </h2>

        <p className="text-slate-400 max-w-2xl text-lg md:text-xl mb-12 leading-relaxed">
          Practice technical and behavioral interviews in a fully sandboxed environment. Get instant feedback on your code, communication, and confidence.
        </p>

        <div className="flex gap-6">
          <Link
            to="/signup"
            className="btn-primary px-8 py-4 text-lg"
          >
            Start Practicing Free
          </Link>

          <Link
            to="/login"
            className="btn-secondary px-8 py-4 text-lg"
          >
            View Dashboard
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 px-8 pb-32 max-w-7xl mx-auto relative z-10">
        <div className="glass-panel p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300 border-t-cyan-500/30 border-t-2">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-6 border border-cyan-500/30">
            <span className="text-cyan-400 text-2xl">💻</span>
          </div>
          <h3 className="text-2xl font-bold mb-4 text-slate-100">Live Code Sandbox</h3>
          <p className="text-slate-400 leading-relaxed">
            Write, execute, and evaluate real Python code directly in the browser during your mock technical rounds.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300 border-t-violet-500/30 border-t-2">
          <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-6 border border-violet-500/30">
            <span className="text-violet-400 text-2xl">🧠</span>
          </div>
          <h3 className="text-2xl font-bold mb-4 text-slate-100">Behavioral Analytics</h3>
          <p className="text-slate-400 leading-relaxed">
            Track eye contact, facial expressions, speaking pace, and filler words seamlessly using advanced computer vision.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300 border-t-blue-500/30 border-t-2">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30">
            <span className="text-blue-400 text-2xl">📈</span>
          </div>
          <h3 className="text-2xl font-bold mb-4 text-slate-100">Progress Tracking</h3>
          <p className="text-slate-400 leading-relaxed">
            Monitor your historical performance trends with beautiful visual charts and customized actionable feedback reports.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Home;