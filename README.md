# Raila AI Chat

Realtime chat platform built with React, Firebase, and Google Gemini. Features invite-only access, room-based messaging, persistent direct messages, file sharing, emoji reactions, threaded replies, slash commands, AI-powered chat and summaries, online presence with typing indicators, and unread counts — all backed by Firebase Cloud Functions so no secrets touch the browser.

This repository assumes the documented production setup: Firebase Auth + Firestore + Cloud Functions, with Blaze enabled for AI, invite management, and file uploads. Spark can be used only for ad hoc local experiments; tracked app code does not auto-approve users or bypass the invite/admin model.

## Live Demo

[Add link here]

## Screenshots

[Add 3-5 screenshots or GIFs here]

- Sign-in → invite gate flow
- Main chat room with AI summary panel and reactions
- Sidebar with online presence dots, unread badges, and DM list
- Typing indicator, reply thread, and slash command menu
- Mobile layout with icon-only header buttons
- Admin panel with invite code management

## Why We Built It

Raila AI Chat started as a collaborative idea between me and my friend Suvanga. We wanted to build a modern group chat product — not a messaging demo, but something that feels like a real collaborative tool with proper realtime infrastructure.

Suvanga started the initial implementation. I joined to push the project toward production quality: proper backend architecture, invite system, first-class DMs, presence system, unread state, file uploads, reactions, replies, AI features behind Cloud Functions, and Firestore security rules.

## My Contributions

- **Backend AI architecture** — moved all Gemini API calls to Firebase Cloud Functions (`generateAiResponse`, `summarizeRoom`); API key stored in Secret Manager, never exposed client-side
- **AI room summaries** — one-click summary of the last 50 messages in any chat, powered by Gemini via Cloud Function
- **AI conversation context** — last 10 messages sent as history so AI responses are contextually aware
- **Invite-only access** — Cloud Functions for creating, redeeming, and managing invite codes with expiration and usage limits
- **Admin panel** — admin-only UI for generating invite codes, viewing usage, and toggling active/inactive status
- **First-class DMs** — persistent Firestore DM documents with `isDM` flag, deterministic chat IDs, member info storage, sidebar integration with avatars and online presence dots
- **Online presence** — Firestore-backed online/offline tracking with `lastSeen` timestamps, auto-updates on visibility change and page unload, green/gray dots in sidebar
- **Typing indicators** — real-time per-chat typing status via Firestore sub-collections (works for public chat and group/DM chats), debounced input tracking, status bar with multi-user display
- **Unread counts** — per-room unread message badges, `lastRead` timestamps per user, auto-mark-as-read on chat open
- **File uploads** — image and document sharing via Firebase Storage with 10MB limit, inline image previews, download links for documents
- **Emoji reactions** — quick-reaction toolbar on hover with 6 emoji options, toggle on/off, active state per user, reaction count badges
- **Threaded replies** — reply-to-message with inline quote display, reply bar above send form, sender attribution
- **Slash commands** — `/trip`, `/homework`, `/budget`, `/date`, `/ask` for quick AI model switching with autocomplete menu
- **Message search** — search bar with highlight matching across messages in the active room
- **Markdown rendering** — AI messages rendered with `react-markdown` and `remark-gfm` (tables, code blocks, lists, blockquotes)
- **Date separators** — "Today", "Yesterday", and formatted date headers between message groups
- **Custom hooks architecture** — extracted `useAuth`, `useMessages`, `useChatList`, `usePresence`, `useUnread` for clean state separation
- **Firestore security rules** — members-only read/write for chats, messages, and typing; user-scoped presence and lastRead writes
- **Mobile UX** — responsive sidebar with hamburger toggle, icon-only header buttons on small screens, proper touch targets
- **Bug fixes** — fixed memory leak in presence listener cleanup, fixed broken reaction toggle, fixed typing indicators for public chat path, fixed CreateGroupModal wiring

## Current Features

