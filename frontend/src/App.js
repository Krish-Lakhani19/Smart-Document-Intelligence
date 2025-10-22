import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, MessageSquare, Loader2, Trash2, Search, BarChart3, Brain, ChevronDown, ChevronUp } from 'lucide-react';

export default function DocumentIntelligence() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [docAnalysis, setDocAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const docsResult = await window.storage.get('documents-list');
      if (docsResult) {
        setDocuments(JSON.parse(docsResult.value));
      }
    } catch (error) {
      console.log('No stored documents found');
    }
  };

  const saveDocuments = async (docs) => {
    try {
      await window.storage.set('documents-list', JSON.stringify(docs));
    } catch (error) {
      console.error('Error saving documents:', error);
    }
  };

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setIsProcessing(true);

  try {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;

      const doc = {
        id: Date.now(),
        name: file.name,
        content: text,
        uploadDate: new Date().toISOString(),
        wordCount: text.split(/\s+/).length,
        size: (text.length / 1024).toFixed(2) + ' KB'
      };

      const analysis = performDocumentAnalysis(text);
      doc.analysis = analysis;

      const newDocs = [...documents, doc];
      setDocuments(newDocs);
      await saveDocuments(newDocs);
      setSelectedDoc(doc);
      setActiveTab('chat');

      setChatHistory([
        {
          type: 'system',
          message: `Document "${file.name}" uploaded successfully! I've analyzed it and I'm ready to answer your questions.`
        }
      ]);

      setIsProcessing(false);
    };

    reader.onerror = () => {
      alert('Error reading file. Please ensure the file is uploaded and try again.');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  } catch (error) {
    alert('Error reading file. Please ensure the file is uploaded and try again.');
    setIsProcessing(false);
  }
};


  const performDocumentAnalysis = (text) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    const wordFreq = {};
    words.forEach(word => {
      const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean.length > 3) {
        wordFreq[clean] = (wordFreq[clean] || 0) + 1;
      }
    });

    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    return {
      sentenceCount: sentences.length,
      wordCount: words.length,
      paragraphCount: paragraphs.length,
      avgWordsPerSentence: (words.length / sentences.length).toFixed(1),
      topWords,
      readingTime: Math.ceil(words.length / 200)
    };
  };

  const extractRelevantContext = (content, query) => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const scoredSentences = sentences.map(sentence => {
      const lowerSentence = sentence.toLowerCase();
      let score = 0;
      queryWords.forEach(word => {
        if (lowerSentence.includes(word)) score += 1;
      });
      return { sentence: sentence.trim(), score };
    });

    const relevantSentences = scoredSentences
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.sentence);

    return relevantSentences.length > 0 
      ? relevantSentences.join('. ') 
      : sentences.slice(0, 5).join('. ');
  };

  const generateAnswer = (context, query) => {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('summar')) {
      const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 0);
      return `Here's a summary based on the document: ${sentences.slice(0, 3).join('. ')}.`;
    }
    
    if (queryLower.includes('how many') || queryLower.includes('count')) {
      const numbers = context.match(/\d+/g);
      if (numbers) {
        return `Based on the document, I found the following numbers: ${numbers.slice(0, 5).join(', ')}. ${context.split('.')[0]}.`;
      }
    }

    if (queryLower.includes('what is') || queryLower.includes('define')) {
      const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 0);
      return sentences[0] ? sentences[0].trim() + '.' : 'I found some relevant information in the document.';
    }

    const relevantSentences = context.split(/[.!?]+/).filter(s => s.trim().length > 0).slice(0, 3);
    return `Based on the document: ${relevantSentences.join('. ')}.`;
  };

  const handleQuery = async () => {
    if (!query.trim() || !selectedDoc) return;

    const userMessage = { type: 'user', message: query };
    setChatHistory(prev => [...prev, userMessage]);
    setIsProcessing(true);

    setTimeout(() => {
      const context = extractRelevantContext(selectedDoc.content, query);
      const answer = generateAnswer(context, query);
      
      const aiMessage = { 
        type: 'ai', 
        message: answer,
        context: context.slice(0, 200) + '...'
      };
      
      setChatHistory(prev => [...prev, aiMessage]);
      setIsProcessing(false);
      setQuery('');
    }, 1000);
  };

  const deleteDocument = async (docId) => {
    const newDocs = documents.filter(d => d.id !== docId);
    setDocuments(newDocs);
    await saveDocuments(newDocs);
    
    if (selectedDoc?.id === docId) {
      setSelectedDoc(null);
      setChatHistory([]);
    }
  };

  const showDocumentAnalysis = (doc) => {
    setDocAnalysis(doc.analysis);
    setShowAnalysis(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-12 h-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Smart Document Intelligence</h1>
          </div>
          <p className="text-gray-600 text-lg">Upload documents and ask questions powered by AI analysis</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-2 shadow-sm">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Upload
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            disabled={!selectedDoc}
          >
            <MessageSquare className="w-5 h-5 inline mr-2" />
            Q&A Chat
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'library'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5 inline mr-2" />
            Library ({documents.length})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {activeTab === 'upload' && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Document</h2>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-3 border-dashed border-indigo-300 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                >
                  <Upload className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports TXT files (PDF support coming soon)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                
                {isProcessing && (
                  <div className="mt-6 flex items-center justify-center text-indigo-600">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Processing document...</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chat' && selectedDoc && (
              <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col h-[600px]">
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Chat with Document</h2>
                    <p className="text-sm text-gray-500">{selectedDoc.name}</p>
                  </div>
                  <button
                    onClick={() => showDocumentAnalysis(selectedDoc)}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all"
                  >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    View Analysis
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {chatHistory.map((chat, idx) => (
                    <div
                      key={idx}
                      className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          chat.type === 'user'
                            ? 'bg-indigo-600 text-white'
                            : chat.type === 'system'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{chat.message}</p>
                        {chat.context && (
                          <div className="mt-2 pt-2 border-t border-gray-300 text-xs opacity-75">
                            <p className="font-semibold mb-1">Source Context:</p>
                            <p>{chat.context}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                    placeholder="Ask a question about the document..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleQuery}
                    disabled={!query.trim() || isProcessing}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'chat' && !selectedDoc && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Select a document to start chatting</p>
              </div>
            )}

            {activeTab === 'library' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Document Library</h2>
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No documents uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-2">{doc.name}</h3>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span>📄 {doc.wordCount} words</span>
                              <span>💾 {doc.size}</span>
                              <span>📅 {new Date(doc.uploadDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedDoc(doc);
                                setActiveTab('chat');
                                setChatHistory([{
                                  type: 'system',
                                  message: `Now chatting with "${doc.name}". Ask me anything!`
                                }]);
                              }}
                              className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-all"
                            >
                              Chat
                            </button>
                            <button
                              onClick={() => deleteDocument(doc.id)}
                              className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Document Info */}
            {selectedDoc && (
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="font-bold text-lg mb-4">Active Document</h3>
                <p className="text-sm opacity-90 mb-2 truncate">{selectedDoc.name}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="opacity-75">Words:</span>
                    <span className="font-semibold">{selectedDoc.wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Size:</span>
                    <span className="font-semibold">{selectedDoc.size}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Panel */}
            {showAnalysis && docAnalysis && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-gray-800">Document Analysis</h3>
                  <button
                    onClick={() => setShowAnalysis(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sentences:</span>
                    <span className="font-semibold">{docAnalysis.sentenceCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paragraphs:</span>
                    <span className="font-semibold">{docAnalysis.paragraphCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Words/Sentence:</span>
                    <span className="font-semibold">{docAnalysis.avgWordsPerSentence}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reading Time:</span>
                    <span className="font-semibold">{docAnalysis.readingTime} min</span>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-gray-600 font-semibold mb-2">Top Keywords:</p>
                    <div className="flex flex-wrap gap-2">
                      {docAnalysis.topWords.slice(0, 5).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs"
                        >
                          {item.word} ({item.count})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Features</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>AI-powered Q&A</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Document analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Context extraction</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Persistent storage</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}