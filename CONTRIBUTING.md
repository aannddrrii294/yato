# Contributing to YATO

First off, thank you for considering contributing to YATO! It's people like you who make open-source software such a powerful tool.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct. Please treat all contributors and maintainers with respect, empathy, and professional courtesy.

## How Can I Contribute?

### 1. Reporting Bugs

If you find a bug in the application, please search existing GitHub Issues to see if it has already been reported. If not, open a new issue and include:
- A clear, descriptive title.
- Steps to reproduce the issue.
- Expected vs. actual behavior.
- Screenshots or log files (if applicable).

### 2. Suggesting Enhancements

We welcome suggestions for new features or UX improvements! Please open an enhancement issue describing:
- The problem this enhancement would solve.
- Your proposed solution or user flow.
- Any alternative options you've considered.

### 3. Pull Requests (PRs)

If you're ready to contribute code:
1. **Fork** the repository and create your branch from `main`.
2. **Branch Naming**: Use a prefix like `feature/` or `bugfix/` (e.g., `feature/excel-multi-sheet-export`).
3. **Coding Standards**:
   - For Frontend (Next.js/React): Use TypeScript, functional components, vanilla CSS conventions, and premium UI styling guidelines.
   - For Backend (NestJS): Adhere to standard NestJS controller-service pattern, Prisma schema integrity, and TypeScript typing conventions.
4. **License**: Ensure that all new source files contain the standard Apache 2.0 copyright header. You can run the automation script:
   ```bash
   node add-copyright-header.js
   ```
5. **Commit Messages**: Follow standard descriptive git commit rules:
   - `feat: add multi-sheet Excel export for asset registry`
   - `fix: correct IP address validation in approval modal`
6. **Submit**: Open a Pull Request targeting the `main` branch. Provide a comprehensive summary of changes in the PR description.

## Developer Setup Quickstart

1. Clone the repository.
2. Build and run containers locally:
   ```bash
   docker compose up --build
   ```
3. Access:
   - Frontend: `http://localhost:4001`
   - Backend API: `http://localhost:4000`

Thank you for your contribution!
