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
feature: core
description: "Smoke checks for the environment"

contracts:
  - name: health
    description: "Health endpoint must always respond correctly."
    checks:
      - id: health_ok
        work_item: "KAN-123" # optional unless require_work_item is enabled
        says: "GET /health returns 200 with ok:true"
        steps:
          - http:
              method: GET
              path: /health
            expect:
              status: 200
              json:
                ok: true
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

          # Optional execution control:
          # fail_fast: "true"

          # Optional policy controls:
          # require_work_item: "true"
          # work_item_pattern: "^KAN-\\d+$"

          # Optional integrations:
          # db_url: ${{ secrets.STONEY_DB_URL }}
          # token: ${{ secrets.STONEY_TOKEN }}
```

---

## 3️⃣ Add Secrets

In your repository:

Settings → Secrets and variables → Actions → New repository secret

Add:

- `STONEY_BASE_URL` → `https://staging.example.com`

Optional (if needed by your contracts):

- `STONEY_DB_URL`
- `STONEY_TOKEN`

Open a Pull Request.

If a contract fails, the merge is blocked.

---

# ⚡ Fail Fast

By default, Stoney runs **all checks** and reports all failures in one run.

If you prefer to stop immediately on the first failing check (faster CI, less noise), enable:

```yaml
fail_fast: "true"
```

When enabled:
- Stoney stops after the first failing check (including missing/invalid `work_item` when required)
- PR comment + report still include everything that ran up to that failure

---

# 🔍 Supported Checks

## HTTP

```yaml
steps:
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
steps:
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
steps:
  - exec:
      run: "node -v"
    expect:
      exit_code: 0
      stdout_contains: "v"
```

---

# 🧾 Work Items (Optional)

Contracts may include a `work_item` for traceability:

```yaml
checks:
  - id: ping_ok
    work_item: "KAN-100"
    says: "Ping endpoint works"
    steps:
      - http:
          method: GET
          path: /v1/ping
        expect:
          status: 200
```

You can enforce work items in CI:

```yaml
require_work_item: "true"
work_item_pattern: "^KAN-\\d+$"
```

No external integrations required in v1.

# 📖 Documentation

https://wwww.stoneydev.com

# 🤝 Contributing

PRs welcome.

If you're proposing a major change, open an issue first.

---

# 📜 License

MIT