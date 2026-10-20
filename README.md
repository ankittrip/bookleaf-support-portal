BookLeaf Author Support & Communication Portal
An AI-assisted support workspace for BookLeaf Publishing. Authors can access their books and raise support tickets, while administrators can triage requests, manage ticket status, review internal notes, and prepare policy-grounded response drafts with validation and fallback handling.
Live demo: https://frontend-amber-eta-zc5pkg9crv.vercel.app/

Important: AI-generated and fallback responses are suggestions. Administrators must verify the facts, policy wording, and next steps before sending a response.

Features
- Author portal: Email/password login, author-specific book information, ticket creation, and ticket history.
- Admin ticket queue: View tickets across authors and filter by status, priority, category, and date.
- Ticket management: View author messages and book context, update ticket status/category/priority, assign tickets, and add private internal notes.
- AI-assisted classification: Classify requests as Royalty & Payments, ISBN & Metadata Issues, Printing & Quality, Distribution & Availability, Book Status & Production Updates, or General Inquiry.
- Priority safeguards: Apply deterministic priority floors to selected high-impact cases so the final priority is not lower than the configured rule-based minimum.
- AI response drafting: Generate author-facing drafts using BookLeaf's knowledge base, category playbooks, style examples, and available ticket/book facts.
- Draft validation and retry: Check drafts for unsupported claims, missing policy details, potentially unsupported figures/dates, and other safety or accuracy issues; retry generation when appropriate.
- Template fallback: If AI generation fails or a draft does not pass validation, return a policy-based template for administrator review.
- Human review: Administrators can edit a proposed reply before sending it.
- API documentation: Swagger UI is available at http://localhost:3000/docs when the backend is running locally.
Live Demo and Test Accounts
Live application: https://frontend-amber-eta-zc5pkg9crv.vercel.app/

Use the demo credentials configured for the deployed environment. The passwords are not included here because they must match the values actually configured during demo-data seeding.
Role	Login email	Password
Admin	admin@bookleaf.test	Replace with the deployed demo admin password
Author	ananya.reddy@email.com	Replace with the deployed demo author password
Author	sneha.kulkarni@email.com	Replace with the deployed demo author password


Before sending this README to the reviewer: replace the password instructions above with the actual demo passwords configured in the deployment. Do not use a personal or production password. If the deployed application uses different seeded emails, update these entries to match the deployment.
Technology Stack
- Frontend: React, TypeScript, Vite
- Backend: NestJS, TypeScript, REST API
- Database: MongoDB with Mongoose
- AI integration: Groq-compatible API configuration using openai/gpt-oss-20b in the current setup
- API documentation: Swagger/OpenAPI
- Testing: Vitest, plus a TypeScript-based AI evaluation script
- Deployment: Frontend hosted on Vercel; backend and database require their configured runtime services
Project Structure
bookleaf-support-portal/
├── backend/
│   ├── src/
│   ├── scripts/
│   ├── reports/
│   └── package.json
├── frontend/
└── README.md
Prerequisites
- Node.js and npm
- MongoDB, either local or hosted (for example, MongoDB Atlas)
- A valid AI provider API key for live classification and response drafting
- Environment variables configured separately for backend and frontend
Local Setup
1. Configure the backend environment
cd backend
npm install
Create backend/.env using the exact variable names expected by the backend configuration. At minimum, configure the MongoDB connection URI and the AI provider settings. Demo-data seeding also requires:
GROQ_API_KEY=your_provider_api_key
GROQ_MODEL=openai/gpt-oss-20b
DEMO_ADMIN_EMAIL=admin@bookleaf.test
DEMO_ADMIN_PASSWORD=replace_with_a_demo_password
DEMO_AUTHOR_PASSWORD=replace_with_a_demo_password
Also set the MongoDB connection variable expected by the backend in its configuration. Check the source/configuration or an existing .env.example for the exact name; do not commit the real .env file.
2. Build and seed demonstration data
From the backend/ directory:
npm run build
npm run seed
Use the provided BookLeaf sample dataset for the demonstration records. Run the seed script against a demo database only, since reseeding may reset or recreate sample records depending on the script's implementation.
3. Start the backend
npm run start:dev
When running locally, the API is expected at http://localhost:3000 and Swagger UI at http://localhost:3000/docs.
4. Start the frontend
Open a second terminal from the project root:
cd frontend
npm install
npm run dev
Configure the frontend API base URL using the environment variable expected by the frontend. For a local setup, it should point to the backend API at http://localhost:3000/api. Check the frontend configuration for the exact variable name (commonly a Vite variable such as VITE_API_BASE_URL).
Useful API Routes
The backend exposes a REST API. These author-facing routes are available in the current implementation:
Method	Route	Purpose
GET	/api/author/books	Retrieve the logged-in author's books
POST	/api/author/tickets	Create an author support ticket
GET	/api/author/tickets	List the logged-in author's tickets
GET	/api/author/tickets/:id	Retrieve a ticket by ID


