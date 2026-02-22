![GitHub release](https://img.shields.io/github/v/release/stoney-dev/stoney)
![License](https://img.shields.io/github/license/stoney-dev/stoney)
![CI](https://img.shields.io/github/actions/workflow/status/stoney-dev/stoney/ci.yml)

# 🪨 Stoney
**Requirements-as-Code for real environments.**

Stoney runs small, powerful contract checks inside GitHub Actions against your:

- 🌐 APIs (HTTP)
- 🗄️ PostgreSQL databases (SQL invariants)
- ⚙️ CI environments (shell / CLI checks)

No servers.  
No hosted platform.  
No infrastructure to manage.  

Just YAML + CI.

---

## What Is Stoney?

Most teams write requirements in tickets and test them elsewhere.

Over time, implementation drifts.

Stoney lets you declare:

> “When I call `/health`, it must return 200.”  
> “There must be zero failed jobs in the database.”  
> “My smoke script must exit successfully.”

Those declarations become executable CI checks.

If the contract fails, the PR fails.

---

## Why Teams Use Stoney

- ✅ Protect staging & production environments
- ✅ Keep acceptance criteria executable
- ✅ Validate database invariants safely
- ✅ No test server required
- ✅ No external service dependency
- ✅ CI-native (GitHub Actions)

---

# 🚀 5 Minute Setup

## 1️⃣ Create a Contract

Create `contracts/smoke.yml`:

```yaml
version: 1
suite: core

contracts:
  - name: health
    scenarios:
      - id: health_ok
        req:
          text: "Health endpoint must respond with 200 OK"
        steps:
          - http:
              method: GET
              path: /health
            expect:
              status: 200
```

---

## 2️⃣ Add GitHub Workflow

Create `.github/workflows/stoney.yml`:

```yaml
name: Stoney

on:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read
  pull-requests: write

jobs:
  stoney:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: stoney-dev/stoney@v0
        with:
          base_url: ${{ secrets.STONEY_BASE_URL }}
          suite: contracts/*.yml
          comment_pr: "true"
```

---

## 3️⃣ Add Secrets

In your repository:

Settings → Secrets and variables → Actions → New repository secret

Add:

- `STONEY_BASE_URL` → `https://staging.example.com`

Open a Pull Request.

If the invariant breaks, the merge is blocked.

---

# 🔍 Supported Checks

## HTTP

```yaml
- http:
    method: GET
    path: /health
  expect:
    status: 200
    json:
      ok: true
```

Uses deep subset matching — extra fields don’t break your contract.

---

## SQL (Postgres)

```yaml
- sql:
    driver: postgres
    url_env: STONEY_DB_URL
    query: "SELECT 1::int AS ok;"
  expect:
    rows: 1
    equals:
      ok: 1
```

Safe-by-default:

- Write queries blocked
- Multi-statement SQL blocked
- `statement_timeout` enforced

---

## Exec (CLI / Scripts)

```yaml
- exec:
    run: "node -v"
  expect:
    exit_code: 0
    stdout_contains: "v"
```

---

# 🛡️ Security Model

- Secrets are never stored in YAML
- SQL writes are blocked by default
- No external telemetry
- Runs entirely inside your CI runner
- Supports self-hosted runners for private networks

---

# 🏗️ Architecture

Public staging:

```
GitHub Hosted Runner → Public API / DB
```

Private staging:

```
Self-Hosted Runner → Private API / DB
```

Stoney executes wherever your runner lives.

---

# 📖 Documentation

Full documentation lives in:

https://your-docs-site-url

---

# 🤝 Contributing

PRs welcome.

If you're proposing a major change, open an issue first.

---

# 📜 License

MIT