- **Auth** — Firebase Authentication with Google sign-in
- **Invite system** — invite-only access with code generation, redemption, expiration, and usage limits
- **Admin panel** — admin role with invite code management (create, view, activate/deactivate)
- **Realtime chat** — room-based group messaging with Firestore `onSnapshot`
- **Group creation** — modal with member search and selection
- **Direct messages** — persistent 1-on-1 chats with Firestore documents, shown in sidebar with presence dots
- **AI assistant** — `@RailaAI` mention or slash commands trigger server-side Gemini response with conversation context
- **AI room summaries** — one-click summarize button generates a bullet-point recap of recent messages
- **AI personalities** — switch between "Sushil" (polite) and "Chada" (sassy) modes
- **AI models** — General, Trip Planner, Date Planner, Budgeting, Homework Help
- **Slash commands** — `/trip`, `/homework`, `/budget`, `/date`, `/ask` with autocomplete menu
- **File sharing** — upload images and documents (up to 10MB) with inline previews
- **Emoji reactions** — quick-react on hover, toggle per user, count badges
- **Threaded replies** — reply to specific messages with inline quote display
- **Message search** — real-time search with match highlighting
- **Markdown** — AI messages rendered with full GFM support (tables, code, lists)
- **Online presence** — green/gray dots showing online/offline status for DM contacts
- **Typing indicators** — real-time "X is typing..." status bar with animated dots
- **Unread counts** — per-room badge counts, auto-cleared on open
- **Date separators** — "Today", "Yesterday", and formatted headers between message groups
- **Emoji picker** — inline emoji selection via `emoji-picker-react`
- **User search** — find and start conversations with other users
- **Message quality** — sender names, avatars, formatted timestamps, loading/empty/error states
- **Mobile responsive** — hamburger sidebar, icon-only header buttons, proper touch targets
- **Security rules** — Firestore rules enforce member-only access to chats and messages

## Planned Features

- Push notifications for new messages
- Message delivery receipts
- Semantic search across chat history with embeddings
- Voice messages
- User profiles with status and bio

## Tech Stack

- **Frontend** — React 19, Vite 7, CSS (custom dark theme)
- **Auth** — Firebase Authentication (Google provider)
- **Database** — Cloud Firestore (realtime subscriptions)
- **Storage** — Firebase Storage (file uploads)
- **Backend** — Firebase Cloud Functions v2 (Node 18)
- **AI** — Google Gemini API (proxied server-side)
- **Secrets** — Firebase Secret Manager
- **Libraries** — emoji-picker-react, react-markdown, remark-gfm, firebase SDK

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  React Frontend (Vite)                              │
│                                                     │
│  useAuth ─── Firebase Auth (Google sign-in)         │
│  useMessages ── Firestore onSnapshot (realtime)     │
│  useChatList ── groups + DMs from chats collection  │
│  usePresence ── presence/{uid}, typing indicators   │
│  useUnread ── lastRead timestamps vs message times  │
│                                                     │
│  ChatRoom ──→ httpsCallable('generateAiResponse')   │
│  App ────────→ httpsCallable('summarizeRoom')       │
│  Sidebar ────→ httpsCallable('createInviteCode')    │
│  InviteGate ─→ httpsCallable('redeemInviteCode')    │
│  AdminPanel ─→ httpsCallable('getInviteCodes')      │
│               httpsCallable('toggleInviteCode')     │
└───────────────────────┬─────────────────────────────┘
                        │ Firebase callable
