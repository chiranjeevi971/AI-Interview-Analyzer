from faster_whisper import WhisperModel
import re

model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)


def transcribe_audio(file_path):
    segments, info = model.transcribe(
        file_path,
        language="en",
        task="transcribe"
    )

    transcript = ""
    speaking_duration = 0

    for segment in segments:
        transcript += segment.text + " "
        speaking_duration += segment.end - segment.start

    transcript = transcript.strip()

    speaking_analytics = calculate_speaking_analytics(
        transcript,
        speaking_duration
    )

    return transcript, speaking_analytics


def calculate_speaking_analytics(transcript, speaking_duration):
    words = transcript.split()
    word_count = len(words)

    sentences = re.split(r"[.!?]+", transcript)
    sentences = [s.strip() for s in sentences if s.strip()]
    sentence_count = len(sentences)

    duration_minutes = speaking_duration / 60 if speaking_duration > 0 else 1

    words_per_minute = round(word_count / duration_minutes)

    avg_words_per_sentence = (
        round(word_count / sentence_count, 1)
        if sentence_count > 0
        else word_count
    )

    if words_per_minute < 90:
        speaking_pace = "Slow"
    elif words_per_minute <= 160:
        speaking_pace = "Normal"
    else:
        speaking_pace = "Fast"

    return {
        "word_count": word_count,
        "speaking_duration": round(speaking_duration, 2),
        "words_per_minute": words_per_minute,
        "average_words_per_sentence": avg_words_per_sentence,
        "speaking_pace": speaking_pace
    }