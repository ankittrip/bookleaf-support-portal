BookLeaf Author Support & Communication Portal
A full-stack support portal for BookLeaf Publishing that helps authors raise and track support tickets while giving the operations team a central queue, AI-assisted classification, priority suggestions, and editable AI-drafted replies.
Submission status: Replace the deployment and repository placeholders below with the final public URLs before submitting. Verify the environment-variable names and seed command against the checked-in backend configuration and package.json files.

Links
- Live demo: ADD_DEPLOYED_DEMO_URL
- Source repository: ADD_PUBLIC_REPOSITORY_URL
- API documentation (local): http://localhost:3000/docs (if Swagger is enabled in the running backend)
Features
Author portal
- Email/password sign-in.
- View the author's books and available publishing and royalty information.
- Create a support ticket linked to a book or to a general/account-level query.
- View submitted tickets, their category, priority, status, and public conversation replies.
- Ticket access is scoped to the authenticated author's account.
Admin portal
- View and filter the ticket queue.
- Review AI-suggested categories and priorities, then override them when necessary.
- Generate an AI-assisted response draft, edit it, and send the final reply to the author.
- Update ticket status and assign a ticket to the current admin.
- Add and review internal notes intended for the operations team, not the author.
AI-assisted support
- Classifies tickets into BookLeaf support categories: Royalty & Payments, ISBN & Metadata Issues, Printing & Quality, Distribution & Availability, Book Status & Production Updates, and General Inquiry.
- Suggests ticket priority using an LLM, with deterministic priority-floor rules applied after classification so qualifying tickets are not left below their minimum priority.
- Drafts replies using BookLeaf's knowledge base and category-specific guidance.
- Validates generated drafts for selected policy and safety issues. When the model output is invalid or unavailable, the backend can return a safe template so ticket handling can continue.
- Records model usage in backend logs to help assess token use and provider behavior.
Technology stack
- Frontend: React, TypeScript, Vite
- Backend: Node.js, NestJS, TypeScript
- Database: MongoDB with Mongoose
- AI integration: Groq API through an OpenAI-compatible Responses API, configured by environment variables
- Authentication / authorization: JWT authentication and role-based guards
- API documentation: Swagger/OpenAPI, exposed at /docs when enabled
Architecture overview
The codebase separates the author experience, admin workflow, API controllers, business services, database schemas, and AI-related logic.
- Author controllers/services scope books and tickets to the authenticated author.
- Admin controllers/services provide queue management, assignment, status changes, public replies, internal notes, and AI draft generation.
- AI module handles ticket classification, priority adjustment, response drafting, draft validation, retry behavior, and safe fallback templates.
- MongoDB/Mongoose stores users, books, tickets, public messages, and associated operational data.
Typical ticket flow:
1. An author signs in and creates a ticket.
2. The backend saves the ticket and attempts AI classification and priority suggestion.
3. An admin reviews the ticket and can adjust the category, priority, or status.
4. The admin generates an AI draft, edits it as needed, and sends a public reply.
5. The reply appears in the author's ticket conversation; internal notes remain an admin workflow feature.
Local development setup
Prerequisites
- Node.js compatible with the versions specified by the project.
- npm.
- A MongoDB database (local MongoDB or MongoDB Atlas).
- A Groq API key for live AI classification and draft generation. The application should still be able to use its non-AI/fallback paths when the key is unavailable, subject to the implemented configuration.
1. Clone the repository
git clone ADD_PUBLIC_REPOSITORY_URL
cd bookleaf-support-portal
Replace ADD_PUBLIC_REPOSITORY_URL with the repository URL.
2. Configure the backend
cd backend
npm install
Create a local .env file based on the environment-variable names used by the backend configuration. Do not commit .env or real API keys.
The application uses these settings conceptually; use the exact variable names expected by the code:
Setting	Purpose
MongoDB connection URI	Connect the backend to the intended database
JWT_SECRET	Sign and verify authentication tokens; use a long, random secret
GROQ_API_KEY	Authenticate requests to the Groq API
GROQ_MODEL	Select the model; the tested evaluation configuration used openai/gpt-oss-20b
Backend port	Select the HTTP port if configurable; the development API has been run on port 3000


Start the backend using the script provided by backend/package.json (commonly npm run start:dev for a NestJS development server):
npm run start:dev
If this script differs in the current repository, use the matching script listed by npm run.
3. Configure the frontend
In a separate terminal:
cd frontend
npm install
Set the frontend's API base URL to the backend's local API address using the environment-variable name expected by the frontend configuration. Start Vite using the configured npm script, typically:
npm run dev
Use the local URL printed by Vite to open the application.
4. Seed the sample dataset
The assignment supplies bookleaf_sample_data.json containing 10 authors and 18 books. Seed the application with the provided records before demoing it, so the test accounts and book/royalty data match the expected sample data.
Use the seed command implemented in the repository's package.json or seed scripts. Add the exact command here before publishing this README:
# Replace with the actual seed command from this repository
ADD_SEED_COMMAND_HERE
Run seeding only against a development/demo database. A seed operation may create or reset demo records.

Demo accounts
These are development/demo credentials known to be used by the local seeded application. They should only be enabled on an isolated demo deployment, never for a production customer environment.
Role	Email	Password
Admin	admin@bookleaf.test	AdminDemo@123
Author	priya.sharma@email.com	AuthorDemo@123


