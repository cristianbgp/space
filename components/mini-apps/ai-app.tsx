"use client";

import * as React from "react";
import { BorderBeam } from "border-beam";
import { Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIApp() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  React.useEffect(() => {
    // Focus textarea after loading is complete
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.content },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <Sparkles className="size-10 stroke-1 text-muted-foreground" />
            <p className="text-sm">Start a conversation</p>
            <p className="mt-1 text-xs">Powered by Llama 3.3</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                message.role === "user"
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground",
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading ? (
          <div className="flex justify-start">
            <p
              aria-live="polite"
              className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground"
              role="status"
            >
              Thinking…
            </p>
          </div>
        ) : null}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-100 text-red-700 rounded-lg px-3 py-2 text-xs">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <BorderBeam
          active={isLoading}
          className="w-full"
          colorVariant="mono"
          duration={2.8}
          size="pulse-inner"
          strength={0.45}
          theme="light"
        >
          <div
            className="flex gap-2 rounded-xl border border-border bg-background p-2"
            data-state={isLoading ? "generating" : "idle"}
            data-testid="ai-composer"
          >
            <textarea
              aria-label="Message"
              autoComplete="off"
              className="min-h-10 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 disabled:opacity-50"
              disabled={isLoading}
              name="message"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              ref={textareaRef}
              rows={1}
              value={input}
            />
            <Button
              aria-label="Send message"
              className="size-10 self-end rounded-lg"
              disabled={!input.trim() || isLoading}
              onClick={sendMessage}
              size="icon"
            >
              <Send aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </BorderBeam>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
