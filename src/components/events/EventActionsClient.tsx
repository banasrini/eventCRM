"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TIER_COLORS, RSVP_COLORS, TASK_STATUS_COLORS, formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Check, Pencil } from "lucide-react";
import type { Event, Guest, Task, BudgetCategory } from "@/db/schema";

interface EventSponsorRow {
  id: string;
  sponsorId: string;
  tier: "gold" | "silver" | "bronze" | "custom" | null;
  contribution: number | null;
  notes: string | null;
  companyName: string;
  contactName: string | null;
  email: string | null;
}

interface EventActionsClientProps {
  event: Event;
  eventSponsors: EventSponsorRow[];
  guests: Guest[];
  tasks: Task[];
  budget: BudgetCategory[];
  eventId: string;
}

// ─── Sponsors Tab ─────────────────────────────────────────────────────────────
function SponsorsTab({ eventId, eventSponsors }: { eventId: string; eventSponsors: EventSponsorRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sponsorId, setSponsorId] = useState("");
  const [tier, setTier] = useState("");
  const [contribution, setContribution] = useState("");
  const [saving, setSaving] = useState(false);

  async function attach() {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/sponsors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sponsorId,
          tier: tier || undefined,
          contribution: contribution ? parseFloat(contribution) : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Sponsor attached");
      setOpen(false);
      setSponsorId(""); setTier(""); setContribution("");
      router.refresh();
    } catch {
      toast.error("Failed to attach sponsor");
    } finally {
      setSaving(false);
    }
  }

  async function detach(sid: string) {
    await fetch(`/api/events/${eventId}/sponsors?sponsorId=${sid}`, { method: "DELETE" });
    toast.success("Sponsor removed");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="h-3 w-3 mr-1" /> Attach Sponsor
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Attach Sponsor</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Sponsor ID</Label>
                <Input
                  placeholder="Paste sponsor ID from the sponsor's page"
                  value={sponsorId}
                  onChange={(e) => setSponsorId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tip: use the chat panel — "attach [sponsor name] to this event"
                </p>
              </div>
              <div>
                <Label>Tier</Label>
                <Select onValueChange={(v) => setTier(v ?? "")} value={tier}>
                  <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contribution ($)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={contribution}
                  onChange={(e) => setContribution(e.target.value)}
                />
              </div>
              <Button onClick={attach} disabled={!sponsorId || saving} className="w-full">
                {saving ? "Attaching…" : "Attach"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {eventSponsors.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No sponsors attached yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Contribution</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventSponsors.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.companyName}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{s.contactName ?? "—"}</TableCell>
                <TableCell>
                  {s.tier ? (
                    <Badge variant="outline" className={`capitalize ${TIER_COLORS[s.tier]}`}>{s.tier}</Badge>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(s.contribution)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => detach(s.sponsorId)}>
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── Guests Tab ────────────────────────────────────────────────────────────────
const CONTACTED_VIA_LABELS: Record<string, string> = { linkedin: "LI", email: "Email", msg: "Msg" };
const CONTACTED_VIA_COLORS: Record<string, string> = {
  linkedin: "bg-blue-100 text-blue-700 border-blue-200",
  email: "bg-gray-100 text-gray-700 border-gray-200",
  msg: "bg-green-100 text-green-700 border-green-200",
};

function GuestsTab({ eventId, guests }: Pick<EventActionsClientProps, "eventId" | "guests">) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", contactedVia: "", role: "attendee", rsvpStatus: "pending", notes: "" });
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  async function addGuest() {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, contactedVia: form.contactedVia || undefined }),
      });
      if (!res.ok) throw new Error();
      toast.success("Guest added");
      setOpen(false);
      setForm({ name: "", email: "", company: "", contactedVia: "", role: "attendee", rsvpStatus: "pending", notes: "" });
      router.refresh();
    } catch {
      toast.error("Failed to add guest");
    } finally {
      setSaving(false);
    }
  }

  async function bulkImport() {
    const lines = importText.trim().split("\n").filter(Boolean);
    if (!lines.length) return;
    setImporting(true);
    let added = 0;
    for (const line of lines) {
      const parts = line.split(/\t|  +/).map((p) => p.trim()).filter(Boolean);
      if (parts.length < 1) continue;
      const name = parts[0];
      // detect which part is the channel (LI / Email / Msg / LinkedIn)
      let contactedVia: string | undefined;
      let company: string | undefined;
      for (let i = 1; i < parts.length; i++) {
        const p = parts[i].toLowerCase();
        if (p === "li" || p === "linkedin") { contactedVia = "linkedin"; }
        else if (p === "email") { contactedVia = "email"; }
        else if (p === "msg") { contactedVia = "msg"; }
        else { company = parts[i]; }
      }
      await fetch(`/api/events/${eventId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, contactedVia }),
      });
      added++;
    }
    toast.success(`${added} guest${added !== 1 ? "s" : ""} imported`);
    setImportOpen(false);
    setImportText("");
    setImporting(false);
    router.refresh();
  }

  async function updateRsvp(guestId: string, rsvpStatus: string) {
    await fetch(`/api/events/${eventId}/guests/${guestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rsvpStatus }),
    });
    router.refresh();
  }

  async function removeGuest(guestId: string) {
    await fetch(`/api/events/${eventId}/guests/${guestId}`, { method: "DELETE" });
    toast.success("Guest removed");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        {/* Bulk Import */}
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger render={<Button size="sm" variant="outline" />}>
            Import List
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Bulk Import Guests</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Paste rows with columns: <strong>Name · LI/Email/Msg · Company</strong> (tab or multi-space separated)</p>
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={10}
                placeholder={"Darlene Yu    Msg    Our Place\nAndreas Andrea    LI    Living Proof"}
                className="font-mono text-xs"
              />
              <Button onClick={bulkImport} disabled={!importText.trim() || importing} className="w-full">
                {importing ? "Importing…" : "Import"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add single guest */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="h-3 w-3 mr-1" /> Add Guest
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Guest</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Company</Label>
                  <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
                <div>
                  <Label>Contacted Via</Label>
                  <Select value={form.contactedVia} onValueChange={(v) => setForm({ ...form, contactedVia: v ?? "" })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="msg">Msg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v ?? "attendee" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attendee">Attendee</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="sponsor">Sponsor</SelectItem>
                      <SelectItem value="speaker">Speaker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>RSVP</Label>
                  <Select value={form.rsvpStatus} onValueChange={(v) => setForm({ ...form, rsvpStatus: v ?? "pending" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <Button onClick={addGuest} disabled={!form.name || saving} className="w-full">
                {saving ? "Adding…" : "Add Guest"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {guests.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No guests yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Via</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>RSVP</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {guests.map((g) => (
              <TableRow key={g.id}>
                <TableCell>
                  <div className="font-medium">{g.name}</div>
                  {g.email && <div className="text-xs text-muted-foreground">{g.email}</div>}
                  {g.sponsorId && <Badge variant="secondary" className="text-[10px] mt-0.5">Sponsor contact</Badge>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{g.company ?? "—"}</TableCell>
                <TableCell>
                  {g.contactedVia ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${CONTACTED_VIA_COLORS[g.contactedVia]}`}>
                      {CONTACTED_VIA_LABELS[g.contactedVia]}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell className="capitalize text-sm">{g.role}</TableCell>
                <TableCell>
                  <Select defaultValue={g.rsvpStatus ?? "pending"} onValueChange={(v) => updateRsvp(g.id, v ?? "pending")}>
                    <SelectTrigger className="h-7 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeGuest(g.id)}>
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── Tasks Tab ─────────────────────────────────────────────────────────────────
const TASK_OWNERS = ["Bhavana", "Gowtham"];

function OwnerPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 mt-1">
      {TASK_OWNERS.map((owner) => (
        <button
          key={owner}
          type="button"
          onClick={() => onChange(value === owner ? "" : owner)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            value === owner
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:border-primary/50"
          }`}
        >
          {owner}
        </button>
      ))}
    </div>
  );
}

function TasksTab({ eventId, tasks }: Pick<EventActionsClientProps, "eventId" | "tasks">) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", assignedTo: "", dueDate: "", notes: "" });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({ title: "", assignedTo: "", dueDate: "", notes: "", status: "todo" });
  const [editSaving, setEditSaving] = useState(false);

  async function addTask() {
    setSaving(true);
    try {
      await fetch(`/api/events/${eventId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "todo" }),
      });
      toast.success("Task created");
      setOpen(false);
      setForm({ title: "", assignedTo: "", dueDate: "", notes: "" });
      router.refresh();
    } catch {
      toast.error("Failed to create task");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(t: Task) {
    setEditingTask(t);
    setEditForm({
      title: t.title,
      assignedTo: t.assignedTo ?? "",
      dueDate: t.dueDate ?? "",
      notes: t.notes ?? "",
      status: t.status ?? "todo",
    });
  }

  async function saveEdit() {
    if (!editingTask) return;
    setEditSaving(true);
    try {
      await fetch(`/api/events/${eventId}/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      toast.success("Task updated");
      setEditingTask(null);
      router.refresh();
    } catch {
      toast.error("Failed to update task");
    } finally {
      setEditSaving(false);
    }
  }

  async function updateStatus(taskId: string, status: string) {
    await fetch(`/api/events/${eventId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function deleteTask(taskId: string) {
    await fetch(`/api/events/${eventId}/tasks/${taskId}`, { method: "DELETE" });
    toast.success("Task deleted");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="h-3 w-3 mr-1" /> Add Task
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Assigned To</Label>
                  <OwnerPicker value={form.assignedTo} onChange={(v) => setForm({ ...form, assignedTo: v })} />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <Button onClick={addTask} disabled={!form.title || saving} className="w-full">
                {saving ? "Creating…" : "Create Task"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(o) => { if (!o) setEditingTask(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Assigned To</Label>
                <OwnerPicker value={editForm.assignedTo} onChange={(v) => setEditForm({ ...editForm, assignedTo: v })} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v ?? "todo" })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3} />
            </div>
            <Button onClick={saveEdit} disabled={!editForm.title || editSaving} className="w-full">
              {editSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No tasks yet.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-start gap-3 rounded-md border p-3">
              <button
                onClick={() => updateStatus(t.id, t.status === "done" ? "todo" : "done")}
                className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors mt-0.5 ${t.status === "done" ? "bg-green-500 border-green-500 text-white" : "border-gray-300"}`}
              >
                {t.status === "done" && <Check className="h-3 w-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                  {t.title}
                </p>
                <div className="flex flex-wrap gap-2 items-center mt-1">
                  {t.assignedTo && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      {t.assignedTo}
                    </span>
                  )}
                  {t.dueDate && <span className="text-xs text-muted-foreground">Due: {t.dueDate}</span>}
                </div>
                {t.notes && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.notes}</p>
                )}
              </div>
              <Select defaultValue={t.status ?? "todo"} onValueChange={(v) => updateStatus(t.id, v ?? "todo")}>
                <SelectTrigger className="h-7 w-28 text-xs shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => openEdit(t)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => deleteTask(t.id)}>
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Budget Tab ────────────────────────────────────────────────────────────────
function BudgetTab({ eventId, budget }: Pick<EventActionsClientProps, "eventId" | "budget">) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", plannedAmount: "", actualAmount: "" });

  const totalPlanned = budget.reduce((s, b) => s + (b.plannedAmount ?? 0), 0);
  const totalActual = budget.reduce((s, b) => s + (b.actualAmount ?? 0), 0);

  async function addCategory() {
    setSaving(true);
    try {
      await fetch(`/api/events/${eventId}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          plannedAmount: form.plannedAmount ? parseFloat(form.plannedAmount) : 0,
          actualAmount: form.actualAmount ? parseFloat(form.actualAmount) : 0,
        }),
      });
      toast.success("Category added");
      setOpen(false);
      setForm({ name: "", plannedAmount: "", actualAmount: "" });
      router.refresh();
    } catch {
      toast.error("Failed to add category");
    } finally {
      setSaving(false);
    }
  }

  async function updateActual(catId: string, actualAmount: string) {
    await fetch(`/api/events/${eventId}/budget/${catId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualAmount: parseFloat(actualAmount) || 0 }),
    });
    router.refresh();
  }

  async function deleteCategory(catId: string) {
    await fetch(`/api/events/${eventId}/budget/${catId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="h-3 w-3 mr-1" /> Add Category
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Budget Category</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Category Name *</Label>
                <Input placeholder="e.g. Catering, AV, Marketing" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Planned ($)</Label>
                  <Input type="number" value={form.plannedAmount} onChange={(e) => setForm({ ...form, plannedAmount: e.target.value })} />
                </div>
                <div>
                  <Label>Actual ($)</Label>
                  <Input type="number" value={form.actualAmount} onChange={(e) => setForm({ ...form, actualAmount: e.target.value })} />
                </div>
              </div>
              <Button onClick={addCategory} disabled={!form.name || saving} className="w-full">
                {saving ? "Adding…" : "Add"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {budget.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No budget categories yet.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Planned</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {budget.map((b) => {
                const variance = (b.plannedAmount ?? 0) - (b.actualAmount ?? 0);
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(b.plannedAmount)}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        defaultValue={b.actualAmount ?? 0}
                        className="h-7 w-24 text-right text-sm ml-auto"
                        onBlur={(e) => updateActual(b.id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell className={`text-right text-sm ${variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {variance >= 0 ? "+" : ""}{formatCurrency(variance)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteCategory(b.id)}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{formatCurrency(totalPlanned)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totalActual)}</TableCell>
                <TableCell className={`text-right ${totalPlanned - totalActual >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {totalPlanned - totalActual >= 0 ? "+" : ""}{formatCurrency(totalPlanned - totalActual)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function EventActionsClient({ event, eventSponsors, guests, tasks, budget, eventId }: EventActionsClientProps) {
  return (
    <Tabs defaultValue="sponsors">
      <TabsList>
        <TabsTrigger value="sponsors">Sponsors ({eventSponsors.length})</TabsTrigger>
        <TabsTrigger value="guests">Guests ({guests.length})</TabsTrigger>
        <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
        <TabsTrigger value="budget">Budget</TabsTrigger>
      </TabsList>
      <TabsContent value="sponsors" className="mt-4">
        <SponsorsTab eventId={eventId} eventSponsors={eventSponsors} />
      </TabsContent>
      <TabsContent value="guests" className="mt-4">
        <GuestsTab eventId={eventId} guests={guests} />
      </TabsContent>
      <TabsContent value="tasks" className="mt-4">
        <TasksTab eventId={eventId} tasks={tasks} />
      </TabsContent>
      <TabsContent value="budget" className="mt-4">
        <BudgetTab eventId={eventId} budget={budget} />
      </TabsContent>
    </Tabs>
  );
}
