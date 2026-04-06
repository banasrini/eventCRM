import type Anthropic from "@anthropic-ai/sdk";

export const CRM_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_sponsors",
    description: "Search for sponsors by name or location",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query for company name" },
      },
    },
  },
  {
    name: "create_sponsor",
    description: "Add a new sponsor to the CRM master list",
    input_schema: {
      type: "object",
      required: ["company_name"],
      properties: {
        company_name: { type: "string" },
        contact_name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        url: { type: "string", description: "Company website URL" },
        city: { type: "string" },
        state: { type: "string" },
        country: { type: "string" },
        notes: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "update_sponsor",
    description: "Update an existing sponsor's details",
    input_schema: {
      type: "object",
      required: ["sponsor_id"],
      properties: {
        sponsor_id: { type: "string" },
        company_name: { type: "string" },
        contact_name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        url: { type: "string", description: "Company website URL" },
        notes: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "search_events",
    description: "Search events by name or status",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query for event name" },
        status: {
          type: "string",
          enum: ["planning", "active", "completed"],
        },
      },
    },
  },
  {
    name: "create_event",
    description: "Create a new event",
    input_schema: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
        date: { type: "string", description: "ISO-8601 date e.g. 2025-06-15" },
        venue: { type: "string" },
        city: { type: "string" },
        state: { type: "string" },
        status: {
          type: "string",
          enum: ["planning", "active", "completed"],
          default: "planning",
        },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "attach_sponsor_to_event",
    description:
      "Attach a sponsor to an event with optional tier and contribution amount. Always search for both the sponsor and event first to get their IDs.",
    input_schema: {
      type: "object",
      required: ["event_id", "sponsor_id"],
      properties: {
        event_id: { type: "string" },
        sponsor_id: { type: "string" },
        tier: { type: "string", enum: ["gold", "silver", "bronze", "custom"] },
        contribution: {
          type: "number",
          description: "Dollar amount contributed",
        },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "add_guest",
    description:
      "Add a guest to an event. Can optionally link to a sponsor record if the guest is a sponsor contact.",
    input_schema: {
      type: "object",
      required: ["event_id", "name"],
      properties: {
        event_id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        rsvp_status: {
          type: "string",
          enum: ["pending", "confirmed", "declined"],
          default: "pending",
        },
        role: {
          type: "string",
          enum: ["vip", "sponsor", "speaker", "attendee"],
          default: "attendee",
        },
        sponsor_id: {
          type: "string",
          description: "Link this guest to a sponsor record",
        },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "update_guest_rsvp",
    description: "Update a guest's RSVP status or role. Search for the guest first to get the ID.",
    input_schema: {
      type: "object",
      required: ["guest_id"],
      properties: {
        guest_id: { type: "string" },
        rsvp_status: {
          type: "string",
          enum: ["pending", "confirmed", "declined"],
        },
        role: {
          type: "string",
          enum: ["vip", "sponsor", "speaker", "attendee"],
        },
      },
    },
  },
  {
    name: "search_guests",
    description: "Search for guests by name within a specific event or all events",
    input_schema: {
      type: "object",
      properties: {
        event_id: { type: "string", description: "Limit search to this event" },
        name: { type: "string", description: "Guest name to search for" },
      },
    },
  },
  {
    name: "create_task",
    description: "Create a task for an event",
    input_schema: {
      type: "object",
      required: ["event_id", "title"],
      properties: {
        event_id: { type: "string" },
        title: { type: "string" },
        assigned_to: { type: "string" },
        due_date: { type: "string" },
        status: { type: "string", enum: ["todo", "in_progress", "done"] },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "update_task",
    description: "Update a task's status, assignee, or due date",
    input_schema: {
      type: "object",
      required: ["task_id"],
      properties: {
        task_id: { type: "string" },
        title: { type: "string" },
        status: { type: "string", enum: ["todo", "in_progress", "done"] },
        assigned_to: { type: "string" },
        due_date: { type: "string" },
      },
    },
  },
  {
    name: "get_sponsor_history",
    description: "Get all events a sponsor has been attached to",
    input_schema: {
      type: "object",
      required: ["sponsor_id"],
      properties: {
        sponsor_id: { type: "string" },
      },
    },
  },
  {
    name: "get_event_summary",
    description:
      "Get a full summary of an event including sponsor count, guest count, task count, and budget totals",
    input_schema: {
      type: "object",
      required: ["event_id"],
      properties: {
        event_id: { type: "string" },
      },
    },
  },
];