┌───────────────────────▼─────────────────────────────┐
│  Cloud Functions (v2)                               │
│                                                     │
│  generateAiResponse ── auth → prompt → Gemini       │
│  summarizeRoom ─────── auth → fetch msgs → Gemini   │
│  createInviteCode ──── auth → generate code         │
│  redeemInviteCode ──── auth → validate → approve    │
│  getInviteCodes ────── admin → list all codes       │
│  toggleInviteCode ──── admin → activate/deactivate  │
│                                                     │
│  GEMINI_API_KEY stored in Secret Manager            │
└─────────────────────────────────────────────────────┘
```

**Firestore data model:**

| Collection | Purpose |
|---|---|
| `users/{uid}` | User profile, approval status, role |
| `users/{uid}/lastRead/{chatId}` | Timestamp of last read per chat |
| `messages/{id}` | Public chat messages (text, reactions, replies, files) |
| `chats/{chatId}` | Chat metadata (isGroup, isDM, members, membersInfo) |
| `chats/{chatId}/messages/{id}` | Group/DM messages |
| `chats/{chatId}/typing/{uid}` | Real-time typing indicators |
| `typing/{uid}` | Public chat typing indicators |
| `presence/{uid}` | Online status, lastSeen, displayName |
| `invites/{code}` | Invite codes (maxUses, usedBy, expiresAt, active) |

## Project Structure

```
src/
  App.jsx                        # Root layout, auth, sidebar, chat panel, AI summary
  App.css                        # Full application styles (dark theme, 2000+ lines)
  main.jsx                       # React entry point
  index.css                      # Base resets
  firebase-config.js             # Firebase credentials (gitignored)
  firebase-config.example.js     # Template for contributors
  hooks/
    useAuth.js                   # Auth state subscription
    useMessages.js               # Realtime message subscription with loading/error
    useChatList.js               # Group + DM chat list subscription
    usePresence.js               # Online presence, typing indicators (read + write)
    useUnread.js                 # Unread counts per chat, mark-as-read
  components/
    ChatRoom.jsx                 # Messages, send form, emoji, AI, typing, slash cmds, files
    ChatMessage.jsx              # Message bubble with reactions, replies, markdown, files
    Sidebar.jsx                  # Rooms, DMs, presence dots, unread badges, invites
    CreateGroupModal.jsx         # Group creation with member search and selection
    InviteGate.jsx               # Invite code redemption screen for new users
    AdminPanel.jsx               # Admin invite code management panel
    Signin.jsx                   # Google sign-in screen
functions/
  index.js                       # Cloud Functions (6 total): AI + invite management
  package.json                   # Functions dependencies
firestore.rules                  # Security rules (members-only access)
```

## Local Setup

```bash
git clone https://github.com/Suvanga/Raila-AI-Group-Chat.git
cd Raila-AI-Group-Chat
npm install
```

Create `src/firebase-config.js` from the example template:

```bash
cp src/firebase-config.example.js src/firebase-config.js
# Fill in your Firebase project credentials
```

Before running the full feature set, make sure your Firebase project has:

- Firestore enabled
- Google Auth enabled
- Cloud Functions deployed for invite management and AI features
- Blaze plan enabled if you want AI or file uploads

Start the dev server:

```bash
npm run dev
```

Deploy Cloud Functions and security rules:

```bash
cd functions && npm install && cd ..
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions
firebase deploy --only firestore:rules
```

Run the Firestore rules suite locally:

```bash
npm run test:rules
```

## What I'd Improve Next

- Push notifications for new messages
- Message delivery receipts
- Semantic search across chat history with embeddings
- Voice messages
- E2E tests with Playwright
- Code-split the bundle (currently 1.1MB gzipped 302KB)

## Resume / Portfolio Framing

Raila AI Chat is best described as:

**Invite-only realtime chat platform with Firebase Auth, Firestore messaging, file sharing, emoji reactions, threaded replies, persistent DMs with online presence, typing indicators, unread counts, and AI-powered chat and summaries via Cloud Functions — 6 serverless functions, 5 custom React hooks, and Firestore security rules.**

Strong bullet points for a resume:

- Built a realtime chat platform with Firebase Auth, Firestore subscriptions, persistent DMs, online presence, unread counts, typing indicators, emoji reactions, threaded replies, and file sharing using React custom hooks for modular state management
- Implemented 6 Firebase Cloud Functions for server-side AI chat (Gemini with conversation context), room summarization, and a full invite code system with admin controls — API keys secured in Secret Manager
- Designed invite-only access system with code generation, expiration, usage limits, and an admin panel for code lifecycle management

## License

MIT
