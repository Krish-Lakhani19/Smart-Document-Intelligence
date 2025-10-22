# Document Intelligence Platform - Production Backend
# Requirements: pip install fastapi uvicorn langchain langchain-community langchain-openai 
#               chromadb pypdf python-multipart sentence-transformers openai

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
from datetime import datetime

# LangChain imports
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_community.document_loaders import PyPDFLoader, TextLoader

# Document processing
import chromadb
from chromadb.config import Settings
import shutil
import tempfile

# Initialize FastAPI
app = FastAPI(title="Document Intelligence API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = "uploads"
VECTOR_DB_DIR = "vector_db"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(VECTOR_DB_DIR, exist_ok=True)

# OpenAI API Key (set as environment variable)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-api-key-here")

# Initialize embeddings (using free HuggingFace model)
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# Alternative: Use OpenAI embeddings (requires API key)
# embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

# Document storage
documents_db = {}

# Pydantic models
class DocumentResponse(BaseModel):
    id: str
    name: str
    upload_date: str
    word_count: int
    size: str
    status: str

class QueryRequest(BaseModel):
    document_id: str
    query: str

class QueryResponse(BaseModel):
    answer: str
    source_documents: List[str]
    confidence: float

class AnalysisResponse(BaseModel):
    word_count: int
    sentence_count: int
    paragraph_count: int
    avg_words_per_sentence: float
    top_keywords: List[dict]
    reading_time: int
    sentiment: str

# Helper functions
def process_document(file_path: str, file_type: str):
    """Load and split document into chunks"""
    try:
        if file_type == "pdf":
            loader = PyPDFLoader(file_path)
        else:
            loader = TextLoader(file_path)
        
        documents = loader.load()
        
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        
        chunks = text_splitter.split_documents(documents)
        return chunks, documents[0].page_content if documents else ""
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

def create_vector_store(doc_id: str, chunks):
    """Create ChromaDB vector store for document"""
    try:
        persist_directory = os.path.join(VECTOR_DB_DIR, doc_id)
        
        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=persist_directory
        )
        
        return vectorstore
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating vector store: {str(e)}")

def analyze_text(text: str) -> dict:
    """Perform statistical analysis on text"""
    words = text.split()
    sentences = text.split('.')
    paragraphs = text.split('\n\n')
    
    # Word frequency
    word_freq = {}
    for word in words:
        clean_word = word.lower().strip('.,!?;:"()[]{}')
        if len(clean_word) > 3:
            word_freq[clean_word] = word_freq.get(clean_word, 0) + 1
    
    top_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Simple sentiment (can be enhanced with transformers)
    positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'positive']
    negative_words = ['bad', 'terrible', 'poor', 'negative', 'awful', 'horrible']
    
    pos_count = sum(1 for word in words if word.lower() in positive_words)
    neg_count = sum(1 for word in words if word.lower() in negative_words)
    
    if pos_count > neg_count:
        sentiment = "Positive"
    elif neg_count > pos_count:
        sentiment = "Negative"
    else:
        sentiment = "Neutral"
    
    return {
        "word_count": len(words),
        "sentence_count": len([s for s in sentences if s.strip()]),
        "paragraph_count": len([p for p in paragraphs if p.strip()]),
        "avg_words_per_sentence": round(len(words) / max(len(sentences), 1), 1),
        "top_keywords": [{"word": word, "count": count} for word, count in top_keywords],
        "reading_time": max(1, len(words) // 200),
        "sentiment": sentiment
    }

# API Endpoints

@app.get("/")
def root():
    return {
        "message": "Document Intelligence API",
        "version": "1.0.0",
        "endpoints": ["/upload", "/query", "/documents", "/analyze/{doc_id}"]
    }

@app.post("/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document"""
    try:
        # Generate unique document ID
        doc_id = str(uuid.uuid4())
        
        # Save uploaded file
        file_extension = file.filename.split('.')[-1].lower()
        file_path = os.path.join(UPLOAD_DIR, f"{doc_id}.{file_extension}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process document
        file_type = "pdf" if file_extension == "pdf" else "txt"
        chunks, full_text = process_document(file_path, file_type)
        
        # Create vector store
        vectorstore = create_vector_store(doc_id, chunks)
        
        # Calculate stats
        word_count = len(full_text.split())
        file_size = os.path.getsize(file_path) / 1024  # KB
        
        # Store document metadata
        documents_db[doc_id] = {
            "id": doc_id,
            "name": file.filename,
            "file_path": file_path,
            "upload_date": datetime.now().isoformat(),
            "word_count": word_count,
            "size": f"{file_size:.2f} KB",
            "status": "processed",
            "vectorstore": vectorstore,
            "full_text": full_text
        }
        
        return DocumentResponse(**documents_db[doc_id])
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=QueryResponse)
async def query_document(request: QueryRequest):
    """Query a document using RAG (Retrieval Augmented Generation)"""
    try:
        if request.document_id not in documents_db:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc = documents_db[request.document_id]
        vectorstore = doc["vectorstore"]
        
        # Create QA chain with custom prompt
        prompt_template = """Use the following pieces of context to answer the question at the end. 
        If you don't know the answer, just say that you don't know, don't try to make up an answer.
        
        Context: {context}
        
        Question: {question}
        
        Answer:"""
        
        PROMPT = PromptTemplate(
            template=prompt_template, 
            input_variables=["context", "question"]
        )
        
        # Initialize LLM (using OpenAI - you can switch to local models)
        llm = ChatOpenAI(
            model_name="gpt-3.5-turbo",
            temperature=0.3,
            openai_api_key=OPENAI_API_KEY
        )
        
        # Alternative: Use local model with Ollama or HuggingFace
        # from langchain_community.llms import Ollama
        # llm = Ollama(model="llama2")
        
        # Create QA chain
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
            return_source_documents=True,
            chain_type_kwargs={"prompt": PROMPT}
        )
        
        # Get answer
        result = qa_chain({"query": request.query})
        
        # Extract source documents
        source_docs = [doc.page_content[:200] + "..." for doc in result.get("source_documents", [])]
        
        return QueryResponse(
            answer=result["result"],
            source_documents=source_docs,
            confidence=0.85  # Can be calculated based on retrieval scores
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents", response_model=List[DocumentResponse])
async def list_documents():
    """Get list of all uploaded documents"""
    docs = []
    for doc_id, doc in documents_db.items():
        docs.append(DocumentResponse(
            id=doc["id"],
            name=doc["name"],
            upload_date=doc["upload_date"],
            word_count=doc["word_count"],
            size=doc["size"],
            status=doc["status"]
        ))
    return docs

@app.get("/analyze/{document_id}", response_model=AnalysisResponse)
async def analyze_document(document_id: str):
    """Get detailed analysis of a document"""
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = documents_db[document_id]
    analysis = analyze_text(doc["full_text"])
    
    return AnalysisResponse(**analysis)

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document"""
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = documents_db[document_id]
    
    # Delete file
    if os.path.exists(doc["file_path"]):
        os.remove(doc["file_path"])
    
    # Delete vector store
    vector_dir = os.path.join(VECTOR_DB_DIR, document_id)
    if os.path.exists(vector_dir):
        shutil.rmtree(vector_dir)
    
    # Remove from database
    del documents_db[document_id]
    
    return {"message": "Document deleted successfully"}

# Run with: uvicorn main:app --reload --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)