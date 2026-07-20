import { useRef, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaceMesh } from "@mediapipe/face_mesh";

import { API_URL } from "../config";
import FacialAnalyticsPanel from "../components/FacialAnalyticsPanel";
import Editor from "@monaco-editor/react";

function CodingInterviewRoom() {
  const navigate = useNavigate();
  const location = useLocation();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const faceMeshRef = useRef(null);
  const eyeIntervalRef = useRef(null);
  const totalFramesRef = useRef(0);
  const goodEyeFramesRef = useRef(0);
  const goodSmileFramesRef = useRef(0);
  const goodAttentionFramesRef = useRef(0);

  const questions = location.state?.questions || [
    "Tell me about yourself.",
    "Explain one project from your resume.",
    "What are your strengths?",
    "Why should we hire you?",
    "Where do you see yourself in five years?",
  ];

  const setup = location.state?.setup;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [seconds, setSeconds] = useState(0);

  const [transcript, setTranscript] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [fillerWords, setFillerWords] = useState({});
  const [totalFillerWords, setTotalFillerWords] = useState(0);
  const [confidenceScore, setConfidenceScore] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [eyeContactScore, setEyeContactScore] = useState(0);
  const [smileScore, setSmileScore] = useState(0);
  const [attentionScore, setAttentionScore] = useState(0);
  const [headPoseStatus, setHeadPoseStatus] = useState("Centered");
  const [speakingAnalytics, setSpeakingAnalytics] = useState(null);
  const [answers, setAnswers] = useState([]);

  // Coding State
  const [code, setCode] = useState("# Write your Python code here\n\n");
  const [codeOutput, setCodeOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      totalFramesRef.current += 1;

      let currentHeadPose = "Not Found";
      let isSmiling = false;
      let isAttentive = false;

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        const nose = landmarks[1];
        
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        
        const eyeDist = Math.abs(rightEye.x - leftEye.x);
        const noseDistFromLeft = Math.abs(nose.x - leftEye.x);
        const yawRatio = noseDistFromLeft / eyeDist;

        if (yawRatio < 0.35) {
          currentHeadPose = "Looking Left";
        } else if (yawRatio > 0.65) {
          currentHeadPose = "Looking Right";
        } else if (nose.y > 0.65) {
          currentHeadPose = "Looking Down";
        } else if (nose.y < 0.35) {
          currentHeadPose = "Looking Up";
        } else {
          currentHeadPose = "Centered";
        }

        const mouthLeft = landmarks[61];
        const mouthRight = landmarks[291];
        const topLip = landmarks[13];
        const bottomLip = landmarks[14];

        const mouthWidth = Math.abs(mouthRight.x - mouthLeft.x);
        const mouthHeight = Math.abs(bottomLip.y - topLip.y);
        
        if (mouthWidth > 0.12 && mouthHeight < 0.05) {
            if (mouthLeft.y < topLip.y + 0.02 && mouthRight.y < topLip.y + 0.02) {
               isSmiling = true;
               goodSmileFramesRef.current += 1;
            }
        }

        const lookingCenter = currentHeadPose === "Centered";

        if (lookingCenter) {
          goodEyeFramesRef.current += 1;
          isAttentive = true;
        }
        
        if (isAttentive || isSmiling) {
           goodAttentionFramesRef.current += 1;
        }

        setHeadPoseStatus(currentHeadPose);
      } else {
        setHeadPoseStatus("Not Found");
      }

      const frames = totalFramesRef.current;
      setEyeContactScore(Math.round((goodEyeFramesRef.current / frames) * 100));
      setSmileScore(Math.round((goodSmileFramesRef.current / frames) * 100));
      setAttentionScore(Math.round((goodAttentionFramesRef.current / frames) * 100));
    });

    faceMeshRef.current = faceMesh;

    return () => {
      if (eyeIntervalRef.current) {
        clearInterval(eyeIntervalRef.current);
      }
    };
  }, []);

  const enableCamera = async () => {
    try {
      setCameraError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      setCameraEnabled(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        startEyeContactTracking();
      }, 300);
    } catch (error) {
      setCameraError("Camera or microphone permission denied.");
    }
  };

  const startEyeContactTracking = () => {
    if (eyeIntervalRef.current) {
      clearInterval(eyeIntervalRef.current);
    }

    eyeIntervalRef.current = setInterval(async () => {
      if (
        videoRef.current &&
        faceMeshRef.current &&
        videoRef.current.readyState === 4
      ) {
        await faceMeshRef.current.send({ image: videoRef.current });
      }
    }, 700);
  };

  useEffect(() => {
    let interval;

    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (eyeIntervalRef.current) {
        clearInterval(eyeIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getConfidenceLabel = (score) => {
    if (score === null) return "Pending";
    if (score >= 80) return "Excellent Confidence";
    if (score >= 60) return "Good Confidence";
    if (score >= 40) return "Needs Improvement";
    return "Low Confidence";
  };

  const getConfidenceColor = (score) => {
    if (score === null) return "bg-gray-300";
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-blue-600";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-600";
  };

  const getEyeContactLabel = (score) => {
    if (score >= 80) return "Excellent Eye Contact";
    if (score >= 60) return "Good Eye Contact";
    if (score >= 40) return "Needs Improvement";
    return "Low Eye Contact";
  };

  const resetAnalysis = () => {
    setAudioUrl("");
    setTranscript("");
    setSpeechError("");
    setSeconds(0);
    setFillerWords({});
    setTotalFillerWords(0);
    setConfidenceScore(null);
    setAiFeedback(null);
    setSpeakingAnalytics(null);

    totalFramesRef.current = 0;
    goodEyeFramesRef.current = 0;
    goodSmileFramesRef.current = 0;
    goodAttentionFramesRef.current = 0;
    setEyeContactScore(0);
    setSmileScore(0);
    setAttentionScore(0);
    setHeadPoseStatus("Centered");
  };

  const startRecording = () => {
    if (!streamRef.current) {
      alert("Please enable camera and microphone first");
      return;
    }

    audioChunksRef.current = [];
    resetAnalysis();

    const audioTracks = streamRef.current.getAudioTracks();

    if (audioTracks.length === 0) {
      alert("No microphone found");
      return;
    }

    const audioStream = new MediaStream(audioTracks);

    let mediaRecorder;

    try {
      mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: "audio/webm",
      });
    } catch (error) {
      mediaRecorder = new MediaRecorder(audioStream);
    }

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      if (audioBlob.size === 0) {
        setSpeechError("Recording failed. Audio file is empty.");
        return;
      }

      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      const formData = new FormData();
      formData.append("file", audioBlob, "answer.webm");
      formData.append("question", questions[currentQuestion]);
      formData.append("code", code);

      try {
        setTranscript("Uploading audio to backend...");

        const response = await fetch(`${API_URL}/upload-audio`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Backend response failed");
        }

        const data = await response.json();

        setTranscript(data.transcript || "No transcript received from backend.");
        setFillerWords(data.filler_words || {});
        setTotalFillerWords(data.total_filler_words || 0);
        setConfidenceScore(data.confidence_score ?? null);
        setAiFeedback(data.ai_feedback || null);
        setSpeakingAnalytics(data.speaking_analytics || null);
      } catch (error) {
        setSpeechError("Failed to upload audio to backend.");
      }
    };

    mediaRecorder.start(1000);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  const handleNext = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    const currentAnswer = {
      question: questions[currentQuestion],
      transcript,
      fillerWords,
      totalFillerWords,
      confidenceScore,
      aiFeedback,
      eyeContactScore,
      smileScore,
      attentionScore,
      headPoseStatus,
      speakingAnalytics,
      duration: formatTime(seconds),
      code,
    };

    if (currentQuestion < questions.length - 1) {
      setAnswers((prev) => [...prev, currentAnswer]);
      resetAnalysis();
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const finalAnswers = [...answers, currentAnswer];
      const reportData = {
        answers: finalAnswers,
        setup,
      };

      navigate("/report", { state: reportData });
    }
  };

  const runCode = async () => {
    setIsExecuting(true);
    setCodeOutput("Running...");
    try {
      const response = await fetch(`${API_URL}/execute-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "python", code }),
      });
      const data = await response.json();
      setCodeOutput(data.output);
    } catch (err) {
      setCodeOutput("Failed to connect to execution server.");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-float"></div>
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '2s' }}></div>

      <nav className="glass-panel border-b-0 mx-4 mt-4 rounded-2xl px-8 py-4 flex justify-between items-center relative z-10">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Antigravity AI
        </h1>

        <Link
          to="/dashboard"
          className="text-sm btn-danger px-4 py-2"
        >
          Exit Interview
        </Link>
      </nav>

      <main className="max-w-[1600px] mx-auto p-4 md:p-8 h-[calc(100vh-80px)] relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 h-full">
          {/* Left Panel: Video & Interview Tools */}
          <section className="space-y-6 overflow-y-auto pr-2 pb-10 custom-scrollbar">
            <div className="glass-panel p-8 rounded-3xl border-t-cyan-500/30 border-t-2">
              <div className="flex justify-between items-center mb-6">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Question {currentQuestion + 1} of {questions.length}
                </p>

                <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-4 py-1.5 rounded-full text-sm font-medium">
                  {setup
                    ? `${setup.type} • ${setup.difficulty}`
                    : "Technical + HR"}
                </span>
              </div>

              <h2 className="text-3xl font-bold text-slate-100 leading-tight">
                {questions[currentQuestion]}
              </h2>
            </div>

            <div className="glass-panel rounded-3xl h-[450px] overflow-hidden flex items-center justify-center relative border border-slate-700/50 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              {!cameraEnabled ? (
                <div className="text-center px-6">
                  <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700/50">
                    <span className="text-3xl">📷</span>
                  </div>
                  <p className="text-xl font-bold mb-3 text-slate-100">
                    Enable camera to start
                  </p>

                  <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                    We need camera and microphone access for live interview analysis.
                  </p>

                  <button
                    onClick={enableCamera}
                    className="btn-primary px-8 py-3"
                  >
                    Allow Access
                  </button>

                  {cameraError && (
                    <p className="text-red-400 text-sm mt-4 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">{cameraError}</p>
                  )}
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="glass-panel rounded-3xl p-8 border-t-emerald-500/30 border-t-2">
              <h3 className="font-bold text-xl mb-6 text-slate-100">Answer Controls</h3>

              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={startRecording}
                  disabled={isRecording}
                  className="btn-success px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Recording
                </button>

                <button
                  onClick={stopRecording}
                  disabled={!isRecording}
                  className="btn-danger px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Stop Recording
                </button>

                <button
                  onClick={handleNext}
                  className="btn-primary px-6 py-3"
                >
                  {currentQuestion === questions.length - 1
                    ? "Finish Interview"
                    : "Next Question"}
                </button>
              </div>

              {audioUrl && (
                <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                  <p className="font-medium text-slate-300 mb-3">
                    Recorded Answer Preview
                  </p>
                  <audio controls src={audioUrl} className="w-full outline-none"></audio>
                </div>
              )}

              <AnalysisBox title="Transcript">
                {speechError ? (
                  <p className="text-red-400 text-sm">{speechError}</p>
                ) : (
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {transcript ||
                      "Your transcript will appear here after backend processing..."}
                  </p>
                )}
              </AnalysisBox>

              {speakingAnalytics && (
                <div className="mt-8 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6">
                  <p className="font-semibold text-indigo-400 mb-4 text-lg">
                    Speaking Analytics
                  </p>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <SmallInfo
                      label="Words"
                      value={speakingAnalytics.word_count}
                    />
                    <SmallInfo
                      label="WPM"
                      value={speakingAnalytics.words_per_minute}
                    />
                    <SmallInfo
                      label="Pace"
                      value={speakingAnalytics.speaking_pace}
                    />
                    <SmallInfo
                      label="Speaking Duration"
                      value={`${speakingAnalytics.speaking_duration}s`}
                    />
                    <SmallInfo
                      label="Avg Words/Sentence"
                      value={speakingAnalytics.average_words_per_sentence}
                    />
                  </div>
                </div>
              )}

              <div className="mt-8 bg-amber-900/20 border border-amber-500/30 rounded-2xl p-6">
                <p className="font-semibold text-amber-400 mb-4 text-lg">
                  Filler Word Analysis
                </p>

                {totalFillerWords === 0 ? (
                  <p className="text-sm text-amber-200/50">
                    Filler words will appear here after analysis.
                  </p>
                ) : (
                  <div className="space-y-2 text-sm text-amber-200">
                    <p className="font-medium text-amber-400">Total Filler Words: {totalFillerWords}</p>

                    {Object.entries(fillerWords).map(([word, count]) => (
                      <p key={word} className="bg-amber-500/10 inline-block px-3 py-1 rounded-full mr-2 mt-2 border border-amber-500/20">
                        {word}: {count}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <ScoreBox
                title="Eye Contact Score"
                score={eyeContactScore}
                label={getEyeContactLabel(eyeContactScore)}
                color="bg-purple-500"
              />

              {confidenceScore !== null && (
                <ScoreBox
                  title="Confidence Score"
                  score={confidenceScore}
                  label={getConfidenceLabel(confidenceScore)}
                  color={getConfidenceColor(confidenceScore)}
                />
              )}

              {aiFeedback && (
                <div className="mt-8 bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-6">
                  <p className="font-semibold text-emerald-400 mb-4 text-lg">
                    AI Feedback
                  </p>

                  <div className="grid md:grid-cols-3 gap-4 text-sm mb-6">
                    <SmallScore
                      label="Technical"
                      value={aiFeedback.technical_score}
                    />
                    <SmallScore
                      label="Communication"
                      value={aiFeedback.communication_score}
                    />
                    <SmallScore
                      label="Confidence"
                      value={aiFeedback.confidence_score}
                    />
                  </div>

                  <FeedbackList title="Strengths" items={aiFeedback.strengths} icon="✨" color="text-emerald-400" />
                  <FeedbackList
                    title="Weaknesses"
                    items={aiFeedback.weaknesses}
                    icon="⚠️"
                    color="text-rose-400"
                  />
                  <FeedbackList
                    title="Suggestions"
                    items={aiFeedback.suggestions}
                    icon="💡"
                    color="text-cyan-400"
                  />
                </div>
              )}
            </div>
            
            <div className="glass-panel p-6 rounded-3xl border-t-cyan-500/30 border-t-2">
              <h3 className="text-xl font-bold mb-4 text-slate-100">Session Status</h3>
              <div className="space-y-4 text-sm">
                <InfoRow label="Status" value={isRecording ? "Recording..." : "Idle"} active={isRecording} />
                <InfoRow label="Timer" value={formatTime(seconds)} />
                <InfoRow label="Answered" value={`${currentQuestion} / ${questions.length}`} />
              </div>
            </div>

            <FacialAnalyticsPanel
              attentionScore={attentionScore}
              eyeContactScore={eyeContactScore}
              smileScore={smileScore}
              headPoseStatus={headPoseStatus}
            />
          </section>

          {/* Right Panel: Code Editor */}
          <aside className="space-y-4 flex flex-col h-[calc(100vh-140px)]">
            <div className="flex justify-between items-center glass-panel rounded-t-3xl px-6 py-4 border-b border-slate-700/50">
              <h3 className="text-slate-100 font-semibold flex items-center gap-2"><span>💻</span> Python Environment</h3>
              <button
                onClick={runCode}
                disabled={isExecuting}
                className="btn-success px-6 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isExecuting ? "Running..." : <><span>▶</span> Run Code</>}
              </button>
            </div>
            
            <div className="flex-1 border-x border-slate-700/50 overflow-hidden bg-[#1e1e1e]">
              <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  padding: { top: 20 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                }}
              />
            </div>

            <div className="h-56 glass-panel rounded-b-3xl p-5 overflow-y-auto font-mono text-sm shadow-inner border-t border-slate-700/50">
              <p className="text-slate-500 mb-3 flex items-center gap-2"><span>🔍</span> Console Output</p>
              <pre className="whitespace-pre-wrap text-emerald-400">{codeOutput || "Run your code to see the output here."}</pre>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
function InfoRow({ label, value, active }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-700/30 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span
        className={
          active
            ? "text-red-400 font-semibold animate-pulse"
            : "text-slate-200 font-semibold"
        }
      >
        {value}
      </span>
    </div>
  );
}

function AnalysisBox({ title, children }) {
  return (
    <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
      <p className="font-semibold text-slate-300 mb-3 text-lg">{title}</p>
      {children}
    </div>
  );
}

function ScoreBox({ title, score, label, color }) {
  return (
    <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6">
      <div className="flex justify-between mb-3">
        <p className="font-semibold text-blue-400">{title}</p>
        <p className="font-bold text-blue-300">{score}/100</p>
      </div>

      <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_currentColor]`}
          style={{ width: `${score}%` }}
        ></div>
      </div>

      <p className="text-sm text-blue-200/70 mt-3">{label}</p>
    </div>
  );
}

function SmallScore({ label, value }) {
  return (
    <div className="glass-panel rounded-xl p-4 border-t-emerald-500/30 border-t-2">
      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-emerald-400">{value}<span className="text-sm text-slate-500 font-normal">/100</span></p>
    </div>
  );
}

function SmallInfo({ label, value }) {
  return (
    <div className="glass-panel rounded-xl p-4 border-t-indigo-500/30 border-t-2">
      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold text-indigo-300">{value}</p>
    </div>
  );
}

function FeedbackList({ title, items, icon, color }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-6 bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
      <p className={`font-semibold ${color} mb-3 flex items-center gap-2`}>
        <span>{icon}</span> {title}
      </p>
      <ul className="space-y-2 text-sm text-slate-300">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2">
            <span className={color}>•</span> <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CodingInterviewRoom;