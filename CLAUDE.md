# PROJECT CONTEXT — READ FULLY BEFORE STARTING

## WHO I AM

I'm a 3rd-year CSE student prepping for campus placements (product-based companies,
targeting 15–30 LPA range, placements starting August 4, 2026). I'm juggling DSA,
CS fundamentals, LLD, and SQL prep at the same time as building this project, so my
time is tight and I need this project to serve double duty: a working resume piece
AND a way to relearn MERN properly.

## MY MERN BACKGROUND — BE HONEST ABOUT THIS

I learned MERN basics a while ago but have lost touch — I've forgotten most of it.
Do not assume I remember fundamentals. Assume I need refreshers on almost everything,
but don't be condescending about it either. Explain like I'm a competent engineer
who's rusty, not a total beginner.

## WHY I'M BUILDING THIS PROJECT

Two reasons, in order of importance:
1. To relearn MERN properly, end-to-end, from an INTERVIEW perspective — I need to
   be able to defend every architectural decision and explain every core concept used.
2. To have a working, non-generic project for my resume (my other resume project is
   NegGuard, a research project — this MERN project is meant to show full-stack
   engineering ability).

## HOW I WANT US TO WORK TOGETHER — THIS IS THE MOST IMPORTANT SECTION

- **You write the code. I will not be typing line-by-line.** My goal is to read,
  understand, and be able to explain every part — not to build typing muscle memory.
  It would be a waste of my limited time to hand-type boilerplate I already
  conceptually understand how to write. The learning happens through understanding
  the *why*, not through typing the *what*.
- Before building any component, briefly explain WHAT we're about to build and WHY
  it's needed (e.g. "we need middleware here because...").
- After building each component, explain what it actually does — not just "this
  works" but the underlying concept (e.g. if we add JWT auth, explain access vs
  refresh tokens, why stateless auth, what happens if the secret leaks).
- Flag anything an interviewer is likely to ask about this specific piece of code,
  and give me the one-line answer I should be able to say out loud in an interview.
- When introducing a new concept (event loop, middleware chaining, indexing,
  virtual DOM, connection pooling, etc.) explain it in a way I can repeat
  confidently in an interview — not textbook-dense, but not oversimplified either.
- After each major module, quiz me with 1–2 questions an interviewer might realistically
  ask, so I can check if I actually understood it or just watched you build it.
- **Do NOT move to the next component until I confirm I understand the current one.**
  This is a hard checkpoint, not a suggestion. Don't steamroll through the whole
  build while I passively read.
- I will go through every file thoroughly myself and learn the concepts — give me
  enough explanation in comments and in your responses that this is possible without
  me having to ask "wait, what does this do" for every line.

## GOAL

By the time this project is done, I should be able to:
- Explain every architectural decision (why Redis, why Socket.io, why JWT over
  sessions, why MongoDB over SQL here, etc.)
- Walk an interviewer through the full data flow from memory
- Answer fundamentals questions tied to each part of the stack (event loop, virtual
  DOM, indexing, middleware, etc.) without looking at the code

---

# PROJECT: Real-Time URL Shortener + Analytics Dashboard

## STACK — FULL END-TO-END BREAKDOWN

### Frontend
- **React** (functional components + hooks) — UI, dashboard, URL creation form
- **Chart.js** (via react-chartjs-2) — visualizing click analytics (clicks over
  time, device/browser breakdown, geo data if scoped in)
- **Socket.io-client** — real-time updates on the dashboard when a shortened link
  gets clicked (no refresh needed)
- **Axios** — API calls to backend
- **TailwindCSS** (optional but recommended) — fast, clean styling without writing
  custom CSS

### Backend
- **Node.js + Express** — REST API server (routes: create short URL, redirect, get
  analytics, auth)
- **JWT (jsonwebtoken)** — stateless auth for dashboard/user accounts (access token
  + refresh token flow)
- **bcrypt** — password hashing
- **Socket.io (server)** — pushes real-time click events to connected dashboard
  clients

### Database
- **MongoDB (Mongoose ODM)** — primary store: users, URL mappings (short code →
  long URL), click metadata (timestamp, device, referrer)
- **Redis** — two distinct jobs, keep both explicit:
  1. **Caching** — short code → long URL lookups (so redirects don't hit MongoDB
     every time; critical for read-heavy traffic)
  2. **Rate limiting** — prevent abuse of the shorten-URL endpoint (e.g. using
     `rate-limiter-flexible` or a simple sliding window in Redis)

### Infra / DevOps
- **Docker + Docker Compose** — containerize frontend, backend, MongoDB, Redis as
  separate services so the whole thing spins up with one command
- **Nginx** (optional, adds polish) — reverse proxy in front of Express, handles
  the actual short-URL redirect at the edge

### Supporting libraries
- **nanoid** or **shortid** — generating short URL codes
- **express-validator** — input validation on API routes
- **dotenv** — environment config management
- **cors** — cross-origin handling between frontend/backend during dev

## DATA FLOW — WALK ME THROUGH EACH STEP AS WE BUILD IT

These are the flows interviewers are most likely to probe. Each one should get its
own clear explanation as we build the relevant pieces, and I should be quizzed on
each once built.

1. **URL creation:** User submits long URL → Express validates → nanoid generates
   short code → saved in MongoDB → cached in Redis
2. **Redirect flow:** Someone hits the short URL → Express checks Redis first
   (cache hit = fast redirect) → cache miss = Mongo lookup + backfill Redis →
   redirect (302) → click event logged async → Socket.io emits event to dashboard
3. **Real-time dashboard:** Dashboard listens via Socket.io → Chart.js re-renders
   in real time as click events come in
4. **Auth flow:** login → JWT issued → protected routes check token → refresh
   token flow for session persistence

## INTERVIEW PREP ANGLE — KEEP THIS FRONT OF MIND THROUGHOUT

Since I only wrote "MERN" on my resume with no other qualifier, interviewers may
default to a standard script across all four letters, not just questions about this
specific project:
- **M**ongoDB: indexing, schema design (why NoSQL here), aggregation pipeline basics
- **E**xpress: middleware, how routing works, error handling
- **R**eact: reconciliation/virtual DOM, useEffect pitfalls, state management,
  re-render triggers
- **N**ode: event loop, async/await vs callbacks, how Node handles concurrency

Whenever a component we build touches one of these areas, explicitly call it out
and connect it back to the underlying fundamental, not just the implementation
detail. I should walk away from this project able to answer both "what does this
code do" and "explain the event loop" with equal confidence.

## OTHER CONTEXT (in case it's useful while building)

- I'm also building/have built NegGuard, a separate research project (LLM-based
  descriptive answer grading system) — this MERN project is unrelated to that, but
  both will sit on my resume as my two core projects.
- Time is tight — DSA, CS fundamentals, LLD, and SQL prep are running in parallel
  with this build, so keep explanations efficient: thorough enough to actually
  learn from, not padded.
- Estimated effort for this project: ~8–10 hours total build time.