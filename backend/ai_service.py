import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def evaluate_answer(question: str, transcript: str, code: str = None):
    code_section = f"\nCandidate Code:\n{code}\n" if code else ""
    
    prompt = f"""
You are an AI interview evaluator.

Evaluate the candidate answer.

Question:
{question}

Candidate Answer (Speech):
{transcript}
{code_section}
Return only valid JSON in this format:
{{
  "technical_score": 0,
  "communication_score": 0,
  "confidence_score": 0,
  "strengths": [],
  "weaknesses": [],
  "suggestions": [],
  "tone": "Determined by AI (e.g. Confident, Hesitant, Nervous, Enthusiastic)"
}}
"""

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )

    try:
        text = response.text.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception:
        return {
            "technical_score": 70,
            "communication_score": 70,
            "confidence_score": 70,
            "strengths": ["Answer was attempted."],
            "weaknesses": ["Could not parse detailed AI response."],
            "suggestions": ["Try giving a clearer and more structured answer."],
            "tone": "Unknown"
        }


def generate_interview_questions(
    role: str,
    interview_type: str,
    difficulty: str,
    count: int,
    resume_text: str = ""
):
    resume_section = ""

    if resume_text:
        resume_section = f"""
Candidate Resume Text:
{resume_text[:3000]}

Generate questions based on the candidate's skills, projects, and experience.
"""

    prompt = f"""
You are an interview question generator.

Generate {count} interview questions.

Role: {role}
Interview Type: {interview_type}
Difficulty: {difficulty}

{resume_section}

Rules:
- Return only valid JSON.
- Do not add explanation.
- Questions should be practical and interview-like.
- If resume text is provided, include resume/project-based questions.
- Format:
{{
  "questions": [
    "Question 1",
    "Question 2"
  ]
}}
"""

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )

    try:
        text = response.text.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception:
        return {
            "questions": [
                "Tell me about yourself.",
                "Explain one project from your resume.",
                "What technologies did you use in your project?",
                "What challenges did you face while building your project?",
                "Why should we hire you?"
            ]
        }