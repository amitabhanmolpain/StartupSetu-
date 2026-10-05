# StartupSetu

> **Where Government Problems Meet Startup Solutions.**
> AI recommends. Humans decide.

StartupSetu is an AI-powered bridge between government departments and startups. Departments post
problems, verified startups apply with a 30-second demo video, seven AI agents verify and rank them
with reasons, and government officers and experts make every important decision: selection,
contracts and payments.

**This is a FRONTEND-ONLY prototype.** All data is hardcoded mock data, and authentication is simulated
with localStorage. It makes no calls to Aadhaar, DigiLocker, GST, GeM, payment gateways or LLM APIs.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

Requires Node.js 18.18+ (Node 20/22 recommended). It needs no environment variables.

### For the judges / any live demo — use the production build

```bash
npm run demo        # = next build && next start  → http://localhost:3000
```

`npm run dev` compiles each page the first time you open it (1–6 s per page). That pause is
dev-mode only. The production build serves every page instantly, so always present from `npm run demo`.

## Themes

- **Light (default)**: Government Blue `#0E91E1` on white.
- **Dark**: the original StartupSetu look.
- Toggle with the ☀/🌙 button in the navbar, the dashboard top bar or the login pages.
- The choice is saved in `localStorage` under `startupsetu_theme` and applied before first paint, so it never flashes.
- All colours are CSS variables in `app/globals.css` (`:root` = light, `[data-theme="dark"]` = dark).
  Tailwind reads them via `tailwind.config.ts`.

## Demo logins

On `/login`, click **Continue with Demo Account** for any role. To type credentials instead
(password `demo1234` for every account), use:

| Role | Email | Lands on |
|---|---|---|
| Startup Owner | founder@ecotech.in | `/startup` |
| Government Administrator | priya.deshmukh@mahaurban.gov.in | `/government` |
| Expert / Reviewer | r.iyer@iitb.ac.in | `/expert` |
| Independent Validator | neha.joshi@nabl-validators.in | `/validator` |
| Platform Administrator | admin@startupsetu.gov.in | `/admin` |

If you open a dashboard URL directly, the app signs you in as that role's demo account.

## Judge demo flow (3–5 min)

1. `/` landing: Government Problem → AI Evaluation → Human Decision → Pilot → Impact
2. **Get Started** → choose **Government Administrator**
3. Government Control Center: 12 problems, 286 applications, 11 pending human reviews
4. **My Problems → Plastic Recycling**: 48 applications
5. **AI Evaluation Center**: seven agents (click **Run AI Evaluation**)
6. **AI Recommendation**: top 5, labelled *AI RECOMMENDATION — NOT FINAL DECISION*
7. **EcoTech**: score 92 with a reason, evidence and confidence for every number
8. **Human Review**: the officer reviews the evidence and the challenger findings
9. **Approve**: a confirmation modal with reviewer identity and MFA, then the decision lands in the audit trail
10. **Pilots**: milestone progress and target vs actual (4.6 / 5 t/week), with escrowed payments
11. **Trust & Compliance / Security Center / Audit Log**: trust scores both ways, a prompt-injection demo and a tamper-proof trail

## Main routes

```
/                      landing
/select-role /login /signup
/government            overview          /government/problems[/id|/new]
/government/applications[/id]            /government/ai-evaluation
/government/recommendation               /government/leaderboard
/government/human-review[/id]            /government/pilots   /government/payments
/government/trust      /government/security   /government/audit   /government/settings
/startup  /startup/opportunities[/id]    /startup/applications[/id]   /startup/evaluation
/startup/pilots  /startup/payments  /startup/trust  /startup/documents  /startup/profile
/expert/*   /validator/*   /admin/*
```

## Structure

```
app/                 Next.js App Router pages (one folder per role)
components/ui        design system (Button, Card, Badge, StatCard, ScoreRing, Modal, Drawer, Tabs…)
components/layout    DashboardShell, sidebar nav per role
components/ai        agent pipeline, explainability (score + reason + evidence + confidence)
components/shared    AuditTimeline
components/landing   landing sections
components/chatbot   multilingual assistant (English / हिन्दी / मराठी, hardcoded)
mock/                all fake data (startups, problems, applications, evaluations, pilots, audit…)
lib/store.tsx        mock auth + app state + toasts (localStorage)
tailwind.config.ts   design tokens → CSS variables in app/globals.css (light + dark values)
```

The design system is centralised: colours live only in `tailwind.config.ts`, and every screen uses the same
`glass` cards, glow borders and gradient backdrop.

## Assumptions

- All names, numbers, departments and startups are fictional demo data.
- "Reset" demo state: clear the site's localStorage keys `startupsetu.state` / `startupsetu.user`
  (DevTools → Application → Local Storage). The theme key `startupsetu_theme` is separate.
- AI agents, MFA, DigiLocker, escrow and hashing are UI simulations only.
