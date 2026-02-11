# Stoney 🪨

Stoney runs **HTTP contracts** (YAML) against a **base URL** in GitHub Actions and produces a JSON report.

## Quickstart (in your repo)

### 1) Add a suite file
Create: `contracts/stoney.yml`

```yml
version: 1
suite: core
contracts:
  - name: health
    scenarios:
      - id: health_ok
        http:
          method: GET
          path: /health
        expect:
          status: 200
