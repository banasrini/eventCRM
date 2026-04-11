"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Plus, Trash2, Loader2, FileText, ChevronDown, ChevronRight } from "lucide-react";
import type { SponsorNote } from "@/db/schema";

interface AIBrief {
  relationshipStatus: string;
  whatTheyCareAbout: string;
  personalDetails: string;
  openActionItems: string;
  sentiment: "positive" | "neutral" | "negative";
}

interface Props {
  sponsorId: string;
  initialNotes: SponsorNote[];
  initialSummary: string | null;  // JSON string
  initialSummaryAt: string | null;
}

const SENTIMENT_COLORS = {
  positive: "bg-green-100 text-green-700 border-green-200",
  neutral: "bg-gray-100 text-gray-600 border-gray-200",
  negative: "bg-red-100 text-red-700 border-red-200",
};

const SOURCE_OPTIONS = ["meeting", "email", "linkedin", "call", "note"];

function parseBrief(json: string | null): AIBrief | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as AIBrief;
  } catch {
    return null;
  }
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function BulletText({ text }: { text: string }) {
  const lines = text.split("\n").filter(Boolean);
  return (
    <ul className="space-y-1">
      {lines.map((line, i) => (
        <li key={i} className="text-sm text-muted-foreground">
          {line.startsWith("• ") ? line : `• ${line}`}
        </li>
      ))}
    </ul>
  );
}

export function RelationshipIntelligence({ sponsorId, initialNotes, initialSummary, initialSummaryAt }: Props) {
  const [notes, setNotes] = useState<SponsorNote[]>(initialNotes);
  const [brief, setBrief] = useState<AIBrief | null>(parseBrief(initialSummary));
  const [summaryAt, setSummaryAt] = useState<string | null>(initialSummaryAt);

  const [generating, setGenerating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function generateSummary() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/sponsors/${sponsorId}/summarize`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { brief: newBrief, generatedAt } = await res.json() as { brief: AIBrief; generatedAt: string };
      setBrief(newBrief);
      setSummaryAt(generatedAt);
      toast.success("Relationship brief updated");
    } catch {
      toast.error("Failed to generate summary");
    } finally {
      setGenerating(false);
    }
  }

  async function addNote() {
    if (!content.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/sponsors/${sponsorId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || undefined, content: content.trim(), source: source || undefined }),
      });
      if (!res.ok) throw new Error();
      const note = await res.json() as SponsorNote;
      setNotes((prev) => [note, ...prev]);
      setTitle("");
      setContent("");
      setSource("");
      setShowForm(false);
      toast.success("Context added");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setAddingNote(false);
    }
  }

  async function deleteNote(noteId: string) {
    await fetch(`/api/sponsors/${sponsorId}/notes?noteId=${noteId}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    toast.success("Entry removed");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <CardTitle className="text-sm font-medium">Relationship Intelligence</CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={generating || notes.length === 0}
            onClick={generateSummary}
            title={notes.length === 0 ? "Add context notes first" : undefined}
          >
            {generating ? (
              <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Generating…</>
            ) : brief ? (
              <><RefreshCw className="h-3 w-3 mr-1.5" /> Refresh summary</>
            ) : (
              <><Sparkles className="h-3 w-3 mr-1.5" /> Summarize relationship history</>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── AI Brief ─────────────────────────────────────── */}
        {brief ? (
          <div className="space-y-4">
            {summaryAt && (
              <p className="text-xs text-muted-foreground">As of {formatDate(summaryAt)}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Relationship Status</p>
                <p className="text-sm">{brief.relationshipStatus}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">What They Care About</p>
                <BulletText text={brief.whatTheyCareAbout} />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Personal Details</p>
                <p className="text-sm text-muted-foreground">{brief.personalDetails}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Open Action Items</p>
                {brief.openActionItems === "None identified." ? (
                  <p className="text-sm text-muted-foreground">None identified.</p>
                ) : (
                  <BulletText text={brief.openActionItems} />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Overall sentiment</p>
              <Badge
                variant="outline"
                className={`capitalize text-xs ${SENTIMENT_COLORS[brief.sentiment ?? "neutral"]}`}
              >
                {brief.sentiment}
              </Badge>
            </div>
          </div>
        ) : notes.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No context added yet.</p>
            <p className="text-xs text-muted-foreground">Paste notes, emails, or meeting summaries below to build a relationship brief.</p>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">
              {notes.length} context {notes.length === 1 ? "entry" : "entries"} ready. Click <span className="font-medium">Summarize relationship history</span> to generate a brief.
            </p>
          </div>
        )}

        {/* ── Context Log ──────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Context Log {notes.length > 0 && `(${notes.length})`}
            </p>
            {!showForm && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowForm(true)}>
                <Plus className="h-3 w-3 mr-1" /> Add context
              </Button>
            )}
          </div>

          {showForm && (
            <div className="rounded-md border p-3 space-y-3 bg-muted/30">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  placeholder="e.g. Intro call recap, Q2 follow-up email…"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 text-sm h-8"
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-xs">Content</Label>
                <Textarea
                  rows={4}
                  placeholder="Paste raw notes, email snippet, or meeting summary…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Source (optional)</Label>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {SOURCE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSource(source === opt ? "" : opt)}
                      className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                        source === opt
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                  <Input
                    className="h-6 w-28 text-xs"
                    placeholder="custom…"
                    value={SOURCE_OPTIONS.includes(source) ? "" : source}
                    onChange={(e) => setSource(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={!content.trim() || addingNote} onClick={addNote}>
                  {addingNote ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setTitle(""); setContent(""); setSource(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {notes.length > 0 ? (
            <div className="space-y-1.5">
              {notes.map((note) => {
                const expanded = expandedIds.has(note.id);
                const label = note.title || note.content.slice(0, 60) + (note.content.length > 60 ? "…" : "");
                return (
                  <div key={note.id} className="group rounded-md border bg-card transition-colors">
                    <div
                      className="flex items-center gap-2 px-2.5 py-2 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggleExpand(note.id)}
                    >
                      {expanded
                        ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      }
                      <span className="flex-1 text-sm font-medium truncate">{label}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {note.source && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
                            {note.source}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    </div>
                    {expanded && (
                      <div className="px-7 pb-3 pt-0">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{note.content}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            !showForm && (
              <p className="text-xs text-muted-foreground text-center py-2">No entries yet.</p>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
