# Contributing to Lumipuchi ERP

> **Important:** Lumipuchi ERP is a community-driven, open-source project. Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

## House Rules (for PRs and Issues)

### 👥 Prevent Work Duplication

Before submitting a new issue or PR, check if it already exists in the Issues or Pull Requests.

### ✅ Work Only on Approved Issues

For feature requests, please wait for a core team member to approve and remove the `🚨 needs approval` label before you start coding or submitting a PR.

For bugs, security, performance, documentation, etc., you can start coding immediately—even if the `🚨 needs approval` label is present.

### 🚫 Don’t Just Drop a Link

Avoid posting third-party links without context. A GitHub issue or PR should stand on its own—reviewers shouldn’t have to chase information across multiple tools to understand the context.

### 👀 Think Like a Reviewer

Put yourself in the reviewer’s shoes. What would you want to know if reading this for the first time? Are there key decisions, goals, or constraints that need clarification? 

### ✅ Summarize Your PR at the Top

Even if the code changes are minor or self-explanatory, a short written summary helps reviewers quickly understand the intent. 

### 🔗 Use GitHub Keywords to Auto-Link Issues

Use phrases like “Closes #123” or “Fixes #456” in your PR descriptions. This automatically links your PR to the related issue and closes it once merged.

## Local Development Setup

Lumipuchi ERP is a monorepo containing a Next.js frontend and a FastAPI backend.

### Backend (apps/api)
```bash
cd apps/api
pip install -r requirements.txt
set DATABASE_URL="sqlite:///./dev.db" # Windows
export DATABASE_URL="sqlite:///./dev.db" # Mac/Linux
python -m uvicorn main:app --reload --port 8000
```

### Frontend (apps/web)
```bash
cd apps/web
npm install
npm run dev
```

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
3. You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.
