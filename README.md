# BookLeaf Author Support & Communication Portal

An AI-assisted support workspace for BookLeaf Publishing. The application helps a support administrator review author tickets, classify incoming requests, generate policy-grounded response drafts, and edit a response before sending it.

**Important:** AI-generated and fallback replies are suggestions. Review facts, policy language, and next steps before sending a response.

---

## 🌟 Features

* **Support ticket queue:** View seeded tickets and triage them by status, priority, and category.
* **Ticket details:** Read the author's message and associated book context.
* **AI-assisted classification:** Classify tickets into Royalty & Payments, ISBN & Metadata Issues, Printing & Quality, Distribution & Availability, Book Status & Production Updates, or General Inquiry.
* **Priority safeguards:** Apply deterministic priority floors for selected high-impact cases.
* **AI response drafting:** Generate author-facing replies using the BookLeaf knowledge base, category playbooks, and available ticket/book facts.
* **Draft validation and retry:** Check generated replies for unsupported claims, missing policy details, and other accuracy issues before returning them.
* **Template fallback:** Load a policy-based template when AI generation fails or a draft does not pass validation.
* **Human review:** Let an administrator edit the proposed reply and review it before sending.
* **Internal notes and workflow:** Support internal operational notes and ticket status/priority/category management.
* **API documentation:** Browse the backend's Swagger UI at `http://localhost:3000/docs` when the backend is running.

---

## 💻 Technology Stack

* **Frontend:** React, TypeScript, Vite
* **Backend:** NestJS, TypeScript, REST API
* **Database:** MongoDB with Mongoose
* **AI:** Groq-compatible API configuration using `openai/gpt-oss-20b` (configured model in the current setup)
* **Testing:** Vitest and a TypeScript-based AI evaluation script

---

## 📂 Project Layout

```text
bookleaf-support-portal/
├── backend/
│   ├── src/
│   ├── scripts/
│   ├── reports/
│   └── package.json
├── frontend/
└── README.md
```

---

## ⚙️ Setup & Configuration

### Prerequisites

* Node.js and npm
* A MongoDB database (local or hosted Atlas)
* An AI provider API key (Groq/OpenAI) for live AI classification and drafting

### Configuration

1. Open the `backend/` directory.
2. Create a `.env` file and set the environment variables expected by the backend.
3. Provide the MongoDB connection URI.
4. Configure the AI provider key as `GROQ_API_KEY` (and `GROQ_MODEL` if needed).
5. For demo-data seeding, configure: `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`, and `DEMO_AUTHOR_PASSWORD`.

> **Security Note:** Never commit `.env`, real API keys, or real customer data. Use placeholder values in `.env.example`.

---

## 🚀 Run Locally

### 1. Start the Backend

```bash
cd backend
npm install
npm run build
npm run start:dev
```

API will run at `http://localhost:3000` and Swagger docs at `http://localhost:3000/docs`.

### 2. Seed Demonstration Data

Run the seed script to load the sample author/book data:

```bash
npm run seed
```

### 3. Start the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Ensure the frontend environment variables point to `http://localhost:3000/api`.

---

## 📡 Useful API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/author/books` | Retrieve the author's books |
| POST | `/api/author/tickets` | Create an author support ticket |
| GET | `/api/author/tickets` | List author support tickets |
| GET | `/api/author/tickets/:id` | Retrieve a ticket by ID |

For the full list, view the Swagger UI at `/docs`.

---

## 🧪 Tests and AI Evaluation

Run these from the `backend/` directory.

**Build and Unit Tests:**

```bash
npm run build
npm test
```

**AI Evaluation Scripts:**

```bash
# Main classification and rule-fallback evaluation
npx tsx scripts/eval-ai.ts

# Held-out classification evaluation
npx tsx scripts/eval-ai.ts --heldout

# Response-draft evaluation only
npx tsx scripts/eval-ai.ts --drafts-only
```

The evaluation script writes a machine-readable report to `backend/reports/ai-eval-results.json`.

---

## 🛡️ AI Safeguards and Known Limitations

* **Validation:** Drafts can be rejected by deterministic validators. In that case, a fallback template is returned for review.
* **Rate Limits:** AI-provider errors or rate limits gracefully degrade to the fallback template to keep the workflow usable.
* **Human Editing:** A fallback response may require human editing to fully address the specific ticket.
* **Strict Claims:** The application is programmed not to claim that a payment is scheduled/overdue based only on a pending balance.