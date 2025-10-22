<div align="center">

# 🧠 Document Intelligence Platform

### AI-Powered Document Analysis & Question Answering System

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Documentation](#documentation) • [API](#api-reference)

</div>

---

## Overview

A production-ready platform that leverages Large Language Models (LLMs) and Retrieval Augmented Generation (RAG) to enable intelligent document analysis and natural language question-answering. Built for researchers, legal professionals, and organizations requiring fast, accurate document insights.

### Key Capabilities

- **Intelligent Q&A** — Ask questions in natural language, get contextual answers
- **Semantic Search** — Vector-based similarity search for relevant content
- **Multi-Format Support** — Process PDF, TXT, and DOCX documents
- **Real-Time Analytics** — Comprehensive document statistics and insights
- **Enterprise-Ready** — Scalable architecture with production-grade error handling

---

## Features

<table>
<tr>
<td width="50%">

### 🤖 AI-Powered
- GPT-3.5/4 integration
- RAG pipeline
- Context-aware responses
- Source citation

</td>
<td width="50%">

### 📊 Analytics
- Word frequency analysis
- Sentiment detection
- Reading time estimation
- Keyword extraction

</td>
</tr>
<tr>
<td width="50%">

### 🎨 Modern UI
- React + TailwindCSS
- Responsive design
- Real-time updates
- Intuitive interface

</td>
<td width="50%">

### 🚀 Performance
- Async processing
- Vector embeddings
- Efficient chunking
- Fast retrieval

</td>
</tr>
</table>

---

## Demo

### Upload & Analyze
<div align="center">

```mermaid
graph LR
    A[Upload Document] --> B[Text Extraction]
    B --> C[Chunking]
    C --> D[Embedding]
    D --> E[Vector Storage]
    E --> F[Ready for Q&A]
    style A fill:#667eea
    style F fill:#10b981
```

</div>

### Question Answering
```
User: "What are the main findings of this research paper?"

AI: "Based on the document, the main findings include three key areas:
     1. Improved accuracy by 23% using the proposed method...
     2. Reduced processing time from 5 hours to 30 minutes...
     3. Cost reduction of approximately 40% in production..."

Sources: [Page 12, Section 4.2] [Page 15, Table 3]
```

---

## Tech Stack

### Backend
```
Python 3.8+  │  FastAPI  │  LangChain  │  ChromaDB  │  OpenAI API
```

### Frontend
```
React 18  │  TailwindCSS  │  Axios  │  Lucide Icons
```

### AI/ML
```
GPT-3.5-turbo  │  HuggingFace Embeddings  │  Vector Search  │  RAG Pipeline
```

---

## Installation

### Prerequisites

```bash
Python 3.8+  •  Node.js 16+  •  Git
```

### Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/document-intelligence-platform.git
cd document-intelligence-platform

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Configure environment
cp backend/.env.example backend/.env
# Add your OpenAI API key to backend/.env
```

### Environment Configuration

Create `backend/.env`:

```env
OPENAI_API_KEY=sk-proj-your-key-here
DATABASE_URL=sqlite:///./documents.db
UPLOAD_DIR=uploads
VECTOR_DB_DIR=vector_db
```

> 🔑 **Get API Key:** [OpenAI Platform](https://platform.openai.com/api-keys)  
> 💰 **Cost:** ~$0.002 per query (GPT-3.5-turbo)

---

## Usage

### Start Backend
```bash
cd backend
uvicorn main:app --reload
```
Backend runs at: `http://localhost:8000`  
API Documentation: `http://localhost:8000/docs`

### Start Frontend
```bash
cd frontend
npm start
```
Application opens at: `http://localhost:3000`

### Using the Application

1. **Upload Document** — Drop PDF/TXT files via the upload interface
2. **Wait for Processing** — Automatic text extraction and embedding generation
3. **Ask Questions** — Type natural language questions about your document
4. **Get Answers** — Receive AI-generated responses with source citations
5. **View Analytics** — Access document statistics and insights

---

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload and process document |
| `POST` | `/query` | Ask question about document |
| `GET` | `/documents` | List all documents |
| `GET` | `/analyze/{id}` | Get document analytics |
| `DELETE` | `/documents/{id}` | Delete document |

### Example Request

```bash
# Upload document
curl -X POST "http://localhost:8000/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf"

# Query document
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "uuid-here",
    "query": "What is the conclusion?"
  }'
```

### Response Format

```json
{
  "answer": "The conclusion states that...",
  "source_documents": [
    "Excerpt from page 10...",
    "Excerpt from page 15..."
  ],
  "confidence": 0.87
}
```

Full API documentation available at `/docs` endpoint.

---

## Project Structure

```
document-intelligence-platform/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables (not committed)
│   ├── uploads/                # Document storage (auto-created)
│   └── vector_db/              # ChromaDB storage (auto-created)
│
├── frontend/
│   ├── src/
│   │   ├── App.js              # Main React component
│   │   └── index.css           # Tailwind styles
│   ├── package.json            # Node dependencies
│   └── public/                 # Static assets
│
├── docs/
│   └── index.html              # Technical documentation
│
├── .gitignore                  # Git ignore rules
├── README.md                   # This file
└── LICENSE                     # MIT License
```

---

## Configuration

### Using Local Models (Free Alternative)

Instead of OpenAI, use local models with Ollama:

```bash
# Install Ollama
# Visit: https://ollama.ai/download

# Download model
ollama pull llama2

# Modify backend/main.py
from langchain_community.llms import Ollama
llm = Ollama(model="llama2")
```

**Advantages:**
- ✅ Completely free
- ✅ No API limits
- ✅ Works offline
- ✅ Privacy-focused

---

## Deployment

### Backend (Render)

```bash
# render.yaml
services:
  - type: web
    name: doc-intelligence-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend (Vercel)

```bash
# One-click deployment
vercel deploy
```

**Live URLs:**
- Backend: `https://your-app.onrender.com`
- Frontend: `https://your-app.vercel.app`

---

## Documentation

- 📖 **[Full Documentation](./docs/index.html)** — Comprehensive technical guide
- 🚀 **[API Reference](http://localhost:8000/docs)** — Interactive API documentation
- 🔧 **[Setup Guide](./docs/SETUP.md)** — Detailed installation instructions
- ❓ **[FAQ](./docs/FAQ.md)** — Common questions and solutions

---

## Troubleshooting

<details>
<summary><b>Module not found errors</b></summary>

```bash
# Ensure virtual environment is activated
source venv/bin/activate  # Windows: venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt
```
</details>

<details>
<summary><b>OpenAI API errors</b></summary>

- Verify API key in `.env` file
- Check account has available credits
- Ensure key starts with `sk-proj-` or `sk-`
- Monitor usage at [OpenAI Dashboard](https://platform.openai.com/usage)
</details>

<details>
<summary><b>Port already in use</b></summary>

```bash
# Kill process on port 8000
# Mac/Linux:
lsof -ti:8000 | xargs kill -9

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```
</details>

<details>
<summary><b>CORS errors</b></summary>

Update `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
</details>

---

## Roadmap

- [ ] Multi-user authentication
- [ ] Collaborative document sharing
- [ ] Advanced OCR for scanned documents
- [ ] Multi-language support
- [ ] Export chat history
- [ ] Custom model fine-tuning
- [ ] Mobile application
- [ ] Batch processing API

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **LangChain** — LLM application framework
- **FastAPI** — Modern Python web framework
- **OpenAI** — GPT models
- **ChromaDB** — Vector database
- **React** — UI framework

---

## Support

- 📧 **Email:** your.email@example.com
- 🐛 **Issues:** [GitHub Issues](https://github.com/yourusername/document-intelligence-platform/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/yourusername/document-intelligence-platform/discussions)

---

<div align="center">

**Built with ❤️ using AI & Machine Learning**

⭐ Star this repo if you find it useful!

[Report Bug](https://github.com/yourusername/document-intelligence-platform/issues) • [Request Feature](https://github.com/yourusername/document-intelligence-platform/issues)

</div>