from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import os
import re
from datetime import datetime
from bson import ObjectId

from ai_service import evaluate_answer, generate_interview_questions
from speech_service import transcribe_audio
from resume_service import extract_resume_text
from database import reports_collection, users_collection
from auth_service import hash_password, verify_password, create_access_token, decode_access_token
from models import SignupRequest, LoginRequest
from fastapi import FastAPI, UploadFile, File, Form, Header

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
RESUME_FOLDER = "resumes"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESUME_FOLDER, exist_ok=True)


def detect_filler_words(transcript):
    filler_words = ["um", "uh", "actually", "basically", "like", "you know"]

    result = {}
    total = 0
    text = transcript.lower()

    for word in filler_words:
        pattern = r"\b" + re.escape(word) + r"\b"
        count = len(re.findall(pattern, text))

        if count > 0:
            result[word] = count
            total += count

    return result, total


def calculate_confidence_score(transcript, total_filler_words):
    word_count = len(transcript.split())
    score = 80

    if word_count < 20:
        score -= 20

    if total_filler_words > 5:
        score -= 15
    elif total_filler_words > 2:
        score -= 8

    if word_count > 40:
        score += 5

    return max(0, min(score, 100))
async def get_current_user(authorization: str):
    if not authorization:
        return None

    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_access_token(token)
        return payload
    except Exception:
        return None


@app.get("/")
def home():
    return {"message": "AI Interview Analyzer Backend Running"}


@app.post("/signup")
async def signup(user: SignupRequest):
    existing_user = await users_collection.find_one({"email": user.email})

    if existing_user:
        return {
            "success": False,
            "message": "User already exists with this email",
        }

    hashed_password = hash_password(user.password)

    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "created_at": datetime.utcnow().isoformat(),
    }

    result = await users_collection.insert_one(new_user)

    token = create_access_token({
        "user_id": str(result.inserted_id),
        "email": user.email,
    })

    return {
        "success": True,
        "message": "Signup successful",
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "name": user.name,
            "email": user.email,
        },
    }


@app.post("/login")
async def login(user: LoginRequest):
    existing_user = await users_collection.find_one({"email": user.email})

    if not existing_user:
        return {
            "success": False,
            "message": "Invalid email or password",
        }

    password_valid = verify_password(user.password, existing_user["password"])

    if not password_valid:
        return {
            "success": False,
            "message": "Invalid email or password",
        }

    token = create_access_token({
        "user_id": str(existing_user["_id"]),
        "email": existing_user["email"],
    })

    return {
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": {
            "id": str(existing_user["_id"]),
            "name": existing_user["name"],
            "email": existing_user["email"],
        },
    }


@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    file_path = os.path.join(RESUME_FOLDER, file.filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    try:
        resume_text = extract_resume_text(file_path)
    except Exception as e:
        return {
            "message": "Resume uploaded, but text extraction failed.",
            "resume_text": "",
            "error": str(e),
        }

    return {
        "message": "Resume uploaded successfully",
        "filename": file.filename,
        "resume_text": resume_text,
    }


@app.post("/generate-questions")
async def generate_questions(data: dict):
    role = data.get("role", "Software Engineer")
    interview_type = data.get("type", "Technical")
    difficulty = data.get("difficulty", "Medium")
    count = int(data.get("questions", 5))
    resume_text = data.get("resume_text", "")

    try:
        result = generate_interview_questions(
            role=role,
            interview_type=interview_type,
            difficulty=difficulty,
            count=count,
            resume_text=resume_text,
        )

        return result

    except Exception as e:
        return {
            "questions": [
                "Tell me about yourself.",
                "Explain one project from your resume.",
                "What technologies did you use in your project?",
                "What challenges did you face while building your project?",
                "Why should we hire you?",
            ],
            "error": str(e),
        }


@app.post("/upload-audio")
async def upload_audio(
    file: UploadFile = File(...),
    question: str = Form(...)
):
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    try:
        transcript = transcribe_audio(file_path)

    except Exception as e:
        return {
            "message": "Audio uploaded, but transcription failed.",
            "filename": file.filename,
            "question": question,
            "transcript": "",
            "filler_words": {},
            "total_filler_words": 0,
            "confidence_score": 0,
            "ai_feedback": {
                "technical_score": 0,
                "communication_score": 0,
                "confidence_score": 0,
                "strengths": [],
                "weaknesses": ["Speech-to-text failed."],
                "suggestions": [str(e)],
            },
        }

    filler_words, total_filler_words = detect_filler_words(transcript)

    confidence_score = calculate_confidence_score(
        transcript,
        total_filler_words
    )

    try:
        ai_feedback = evaluate_answer(
            question=question,
            transcript=transcript
        )

    except Exception as e:
        ai_feedback = {
            "technical_score": 0,
            "communication_score": 0,
            "confidence_score": confidence_score,
            "strengths": [],
            "weaknesses": ["AI feedback failed."],
            "suggestions": [str(e)],
        }

    return {
        "message": "Audio uploaded successfully",
        "filename": file.filename,
        "question": question,
        "transcript": transcript,
        "filler_words": filler_words,
        "total_filler_words": total_filler_words,
        "confidence_score": confidence_score,
        "ai_feedback": ai_feedback,
    }


@app.post("/save-report")
async def save_report(report: dict, authorization: str = Header(None)):
    current_user = await get_current_user(authorization)

    if not current_user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    report["user_id"] = current_user["user_id"]
    report["created_at"] = datetime.utcnow().isoformat()

    result = await reports_collection.insert_one(report)

    return {
        "success": True,
        "message": "Report saved successfully",
        "report_id": str(result.inserted_id),
    }


@app.get("/reports")
async def get_reports(authorization: str = Header(None)):
    current_user = await get_current_user(authorization)

    if not current_user:
        return {
            "success": False,
            "reports": []
        }

    reports = []

    cursor = reports_collection.find({
        "user_id": current_user["user_id"]
    }).sort("created_at", -1)

    async for report in cursor:
        report["_id"] = str(report["_id"])
        reports.append(report)

    return {
        "success": True,
        "reports": reports
    }


@app.delete("/reports/{report_id}")
async def delete_report(report_id: str, authorization: str = Header(None)):
    current_user = await get_current_user(authorization)

    if not current_user:
        return {
            "success": False,
            "message": "Unauthorized"
        }

    try:
        result = await reports_collection.delete_one({
            "_id": ObjectId(report_id),
            "user_id": current_user["user_id"]
        })

        if result.deleted_count == 1:
            return {
                "success": True,
                "message": "Report deleted successfully"
            }

        return {
            "success": False,
            "message": "Report not found"
        }

    except Exception as e:
        return {
            "success": False,
            "message": "Invalid report id or delete failed",
            "error": str(e)
        }