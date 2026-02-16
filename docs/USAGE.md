
---

## B) `docs/USAGE.md` (drop-in replacement)
This is the “everything users need” doc. It stays simple.

```md
# Stoney — Usage

This doc is designed to be copy/paste friendly.

---

## 1) Install (GitHub Action)

Create `.github/workflows/stoney.yml`:

```yml
name: Stoney

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  stoney:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Stoney
        uses: stoney-dev/stoney@v0
        with:
          base_url: ${{ secrets.STONEY_BASE_URL }}
          token: ${{ secrets.STONEY_TOKEN }}
          suite: contracts/*.yml
          retries: "2"
          timeout_ms: "15000"
          comment_pr: "true"
