export default function FacialAnalyticsPanel({
  attentionScore = 0,
  eyeContactScore = 0,
  smileScore = 0,
  headPoseStatus = "Centered",
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 min-w-[240px]">
      <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
        Live Facial Analytics
      </h3>

      <div className="space-y-4">
        {/* Attention Score */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-gray-700">Attention Score</span>
            <span className="font-bold text-blue-600">{attentionScore}%</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${attentionScore}%` }}
            ></div>
          </div>
        </div>

        {/* Eye Contact */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-gray-700">Eye Contact</span>
            <span className="font-bold text-purple-600">{eyeContactScore}%</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${eyeContactScore}%` }}
            ></div>
          </div>
        </div>

        {/* Smile Detection */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold text-gray-700">Smile Frequency</span>
            <span className="font-bold text-pink-500">{smileScore}%</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-pink-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${smileScore}%` }}
            ></div>
          </div>
        </div>

        {/* Head Pose Status */}
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 mb-1 font-semibold">Head Pose Tracking</p>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                headPoseStatus === "Centered"
                  ? "bg-green-500"
                  : headPoseStatus === "Not Found"
                  ? "bg-gray-400"
                  : "bg-red-500"
              }`}
            ></span>
            <span className="text-sm font-medium text-gray-800">
              {headPoseStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
