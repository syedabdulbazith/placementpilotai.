import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { chatAssistant } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Send, Loader2, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "AI Assistant — PlacementPilot AI" }] }),
  component: ChatPage,
});

type Thread = { id: string; title: string | null; updated_at: string };
type Msg = { id: string; role: string; content: string; created_at: string };

function ChatPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const chatFn = useServerFn(chatAssistant);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: threads } = useQuery({
    queryKey: ["threads", user.id],
    queryFn: async (): Promise<Thread[]> => {
      const { data } = await supabase.from("chat_threads").select("id,title,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!activeId && threads && threads.length > 0) setActiveId(threads[0].id);
  }, [threads, activeId]);

  const { data: messages, isFetching } = useQuery({
    queryKey: ["messages", activeId],
    enabled: !!activeId,
    queryFn: async (): Promise<Msg[]> => {
      const { data } = await supabase.from("chat_messages").select("*").eq("thread_id", activeId!).order("created_at");
      return data ?? [];
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => { textareaRef.current?.focus(); }, [activeId]);

  async function newThread() {
    const { data, error } = await supabase.from("chat_threads").insert({ user_id: user.id, title: "New conversation" }).select().single();
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["threads"] });
    setActiveId(data.id);
  }

  async function deleteThread(id: string) {
    await supabase.from("chat_threads").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["threads"] });
    if (activeId === id) setActiveId(null);
  }

  const send = useMutation({
    mutationFn: async (msg: string) => {
      let tid = activeId;
      if (!tid) {
        const { data } = await supabase.from("chat_threads").insert({ user_id: user.id, title: msg.slice(0, 60) }).select().single();
        tid = data!.id;
        setActiveId(tid);
        qc.invalidateQueries({ queryKey: ["threads"] });
      }
      return chatFn({ data: { threadId: tid!, message: msg } });
    },
    onMutate: async (msg) => {
      if (!activeId) return;
      qc.setQueryData<Msg[]>(["messages", activeId], (old) => [
        ...(old ?? []),
        { id: "temp-u-" + Date.now(), role: "user", content: msg, created_at: new Date().toISOString() },
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", activeId] });
      qc.invalidateQueries({ queryKey: ["threads"] });
      textareaRef.current?.focus();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = input.trim();
    if (!v || send.isPending) return;
    setInput("");
    send.mutate(v);
  }

  return (
    <div className="grid h-[calc(100vh-8rem)] gap-4 md:grid-cols-[260px_1fr]">
      <aside className="glass-strong hidden flex-col rounded-2xl p-3 md:flex">
        <Button variant="hero" size="sm" className="mb-3" onClick={newThread}><Plus className="h-4 w-4" />New chat</Button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {threads?.length === 0 && <p className="px-2 py-4 text-center text-xs text-muted-foreground">No conversations yet</p>}
          {threads?.map((t) => (
            <div key={t.id} className={cn("group flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors", t.id === activeId ? "bg-accent/20" : "hover:bg-accent/10")}>
              <button onClick={() => setActiveId(t.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{t.title}</span>
              </button>
              <button onClick={() => deleteThread(t.id)} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="glass-strong flex flex-col rounded-2xl">
        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-6">
          {(!messages || messages.length === 0) && !isFetching && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <img src={logo} alt="" className="h-14 w-14" />
              <h2 className="mt-4 font-display text-2xl font-bold">Ask your AI Placement Officer</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Career guidance, resume tips, interview prep, company shortlists, study plans — anything placement-related.
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {[
                  "How do I prepare for a product company in 30 days?",
                  "What should be on my resume as a final-year CSE?",
                  "Which DSA topics are most asked at Amazon?",
                  "Give me a mock HR question and feedback.",
                ].map((q) => (
                  <button key={q} onClick={() => setInput(q)} className="glass rounded-xl p-3 text-left text-xs hover:shadow-glow">{q}</button>
                ))}
              </div>
            </div>
          )}
          {messages?.map((m) => (
            <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "")}>
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                m.role === "user" ? "bg-gradient-primary text-primary-foreground" : "glass")}>
                {m.role === "user" ? (user.email ?? "U")[0].toUpperCase() : "AI"}
              </div>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                m.role === "user" ? "bg-gradient-primary text-primary-foreground" : "glass",
              )}>
                {m.role === "user"
                  ? <p className="whitespace-pre-wrap">{m.content}</p>
                  : <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1"><ReactMarkdown>{m.content}</ReactMarkdown></div>}
              </div>
            </div>
          ))}
          {send.isPending && (
            <div className="flex gap-3">
              <div className="glass flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">AI</div>
              <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />Thinking…
              </div>
            </div>
          )}
        </div>

        <form onSubmit={submit} className="border-t border-border p-3">
          <div className="glass flex items-end gap-2 rounded-2xl p-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e); } }}
              placeholder="Ask anything about placements…"
              rows={1}
              className="min-h-[44px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button type="submit" variant="hero" size="icon" disabled={!input.trim() || send.isPending}>
              {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
