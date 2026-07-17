# Hire Huub ERP
# Sprint Template v1.0

---

# PURPOSE

This document defines the standard sprint execution workflow for the Hire Huub ERP project.

Every sprint must follow this process.

Never skip phases.

The objective is to deliver production-ready features with a successful build.

---

# TEAM

## Solution Architect

ChatGPT

Responsibilities

- Sprint Planning
- Architecture
- Technical Decisions
- Prompt Design
- Code Review
- Debugging

---

## Software Engineer

GPT Work

Responsibilities

- Repository Analysis
- Implementation
- Refactoring
- Build Fixes
- Self Review

Never redesign architecture.

---

## Product Owner

Responsibilities

- Sprint Approval
- QA
- Build
- Git
- Release

Only the Product Owner performs Git operations.

---

# SPRINT LIFECYCLE

```
Sprint Planning
        │
        ▼
Architecture Review
        │
        ▼
Implementation Plan
        │
        ▼
GPT Work Implementation
        │
        ▼
Self Review
        │
        ▼
Build Verification
        │
        ▼
Architecture Review
        │
        ▼
QA
        │
        ▼
Git Commit
        │
        ▼
Push
```

Never skip a phase.

---

# PHASE 1

PROJECT ANALYSIS

GPT Work must

Read

.ai/developer.md

.ai/architecture.md

.ai/coding-standards.md

Understand

- folder structure
- dependencies
- architecture
- coding standards

Do not modify code during this phase.

---

# PHASE 2

SPRINT ANALYSIS

Read the sprint specification.

Understand

Objective

Scope

Architecture

Dependencies

Expected Deliverables

Implementation Plan

Do not write code yet.

---

# PHASE 3

IMPLEMENTATION

Implement only approved files.

Respect architecture.

Never redesign.

Never introduce unrelated changes.

Never modify files outside the approved scope.

---

# PHASE 4

SELF REVIEW

Verify

No TypeScript errors

No duplicated code

No unused imports

No console.log

No debugger

No alert()

No any

Architecture respected

---

# PHASE 5

BUILD

Run

```bash
npm run build
```

If build fails

Fix

Repeat

Until

Build succeeds.

Never finish with a failing build.

---

# PHASE 6

REPORT

Provide

Task Status

Files Modified

Files Created

Files Deleted

Build Status

Warnings

Scope Violations

Do not explain reasoning.

---

# SPRINT PROMPT FORMAT

Every sprint prompt should contain

---

Sprint Number

Example

Sprint 02.5.7

---

Sprint Name

Example

Document Center Integration

---

Objective

Describe the business goal.

---

Current Architecture

Describe the existing implementation.

---

Approved Files

List

Create

Modify

Delete

---

Technical Requirements

Component responsibilities

Hooks

Services

Types

Templates

UI

---

Dependencies

Existing packages

Forbidden packages

---

Engineering Rules

No any

No console.log

TypeScript strict

Reusable code

SOLID

Architecture

---

Stop Rule

Stop only when

Architecture conflict

Missing dependency

Otherwise complete the sprint.

---

Output

Task Status

Files Modified

Files Created

Files Deleted

Build Status

Warnings

Scope Violations

---

# APPROVED WORKFLOW

```
ChatGPT

↓

Architecture

↓

Sprint Prompt

↓

GPT Work

↓

Repository Analysis

↓

Implementation

↓

Self Review

↓

Build

↓

Architecture Review

↓

QA

↓

Git Commit

↓

Push
```

---

# BUILD POLICY

A sprint is NOT complete unless

```
npm run build
```

passes successfully.

Warnings are acceptable.

Errors are not.

---

# GIT POLICY

Never execute

git add

git commit

git push

unless explicitly instructed.

Git operations belong to the Product Owner.

---

# REVIEW POLICY

Every sprint is reviewed.

Architecture

↓

Code Quality

↓

Build

↓

Business Requirements

↓

Release

---

# SUCCESS CRITERIA

A sprint is considered complete only if

✅ Scope completed

✅ Architecture respected

✅ Build successful

✅ No TypeScript errors

✅ No scope violations

✅ Ready for production

---

# FAILURE CRITERIA

A sprint is incomplete if

❌ Build fails

❌ TypeScript errors exist

❌ Scope incomplete

❌ Architecture violated

❌ Unauthorized files modified

---

# FINAL RULE

Quality over speed.

Understand first.

Implement second.

Review third.

Build fourth.

Release last.

Every sprint should leave the repository in a better state than before.