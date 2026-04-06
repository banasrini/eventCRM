"use client";

import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCall {
  tool: string;
  input: unknown;
  result: unknown;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

interface ChatPanelProps {
  pageContext?: {
    eventId?: string;
    eventName?: string;
    sponsorId?: string;
    sponsorName?: string;
  };
}

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("chat-session-id");
  if (!id) {
    id = Math.random().toString(36).slice(2, 14);
    localStorage.setItem("chat-session-id", id);
  }
  return id;
}

function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [open, setOpen] = useState(false);
  const label = toolCall.tool.replace(/_/g, " ");
  return (
    <div className="mt-1 rounded border border-orange-200 bg-orange-50 text-xs">
      <button
        className="flex w-full items-center gap-1 px-2 py-1 text-[#E73D00]"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium">⚡ {label}</span>
        <ChevronDown
          className={cn("ml-auto h-3 w-3 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <pre className="overflow-auto p-2 text-[10px] text-orange-900">
          {JSON.stringify(toolCall.result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function ChatPanel({ pageContext }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: getSessionId(),
          pageContext,
        }),
      });

      const data = await res.json();
      const assistantMsg: Message = {
        role: "assistant",
        content: data.reply,
        toolCalls: data.toolCalls,
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#E73D00] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#cc3600]"
        aria-label="Open AI Chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-[420px] flex-col p-0 sm:max-w-[420px]">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              EventCRM Assistant
            </SheetTitle>
            {pageContext?.eventName && (
              <p className="text-xs text-muted-foreground">
                Context: {pageContext.eventName}
              </p>
            )}
          </SheetHeader>

          <ScrollArea className="flex-1 px-4 py-3">
            {messages.length === 0 && (
              <div className="flex flex-col gap-2 py-8 text-center text-sm text-muted-foreground">
                <MessageSquare className="mx-auto h-8 w-8 opacity-30" />
                <p>Ask me anything about your sponsors and events.</p>
                <p className="text-xs">
                  Try: "Add Nike as a gold sponsor" or "Mark John as confirmed"
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "mb-3 max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "ml-auto bg-[#E73D00] text-white"
                    : "bg-muted text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {msg.toolCalls.map((tc, j) => (
                      <ToolCallCard key={j} toolCall={tc} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </ScrollArea>

          <div className="border-t px-4 py-3">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything… (Enter to send)"
                className="min-h-[60px] resize-none text-sm"
                disabled={loading}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="shrink-0 self-end"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
