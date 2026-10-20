BookLeaf Author Support & Communication Portal
An AI-assisted support workspace for BookLeaf Publishing. The application helps a support administrator review author tickets, classify incoming requests, generate policy-grounded response drafts, and edit a response before sending it. If an AI draft fails accuracy checks or the AI provider is unavailable, the application can load a policy-based fallback template for human review.
Important: AI-generated and fallback replies are suggestions. Review facts, policy language, and next steps before sending a response.

Features
- Support ticket queue: View seeded tickets and triage them by status, priority, and category.
- Ticket details: Read the author's message and associated book context.
- AI-assisted classification: Classify tickets into Royalty & Payments, ISBN & Metadata Issues, Printing & Quality, Distribution & Availability, Book Status & Production Updates, or General Inquiry.
- Priority safeguards: Apply deterministic priority floors for selected high-impact cases.
- AI response drafting: Generate author-facing replies using the BookLeaf knowledge base, category playbooks, and available ticket/book facts.
- Draft validation and retry: Check generated replies for unsupported claims, missing policy details, and other accuracy issues before returning them.
- Template fallback: Load a policy-based template when AI generation fails or a draft does not pass validation.
- Human review: Let an administrator edit the proposed reply and review it before sending.
- Internal notes and ticket workflow: Support internal operational notes and ticket status/priority/category management.
- API documentation: Browse the backend's Swagger UI at http://localhost:3000/docs when the backend is running.
Technology
- Frontend: React, TypeScript, Vite
- Backend: NestJS, TypeScript, REST API
- Database: MongoDB with Mongoose
- AI: Groq-compatible API configuration using openai/gpt-oss-20b as the configured model in the current development setup
- Testing: Vitest and a TypeScript-based AI evaluation script
Project layout
The commands below assume the repository contains backend/ and a frontend directory (commonly frontend/). If your frontend folder has a different name, use that folder in the frontend commands.
bookleaf-support-portal/
├── backend/
│   ├── src/
│   ├── scripts/
│   ├── reports/
│   └── package.json
├── frontend/                 # Use the actual frontend directory name if different
└── README.md
Prerequisites
- Node.js and npm (use a Node version supported by the project dependencies)
- A MongoDB database, local or hosted
- An AI provider API key for live AI classification and drafting
Configuration
1. Open the backend/ directory.
2. Create backend/.env and set the environment variables expected by the backend configuration.
3. Provide the MongoDB connection URI using the exact variable name read by the application's database configuration.
4. Configure the AI provider key as GROQ_API_KEY. The current evaluation setup reports openai/gpt-oss-20b as its model; configure GROQ_MODEL if your environment uses that variable.
5. For demo-data seeding, configure the credentials expected by the seed script: DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, and DEMO_AUTHOR_PASSWORD.
Security: Never commit .env, real API keys, production credentials, or real customer/author data. Use placeholder values in .env.example and demo-only credentials for recordings.
Run locally
1. Start the backend
cd backend
npm install
npm run build
npm run start:dev
When the backend starts successfully, the API is expected at http://localhost:3000 and the Swagger documentation at http://localhost:3000/docs.
2. Seed demonstration data
Use the seed command defined in backend/package.json and configure the required DEMO_* values before running it. The assignment's sample author/book data should be used for demonstration seeding. Check the package scripts (npm run) if you need to confirm the exact seed command name.
3. Start the frontend
In a separate terminal, change into the frontend directory and install its dependencies:
cd frontend
npm install
npm run dev
Open the local URL printed by Vite. Ensure the frontend API base URL points to the backend, normally http://localhost:3000/api, using the environment variable supported by the frontend configuration.
Useful API routes
The backend logs confirm these author-facing routes:
Method	Route	Purpose
GET	/api/author/books	Retrieve the author's books
POST	/api/author/tickets	Create an author support ticket
GET	/api/author/tickets	List author support tickets
GET	/api/author/tickets/:id	Retrieve a ticket by ID


For the full route list and request schemas, open http://localhost:3000/docs after starting the backend.
Tests and AI evaluation
Run these from backend/.
Build and unit tests
npm run build
npm test
Main classification and rule-fallback evaluation
npx tsx scripts/eval-ai.ts
Held-out classification evaluation
npx tsx scripts/eval-ai.ts --heldout
Response-draft evaluation only
npx tsx scripts/eval-ai.ts --drafts-only
The evaluation script writes a machine-readable report to backend/reports/ai-eval-results.json. A run with --drafts-only skips ticket classification but still executes the rule-fallback checks. Draft evaluation makes provider requests and includes delays between cases to reduce rate-limit pressure, so it can take several minutes.
AI safeguards and known limitations
- Drafts can be rejected by deterministic validators. In that case, a fallback template is returned for review.
- AI-provider errors, timeouts, or rate limits can prevent a draft from being generated; the fallback path is intended to keep the support workflow usable.
- A fallback response may require editing to address the specific ticket fully.
- The application must not claim that a payment is eligible, scheduled, or overdue based only on a pending balance or the minimum threshold.
- The application must not claim that an internal escalation, investigation, correction, re-sync, or reprint has already happened unless the available records confirm it.
- Treat seed accounts and generated tickets as demo data. Do not use real personal, financial, or account data in a recorded demonstration.
Demo video checklist
For a concise walkthrough, record these short segments:
1. Workspace overview: Show the queue, ticket counts, and filtering by category/priority/status.
2. AI classification and drafting: Open a royalty ticket, generate a draft, and point out the verified book figures, threshold explanation, policy caveat, and follow-up step.
3. Fallback and human review: Open an ISBN ticket where the AI draft is rejected, show the fallback template, edit it into a ticket-specific response, and explain that it is reviewed before sending.
4. Technical proof (optional): Briefly show Swagger at /docs and a successful build/test result. Avoid exposing .env, keys, passwords, or sensitive machine information.
Before sharing the video, use demo credentials, close unrelated windows, hide browser bookmarks and private notifications, and avoid clicking Send reply unless the recording intentionally demonstrates that action.
Submission contents
- Source code repository or ZIP
- This README with setup instructions
- .env.example with placeholder values only
- Assignment sample data/seed instructions, where required by the brief
- Demo video link(s), if requested by the hiring team
- Short notes describing assumptions and current limitations