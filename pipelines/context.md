Na verdade, eu faria um ajuste importante antes do prompt.

O que você vai pedir para a IA não é um frontend.

Você vai pedir para ela construir um MVP navegável de alta fidelidade, completamente funcional no navegador, simulando um backend real.

Essa diferença muda completamente a qualidade do resultado.

Eu pediria explicitamente que a IA não deixasse nenhuma funcionalidade "para depois". Tudo deve existir visualmente e funcionar com LocalStorage.

O que eu esperaria conseguir fazer nessa primeira versão

Ao abrir a aplicação eu quero sentir que ela já existe.

Eu devo conseguir:

Criar um Workspace
Criar um Template
Criar um Projeto
Criar uma Linguagem
Criar uma Arquitetura
Criar um Feature Manifest
Criar um Rule Set
Criar AI Providers
Criar AI Agents
Criar Technology Stacks
Criar Packages
Criar Plugins
Criar Prompt Templates
Criar Encryption Profiles
Criar Database Profiles
Criar Docker Profiles
Criar Logging Profiles
Criar Cache Profiles
Criar Authentication Profiles
Criar Deployment Profiles

Tudo isso persistindo em LocalStorage.

Ou seja, quando você fechar o navegador e abrir novamente, tudo continua lá.

O Prompt
# FRONTEND MVP PROMPT

You will build a complete high-fidelity frontend prototype for a software called Software Factory.

IMPORTANT

This is NOT a static frontend.

This is NOT a UI showcase.

This is NOT a landing page.

This is NOT an admin dashboard.

This frontend must simulate the complete product exactly as if a backend already existed.

Everything must work.

The only difference is that persistence will be implemented using LocalStorage instead of APIs.

The objective is that I can validate every workflow before implementing the backend.

Assume that this frontend will later be connected to a REST API without changing the UI or business flow.

===============================================
GENERAL OBJECTIVE
===============================================

The Software Factory allows software architects to standardize how software projects are created.

Instead of manually creating solutions, choosing packages, organizing projects and configuring architecture every time, the platform allows users to create reusable Templates.

A Template defines every architectural and technical decision.

Projects generated later inherit those decisions.

AI is NOT responsible for deciding architecture.

AI is responsible for validating, explaining, recommending and documenting architectural decisions.

The user is always the final decision maker.

===============================================
IMPORTANT CONCEPTS
===============================================

Workspace

Organization

Template

Project

Blueprint

Feature Manifest

Rule Set

Technology Stack

Architecture

Language

AI Provider

AI Agent

Prompt Template

Knowledge Pack

Package Profile

Deployment Profile

Security Profile

Authentication Profile

Logging Profile

Database Profile

Docker Profile

Encryption Profile

Cache Profile

===============================================
FEATURE MANIFEST
===============================================

Feature Manifest is one of the core concepts.

Each feature contains:

Name

Description

Category

Dependencies

Optional Dependencies

Recommended Dependencies

Conflicting Features

Questions

Configuration

Generated Files

Generated Packages

Generated Projects

Documentation

AI Recommendations

Security Warnings

Architecture Impact

Performance Impact

Maintainability Impact

Best Practices

The frontend must allow creating and editing Feature Manifests.

===============================================
SMART DEPENDENCIES
===============================================

The application must automatically activate recommended features.

Example:

Docker

↓

Environment Variables

↓

Health Checks

↓

Docker Compose

↓

Secrets

↓

Dockerfile

However,

the user must always be allowed to disable any automatically activated feature.

If disabled,

the Live Validation Engine must immediately generate warnings explaining the consequences.

Nothing should ever be blocked.

The platform guides.

It never forces.

===============================================
LIVE VALIDATION ENGINE
===============================================

Continuously validate the project while the user edits it.

Examples:

Architecture violations

Dependency violations

Missing packages

Security risks

Performance risks

Scalability concerns

Compatibility issues

Best practice violations

Maintainability concerns

Display all validations in real time.

===============================================
PROJECT ADVISOR
===============================================

Create a side panel that constantly evaluates:

Security Score

Architecture Score

Performance Score

Scalability Score

Maintainability Score

Complexity Score

Overall Quality Score

Every score should explain why it received that value.

