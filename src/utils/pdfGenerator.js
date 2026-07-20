import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generatePDF(reportData) {
  const doc = new jsPDF();

  const aiFeedback = reportData?.aiFeedback || {};
  const speakingAnalytics = reportData?.speakingAnalytics || {};

  const technicalScore =
    reportData?.technicalScore || aiFeedback.technical_score || 0;
  const communicationScore =
    reportData?.communicationScore || aiFeedback.communication_score || 0;
  const confidenceScore =
    reportData?.confidenceScore || aiFeedback.confidence_score || 0;
  const eyeContactScore = reportData?.eyeContactScore || 0;
  const attentionScore = reportData?.attentionScore || 0;
  const smileScore = reportData?.smileScore || 0;

  const overallScore =
    reportData?.overallScore ||
    Math.round(
      (technicalScore +
        communicationScore +
        confidenceScore +
        attentionScore) /
        4
    );

  doc.setFontSize(20);
  doc.text("AI Interview Analyzer Report", 20, 20);

  doc.setFontSize(11);
  doc.text(`Generated On: ${new Date().toLocaleString()}`, 20, 30);

  doc.setFontSize(14);
  doc.text("Performance Summary", 20, 45);

  autoTable(doc, {
    startY: 52,
    head: [["Metric", "Score"]],
    body: [
      ["Overall Score", `${overallScore}%`],
      ["Technical Score", `${technicalScore}%`],
      ["Communication Score", `${communicationScore}%`],
      ["Confidence Score", `${confidenceScore}%`],
      ["Eye Contact Score", `${eyeContactScore}%`],
      ["Attention Score", `${attentionScore}%`],
      ["Smile Frequency", `${smileScore}%`],
      ["Filler Words", `${reportData?.totalFillerWords || 0}`],
      ["Duration", reportData?.duration || "00:00"],
    ],
  });

  let y = doc.lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.text("Speaking Analytics", 20, y);

  autoTable(doc, {
    startY: y + 7,
    head: [["Metric", "Value"]],
    body: [
      ["Words Spoken", speakingAnalytics?.word_count || 0],
      ["Speaking Speed", `${speakingAnalytics?.words_per_minute || 0} WPM`],
      ["Speaking Pace", speakingAnalytics?.speaking_pace || "Pending"],
      [
        "Speaking Duration",
        `${speakingAnalytics?.speaking_duration || 0} seconds`,
      ],
      [
        "Average Words Per Sentence",
        speakingAnalytics?.average_words_per_sentence || 0,
      ],
    ],
  });

  y = doc.lastAutoTable.finalY + 15;

  if (reportData?.answers && reportData.answers.length > 0) {
    reportData.answers.forEach((ans, index) => {
      if (y > 220) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.text(`Question ${index + 1}: ${ans.question || "N/A"}`, 20, y);
      y += 8;

      doc.setFontSize(10);
      const metricsText = `Duration: ${ans.duration || "00:00"} | Confidence: ${ans.confidenceScore ?? 0}% | Eye Contact: ${ans.eyeContactScore ?? 0}%`;
      doc.text(metricsText, 20, y);
      y += 6;
      
      const faceMetrics = `Attention Score: ${ans.attentionScore ?? 0}% | Smile Frequency: ${ans.smileScore ?? 0}%`;
      doc.text(faceMetrics, 20, y);
      y += 6;

      const scoresText = `Technical Score: ${ans.aiFeedback?.technical_score ?? 0}% | Communication Score: ${ans.aiFeedback?.communication_score ?? 0}%`;
      doc.text(scoresText, 20, y);
      y += 6;
      
      const toneText = `Detected Tone: ${ans.aiFeedback?.tone || "Unknown"}`;
      doc.text(toneText, 20, y);
      y += 8;

      doc.setFontSize(11);
      doc.text("Transcript:", 20, y);
      y += 6;

      doc.setFontSize(10);
      const transcriptLines = doc.splitTextToSize(
        ans.transcript || "No speech recorded.",
        170
      );
      doc.text(transcriptLines, 20, y);
      y += transcriptLines.length * 5 + 10;

      // Question feedback list
      if (ans.aiFeedback) {
        if (ans.aiFeedback.strengths && ans.aiFeedback.strengths.length > 0) {
          y = addListSection(doc, `Q${index + 1} Strengths`, ans.aiFeedback.strengths, y);
        }
        if (ans.aiFeedback.weaknesses && ans.aiFeedback.weaknesses.length > 0) {
          y = addListSection(doc, `Q${index + 1} Weaknesses`, ans.aiFeedback.weaknesses, y);
        }
        if (ans.aiFeedback.suggestions && ans.aiFeedback.suggestions.length > 0) {
          y = addListSection(doc, `Q${index + 1} Suggestions`, ans.aiFeedback.suggestions, y);
        }
      }
      y += 5;
    });
  } else {
    doc.setFontSize(14);
    doc.text("Question Asked", 20, y);
    y += 8;

    doc.setFontSize(11);
    doc.text(doc.splitTextToSize(reportData?.question || "N/A", 170), 20, y);
    y += 20;

    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.text("Transcript", 20, y);
    y += 8;

    const transcriptLines = doc.splitTextToSize(
      reportData?.transcript || "No transcript available.",
      170
    );

    doc.setFontSize(11);
    doc.text(transcriptLines, 20, y);
    y += transcriptLines.length * 6 + 10;

    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    y = addListSection(doc, "Strengths", reportData?.strengths, y);
    y = addListSection(doc, "Weaknesses", reportData?.weaknesses, y);
    y = addListSection(doc, "Suggestions", reportData?.suggestions, y);
  }

  doc.setFontSize(10);
  doc.text("Generated by AI Interview Analyzer", 20, 285);

  doc.save("AI_Interview_Report.pdf");
}

function addListSection(doc, title, items = [], y) {
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.text(title, 20, y);
  y += 8;

  const listItems =
    items.length > 0 ? items : [`No ${title.toLowerCase()} available.`];

  listItems.forEach((item) => {
    const lines = doc.splitTextToSize(`• ${item}`, 165);

    if (y + lines.length * 6 > 280) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.text(lines, 25, y);
    y += lines.length * 6 + 3;
  });

  return y + 5;
}