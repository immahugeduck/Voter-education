import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles, AlertTriangle, CheckCircle, Flame, DollarSign, Send, BookOpen, MessageSquare, ChevronRight, Loader2, Copy } from "lucide-react";
import { PendingBillSummary, ChatMessage } from "../types";
import { parse as parsePartialJson } from "partial-json";

interface BillDetailModalProps {
  billId: string;
  onClose: () => void;
}

export default function BillDetailModal({ billId, onClose }: BillDetailModalProps) {
  const [summary, setSummary] = useState<Partial<PendingBillSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Chat state
  const [activeTab, setActiveTab] = useState<"summary" | "chat">("summary");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [aiResponding, setAiResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch the summary of the bill on load
  useEffect(() => {
    let active = true;
    async function loadSummary() {
      try {
        setLoading(true);
        setError(null);
        setSummary({}); // Initialize empty for progressive rendering

        const resp = await fetch(`/api/legislation/summarize-stream?id=${encodeURIComponent(billId)}`);
        if (!resp.body) throw new Error("No response body");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedJson = "";

        while (active) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split("\n\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              setLoading(false); // Hide skeleton once we get first data
              try {
                const data = JSON.parse(line.substring(6));
                accumulatedJson += data.chunk;
                
                try {
                  const partial = parsePartialJson(accumulatedJson);
                  if (active) {
                    setSummary(partial as Partial<PendingBillSummary>);
                  }
                } catch (e) {
                  // Ignore partial parsing errors
                }
              } catch (e) {
                console.error("Failed to parse SSE line", e);
              }
            }
          }
        }
      } catch (err: any) {
        if (active) {
          console.error(err);
          setError(err.message || "Unable to synthesize the requested bill. Please check your network connection.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSummary();
    return () => { active = false; };
  }, [billId]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial welcome message from AI
  useEffect(() => {
    if (summary) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! I am 'CapitolExpert AI'. I have reviewed **${summary.billId}: ${summary.oneLiner}**. 

You can ask me any policy question regarding this bill—for instance:
- *"Who profits or benefits most from this?"*
- *"Are there constitutional friction points?"*
- *"How does this influence energy markets?"*

How can I help you understand this bill today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [summary]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || aiResponding || !summary) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setAiResponding(true);

    try {
      const resp = await fetch("/api/legislation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          billContext: summary
        })
      });

      let resJson;
      try {
        resJson = await resp.json();
      } catch (e) {
        throw new Error("Connection failed");
      }

      if (!resp.ok) {
        throw new Error(resJson.error || "Connection failed");
      }

      const data = resJson;

      const responseMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, responseMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: err.message || "I'm having trouble reaching the research grid right now. Please test again in a moment.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setAiResponding(false);
    }
  }

  const handleCopyMarkdown = () => {
    if (!summary) return;
    
    let md = `# ${summary.billId || ""} - ${summary.officialTitle || ""}\n\n`;
    md += `**Status:** ${summary.status || ""}\n`;
    md += `**Sponsor:** ${summary.sponsorName || ""} (${summary.sponsorPartyChamber || ""})\n\n`;
    md += `## Plain Summary\n${summary.plainSummary || ""}\n\n`;
    md += `## Key Provisions\n`;
    (summary.keyProvisions || []).forEach(p => md += `- ${p}\n`);
    md += `\n## Pros\n`;
    (summary.pros || []).forEach(p => md += `- ${p}\n`);
    md += `\n## Cons\n`;
    (summary.cons || []).forEach(p => md += `- ${p}\n`);
    
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-stone-955/80 backdrop-blur-md flex items-center justify-end z-50 animate-fade-in" id="bill-modal-overlay">
      <div className="w-full max-w-3xl bg-stone-900 border-l border-stone-800 h-full flex flex-col shadow-2xl relative" id="bill-modal-container">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
              {billId}
            </span>
            <span className="text-stone-400 font-mono text-xs">Awaiting Analysis review</span>
          </div>
          <div className="flex items-center gap-2">
            {!loading && summary && (
              <button
                onClick={handleCopyMarkdown}
                className="px-3 py-1.5 bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {copied ? <span className="text-emerald-400">Copied!</span> : <><Copy className="h-3 w-3" /> Markdown</>}
              </button>
            )}
            <button
              onClick={onClose}
              id="close-bill-modal"
              className="p-1.5 bg-stone-800 rounded-none text-stone-400 hover:text-white hover:bg-stone-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-stone-950 px-4 border-b border-stone-850">
          <button
            onClick={() => setActiveTab("summary")}
            className={`py-3 px-4 font-sans text-sm font-semibold border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === "summary"
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Plain-Language Summary</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`py-3 px-4 font-sans text-sm font-semibold border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === "chat"
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-stone-400 hover:text-stone-200"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>CapitolExpert AI</span>
            {summary && <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">Ask AI</span>}
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-6" id="bill-modal-body">
          {loading && (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-2 gap-4 bg-stone-950/60 p-4 border border-stone-800">
                <div className="h-10 bg-stone-800/50 rounded"></div>
                <div className="h-10 bg-stone-800/50 rounded"></div>
                <div className="h-10 bg-stone-800/50 rounded"></div>
                <div className="h-10 bg-stone-800/50 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-stone-800/60 w-1/4 rounded"></div>
                <div className="h-24 bg-stone-950/40 border border-stone-850 rounded p-4"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-stone-800/60 w-1/3 rounded"></div>
                <div className="h-12 bg-stone-950/40 border border-stone-850 rounded"></div>
                <div className="h-12 bg-stone-950/40 border border-stone-850 rounded"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-32 bg-stone-800/30 rounded border border-stone-800"></div>
                <div className="h-32 bg-stone-800/30 rounded border border-stone-800"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-none flex items-start space-x-3 text-red-400">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Drafting Failed</h4>
                <p className="text-xs text-red-400/80 mt-1">{error}</p>
                <button onClick={onClose} className="mt-3 text-xs bg-red-900/40 hover:bg-red-900/60 text-white px-3 py-1 rounded font-medium transition cursor-pointer">
                  Close panel
                </button>
              </div>
            </div>
          )}

          {!loading && !error && summary && (
            <>
              {activeTab === "summary" && (
                <div className="space-y-6">
                  {/* Title Info */}
                  <div>
                    <h2 className="text-xl font-display font-black text-stone-100 tracking-tight leading-snug">
                      {summary.officialTitle}
                    </h2>
                    <p className="text-sm text-amber-500 mt-2 font-medium italic flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      &quot;{summary.oneLiner}&quot;
                    </p>
                  </div>

                  {/* Bill Meta Data Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-stone-950/60 p-4 rounded-none border border-stone-800">
                    <div>
                      <span className="text-stone-400 text-[10px] font-mono block">SPONSOR</span>
                      <span className="text-sm font-medium text-stone-200 mt-0.5 block">{summary.sponsorName}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] font-mono block">CHAMBER & PARTY</span>
                      <span className="text-sm font-medium text-stone-200 mt-0.5 block bg-stone-900 px-2 py-0.5 rounded border border-stone-800 inline-block">
                        {summary.sponsorPartyChamber}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] font-mono block">CURRENT STATUS</span>
                      <span className="text-sm font-semibold text-emerald-400 mt-0.5 block">{summary.status}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] font-mono block">COST CLASSIFICATION</span>
                      <span className="text-sm font-medium text-amber-500 mt-0.5 block flex items-center gap-1">
                        <DollarSign className="h-4 w-4" /> Billed CBO Review
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-mono font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-amber-500" /> Executive Digest
                    </h3>
                    <div className="text-sm text-stone-300 leading-relaxed bg-stone-950/20 p-4 rounded-none border border-stone-850">
                      {summary.plainSummary}
                    </div>
                  </div>

                  {/* Key Provisions */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-mono font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-amber-500" /> Key Provisions (What It Does)
                    </h3>
                    <ul className="grid grid-cols-1 gap-2.5">
                      {(summary.keyProvisions || []).map((prov, i) => (
                        <li key={i} className="flex gap-2.5 p-3 bg-stone-950/20 rounded-none border border-stone-850/50">
                          <CheckCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-stone-300 leading-relaxed">{prov}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pros & Cons (Dual-axis analysis) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Arguments For */}
                    <div className="bg-emerald-950/10 border border-emerald-900/30 p-4 rounded-none space-y-3">
                      <h4 className="font-display font-black text-sm text-emerald-400 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> Standard Arguments For
                      </h4>
                      <ul className="space-y-2">
                        {(summary.pros || []).map((pro, idx) => (
                          <li key={idx} className="text-xs text-stone-300 flex gap-1.5 leading-relaxed">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Arguments Against */}
                    <div className="bg-red-955/10 border border-red-900/30 p-4 rounded-none space-y-3">
                      <h4 className="font-display font-black text-sm text-red-400 flex items-center gap-2">
                        <Flame className="h-4 w-4" /> Pointed Arguments Against
                      </h4>
                      <ul className="space-y-2">
                        {(summary.cons || []).map((con, idx) => (
                          <li key={idx} className="text-xs text-stone-300 flex gap-1.5 leading-relaxed">
                            <span className="text-red-500 font-bold">•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Cost & Financial Impact */}
                  {summary.financialImpact && (
                    <div className="bg-gradient-to-r from-amber-950/10 to-transparent border border-amber-900/20 p-4 rounded-none space-y-2">
                      <h4 className="font-sans font-semibold text-sm text-amber-400 flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4" /> Estimated Budget Outlook
                      </h4>
                      <p className="text-xs text-stone-300 leading-relaxed">
                        {summary.financialImpact}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "chat" && (
                <div className="flex flex-col h-[520px] bg-stone-950 rounded-none border border-stone-800 p-4">
                  {/* Messages container */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-none text-xs leading-relaxed whitespace-pre-line ${
                            msg.role === "user"
                              ? "bg-amber-500 text-stone-950 font-medium"
                              : "bg-stone-900 text-stone-200 border border-stone-800"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] font-mono text-stone-500 mt-1 px-1">{msg.timestamp}</span>
                      </div>
                    ))}
                    {aiResponding && (
                      <div className="flex items-center space-x-2 text-stone-500 text-xs ml-2 animate-pulse">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                        <span>CapitolExpert AI is conducting deep research...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="mt-3 flex items-center space-x-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={`Ask about ${summary.billId}...`}
                      disabled={aiResponding}
                      className="flex-1 bg-stone-900 border border-stone-800 hover:border-stone-700 focus:border-amber-500 focus:outline-none rounded-none px-4 py-2 text-xs text-white"
                    />
                    <button
                      type="submit"
                      id="send-modal-chat"
                      disabled={aiResponding || !inputValue.trim()}
                      className="p-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-800 text-stone-950 rounded-full transition cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