===============================================
COMPATIBILITY ENGINE
===============================================

Validate technology compatibility.

Examples:

.NET version

Package compatibility

Framework compatibility

Database compatibility

Operating System compatibility

Docker compatibility

Cloud compatibility

Dependency compatibility

===============================================
IMPACT ANALYZER
===============================================

Whenever a setting changes,

show every component affected.

Example:

Changing SQL Server to PostgreSQL

must show:

Connection String

NuGet Packages

Docker

Health Checks

EF Provider

Migration Project

Documentation

Generated Files

===============================================
DECISION LOG
===============================================

Every important decision must be recorded automatically.

Decision

Date

Reason

Impact

Warnings ignored

AI recommendations

User justification

===============================================
AI ASSISTANT
===============================================

AI never makes decisions.

AI acts as:

Software Architect

Security Engineer

Cloud Architect

Database Architect

Performance Engineer

DevOps Engineer

Reviewer

Teacher

Documentation Assistant

Whenever the user selects an option,

AI explains:

Pros

Cons

Risks

Alternatives

Recommendations

===============================================
PROJECT GENERATION PREVIEW
===============================================

Before generation,

display:

Solution Tree

Folder Structure

Project References

NuGet Packages

Docker Files

Configuration Files

Generated Documentation

Estimated File Count

Estimated Folder Count

Generated Components

===============================================
SIMULATION
===============================================

Everything must work using LocalStorage.

Templates

Projects

Profiles

Rules

Feature Manifests

AI Providers

Languages

Architectures

Prompt Templates

Organizations

Workspaces

History

Logs

Settings

Everything must persist.

===============================================
UX
===============================================

Never create long forms.

Prefer:

Wizard

Tabs

Progressive Disclosure

Split Panels

Property Grid

Tree View

Inspector Panel

Context Menu

Keyboard Shortcuts

Command Palette

Drag & Drop

Visual Dependency Graph

Resizable Panels

Dockable Windows

===============================================
DESIGN
===============================================

The application should look closer to

JetBrains Rider

Visual Studio

GitHub Desktop

Figma

Raycast

Linear

Azure DevOps

Never Bootstrap.

Never Admin Templates.

Never AI-looking UI.

===============================================
TECH STACK
===============================================

React

Next.js

TypeScript

TailwindCSS

shadcn/ui

Radix UI

TanStack Table

React Hook Form

Zod

React Query

Framer Motion

Lucide

React Flow (for dependency graphs)

Monaco Editor

===============================================
DATA
===============================================

Generate realistic mock data.

Everything should behave exactly like a production application.

===============================================
IMPLEMENTATION
===============================================

Build the application exactly as if the backend already existed.

Create repositories/services that currently read/write LocalStorage.

The API layer should already exist.

Only the implementation changes later.

Example:

Today

ProjectService

↓

LocalStorage

Later

ProjectService

↓

REST API

Without changing UI code.

===============================================
IMPORTANT
===============================================

Do NOT simplify.

Do NOT skip screens.

Do NOT create placeholders.

Do NOT create "Coming Soon" pages.

Every screen should be completely functional.

Whenever functionality depends on backend,

simulate it.

The application should feel like a finished SaaS product ready to connect to a backend.
A última melhoria que eu faria (e que considero a mais importante de todas)

Eu mudaria a arquitetura para API-First, mesmo sem backend.

Ou seja, a IA deve criar três camadas desde o início:

Presentation (React)

↓

Application Services

↓

Infrastructure

E a infraestrutura, por enquanto, teria uma implementação em LocalStorage.

Por exemplo:

IProjectRepository

Implementações:

LocalStorageProjectRepository

No futuro:

ApiProjectRepository

A UI nunca saberá onde os dados vêm. Ela conversa apenas com os serviços da aplicação.

Essa decisão parece pequena, mas evita reescrever praticamente todo o frontend quando você começar a desenvolver o backend. Em vez de trocar componentes ou lógica de interface, você substituirá apenas a implementação dos repositórios, mantendo a experiência do utilizador e o restante da aplicação intactos. Isso também facilita testes, evolução da arquitetura e até a criação de uma versão offline da ferramenta no futuro.

quinta-feira