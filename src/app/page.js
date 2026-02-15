'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Database, Loader2, Sparkles, AlertCircle, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css'; // Import a dark theme for code blocks
import { askGeminiRAG } from './actions';

// --- HELPER: Custom Pre Tag (Code Block Wrapper) ---
// This wraps the highlighted code to add the "Copy" button header
const PreBlock = ({ children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const preRef = useRef(null);

  const handleCopy = () => {
    if (preRef.current) {
      // Get the raw text content from the code block
      const codeText = preRef.current.innerText;
      navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-700 bg-[#282c34] shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-[#21252b] border-b border-slate-700">
        <span className="text-xs text-slate-400 font-mono lowercase">code</span>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {/* The actual code block (highlighted by rehype) goes here */}
      <pre ref={preRef} {...props} className="p-4 overflow-x-auto text-sm font-mono text-slate-300 leading-relaxed custom-scrollbar">
        {children}
      </pre>
    </div>
  );
};

export default function DocsChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm connected to your local Knowledge Base. Ask me anything about your documents." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput(""); 
    
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await askGeminiRAG(messages, userMsg);

      if (response.success) {
        setMessages(prev => [...prev, { role: 'assistant', text: response.message }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ ${response.message}` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Error connecting to the server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Sidebar Info (Desktop) */}
      <aside className="w-80 bg-white border-r border-slate-200 hidden md:flex flex-col shadow-sm z-10">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-slate-900">Ant-d docs RAG</h1>
              <p className="text-[11px] text-indigo-600 font-bold uppercase tracking-widest">Local Knowledge Base</p>
            </div>
          </div>
          
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm leading-relaxed text-slate-500">
            <div className="flex items-center gap-2 mb-3 text-indigo-600 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> System Status
            </div>
            <ul className="space-y-3 text-xs font-medium">
              <li className="flex gap-2.5 items-center">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-slate-700">Database Active</span>
              </li>
              <li className="flex gap-2.5 items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                </div>
                <span className="text-slate-600">Model: gemini-2.5-flash</span>
              </li>
              <li className="flex gap-2.5 items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                </div>
                <span className="text-slate-600">Vectors: gemini-embedding-001</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex-1 p-8">
            <div className="flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100/50">
                    <h3 className="text-indigo-900 font-bold text-sm mb-1">Did you know?</h3>
                    <p className="text-indigo-700/80 text-xs leading-relaxed">
                        The system uses cosine similarity to find the most relevant chunks of text from your <span className="font-mono bg-white/50 px-1 rounded text-indigo-800">database.json</span>.
                    </p>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-slate-100">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-100">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
            <p>Ensure <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">database.json</code> is present in your project root.</p>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col relative h-full">
        {/* Header Mobile */}
        <div className="md:hidden h-16 bg-white border-b flex items-center px-4 justify-between shrink-0">
            <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-slate-800">Docs RAG</span>
            </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 scroll-smooth">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
              <div className={`flex gap-4 max-w-[90%] md:max-w-[75%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1 border ${
                  m.role === 'user' 
                    ? 'bg-white border-indigo-100' 
                    : 'bg-indigo-600 border-transparent'
                }`}>
                  {m.role === 'user' 
                    ? <User className="w-4 h-4 text-indigo-600"/> 
                    : <Bot className="w-4 h-4 text-white"/>}
                </div>

                {/* Bubble */}
                <div className={`p-5 rounded-2xl text-[15px] leading-7 shadow-sm transition-all duration-200 ${
                  m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-200' 
                  : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-slate-100'
                }`}>
                  <ReactMarkdown 
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      pre: PreBlock // Use our custom PreBlock for code snippets
                    }}
                  >
                    {m.text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start ml-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 flex items-center gap-3 text-sm text-slate-500 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> 
                <span className="font-medium">Reading documents...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-[#F8FAFC]">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSend} className="relative group">
                <div className="absolute inset-0 bg-indigo-100 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <input 
                className="w-full relative bg-white border border-slate-200 rounded-3xl pl-6 pr-16 py-4 text-[15px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 shadow-sm text-slate-800"
                placeholder="Ask a question about your documents..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                />
                <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 hover:shadow-lg active:scale-95 z-10"
                >
                <Send className="w-5 h-5 ml-0.5" />
                </button>
            </form>
            <p className="text-center text-xs text-slate-400 mt-3 font-medium">
                Powered by Local RAG & Gemini
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}