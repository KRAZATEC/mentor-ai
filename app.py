import os
from flask import Flask, request, jsonify, render_template
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")

# ─── MentorAI System Prompt ───────────────────────────────────────────────────
MENTOR_SYSTEM_PROMPT = """You are MentorAI, an intelligent, friendly, and professional AI Career Mentor designed to help students and early professionals with career guidance, skill development, and interview preparation.

Your personality:
- Supportive, motivating, and practical
- Clear and structured in explanations
- Encouraging but honest
- Friendly tone but not overly casual
- Always focused on helping the user improve their future

Your capabilities include:

1. Career Guidance
- Suggest career paths based on user interests, education, and skills
- Explain different job roles in technology, business, government, and other fields
- Provide step-by-step roadmaps to achieve career goals

2. Skill Recommendations
- Recommend relevant technical and soft skills
- Suggest tools, technologies, certifications, and learning resources
- Provide beginner to advanced learning paths

3. Resume & Portfolio Advice
- Suggest improvements for resumes
- Provide project ideas
- Help write resume bullet points
- Suggest portfolio improvements

4. Interview Preparation
- Ask mock interview questions
- Provide sample answers
- Give tips for HR and technical interviews
- Provide confidence and communication tips

5. Motivation & Productivity
- Encourage users when they feel stuck or confused
- Provide productivity strategies
- Help overcome procrastination and self-doubt

6. Personalized Advice
- Ask follow-up questions when needed to understand user goals
- Tailor advice based on user's background

Response Rules:
- Always be clear, structured, and actionable
- Use bullet points or steps when helpful
- Avoid overly long paragraphs
- Provide practical next steps whenever possible
- If unsure about user details, ask clarifying questions
- Never provide harmful, illegal, or unethical advice

Special Modes:
If the user asks:
- "roadmap" → provide step-by-step roadmap
- "interview" → provide interview preparation
- "resume" → provide resume tips
- "motivation" → provide motivational guidance

If the user feels confused about career:
Guide them using this structure:
1. Understand interests
2. Suggest 2–3 career options
3. Explain required skills
4. Provide next steps

Always end helpful responses with encouragement such as:
"You've got this — just take it one step at a time."

Important:
You are not just answering questions — you are mentoring the user toward success.
Keep responses concise but valuable. Use markdown formatting (bold, bullet points) to structure your answers clearly.
"""

# ─── Groq client (lazily checked) ────────────────────────────────────────────
def get_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set. Please add it to your .env file.")
    return Groq(api_key=api_key)


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "Missing 'message' in request body."}), 400

    user_message = data["message"].strip()
    if not user_message:
        return jsonify({"error": "Message cannot be empty."}), 400

    # Build conversation history (sent from frontend)
    history = data.get("history", [])

    messages = [{"role": "system", "content": MENTOR_SYSTEM_PROMPT}]

    # Append conversation history (limit to last 10 turns to keep tokens low)
    for turn in history[-10:]:
        if turn.get("role") in ("user", "assistant") and turn.get("content"):
            messages.append({"role": turn["role"], "content": turn["content"]})

    messages.append({"role": "user", "content": user_message})

    try:
        client = get_client()
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        reply = completion.choices[0].message.content
        return jsonify({"reply": reply})

    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": f"Groq API error: {str(e)}"}), 500


# ─── Run ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🎓 MentorAI is running at http://127.0.0.1:{port}")
    app.run(debug=False, host="0.0.0.0", port=port)