Verify these credentials against the deployment's seed data before publishing the live demo. Do not use real author credentials in this section.
API overview
The backend exposes REST endpoints under the API prefix used by the application. The following routes are used by the portal; check the running Swagger page for request DTOs, response schemas, authentication requirements, and any route changes.
Method	Route	Purpose
POST	/api/author/tickets	Create a ticket for the authenticated author
GET	/api/author/tickets	List tickets belonging to the authenticated author
GET	/api/author/tickets/:id	Get the details and public conversation for the author's ticket
GET	/api/admin/tickets	List/filter tickets for admins
PATCH	/api/admin/tickets/:id	Update ticket fields such as status, category, or priority
POST	/api/admin/tickets/:id/assign-to-me	Assign the ticket to the authenticated admin
POST	/api/admin/tickets/:id/messages	Send a public reply to the author
GET	/api/admin/tickets/:id/notes	Get internal notes (admin-only)
POST	/api/admin/tickets/:id/notes	Add an internal note (admin-only)
POST	/api/admin/tickets/:id/ai-draft	Generate an AI-assisted response draft


The api prefix shown above assumes the configured global prefix in the running backend. If the project configuration uses a different prefix, update this table accordingly. Authentication endpoints and detailed DTO definitions are documented in the running Swagger UI when enabled.
AI design, safety, and cost awareness
Classification and priority
The LLM suggests a category and priority. Deterministic rules then apply minimum priority floors, preserving the AI's priority when it is already higher. This keeps urgent categories from being incorrectly left at Low while allowing the AI to provide the initial classification.
Response generation
The AI uses BookLeaf-specific knowledge and category guidance to draft an empathetic, specific response. The draft is editable by the admin; it is not intended to be sent without human review. Validation checks attempt to prevent unsupported operational claims, incorrect facts, misleading payment promises, and unsuitable follow-up wording.
Graceful degradation
If AI generation fails validation or the provider is unavailable, the service can return a safer template. Ticket creation and manual admin replies should not depend on a successful AI call.
Credentials and privacy
- Store API keys and JWT secrets in environment variables or the deployment platform's secret manager.
- Never put provider API keys in frontend variables or commit secrets to the repository.
- Treat model output as an editable suggestion, not an authoritative action record.
- Do not claim that a ticket was escalated, a re-sync was triggered, a payment was processed, or a correction was completed unless trusted workflow data confirms it.
Token usage
Backend logs record input/output usage for AI requests where provided by the API response. The evaluation script spaces draft requests to reduce bursts against provider token-per-minute limits. Continue to monitor actual usage, retries, rate limits, and cost in the selected deployment.
Evaluation and verification
Run commands from the backend directory.
Build the backend:
npm run build
Run the rule-based checks and the main classification dataset:
npx tsx scripts/eval-ai.ts
Run the held-out classification dataset:
npx tsx scripts/eval-ai.ts --heldout
Run only the four AI draft scenarios:
npx tsx scripts/eval-ai.ts --drafts-only
The latest reported evaluation results during development were:
- Rule-based fallback checks: 8/8 passed.
- Main classification dataset: 12/12 passed category and minimum-priority checks.
- Held-out classification dataset: 6/6 passed category and minimum-priority checks.
- Draft scenarios: 4/4 passed in the latest reported draft-only run, with 4 AI-generated drafts and 0 template fallbacks in that run.
These are development-run results, not a guarantee that every later API call will produce identical model output. Run the evaluation scripts again after modifying prompts, rules, or model configuration. The report is written to backend/reports/ai-eval-results.json.
Known limitations and future improvements
- AI output can vary between runs; validation, safe fallbacks, admin review, and ongoing evaluation remain important.
- The evaluation script is a small scenario-based test set, not a full production benchmark.
- Verify that the chosen real-time/near-real-time update mechanism behaves as required in the deployed environment.
- Actual file upload storage is not required by the assignment; implement it separately if attachment handling is included only as UI.
- Before production use, add automated API/integration tests for ticket ownership, internal-note isolation, pagination/filter edge cases, and provider failures.
- A production deployment should add structured monitoring, rate-limit handling, secret rotation, backups, and operational alerting.
Deployment checklist
Before submitting:
- [ ] Push the final source code to a public GitHub/GitLab repository.
- [ ] Add the assignment evaluator as a collaborator when their email is provided.
- [ ] Deploy the frontend and backend and verify the public URLs.
- [ ] Configure production secrets in the host's secret manager, not in source control.
- [ ] Connect the deployment to a demo database seeded with the supplied 10-author/18-book sample data.
- [ ] Verify the demo logins shown above on the deployed site.
- [ ] Test both author and admin workflows end-to-end.
- [ ] Verify that public replies are visible to the author and internal notes are not.
- [ ] Confirm the API documentation URL and update the links at the top of this file.
- [ ] Add the one-page assignment write-up as a separate submission document.
Assignment approach
The implementation prioritizes the end-to-end support workflow, AI-assisted categorization and drafting, and explicit deterministic rules around priority and risky response claims. The AI integration is designed to assist staff rather than replace review: admins can correct classifications, edit drafts, and send the final response. Future production iterations would focus on broader regression testing, better monitoring and audit trails, stronger evaluation coverage, and improved real-time delivery guarantees.