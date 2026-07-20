import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "../config";
import { generatePDF } from "../utils/pdfGenerator";

function Report() {
  const location = useLocation();
  const stateData = location.state;
  const hasSavedRef = useRef(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  let answers = [];
  let setup = stateData?.setup;
  let overallScore = 0;
  let technicalScore = 0;
  let communicationScore = 0;
  let confidenceScore = 0;
  let eyeContactScore = 0;
  let attentionScore = 0;
  let smileScore = 0;
  let totalFillerWords = 0;
  let fillerWords = {};
  let speakingAnalytics = {
    word_count: 0,
    words_per_minute: 0,
    speaking_duration: 0,
    average_words_per_sentence: 0,
    speaking_pace: "Normal"
  };
  let strengths = [];
  let weaknesses = [];
  let suggestions = [];

  if (stateData) {
    if (stateData.answers && stateData.answers.length > 0) {
      answers = stateData.answers;
      const count = answers.length;
      let sumTechnical = 0;
      let sumCommunication = 0;
      let sumConfidence = 0;
      let sumEyeContact = 0;
      let sumAttention = 0;
      let sumSmile = 0;
      let sumWpm = 0;
      let sumDuration = 0;
      let sumAvgWordsPerSentence = 0;

      answers.forEach((ans) => {
        const ai = ans.aiFeedback || {};
        sumTechnical += ai.technical_score ?? 0;
        sumCommunication += ai.communication_score ?? 0;
        sumConfidence += ans.confidenceScore ?? ai.confidence_score ?? 0;
        sumEyeContact += ans.eyeContactScore ?? 0;
        sumAttention += ans.attentionScore ?? 0;
        sumSmile += ans.smileScore ?? 0;
        totalFillerWords += ans.totalFillerWords ?? 0;

        if (ans.fillerWords) {
          Object.entries(ans.fillerWords).forEach(([word, val]) => {
            fillerWords[word] = (fillerWords[word] || 0) + val;
          });
        }

        const sa = ans.speakingAnalytics || {};
        speakingAnalytics.word_count += sa.word_count ?? 0;
        sumWpm += sa.words_per_minute ?? 0;
        sumDuration += sa.speaking_duration ?? 0;
        sumAvgWordsPerSentence += sa.average_words_per_sentence ?? 0;

        if (ai.strengths) strengths.push(...ai.strengths);
        if (ai.weaknesses) weaknesses.push(...ai.weaknesses);
        if (ai.suggestions) suggestions.push(...ai.suggestions);
      });

      technicalScore = Math.round(sumTechnical / count);
      communicationScore = Math.round(sumCommunication / count);
      confidenceScore = Math.round(sumConfidence / count);
      eyeContactScore = Math.round(sumEyeContact / count);
      attentionScore = Math.round(sumAttention / count);
      smileScore = Math.round(sumSmile / count);

      overallScore = Math.round(
        (technicalScore + communicationScore + confidenceScore + attentionScore) / 4
      );

      speakingAnalytics.words_per_minute = Math.round(sumWpm / count);
      speakingAnalytics.speaking_duration = Math.round(sumDuration, 2);
      speakingAnalytics.average_words_per_sentence = Math.round((sumAvgWordsPerSentence / count) * 10) / 10;

      if (speakingAnalytics.words_per_minute < 90) {
        speakingAnalytics.speaking_pace = "Slow";
      } else if (speakingAnalytics.words_per_minute <= 160) {
        speakingAnalytics.speaking_pace = "Normal";
      } else {
        speakingAnalytics.speaking_pace = "Fast";
      }

      strengths = strengths.length > 0 ? [...new Set(strengths)] : ["Great communication and answer attempts."];
      weaknesses = weaknesses.length > 0 ? [...new Set(weaknesses)] : ["Keep working on pacing and explanations."];
      suggestions = suggestions.length > 0 ? [...new Set(suggestions)] : ["Practice more mock sessions to refine explanations."];
    } else {
      // Single question format (fallback)
      answers = [stateData];
      const aiFeedback = stateData.aiFeedback;
      speakingAnalytics = stateData.speakingAnalytics || {};

      technicalScore = aiFeedback?.technical_score ?? 0;
      communicationScore = aiFeedback?.communication_score ?? 0;
      confidenceScore = stateData.confidenceScore ?? aiFeedback?.confidence_score ?? 0;
      eyeContactScore = stateData.eyeContactScore ?? 0;
      attentionScore = stateData.attentionScore ?? 0;
      smileScore = stateData.smileScore ?? 0;

      overallScore = Math.round(
        (technicalScore + communicationScore + confidenceScore + attentionScore) / 4
      );

      totalFillerWords = stateData.totalFillerWords ?? 0;
      fillerWords = stateData.fillerWords || {};
      strengths = aiFeedback?.strengths || ["Answer was attempted."];
      weaknesses = aiFeedback?.weaknesses || ["None noted."];
      suggestions = aiFeedback?.suggestions || ["Practice structuring answers more clearly."];
    }
  }

  const fullReportData = {
    ...stateData,
    answers: stateData?.answers ? stateData.answers : null,
    question: stateData?.answers 
      ? `Interview: ${setup?.role || "Mock"} (${setup?.type || "General"})`
      : stateData?.question,
    technicalScore,
    communicationScore,
    confidenceScore,
    eyeContactScore,
    attentionScore,
    smileScore,
    speakingAnalytics,
    overallScore,
    strengths,
    weaknesses,
    suggestions,
    totalFillerWords,
    fillerWords,
    date: stateData?.date || new Date().toLocaleString(),
  };

  useEffect(() => {
    if (!stateData || hasSavedRef.current) return;

    // Do not save if we loaded this report from the DB (it already has a date or _id)
    if (stateData._id || stateData.id || stateData.isSavedFromDb) return;

    hasSavedRef.current = true;

    const saveReport = async () => {
      const token = localStorage.getItem("token");

      let totalDurationFormatted = "00:00";
      if (stateData.answers) {
        let totalSecs = 0;
        stateData.answers.forEach((ans) => {
          const parts = (ans.duration || "00:00").split(":");
          if (parts.length === 2) {
            totalSecs += parseInt(parts[0]) * 60 + parseInt(parts[1]);
          }
        });
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        totalDurationFormatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      } else {
        totalDurationFormatted = stateData.duration || "00:00";
      }

      const newReport = {
        question: stateData.answers 
          ? `Interview: ${setup?.role || "Mock"} (${setup?.type || "General"})`
          : stateData.question,
        answers: stateData.answers ? stateData.answers : null,
        fillerWords,
        totalFillerWords,
        confidenceScore,
        eyeContactScore,
        attentionScore,
        smileScore,
        speakingAnalytics,
        technicalScore,
        communicationScore,
        overallScore,
        strengths,
        weaknesses,
        suggestions,
        duration: totalDurationFormatted,
        date: new Date().toLocaleString(),
      };

      try {
        await fetch(`${API_URL}/save-report`, {
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
    <div className="min-h-screen bg-slate-900 text-slate-100 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-violet-600/10 blur-[120px] rounded-full animate-float"></div>
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '2s' }}></div>

      <nav className="glass-panel border-b-0 mx-4 mt-4 rounded-2xl px-8 py-4 flex justify-between items-center relative z-10">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Antigravity AI
        </h1>

        <div className="flex gap-4">
          <Link
            to="/interview"
            className="text-sm btn-primary px-4 py-2"
          >
            Practice Again
          </Link>

          <Link
            to="/dashboard"
            className="text-sm text-slate-300 hover:text-cyan-400 font-medium transition-colors flex items-center"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 relative z-10">
        <h2 className="text-4xl font-extrabold text-slate-100 mb-2">
          Interview Report
        </h2>

        <p className="text-slate-400 mb-10 text-lg">
          AI-generated performance summary based on your latest session.
        </p>

        {!stateData && (
          <div className="glass-panel border-t-amber-500/30 border-t-2 rounded-2xl p-6 mb-8 text-center py-12">
            <h3 className="font-bold text-amber-400 mb-2 text-xl">
              No interview data found
            </h3>
            <p className="text-amber-200/60 text-sm">
              Please complete an interview first to generate a real report.
            </p>
          </div>
        )}

        <div className="glass-panel text-white rounded-3xl p-10 mb-10 border-t-cyan-500/30 border-t-2 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-500/10 blur-[100px]"></div>
          <p className="text-cyan-400 mb-2 font-medium tracking-wider uppercase text-sm">Overall Score</p>
          <h3 className="text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">{overallScore}%</h3>
          <p className="text-slate-300 text-lg max-w-2xl">
            {overallScore >= 80
              ? "Excellent performance. Keep practicing to maintain consistency."
              : overallScore >= 60
              ? "Good performance. Focus on weak areas to improve further."
              : "Needs improvement. Practice answer structure and communication."}
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6 mb-10">
          <ScoreCard title="Technical" score={technicalScore} color="text-emerald-400" border="border-t-emerald-500/30" />
          <ScoreCard title="Communication" score={communicationScore} color="text-cyan-400" border="border-t-cyan-500/30" />
          <ScoreCard title="Confidence" score={confidenceScore} color="text-violet-400" border="border-t-violet-500/30" />
          <ScoreCard title="Eye Contact" score={eyeContactScore} color="text-indigo-400" border="border-t-indigo-500/30" />
          <ScoreCard
            title="Filler Words"
            score={totalFillerWords}
            isCount
            color="text-rose-400"
            border="border-t-rose-500/30"
          />
        </div>

        <div className="grid md:grid-cols-5 gap-6 mb-10">
          <InfoCard
            title="Words Spoken"
            value={speakingAnalytics?.word_count ?? 0}
            border="border-t-slate-500/30"
          />
          <InfoCard
            title="Speaking Speed"
            value={`${speakingAnalytics?.words_per_minute ?? 0} WPM`}
            border="border-t-slate-500/30"
          />
          <InfoCard
            title="Speaking Pace"
            value={speakingAnalytics?.speaking_pace ?? "Pending"}
            border="border-t-slate-500/30"
          />
          <InfoCard
            title="Speaking Duration"
            value={`${speakingAnalytics?.speaking_duration ?? 0}s`}
            border="border-t-slate-500/30"
          />
          <InfoCard
            title="Avg Words/Sentence"
            value={speakingAnalytics?.average_words_per_sentence ?? 0}
            border="border-t-slate-500/30"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-8">
            <div className="glass-panel p-8 rounded-3xl border-t-blue-500/30 border-t-2">
              <h3 className="text-2xl font-bold mb-6 text-slate-100">Detailed Breakdown</h3>

              <div className="space-y-6">
                <Progress label="Technical Knowledge" value={technicalScore} />
                <Progress
                  label="Communication Clarity"
                  value={communicationScore}
                />
                <Progress label="Confidence Level" value={confidenceScore} />
                <Progress label="Eye Contact" value={eyeContactScore} />
                <Progress label="Attention Score" value={attentionScore} />
                <Progress label="Smile Frequency" value={smileScore} />
              </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl border-t-indigo-500/30 border-t-2">
              <h3 className="text-2xl font-bold mb-6 text-slate-100">Speaking Analysis</h3>

              <div className="grid grid-cols-2 gap-6 text-sm text-slate-300">
                <div className="glass-panel p-4 rounded-xl border border-slate-700/30">
                  <p className="text-slate-400 text-xs uppercase mb-1">Word Count</p>
                  <p className="text-2xl font-bold text-indigo-400">{speakingAnalytics?.word_count ?? 0}</p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-slate-700/30">
                  <p className="text-slate-400 text-xs uppercase mb-1">Words Per Minute</p>
                  <p className="text-2xl font-bold text-cyan-400">{speakingAnalytics?.words_per_minute ?? 0} <span className="text-sm font-normal">WPM</span></p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-slate-700/30">
                  <p className="text-slate-400 text-xs uppercase mb-1">Speaking Pace</p>
                  <p className="text-xl font-bold text-violet-400">{speakingAnalytics?.speaking_pace ?? "Pending"}</p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-slate-700/30">
                  <p className="text-slate-400 text-xs uppercase mb-1">Speaking Duration</p>
                  <p className="text-xl font-bold text-emerald-400">{speakingAnalytics?.speaking_duration ?? 0} <span className="text-sm font-normal">seconds</span></p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-slate-700/30 col-span-2">
                  <p className="text-slate-400 text-xs uppercase mb-1">Average Words Per Sentence</p>
                  <p className="text-xl font-bold text-blue-400">{speakingAnalytics?.average_words_per_sentence ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl border-t-violet-500/30 border-t-2">
              <h3 className="text-2xl font-bold mb-6 text-slate-100">Question-by-Question Breakdown</h3>
              
              <div className="flex flex-wrap gap-3 mb-8">
                {answers.map((ans, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                      activeQuestionIndex === idx
                        ? "bg-violet-600/20 text-violet-400 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                        : "bg-slate-800/30 text-slate-400 border-slate-700/50 hover:bg-slate-800/80 hover:text-slate-300"
                    }`}
                  >
                    Question {idx + 1}
                  </button>
                ))}
              </div>

              {answers.length > 0 && answers[activeQuestionIndex] && (
                <div className="space-y-8">
                  <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-cyan-500">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><span>❓</span> Question</p>
                    <p className="text-lg font-bold text-slate-100 leading-snug">{answers[activeQuestionIndex].question}</p>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-emerald-500">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><span>🗣️</span> Your Transcript</p>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                      {answers[activeQuestionIndex].transcript || "No speech recorded."}
                    </p>
                  </div>

                  {/* Individual Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    <SmallMetricBox
                      label="Technical"
                      value={answers[activeQuestionIndex].aiFeedback?.technical_score}
                      color="emerald-400"
                    />
                    <SmallMetricBox
                      label="Communication"
                      value={answers[activeQuestionIndex].aiFeedback?.communication_score}
                      color="cyan-400"
                    />
                    <SmallMetricBox
                      label="Confidence"
                      value={answers[activeQuestionIndex].confidenceScore}
                      color="violet-400"
                    />
                    <SmallMetricBox
                      label="Eye Contact"
                      value={answers[activeQuestionIndex].eyeContactScore}
                      color="indigo-400"
                    />
                    <SmallMetricBox
                      label="Attention"
                      value={answers[activeQuestionIndex].attentionScore}
                      color="amber-400"
                    />
                    <SmallMetricBox
                      label="Smile"
                      value={answers[activeQuestionIndex].smileScore}
                      color="rose-400"
                    />
                  </div>

                  {/* Individual Feedback Lists */}
                  {answers[activeQuestionIndex].aiFeedback && (
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-700/50 pb-4">
                        <p className="font-bold text-emerald-400 text-sm uppercase tracking-wider flex items-center gap-2"><span>🤖</span> AI Answer Feedback</p>
                        <p className="text-xs font-medium bg-slate-800 text-cyan-400 px-4 py-1.5 rounded-full border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                          Tone: {answers[activeQuestionIndex].aiFeedback?.tone || "Unknown"}
                        </p>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-6 text-sm">
                        <div className="glass-panel p-4 rounded-xl border border-slate-700/30 bg-emerald-900/10">
                          <p className="font-bold border-b border-emerald-500/20 pb-2 mb-3 text-emerald-400 flex items-center gap-2"><span>✨</span> Strengths</p>
                          <ul className="space-y-2 text-slate-300">
                            {(answers[activeQuestionIndex].aiFeedback.strengths || []).map((s, i) => (
                              <li key={i} className="flex gap-2"><span className="text-emerald-400">•</span> <span>{s}</span></li>
                            ))}
                            {(answers[activeQuestionIndex].aiFeedback.strengths || []).length === 0 && <li className="text-slate-500 italic">Good answer attempt.</li>}
                          </ul>
                        </div>
                        <div className="glass-panel p-4 rounded-xl border border-slate-700/30 bg-rose-900/10">
                          <p className="font-bold border-b border-rose-500/20 pb-2 mb-3 text-rose-400 flex items-center gap-2"><span>⚠️</span> Weaknesses</p>
                          <ul className="space-y-2 text-slate-300">
                            {(answers[activeQuestionIndex].aiFeedback.weaknesses || []).map((w, i) => (
                              <li key={i} className="flex gap-2"><span className="text-rose-400">•</span> <span>{w}</span></li>
                            ))}
                            {(answers[activeQuestionIndex].aiFeedback.weaknesses || []).length === 0 && <li className="text-slate-500 italic">None detected.</li>}
                          </ul>
                        </div>
                        <div className="glass-panel p-4 rounded-xl border border-slate-700/30 bg-cyan-900/10">
                          <p className="font-bold border-b border-cyan-500/20 pb-2 mb-3 text-cyan-400 flex items-center gap-2"><span>💡</span> Suggestions</p>
                          <ul className="space-y-2 text-slate-300">
                            {(answers[activeQuestionIndex].aiFeedback.suggestions || []).map((su, i) => (
                              <li key={i} className="flex gap-2"><span className="text-cyan-400">•</span> <span>{su}</span></li>
                            ))}
                            {(answers[activeQuestionIndex].aiFeedback.suggestions || []).length === 0 && <li className="text-slate-500 italic">Continue practicing this pacing.</li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="glass-panel p-8 rounded-3xl border-t-amber-500/30 border-t-2">
              <h3 className="text-2xl font-bold mb-6 text-slate-100 flex items-center gap-2">
                <span>📈</span> Improvement Suggestions
              </h3>

              <div className="space-y-4">
                {suggestions.map((item, index) => (
                  <div
                    key={index}
                    className="glass-panel rounded-xl p-4 text-slate-300 border-l-2 border-l-amber-500/50"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-8">
            <div className="glass-panel p-8 rounded-3xl border-t-rose-500/30 border-t-2 text-center">
              <h3 className="text-xl font-bold mb-4 text-slate-100">Filler Words</h3>

              <div className="text-6xl font-black text-rose-400 mb-6 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                {totalFillerWords}
              </div>

              {fillerWords &&
              Object.keys(fillerWords).length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.entries(fillerWords).map(([word, count]) => (
                    <span key={word} className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-3 py-1 rounded-full text-sm">
                      {word}: {count}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  No filler words detected.
                </p>
              )}
            </div>

            <List title="Strengths" items={strengths} prefix="✨" color="text-emerald-400" />
            <List title="Weaknesses" items={weaknesses} prefix="⚠️" color="text-rose-400" />

            <button
              onClick={() => generatePDF(fullReportData)}
              disabled={!stateData}
              className="w-full btn-primary py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              Download PDF Report
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}

function ScoreCard({ title, score, isCount, color, border }) {
  return (
    <div className={`glass-panel p-6 rounded-3xl ${border} border-t-2 hover:-translate-y-1 transition-transform duration-300`}>
      <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">{title}</p>
      <h3 className={`text-4xl font-black mt-3 ${color}`}>
        {score}
        {!isCount && <span className="text-2xl font-bold"> %</span>}
      </h3>
    </div>
  );
}

function InfoCard({ title, value, border }) {
  return (
    <div className={`glass-panel p-6 rounded-3xl ${border} border-t-2 hover:-translate-y-1 transition-transform duration-300`}>
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold mt-2 text-slate-200">{value}</h3>
    </div>
  );
}

function Progress({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="font-bold text-cyan-400">{value}%</span>
      </div>

      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/50">
        <div
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-1000"
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}

function Box({ title, children }) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <h3 className="text-xl font-bold mb-4 text-slate-100">{title}</h3>
      <div className="text-slate-300 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function List({ title, items, prefix, color }) {
  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-700/30">
      <h3 className="text-xl font-bold mb-5 text-slate-100">{title}</h3>

      <ul className="space-y-4 text-sm text-slate-300">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3 leading-relaxed">
            <span className={`${color}`}>{prefix}</span> <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SmallMetricBox({ label, value, color }) {
  return (
    <div className="glass-panel rounded-2xl p-4 text-center border border-slate-700/30 shadow-sm hover:bg-slate-800/50 transition-colors">
      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{label}</p>
      <p className={`text-2xl font-black mt-2 text-${color}`}>
        {value !== undefined && value !== null ? `${value}` : "0"}<span className="text-sm font-medium"> %</span>
      </p>
    </div>
  );
}

export default Report;