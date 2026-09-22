import React, { useState, useEffect } from "react";
import { X, RefreshCw, Key, ShieldCheck, ShieldAlert, Cpu, AlertCircle, Copy, Check } from "lucide-react";
import FirebaseBaselineBackupCard from "./FirebaseBaselineBackupCard";

interface ApiDiagnosticsModalProps {
  onClose: () => void;
}

interface DiagnosticResult {
  status: "valid" | "invalid" | "missing" | "error";
  message: string;
}

interface DiagnosticsData {
  gemini: DiagnosticResult;
  anthropic: DiagnosticResult;
  googleCivic: DiagnosticResult;
}

export default function ApiDiagnosticsModal({ onClose }: ApiDiagnosticsModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const runTests = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/civic/diagnostics");
      if (!resp.ok) {
        throw new Error(`Server returned HTTP ${resp.status}`);
      }
      const json = await resp.json();
      if (json.success && json.results) {
        setData(json.results);
      } else {
        throw new Error("Diagnostics response missing success indicator");
      }
    } catch (err: any) {
      console.warn("[Diagnostics] Key checks notice:", err?.message || err);
      // Construct fallback error states
      setData({
        gemini: { status: "error", message: `Unable to retrieve server diagnostic: ${err.message}` },
        anthropic: { status: "error", message: `Unable to retrieve server diagnostic: ${err.message}` },
        googleCivic: { status: "error", message: `Unable to retrieve server diagnostic: ${err.message}` }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Valid & Live
          </span>
        );
      case "invalid":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
            Invalid Credentials
          </span>
        );
      case "missing":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            Not Configured (Using Offline Fallbacks)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            API Error
          </span>
        );
    }
  };

  const copyReport = () => {
    if (!data) return;
    const reportText = `CapitolTrack Civics System Diagnostic Report:
------------------------------------------------
1. Gemini (Search Grounding & Main AI):
   Status: ${data.gemini.status.toUpperCase()}
   Details: ${data.gemini.message}

2. Anthropic (Failover Structured Models):
   Status: ${data.anthropic.status.toUpperCase()}
   Details: ${data.anthropic.message}

3. Google Civic Information API:
   Status: ${data.googleCivic.status.toUpperCase()}
   Details: ${data.googleCivic.message}
------------------------------------------------
Report generated at ${new Date().toLocaleString()}`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in" id="diagnostics-modal">
      <div className="relative w-full max-w-2xl bg-white rounded-none shadow-xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-stone-900 text-amber-500 rounded">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-stone-900">API Key Integrity Diagnostics</h3>
              <p className="text-[10px] font-mono text-stone-500 uppercase tracking-wide">Real-time status of service connections</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-stone-200 rounded-full text-stone-400 hover:text-stone-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <RefreshCw className="h-10 w-10 text-amber-500 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-stone-800">Dispatching live API queries...</p>
                <p className="text-xs text-stone-400 mt-1">Testing response times and credentials on active service paths.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-stone-500 leading-relaxed">
                The checklist below reflects the response status of each provider. Valid credentials will automatically unlock full-fidelity, search-grounded congressional lookups and active elections database feeds.
              </p>

              {/* Providers Checklist */}
              {data && (
                <div className="space-y-4">
                  {/* Gemini API Key */}
                  <div className="p-4 border border-stone-200 rounded-none bg-stone-50/50 hover:bg-stone-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="p-1.5 bg-blue-100 text-blue-700 rounded-md font-mono text-xs font-bold">GEMINI</span>
                        <h4 className="font-sans font-semibold text-sm text-stone-900">Gemini 3.5 Flash</h4>
                      </div>
                      {getStatusBadge(data.gemini.status)}
                    </div>
                    <p className="text-xs text-stone-600 mt-2.5 pl-0.5 leading-normal">
                      {data.gemini.message}
                    </p>
                  </div>

                  {/* Anthropic API Key */}
                  <div className="p-4 border border-stone-200 rounded-none bg-stone-50/50 hover:bg-stone-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="p-1.5 bg-violet-100 text-violet-700 rounded-md font-mono text-xs font-bold">ANTHROPIC</span>
                        <h4 className="font-sans font-semibold text-sm text-stone-900">Claude 3.5 Sonnet Fallback</h4>
                      </div>
                      {getStatusBadge(data.anthropic.status)}
                    </div>
                    <p className="text-xs text-stone-600 mt-2.5 pl-0.5 leading-normal">
                      {data.anthropic.message}
                    </p>
                  </div>

                  {/* Google Civic Info API Key */}
                  <div className="p-4 border border-stone-200 rounded-none bg-stone-50/50 hover:bg-stone-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="p-1.5 bg-amber-100 text-amber-700 rounded-md font-mono text-xs font-bold">CIVIC</span>
                        <h4 className="font-sans font-semibold text-sm text-stone-900">Google Civic Info API</h4>
                      </div>
                      {getStatusBadge(data.googleCivic.status)}
                    </div>
                    <p className="text-xs text-stone-600 mt-2.5 pl-0.5 leading-normal">
                      {data.googleCivic.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Firebase Cloud Firestore Baseline & Daily Backup Resilience */}
              <div className="pt-2 border-t border-stone-200">
                <FirebaseBaselineBackupCard />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-t border-stone-100">
          <button
            onClick={copyReport}
            disabled={loading || !data}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-none hover:bg-stone-50 focus:outline-none transition disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                Copied Report!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy Diagnostics Report
              </>
            )}
          </button>

          <div className="flex space-x-2">
            <button
              onClick={runTests}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-none hover:bg-stone-50 focus:outline-none transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Re-Test Connections
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-none hover:bg-stone-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
