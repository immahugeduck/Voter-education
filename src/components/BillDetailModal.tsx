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
  };  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-xs flex items-center justify-end z-50 animate-fade-in" id="bill-modal-overlay">
      <div className="w-full max-w-3xl bg-[#FAF7F0] border-l-4 border-double border-[#1A1A1A] h-full flex flex-col shadow-2xl relative" id="bill-modal-container">
        
        {/* Header - Editorial Desk Style */}
        <div className="px-6 py-4 bg-[#F5F2EA] border-b-2 border-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-[#1A1A1A] text-[#FBF9F5]">
              {billId}
            </span>
            <span className="sepia-stamp text-[9px]">
              ★ LEGISLATIVE PROOF SHEET ★
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!loading && summary && (
              <button
                onClick={handleCopyMarkdown}
                className="px-3 py-1.5 bg-[#1A1A1A] text-[#FBF9F5] hover:bg-stone-800 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {copied ? <span className="text-amber-400">Copied!</span> : <><Copy className="h-3 w-3" /> Copy Proof Sheet</>}
              </button>
            )}
            <button
              onClick={onClose}
              id="close-bill-modal"
              className="p-1.5 bg-[#1A1A1A] text-[#FBF9F5] hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector - Newsprint Section Selector */}
        <div className="flex bg-[#FAF7F0] px-4 border-b-2 border-[#1A1A1A]">
          <button
            onClick={() => setActiveTab("summary")}
            className={`py-3 px-4 font-headline text-xs font-bold uppercase tracking-wider border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === "summary"
                ? "border-[#1A1A1A] bg-[#F5F2EA] text-[#1A1A1A]"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Plain-Language Translation</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`py-3 px-4 font-headline text-xs font-bold uppercase tracking-wider border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === "chat"
                ? "border-[#1A1A1A] bg-[#F5F2EA] text-[#1A1A1A]"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Editorial AI Inquiry Desk</span>
            {summary && <span className="bg-[#1A1A1A] text-amber-400 text-[9px] font-mono px-1.5 py-0.5 font-bold uppercase">Ask AI</span>}
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" id="bill-modal-body">
          {loading && (
            <div className="space-y-6 animate-pulse font-mono">
              <div className="grid grid-cols-2 gap-4 bg-[#F5F2EA] p-4 border border-[#1A1A1A]">
                <div className="h-10 bg-stone-300 rounded-none"></div>
                <div className="h-10 bg-stone-300 rounded-none"></div>
                <div className="h-10 bg-stone-300 rounded-none"></div>
                <div className="h-10 bg-stone-300 rounded-none"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-stone-300 w-1/4 rounded-none"></div>
                <div className="h-24 bg-[#F5F2EA] border border-[#1A1A1A] rounded-none p-4"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-100 border-2 border-rose-900 flex items-start space-x-3 text-rose-950 font-serif">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-rose-800" />
              <div>
                <h4 className="font-headline font-bold text-sm">Press Wire Error</h4>
                <p className="text-xs text-rose-900 mt-1">{error}</p>
                <button onClick={onClose} className="mt-3 text-xs bg-rose-900 text-white px-3 py-1 font-mono font-bold uppercase cursor-pointer">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {!loading && !error && summary && (
            <>
              {activeTab === "summary" && (
                <div className="space-y-6 font-serif">
                  
                  {/* Headline & Subhead */}
                  <div className="border-b-2 border-[#1A1A1A] pb-4 space-y-2">
                    <span className="sepia-stamp-emerald text-[9px]">
                      OFFICIAL CONGRESSIONAL RECORD TRANSLATION
                    </span>
                    <h2 className="text-xl sm:text-2xl font-headline font-black text-[#1A1A1A] leading-tight mt-1">
                      {summary.officialTitle}
                    </h2>
                    <p className="text-sm font-serif italic text-amber-900 bg-amber-500/10 p-3 border-l-4 border-amber-800">
                      &ldquo;{summary.oneLiner}&rdquo;
                    </p>
                  </div>

                  {/* Bill Meta Data Grid - Newspaper Style */}
                  <div className="grid grid-cols-2 gap-4 bg-[#F5F2EA] p-4 border-2 border-[#1A1A1A] font-mono">
                    <div>
                      <span className="text-stone-600 text-[10px] font-bold block uppercase">PRIMARY SPONSOR</span>
                      <span className="text-xs font-bold text-[#1A1A1A] mt-0.5 block">{summary.sponsorName}</span>
                    </div>
                    <div>
                      <span className="text-stone-600 text-[10px] font-bold block uppercase">CHAMBER & PARTY</span>
                      <span className="text-xs font-bold text-[#1A1A1A] mt-0.5 block bg-stone-300 px-2 py-0.5 inline-block">
                        {summary.sponsorPartyChamber}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-600 text-[10px] font-bold block uppercase">CURRENT STATUS</span>
                      <span className="text-xs font-bold text-emerald-900 mt-0.5 block">{summary.status}</span>
                    </div>
                    <div>
                      <span className="text-stone-600 text-[10px] font-bold block uppercase">COST CLASSIFICATION</span>
                      <span className="text-xs font-bold text-stone-900 mt-0.5 block flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" /> Official CBO Review
                      </span>
                    </div>
                  </div>

                  {/* Executive Summary with Drop Cap */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-headline font-black text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2 border-b border-stone-300 pb-1">
                      <ChevronRight className="h-4 w-4 text-[#1A1A1A]" /> Executive Digest & Translation
                    </h3>
                    <div className="text-sm font-serif text-[#1A1A1A] leading-relaxed bg-[#F5F2EA] p-4 border border-[#1A1A1A]">
                      {summary.plainSummary}
                    </div>
                  </div>

                  {/* Key Provisions */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-headline font-black text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2 border-b border-stone-300 pb-1">
                      <ChevronRight className="h-4 w-4 text-[#1A1A1A]" /> Key Provisions (Statutory Impact)
                    </h3>
                    <ul className="grid grid-cols-1 gap-2.5 font-serif text-xs">
                      {(summary.keyProvisions || []).map((prov, i) => (
                        <li key={i} className="flex gap-2.5 p-3 bg-[#F5F2EA] border border-[#1A1A1A]">
                          <CheckCircle className="h-4 w-4 text-emerald-800 shrink-0 mt-0.5" />
                          <span className="text-stone-900 leading-relaxed">{prov}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pros & Cons (Dual-axis Analysis) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Arguments For */}
                    <div className="bg-[#F5F2EA] border-2 border-emerald-900 p-4 space-y-2.5 font-serif">
                      <h4 className="font-headline font-black text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-900/30 pb-1">
                        <CheckCircle className="h-4 w-4 text-emerald-800" /> Arguments For
                      </h4>
                      <ul className="space-y-2">
                        {(summary.pros || []).map((pro, idx) => (
                          <li key={idx} className="text-xs text-stone-900 flex gap-1.5 leading-relaxed">
                            <span className="text-emerald-800 font-bold">•</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Arguments Against */}
                    <div className="bg-[#F5F2EA] border-2 border-rose-900 p-4 space-y-2.5 font-serif">
                      <h4 className="font-headline font-black text-xs text-rose-950 uppercase tracking-wider flex items-center gap-2 border-b border-rose-900/30 pb-1">
                        <Flame className="h-4 w-4 text-rose-800" /> Arguments Against
                      </h4>
                      <ul className="space-y-2">
                        {(summary.cons || []).map((con, idx) => (
                          <li key={idx} className="text-xs text-stone-900 flex gap-1.5 leading-relaxed">
                            <span className="text-rose-800 font-bold">•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Financial Outlook */}
                  {summary.financialImpact && (
                    <div className="bg-[#F5F2EA] border-2 border-[#1A1A1A] p-4 space-y-2 font-serif">
                      <h4 className="font-headline font-bold text-xs text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4" /> Estimated CBO Fiscal Outlook
                      </h4>
                      <p className="text-xs text-stone-800 leading-relaxed">
                        {summary.financialImpact}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "chat" && (
                <div className="flex flex-col h-[520px] bg-[#F5F2EA] border-2 border-[#1A1A1A] p-4 font-serif">
                  {/* Messages container */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[88%] ${
                          msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                        }`}
                      >
                        <div
                          className={`p-3 text-xs leading-relaxed whitespace-pre-line border ${
                            msg.role === "user"
                              ? "bg-[#1A1A1A] text-[#FBF9F5] border-[#1A1A1A]"
                              : "bg-[#FAF7F0] text-[#1A1A1A] border-[#1A1A1A]"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] font-mono text-stone-600 mt-1 px-1">{msg.timestamp}</span>
                      </div>
                    ))}
                    {aiResponding && (
                      <div className="flex items-center space-x-2 text-stone-700 text-xs ml-2 font-mono animate-pulse">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1A1A1A]" />
                        <span>Research desk analyzing congressional records...</span>
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
                      placeholder={`Inquire about ${summary.billId}...`}
                      disabled={aiResponding}
                      className="flex-1 bg-[#FAF7F0] border-2 border-[#1A1A1A] focus:outline-none px-4 py-2 text-xs font-serif text-[#1A1A1A]"
                    />
                    <button
                      type="submit"
                      id="send-modal-chat"
                      disabled={aiResponding || !inputValue.trim()}
                      className="p-2.5 bg-[#1A1A1A] hover:bg-stone-800 disabled:bg-stone-400 text-[#FBF9F5] transition cursor-pointer"
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
