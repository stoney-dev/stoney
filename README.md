# Stoney 🪨

**Simple contract testing for real environments.**

Stoney runs small, powerful checks against your:

- 🌐 APIs (HTTP)
- 🗄️ Database (Postgres SQL)
- ⚙️ Custom behavior (run any command)

And it runs entirely inside **GitHub Actions**.

No servers.
No hosting.
No infrastructure.

Just YAML + CI.

---

# What is Stoney?

Imagine you could write down:

> "When I call `/health`, it should return 200."
>
> "There should be zero failed jobs in the database."
>
> "My smoke script should exit successfully."

Stoney turns those expectations into executable checks.

If something breaks, your PR fails.

---

# Why teams like Stoney

- ✅ Protect staging & production
- ✅ Keep acceptance criteria executable
- ✅ Validate database invariants
- ✅ No separate test server required
- ✅ Works inside GitHub CI

---

# 5 Minute Setup

## 1) Add a suite file

Create:

