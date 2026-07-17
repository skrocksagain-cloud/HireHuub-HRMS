# Hire Huub ERP
# Coding Standards v1.0

---

# PURPOSE

This document defines the coding standards for the Hire Huub ERP project.

Every developer and AI assistant must follow these standards.

Goals

- Consistency
- Readability
- Maintainability
- Scalability
- Production Quality

Always write code that another developer can understand.

---

# GENERAL PRINCIPLES

Write code for humans first.

Optimize for readability.

Keep functions small.

Prefer explicit code over clever code.

Always prefer maintainability over speed.

---

# TYPESCRIPT

Always use

Strict Mode

Never disable strict mode.

---

Never use

```ts
any
```

Use

- interfaces
- generics
- unknown
- proper type narrowing

instead.

---

Prefer

```ts
interface Employee {}
```

instead of

```ts
type Employee = {}
```

unless a union or mapped type is required.

---

Never ignore TypeScript errors.

Build must always pass.

---

# REACT

Use Functional Components only.

Never create Class Components.

Example

```tsx
export default function EmployeePage() {
    return <div />;
}
```

---

Always use

```tsx
const
```

for helper functions.

---

Keep components focused.

One component.

One responsibility.

---

# COMPONENTS

Components are presentation only.

Components should never

- call Firebase
- call APIs
- contain business logic

Components receive data via props.

---

Maximum component size

≈ 300 lines

Split large components.

---

# PAGES

Pages compose the UI.

Pages

- import hooks
- render components
- handle routing

Pages should not implement business rules.

---

# HOOKS

Hooks orchestrate workflows.

Hooks

- manage loading
- manage errors
- call services
- expose actions

Hooks never

- render JSX
- contain business rules

Example

```ts
const {
    loading,
    error,
    saveEmployee,
} = useEmployee();
```

---

# SERVICES

Services contain business logic.

Services

- Promise based
- Reusable
- Testable

Never import React inside services.

Example

```ts
employeeService.create()

employeeService.update()

employeeService.delete()
```

---

# TYPES

Location

```
src/types/
```

Only

- interfaces
- enums
- type aliases

No business logic.

---

# IMPORT ORDER

Always follow this order.

1.

React

```ts
import { useState } from "react";
```

2.

Third-party libraries

```ts
import { pdf } from "@react-pdf/renderer";
```

3.

Internal aliases

```ts
import { employeeService } from "@/services";
```

4.

Relative imports

```ts
import "./Employee.css";
```

---

Never mix import order.

---

# FILE NAMING

Components

```
EmployeeCard.tsx
```

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

PDF Templates

```
OfferLetterPdf.tsx
```

---

# VARIABLE NAMING

Good

```ts
employee

employeeList

employeeId

isLoading

hasPermission
```

Bad

```ts
emp

list

temp

data

obj

x

y
```

---

# CONSTANTS

Never use magic values.

Bad

```ts
if(age > 18)
```

Good

```ts
const MINIMUM_WORKING_AGE = 18;
```

---

# FUNCTIONS

Functions should

- do one thing
- return early
- avoid nesting

Maximum

≈ 50 lines

Split when necessary.

---

# ERROR HANDLING

Never ignore errors.

Always use

```ts
try
```

```ts
catch
```

Throw meaningful errors.

Never swallow exceptions.

---

# ASYNC CODE

Prefer

```ts
async

await
```

Avoid chained

```ts
.then()
```

unless required.

---

# COMMENTS

Write comments only when necessary.

Bad

```ts
// Increment i

i++;
```

Good

Explain

Why

not

What.

---

# LOGGING

Never commit

```ts
console.log()
```

Never commit

```ts
debugger
```

Remove temporary logging before commit.

---

# ALERTS

Never use

```ts
alert()
```

Use project notification components.

---

# DUPLICATION

Avoid duplicated code.

If copied twice

Extract.

Examples

- utility
- component
- hook
- service

---

# STYLING

Browser UI

Tailwind CSS

PDF

React PDF StyleSheet

Never use Tailwind inside PDF templates.

---

# PDF STANDARDS

Location

```
src/templates/pdf/
```

Use ONLY

- Document
- Page
- View
- Text
- Image
- StyleSheet

Never use

```tsx
<div>

<section>

<main>

className
```

inside PDF templates.

---

# SOLID PRINCIPLES

Always follow

Single Responsibility

Open / Closed

Liskov

Interface Segregation

Dependency Inversion

---

# CLEAN CODE

Meaningful names.

Small functions.

Small files.

No dead code.

No duplicated logic.

Readable formatting.

---

# BUILD RULES

Before commit

Run

```bash
npm run build
```

Build must succeed.

Never commit broken code.

---

# GIT

Use Conventional Commits.

Examples

```text
feat(document-center): add offer letter PDF

fix(payroll): correct PF calculation

refactor(employee): simplify hook

docs(ai): update coding standards
```

Never commit

"WIP"

or

"test"

messages.

---

# CODE REVIEW CHECKLIST

Before every commit verify

✓ Build passes

✓ No TypeScript errors

✓ No console.log

✓ No debugger

✓ No any

✓ No unused imports

✓ No duplicated code

✓ Proper naming

✓ Strong typing

✓ Architecture respected

---

# FINAL RULE

Every line of code should improve

Hire Huub ERP.

If uncertain

STOP

Review

- developer.md

- architecture.md

Then continue.

Never guess.

Always follow the project standards.