"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SparklesIcon } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  useEffect(() => {
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <SparklesIcon className="w-10 h-10 stroke-1 text-muted-foreground" />
            <p className="text-sm">Start a conversation</p>
            <p className="text-xs mt-1">Powered by Llama 3.3</p>
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

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

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
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20 disabled:opacity-50"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-auto min-h-[40px] self-end"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
