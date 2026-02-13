# Using Stoney in your repo

## 1) Add /contracts to root
Create `contracts/stoney.yml`:

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
