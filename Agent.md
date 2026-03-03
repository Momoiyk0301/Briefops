🎯 Project Mission

This project is a SaaS for the event industry.

The goal is to generate structured, modular event briefings for field teams (roadies, stage managers, staff managers, event crew).

The MVP must focus only on:

Creating a briefing

Activating/deactivating modules

Exporting or sharing the briefing

Basic subscription restriction (Stripe)

No over-engineering.
Speed and clarity over complexity.

🧠 Product Philosophy

This is a real-world tool built from field experience.

Priorities:

Clarity of information

Simplicity of UI

Modular structure

Fast creation workflow

Mobile-friendly interface

Every feature must answer:
"Does this reduce confusion on the field?"

If not, do not build it.

🏗 Technical Stack

Frontend:

React 

TailwindCSS

Backend / DB:

Supabase (Postgres + Auth + RLS)
resend : pour les mails 
Payments:

Stripe

Deployment:

Vercel

📦 Architecture Rules

Keep database schema simple.

Use JSON fields for module data (avoid premature normalization).

One organization per user for MVP.

Use server-side routes for sensitive operations (PDF generation, Stripe webhooks).

Always implement RLS policies.

⚙️ Coding Rules

No unnecessary abstractions.

No premature optimization.

Prefer readable code over clever code.

Keep components small and focused.

Reuse logic when possible.

Always explain what files were modified.

Environment files rule:
- Do not modify existing environment variables (values already defined).
- Creating `.env` files is allowed.
- Adding new environment variables is allowed.

🧩 How AI Should Work

When implementing a feature:

Explain the approach briefly.

Show file structure changes.

Provide code per file.

Explain how to test it locally.

Never rewrite the entire project unless explicitly requested.

If something is unclear, make the simplest assumption and proceed.
