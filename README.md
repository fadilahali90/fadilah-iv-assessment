# XYZ Bank Automation Testing Framework

This project is an automation testing framework built using Playwright with TypeScript for the XYZ Bank demo banking application.

---

# 📁 Project Structure

```bash
fadilah-iv-assessment/
│
├── page-objects/           # Page Object classes
│   ├── customer-page.ts
│   └── manager-page.ts
│
├── tests/                  # Test scripts
│   ├── manager.spec.ts
│   └── customer.spec.ts
│
├── test-data/              # Test data files
│   └── customer.data.ts
│
├── utils/                  # Utility/helper functions
│   └── common.ts
│
├── test-results/           # Playwright test results (failure screenshots)
│
├── playwright-report/      # HTML execution reports
│
├── TestCases-XYZBank.xlsx  # Test cases file
│
├── playwright.config.ts    # Playwright configuration
├── package.json            # Project dependencies & scripts
├── package-lock.json
├── .gitignore
└── README.md
```

---

# ⚙️ Prerequisites & Setup

Before running this project, ensure the following are installed:

- Node.js (LTS): https://nodejs.org/
- Git: https://git-scm.com/
- Visual Studio Code: https://code.visualstudio.com/

Verify installation:

```bash
node -v
npm -v
git --version
```

---

# 🚀 Project Setup & Run

## Clone Repository

```bash
git clone https://github.com/fadilahali90/fadilah-iv-assessment.git
```

---

## Enter Project Folder

```bash
cd fadilah-iv-assessment
```

---

## Install Dependencies

```bash
npm ci
```

> `npm ci` is used to install dependencies based on the `package-lock.json` file to ensure consistent installation.

---

## Install Playwright Browsers

```bash
npx playwright install
```

---

# ▶️ Run Test

## Run All Tests

```bash
npx playwright test
```

---

## Run Specific Test File

### Run Manager Test

```bash
npx playwright test tests/manager.spec.ts
```

### Run Customer Test

```bash
npx playwright test tests/customer.spec.ts
```

---

# 📊 Open Playwright HTML Report

```bash
npx playwright show-report
```

---

# ✨ Framework Features

- Playwright Test Runner
- TypeScript Support
- HTML Reporting
- Screenshot Capture on Failure
- Trace Collection on Retry
- Slow Motion Execution
- Page Object Model (POM) Structure

---

# 🌐 Application Under Test

```bash
https://www.globalsqa.com/angularJs-protractor/BankingProject/#/login
```

---

# 👩‍💻 Author

Developed by Fadilah Ali using Playwright + TypeScript