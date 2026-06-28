import { useRef, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaceMesh } from "@mediapipe/face_mesh";

function InterviewRoom() {
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

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        const nose = landmarks[1];

        const lookingCenter =
          nose.x > 0.42 && nose.x < 0.58 && nose.y > 0.30 && nose.y < 0.70;

        if (lookingCenter) {
          goodEyeFramesRef.current += 1;
        }
      }

      const score = Math.round(
        (goodEyeFramesRef.current / totalFramesRef.current) * 100
      );

      setEyeContactScore(score);
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

    totalFramesRef.current = 0;
    goodEyeFramesRef.current = 0;
    setEyeContactScore(0);
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

      try {
        setTranscript("Uploading audio to backend...");

        const response = await fetch("http://127.0.0.1:8000/upload-audio", {
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

    if (currentQuestion < questions.length - 1) {
      resetAnalysis();
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const reportData = {
        question: questions[currentQuestion],
        transcript,
        fillerWords,
        totalFillerWords,
        confidenceScore,
        aiFeedback,
        eyeContactScore,
        duration: formatTime(seconds),
        setup,
      };

      navigate("/report", { state: reportData });
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
          Exit Interview
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">
                  Question {currentQuestion + 1} of {questions.length}
                </p>

                <span className="bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-sm font-medium">
                  {setup
                    ? `${setup.type} • ${setup.difficulty}`
                    : "Technical + HR"}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 leading-relaxed">
                {questions[currentQuestion]}
              </h2>
            </div>

            <div className="bg-gray-900 rounded-2xl h-96 overflow-hidden flex items-center justify-center">
              {!cameraEnabled ? (
                <div className="text-center text-white px-6">
                  <p className="text-lg font-medium mb-3">
                    Enable camera and microphone to start
                  </p>

                  <p className="text-gray-400 text-sm mb-5">
                    We need camera and microphone access for interview practice.
                  </p>

                  <button
                    onClick={enableCamera}
                    className="bg-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-blue-700"
                  >
                    Enable Camera & Microphone
                  </button>

                  {cameraError && (
                    <p className="text-red-400 text-sm mt-4">{cameraError}</p>
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

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="font-bold text-lg mb-4">Answer Controls</h3>

              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={startRecording}
                  disabled={isRecording}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 disabled:bg-gray-400"
                >
                  Start Recording
                </button>

                <button
                  onClick={stopRecording}
                  disabled={!isRecording}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 disabled:bg-gray-400"
                >
                  Stop Recording
                </button>

                <button
                  onClick={handleNext}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700"
                >
                  {currentQuestion === questions.length - 1
                    ? "Finish Interview"
                    : "Next Question"}
                </button>
              </div>

              {audioUrl && (
                <div className="mt-6 bg-gray-50 border rounded-xl p-4">
                  <p className="font-medium text-gray-700 mb-3">
                    Recorded Answer Preview
                  </p>
                  <audio controls src={audioUrl} className="w-full"></audio>
                </div>
              )}

              <AnalysisBox title="Transcript">
                {speechError ? (
                  <p className="text-red-600 text-sm">{speechError}</p>
                ) : (
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {transcript ||
                      "Your transcript will appear here after backend processing..."}
                  </p>
                )}
              </AnalysisBox>

              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="font-medium text-yellow-800 mb-3">
                  Filler Word Analysis
                </p>

                {totalFillerWords === 0 ? (
                  <p className="text-sm text-yellow-700">
                    Filler words will appear here after analysis.
                  </p>
                ) : (
                  <div className="space-y-2 text-sm text-yellow-800">
                    <p>Total Filler Words: {totalFillerWords}</p>

                    {Object.entries(fillerWords).map(([word, count]) => (
                      <p key={word}>
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
                color="bg-purple-600"
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
                <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="font-medium text-green-800 mb-3">
                    AI Feedback
                  </p>

                  <div className="grid md:grid-cols-3 gap-4 text-sm text-green-800">
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

                  <FeedbackList title="Strengths" items={aiFeedback.strengths} />
                  <FeedbackList
                    title="Weaknesses"
                    items={aiFeedback.weaknesses}
                  />
                  <FeedbackList
                    title="Suggestions"
                    items={aiFeedback.suggestions}
                  />
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="text-xl font-bold mb-4">Session Status</h3>

              <div className="space-y-4 text-sm">
                <InfoRow
                  label="Status"
                  value={isRecording ? "Recording" : "Idle"}
                  active={isRecording}
                />
                <InfoRow label="Timer" value={formatTime(seconds)} />
                <InfoRow
                  label="Answered"
                  value={`${currentQuestion} / ${questions.length}`}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="text-xl font-bold mb-4">Live Analysis</h3>

              <div className="space-y-4 text-sm">
                <InfoRow
                  label="Speech-to-text"
                  value={transcript ? "Completed" : "Pending"}
                />
                <InfoRow
                  label="Filler words"
                  value={totalFillerWords > 0 ? totalFillerWords : "Pending"}
                />
                <InfoRow
                  label="Confidence"
                  value={
                    confidenceScore !== null
                      ? `${confidenceScore}/100`
                      : "Pending"
                  }
                />
                <InfoRow label="Eye Contact" value={`${eyeContactScore}/100`} />
                <InfoRow
                  label="AI Feedback"
                  value={aiFeedback ? "Completed" : "Pending"}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="text-xl font-bold mb-4">Eye Contact Meter</h3>

              <div className="flex justify-between mb-2 text-sm">
                <span>{getEyeContactLabel(eyeContactScore)}</span>
                <span className="font-bold">{eyeContactScore}%</span>
              </div>

              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full"
                  style={{ width: `${eyeContactScore}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-blue-600 text-white rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-3">Interview Tip</h3>
              <p className="text-sm text-blue-100">
                Look near the camera, speak clearly, and avoid filler words.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ label, value, active }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-600">{label}</span>
      <span
        className={
          active
            ? "text-red-600 font-semibold"
            : "text-gray-900 font-semibold"
        }
      >
        {value}
      </span>
    </div>
  );
}

function AnalysisBox({ title, children }) {
  return (
    <div className="mt-6 bg-gray-50 border rounded-xl p-4">
      <p className="font-medium text-gray-700 mb-3">{title}</p>
      {children}
    </div>
  );
}

function ScoreBox({ title, score, label, color }) {
  return (
    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex justify-between mb-2">
        <p className="font-medium text-blue-900">{title}</p>
        <p className="font-bold text-blue-900">{score}/100</p>
      </div>

      <div className="w-full bg-blue-100 h-3 rounded-full overflow-hidden">
        <div
          className={`${color} h-full rounded-full`}
          style={{ width: `${score}%` }}
        ></div>
      </div>

      <p className="text-sm text-blue-800 mt-3">{label}</p>
    </div>
  );
}

function SmallScore({ label, value }) {
  return (
    <div className="bg-white rounded-xl p-3 border">
      <p className="text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}/100</p>
    </div>
  );
}

function FeedbackList({ title, items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="font-medium text-green-800">{title}</p>
      <ul className="list-disc ml-5 text-sm text-green-800 mt-2">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default InterviewRoom;