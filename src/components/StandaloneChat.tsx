import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, Send, Landmark, HelpCircle as AskIcon, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { ChatMessage } from "../types";

export default function StandaloneChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial",
      role: "assistant",
      content: "Welcome to CapitolExpert AI. I am your fully unbiased senior policy researcher. I search real legislative data in real-time. \n\nAsk me anything about pending acts, voting alignments, or constitutional procedure. Try some examples below!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(msgText: string) {
    if (!msgText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const resp = await fetch("/api/legislation/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgText })
      });

      if (!resp.ok) {
        throw new Error("Endpoint reached but query failed");
      }

      const data = await resp.json();
      const aiMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.warn("Standalone chat notice:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: "I ran into a server communication glitch. Please confirm your API Key secrets setup inside the settings panel.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestionPrompts = [
    "Which representative has the worst grade on the Liberty & Prosperity Index?",
    "Who are the top-rated and lowest-rated representatives in Congress?",
    "Detail Sen. Elizabeth Warren's Liberty Index grade and voting history.",
    "What are the major structural differences between a House bill and a Senate bill?",
    "Tell me about the recent bipartisan farm and crop credit re-authorizations.",
    "Detail how the FAA re-authorization impacts passenger rights regarding wheelchair support."
  ];

  return (
    <div className="space-y-6">
      {/* Upper header banner */}
      <div>
        <h2 className="text-xl font-display font-black text-stone-100 flex items-center gap-2">
          <AskIcon className="h-5 w-5 text-blue-600" />
          CapitolExpert AI Policy Desk
        </h2>
        <p className="text-xs text-stone-400">Neutral, grounded analysis of the 119th United States Congress regulations</p>
      </div>

      {/* Main double column: Chat box & Quick help reference */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        {/* Chat window (Left 3 cols) */}
        <div className="lg:col-span-3 bg-[#F9F8F6] rounded-none border border-stone-200 p-5 flex flex-col h-[560px] justify-between shadow-sm">
          {/* Messages scroll box */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[460px] scrollbar-thin">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col max-w-[85%] ${
                  m.role === "user" ? "ml-auto items-end animate-fade-in" : "mr-auto items-start"
                }`}
              >
                <div
                  className={`p-3.5 rounded-none text-xs leading-relaxed whitespace-pre-line ${
                    m.role === "user"
                      ? "bg-blue-600 text-white font-medium shadow-sm"
                      : "bg-stone-50 text-stone-900 border border-stone-100"
                  }`}
                >
                  {m.content}
                </div>
                <span className="text-[9px] font-mono text-stone-400 mt-1.5 px-1">{m.timestamp}</span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-stone-500 text-xs pl-2 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="font-mono">Synthesizing multi-partisan opinions...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-150"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask CapitolExpert AI about any bill, procedure or voting record..."
              disabled={loading}
              className="flex-1 bg-stone-50 hover:bg-stone-100/50 focus:bg-[#F9F8F6] border border-stone-300 focus:border-blue-500 focus:outline-none rounded-none px-4 py-2.5 text-xs text-stone-900 transition-all"
            />
            <button
              type="submit"
              id="standalone-chat-submit"
              disabled={loading || !inputValue.trim()}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-100 disabled:text-stone-400 text-white rounded-full transition-all cursor-pointer shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Suggested Prompts sidebar (Right 1 col) */}
        <div className="bg-stone-900 text-white rounded-none p-5 flex flex-col justify-between shadow-lg">
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Prompt Catalogs
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Tap any pre-compiled inquiry card to run deep cross-referenced lookups instantly:
            </p>

            <div className="space-y-2.5">
              {suggestionPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-none bg-stone-800/80 hover:bg-stone-805 border border-stone-800 hover:border-blue-500/30 text-xs text-stone-300 line-clamp-2 hover:text-white transition-all duration-200 cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-stone-800 pt-4 mt-4">
            <div className="flex gap-2 items-center text-[10px] text-stone-400 font-mono">
              <Landmark className="h-3.5 w-3.5 text-blue-400" />
              <span>STRICT MULTI-SOURCE INTEGRITY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
