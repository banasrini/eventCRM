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
import { Plus, Trash2, Check } from "lucide-react";
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
function GuestsTab({ eventId, guests }: Pick<EventActionsClientProps, "eventId" | "guests">) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "attendee", rsvpStatus: "pending", notes: "" });

  async function addGuest() {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Guest added");
      setOpen(false);
      setForm({ name: "", email: "", role: "attendee", rsvpStatus: "pending", notes: "" });
      router.refresh();
    } catch {
      toast.error("Failed to add guest");
    } finally {
      setSaving(false);
    }
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
      <div className="flex justify-end">
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
function TasksTab({ eventId, tasks }: Pick<EventActionsClientProps, "eventId" | "tasks">) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", assignedTo: "", dueDate: "", notes: "" });

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
                  <Input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
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

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No tasks yet.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-md border p-3">
              <button
                onClick={() => updateStatus(t.id, t.status === "done" ? "todo" : "done")}
                className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${t.status === "done" ? "bg-green-500 border-green-500 text-white" : "border-gray-300"}`}
              >
                {t.status === "done" && <Check className="h-3 w-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                  {t.title}
                </p>
                <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                  {t.assignedTo && <span>→ {t.assignedTo}</span>}
                  {t.dueDate && <span>Due: {t.dueDate}</span>}
                </div>
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
              <Button variant="ghost" size="icon" onClick={() => deleteTask(t.id)}>
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
