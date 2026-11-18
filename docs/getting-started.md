# Getting started

**Docker is the only prerequisite.**

```bash
git clone https://github.com/alisabondar/pulse.git && cd pulse && ./dev.sh
```

The first run builds the images, generates encryption keys, and seeds 10,000 synthetic patients
(about a minute). Then open **http://localhost:5173**. API docs are at http://localhost:8000/docs.

**There's no login in the demo:** the app starts as **Dr. Chen**, and the **"Viewing as"** menu in
the header switches between roles (provider, nurse, front desk, admin). The server enforces every
permission regardless of what the UI shows.

`./dev.sh` asks once for an optional Gemini API key. Press Enter to use the built-in mock; every
feature works without one, and the privacy pipeline is the same either way.

**Getting a key (optional, about 2 minutes):** create a free key at
[Google AI Studio](https://aistudio.google.com/app/apikey) and paste it when `./dev.sh` asks, or
set `GEMINI_API_KEY` in `.env` later and run `docker compose up -d api`. Each person should use
their own key: the free tier's rate limit is per key. If you share one, send it outside the repo
(for example through a password manager) and revoke it afterwards. Never commit it.

## 5-minute tour

1. **Run the one-liner** above.
2. **My day:** Dr. Chen's schedule for today. Click a visit card to open the chart.
3. **The chart:** the overview puts the AI summary and recent notes beside the blood pressure
   trend, latest vitals, problems, and allergies. Today's visits run along the top, so the next
   patient is one tap away. Press **New note**, finalize it, and try to edit it.
4. **Switch personas** in "Viewing as": a nurse can record vitals but not diagnoses; front desk sees
   contact details only; the admin sees the audit log. The navigation changes and the API refuses
   anything the role can't do.
5. **Search:** press `/` anywhere and type a last name or MRN, or use the fuller search on the
   Patients page. Look at the address bar: what you typed is never in the URL.
6. **See the encryption:** `./dev.sh proof` prints the app's view of a patient next to the raw
   database row, then searches a full `pg_dump` for the name and finds 0 matches.
7. **Run the tests:** `./dev.sh test` (backend and frontend), `./dev.sh test e2e`, and
   `./dev.sh test privacy`.

## Everyday commands

| What | Command |
|---|---|
| Start everything | `./dev.sh` |
| Stop (data kept) | `./dev.sh stop` |
| Wipe the database **and keys together**, then reseed | `./dev.sh reset [--count N]` |
| Tests in containers | `./dev.sh test [backend\|frontend\|e2e\|privacy]` |
| Encryption proof | `./dev.sh proof` |
| Logs | `docker compose logs -f api web` |

More: [development](development.md), [security](security.md), [AI privacy](ai-privacy.md),
[performance](performance.md), [roadmap](roadmap.md), [decisions](decisions.md).
