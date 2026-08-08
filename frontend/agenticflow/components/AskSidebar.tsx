"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { MessageCircleQuestion, X, Send, Sparkles, CircleCheck, Circle } from "lucide-react";
import { API_BASE_URL } from "../lib/config";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type AgentAvailability = Record<string, { name: string; available: boolean }>;

const AGENT_ORDER = [1, 2, 3, 4];

const FALLBACK_NAMES: Record<number, string> = {
  1: "Data Surveyor",
  2: "Fairness Adjudicator",
  3: "Mitigation Agent",
  4: "Report Compiler",
};

export default function AskSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [agents, setAgents] = useState<AgentAvailability>({});
  const [selectedAgents, setSelectedAgents] = useState<Set<number>>(new Set());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/qa/agents`);
        if (res.ok && !cancelled) {
          const data: AgentAvailability = await res.json();
          setAgents(data);
        }
      } catch {
        // backend not reachable yet — ignore, will retry
      }
    };

    poll();
    const intervalId = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const toggleAgent = (num: number) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const handleAsk = useCallback(async () => {
    const q = question.trim();
    if (!q || isStreaming) return;

    setMessages((prev) => [...prev, { role: "user", text: q }, { role: "assistant", text: "" }]);
    setQuestion("");
    setIsStreaming(true);

    try {
      const res = await fetch(`${API_BASE_URL}/qa/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          agent_numbers: Array.from(selectedAgents),
        }),
      });

      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload);
            const chunk = parsed.text ?? (parsed.error ? `Error: ${parsed.error}` : "");
            if (chunk) {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: "assistant",
                  text: next[next.length - 1].text + chunk,
                };
                return next;
              });
            }
          } catch {
            // ignore malformed SSE chunk
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", text: "Couldn't reach the audit backend. Is it running?" };
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [question, isStreaming, selectedAgents]);

  const selectedCount = selectedAgents.size;

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`fixed right-6 bottom-8 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all active:scale-90 ${
          isOpen
            ? "bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest"
            : "bg-primary text-on-primary hover:brightness-110"
        }`}
        title={isOpen ? "Close Ask the Audit" : "Ask the Audit"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircleQuestion className="h-6 w-6" />}
      </button>

      {/* Backdrop for mobile-ish focus, purely cosmetic click-away */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-30 flex h-full w-[400px] max-w-[92vw] flex-col border-l border-outline-variant bg-surface/95 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant px-5 py-4">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-on-surface">Ask the Audit</h2>
              <p className="mt-0.5 text-xs leading-snug text-on-surface-variant">
                Ask about findings while agents run — no need to wait.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Agent context selector */}
        <div className="border-b border-outline-variant px-5 py-3.5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
            Context {selectedCount > 0 && <span className="text-primary">· {selectedCount} selected</span>}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {AGENT_ORDER.map((num) => {
              const info = agents[String(num)];
              const available = !!info?.available;
              const checked = selectedAgents.has(num);
              return (
                <button
                  key={num}
                  type="button"
                  disabled={!available}
                  onClick={() => toggleAgent(num)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                    !available
                      ? "cursor-not-allowed border-outline-variant/30 text-on-surface-variant/40"
                      : checked
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-on-surface"
                  }`}
                >
                  {checked && available ? (
                    <CircleCheck className="h-3 w-3" />
                  ) : (
                    <Circle className="h-3 w-3 opacity-40" />
                  )}
                  {info?.name ?? FALLBACK_NAMES[num]}
                  {!available && <span className="opacity-60">· pending</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
                <MessageCircleQuestion className="h-6 w-6" />
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-[240px]">
                Pick which agents to pull context from, then ask something like{" "}
                <span className="text-on-surface">"why was this applicant rejected?"</span>
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-on-primary rounded-br-sm whitespace-pre-wrap"
                    : "bg-surface-container-high text-on-surface rounded-bl-sm custom-markdown"
                }`}
              >
                {m.role === "assistant" ? (
                  m.text ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{m.text}</ReactMarkdown>
                  ) : (
                    <span className="inline-flex gap-1 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-on-surface-variant/50 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-on-surface-variant/50 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-on-surface-variant/50 animate-bounce" />
                    </span>
                  )
                ) : (
                  m.text
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="border-t border-outline-variant p-3.5">
          <div className="flex items-end gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest px-3 py-2 focus-within:border-primary transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              placeholder="Ask about the audit..."
              className="flex-1 bg-transparent py-1 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none"
            />
            <button
              onClick={handleAsk}
              disabled={isStreaming || !question.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary transition-all active:scale-90 disabled:opacity-30 disabled:active:scale-100"
              title="Send"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
