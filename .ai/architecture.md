# Hire Huub ERP
# Architecture Guide v1.0

---

# PURPOSE

This document defines the architecture of the Hire Huub ERP application.

It is the single source of truth for:

- Folder structure
- Layer responsibilities
- Module boundaries
- Dependency direction
- Engineering decisions

Every developer and AI assistant must follow this architecture.

Do not redesign the architecture without approval from the Solution Architect.

---

# SYSTEM OVERVIEW

Hire Huub ERP follows a modular architecture.

Each module is independent and reusable.

The application is built using:

- React
- TypeScript
- Vite
- Firebase
- Tailwind CSS

Architecture Style

Feature-first

Layered

Modular

Component-based

---

# HIGH LEVEL ARCHITECTURE

```
Presentation Layer
        │
        ▼
Hooks Layer
        │
        ▼
Service Layer
        │
        ▼
Firebase Layer
        │
        ▼
Database
```

Dependencies always move downward.

Never upward.

---

# FOLDER STRUCTURE

```
src/

assets/

components/

constants/

contexts/

hooks/

layouts/

pages/

router/

services/

templates/

types/

utils/
```

---

# PAGE LAYER

Location

```
src/pages/
```

Responsibilities

- UI
- User interaction
- Routing
- Component composition

Pages must NOT contain

- Business logic
- Firestore queries
- PDF generation
- Complex calculations

Pages coordinate hooks.

---

# COMPONENT LAYER

Location

```
src/components/
```

Responsibilities

Reusable UI.

Examples

- Button
- Modal
- Table
- Card
- Badge
- Avatar

Components should be presentation only.

---

# HOOK LAYER

Location

```
src/hooks/

or

src/pages/<Module>/hooks/
```

Responsibilities

Hooks orchestrate workflows.

Hooks may

- call services
- manage loading
- manage errors
- expose actions

Hooks must NOT

- render UI
- contain business rules

---

# SERVICE LAYER

Location

```
src/services/
```

Responsibilities

Business logic.

Examples

- EmployeeService
- PayrollService
- DocumentService

Services

- reusable
- Promise-based
- framework independent

Services never contain React.

---

# TYPES

Location

```
src/types/
```

Responsibilities

Shared contracts.

Only

- interfaces
- types
- enums

Never business logic.

---

# UTILITIES

Location

```
src/utils/
```

Reusable helper functions.

Examples

- formatCurrency
- formatDate
- validators

Utilities never depend on React.

---

# DOCUMENT GENERATION

Location

```
src/templates/
```

Contains document templates.

---

Browser Templates

```
src/templates/documents/
```

Technology

React DOM

Purpose

Preview in browser.

---

PDF Templates

```
src/templates/pdf/
```

Technology

@react-pdf/renderer

Purpose

Generate downloadable PDF files.

Never use HTML.

Never use Tailwind.

Only

- Document
- Page
- View
- Text
- Image
- StyleSheet

---

PDF Components

```
src/templates/pdf/components/
```

Reusable components.

Examples

- DocumentLayoutPdf
- CompanyHeaderPdf
- CompanyFooterPdf
- SignatureBlockPdf

Shared by every PDF.

---

DOCUMENT GENERATION FLOW

```
Business Data

↓

DocumentGenerationRequest

↓

React PDF Template

↓

pdfService

↓

ReactPdfEngine

↓

Browser Download
```

Current MVP

- Local download
- No Firebase Storage
- No Email

---

MODULE ARCHITECTURE

Every feature module follows

```
pages/

hooks/

components/

services/

types/
```

Example

```
Employee/

Attendance/

Payroll/

Recruitment/

DocumentCenter/
```

Each module owns its own files.

Avoid cross-module dependencies.

---

DEPENDENCY RULES

Allowed

```
Page

↓

Hook

↓

Service

↓

Firebase
```

Forbidden

```
Service

↓

React Component
```

Forbidden

```
Template

↓

Service
```

Forbidden

```
Utility

↓

React
```

---

NAMING CONVENTIONS

Pages

```
EmployeePage.tsx
```

Hooks

```
useEmployee.ts
```

Services

```
employeeService.ts
```

Types

```
Employee.ts
```

Templates

```
OfferLetterPdf.tsx
```

Components

```
EmployeeCard.tsx
```

---

STATE MANAGEMENT

Prefer

React Hooks

Context

Avoid unnecessary global state.

Introduce Redux/Zustand only when justified.

---

ERROR HANDLING

Services

Throw typed errors.

Hooks

Capture errors.

Pages

Display user-friendly messages.

---

FUTURE MODULES

Roadmap

Employee

Attendance

Payroll

Recruitment

Leave

Shift

Asset

Performance

Reports

Settings

Audit Logs

AI Assistant

Each module follows identical architecture.

---

ENGINEERING PRINCIPLES

Single Responsibility

Open / Closed

Dependency Inversion

Composition over inheritance

Reusable components

Strong typing

Readable code

Maintainability over cleverness.

---

ARCHITECTURE CHANGES

No developer or AI may redesign this architecture.

Any architectural modification requires approval.

---

FINAL RULE

When uncertain

STOP

Review this document.

Never invent architecture.

Always follow existing patterns.