For the full endpoint list, request schemas, and response formats, use Swagger UI at /docs when the backend is running locally. The deployed Swagger URL depends on the backend deployment and is not listed here because the public backend URL has not been provided.
Testing and AI Evaluation
Run these commands from the backend/ directory.
Build and unit tests
npm run build
npm test
AI evaluation scripts
# Main classification and rule-fallback evaluation
npx tsx scripts/eval-ai.ts

# Held-out classification evaluation
npx tsx scripts/eval-ai.ts --heldout

# Response-draft evaluation only
npx tsx scripts/eval-ai.ts --drafts-only
The evaluation script writes its machine-readable output to backend/reports/ai-eval-results.json. AI evaluation relies on the configured provider and can be affected by provider availability, rate limits, or timeouts. A passing classification result does not mean every generated response passes draft validation; review the individual results and whether each draft came from the AI or a template fallback.
Architecture and Design Decisions
- Separate author and admin workflows: Authors create and review their own requests; administrators access the cross-author support queue and operational controls.
- NestJS modules and REST APIs: Backend concerns are organized into modules, with controllers handling requests and services containing application logic.
- MongoDB and Mongoose: Book, author, and ticket records are represented as document models, matching the supplied sample dataset.
- Policy-grounded prompts: The response prompt includes BookLeaf knowledge-base guidance, a category-specific playbook, writing examples, and derived facts from the current ticket/book context.
- Deterministic safeguards around AI: Category and priority rules supplement model output, while the response validator checks for unsupported claims and missing required details.
- Graceful degradation: If generation fails or the result is rejected, the system can provide a policy-based fallback that an administrator can review and edit.
- Human approval: A generated response is a draft, not an automatically sent message. The administrator remains responsible for reviewing and sending it.
AI Integration: Prompt Strategy, Error Handling, and Cost Awareness
Prompt strategy
The model is given structured instructions, BookLeaf policy information, relevant category playbook guidance, response-style examples, and ticket-specific facts when available. The goal is to produce a concise, empathetic, author-facing response that reflects the policy and does not invent account details or promise unconfirmed actions.
Error handling
AI provider errors, timeouts, or validation failures are handled by falling back to a template where possible. Fallback messages may be less tailored and should be reviewed and edited by the administrator before use. The ticket-management workflow should remain usable even when live AI generation is unavailable.
Cost awareness
The implementation logs token usage for AI requests and builds prompts from structured policy and ticket context. The current approach prioritizes grounded responses and predictable validation; a future improvement would be to retrieve only the smallest relevant knowledge-base excerpts per ticket and monitor per-ticket cost over time.
Known Limitations and Future Improvements
- AI drafts can be rejected by strict deterministic checks; fallback templates may need manual editing to address the full author question.
- AI provider availability, rate limits, and timeouts can affect live draft generation.
- AI evaluation is a set of deterministic/signal-based checks, not a complete semantic assessment of every possible answer. Individual failures and source=ai versus source=template should be reviewed.
- The exact deployment backend URL and hosted Swagger URL should be documented once finalized.
- Demo account passwords must be supplied through the deployment's demo configuration and shared securely with the reviewer.
- With more time, I would add broader unit/integration coverage for authorization, ticket lifecycle, validators, fallback templates, and edge cases; improve the draft evaluation harness; and further optimize prompt context and token cost.
Security Notes
- Never commit .env, API keys, MongoDB credentials, passwords, or private customer data.
- Keep provider keys on the backend; do not expose them to the frontend.
- Use demo accounts and sample data for the publicly accessible deployment.
- Do not place real credentials in source code or public logs.
Demo Walkthrough
Suggested review order:
1. Sign in to the Author Portal and show the available book information.
2. Create or open a sample support ticket and show the ticket history.
3. Sign in to the Admin Portal and show the ticket queue, filters, priorities, and categories.
4. Open a royalty ticket and generate a response draft, then review the policy and ticket facts.
5. Open an ISBN or another known validation case to demonstrate the fallback template if it is triggered.
6. Show the Swagger documentation and test output if a brief technical walkthrough is useful.