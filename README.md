# 🎓 MentorAI — AI Career Mentor Chatbot

A beautiful, full-stack AI career mentoring chatbot powered by **Flask** and **Groq** (`llama3-8b-8192`).

---

## ✨ Features

- 🗺️ Career roadmaps tailored to your goals
- 🛠️ Skill & certification recommendations
- 📄 Resume & portfolio advice
- 🎤 Interview preparation & mock questions
- ⚡ Motivation & productivity guidance
- 💬 Multi-turn conversation memory
- 🌙 Premium dark glassmorphism UI

---

## 🚀 Quick Start

### 1. Clone / open the project folder
```bash
cd mentor-ai
```

### 2. Create a virtual environment (recommended)
```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up your API key
```bash
copy .env.example .env
```
Open `.env` and set your **Groq API key** (free at https://console.groq.com):
```
GROQ_API_KEY=gsk_your_key_here
```

### 5. Run the app
```bash
python app.py
```

Open your browser at **http://127.0.0.1:5000** 🎉

---

## 📁 Project Structure

```
mentor-ai/
├── app.py                  # Flask backend + Groq integration
├── requirements.txt
├── .env.example
├── templates/
│   └── index.html          # Chat UI
└── static/
    ├── css/style.css       # Premium dark theme
    └── js/main.js          # Chat logic
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Required. Get from https://console.groq.com |
| `FLASK_SECRET_KEY` | Optional. Flask session secret (default: dev key) |

---

## 💡 Quick Action Chips

| Chip | What it sends |
|---|---|
| Career Roadmap | Step-by-step roadmap |
| Interview Prep | Mock questions + tips |
| Resume Tips | Resume review advice |
| Motivation | Encouragement & strategy |
| Skill Advice | Learning path recommendations |
