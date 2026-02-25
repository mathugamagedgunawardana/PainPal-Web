# Project Cost Estimate (USD & LKR)

Rough cost breakdown for building and running this project. Use your own rates and usage for real budgeting.

**Exchange rate used:** 1 USD ≈ **300 LKR** (approximate; check current rate for actual conversion).

---

## 1. Development cost (one-time)

Estimated effort to build the project from scratch (freelance / small-team rates).

| Component | Scope | Hours (range) | USD @ $40/hr | LKR @ 300 |
|-----------|--------|----------------|--------------|-----------|
| **Image pipeline** | Data loader, ResNet18 training, inference, save/load, config | 50–80 | $2,000–3,200 | 600,000–960,000 |
| **Text pipeline** | CSV loaders, XGBoost train/predict, class weights, pipeline | 35–55 | $1,400–2,200 | 420,000–660,000 |
| **Flask APIs** | Summary API (main.py), chatbot (Gemini + MySQL/SQLite) | 25–40 | $1,000–1,600 | 300,000–480,000 |
| **Next.js client** | Auth (Google OAuth), Drive, roles, dashboard, Prisma/MongoDB | 100–160 | $4,000–6,400 | 1,200,000–1,920,000 |
| **LiveKit agent** | Setup and integration | 15–30 | $600–1,200 | 180,000–360,000 |
| **Integration & docs** | Wiring, env, INTRO/Fiverr docs, testing | 20–35 | $800–1,400 | 240,000–420,000 |
| **Total (range)** | | **245–400 hrs** | **$9,800–16,000** | **2,940,000–4,800,000 LKR** |

**Typical mid-range:** ~320 hrs → **~$12,800 USD** → **~3,840,000 LKR**

*Adjust hourly rate (e.g. $25–75) and hours to match your region and seniority.*

---

## 2. Recurring / operational cost (annual)

Ongoing costs to run the system (first year).

| Item | Notes | USD/year (range) | LKR/year @ 300 |
|------|--------|-------------------|-----------------|
| **Hosting (frontend)** | Vercel free tier or Pro (~$20/mo) | $0–240 | 0–72,000 |
| **Hosting (backend)** | Flask on Railway/Render/Fly or small VPS | $0–200 | 0–60,000 |
| **Database** | MongoDB Atlas (free tier or M10), or self-host | $0–200 | 0–60,000 |
| **MySQL** | If used (chatbot): local or managed ~$0–150 | $0–150 | 0–45,000 |
| **Google Gemini API** | Free tier (e.g. 1k RPD); beyond that pay-per-use | $0–400 | 0–120,000 |
| **Google OAuth / Drive** | No charge for normal OAuth + Drive usage | $0 | 0 |
| **LiveKit** | Free tier then paid by usage | $0–200 | 0–60,000 |
| **Domain & SSL** | Optional | $10–30 | 3,000–9,000 |
| **Total (range)** | | **$10–1,420** | **3,000–426,000 LKR** |

**Typical low-usage year:** ~**$150–400 USD** → **45,000–120,000 LKR**

*Heavy traffic or paid tiers will push toward the high end.*

---

## 3. One-time / optional costs

| Item | Notes | USD | LKR @ 300 |
|------|--------|-----|-----------|
| **Cloud GPU (training)** | e.g. Colab Pro or 1× GPU instance for model training | $0–150 | 0–45,000 |
| **Local GPU** | If you buy hardware; not required (CPU works) | — | — |
| **Paid IDE/tools** | Optional | $0–200 | 0–60,000 |

---

## 4. Total cost summary

| Scenario | USD | LKR (≈300/USD) |
|----------|-----|-----------------|
| **Build only (mid-range dev)** | ~$12,800 | ~3,840,000 |
| **Build + first year (low ops)** | ~$13,100–13,200 | ~3,930,000–3,960,000 |
| **Build + first year (higher ops)** | ~$13,200–17,400 | ~3,960,000–5,220,000 |
| **Dev (low)** | ~$9,800 | ~2,940,000 |
| **Dev (high)** | ~$16,000 | ~4,800,000 |

---

## 5. Assumptions

- **Labor:** $40/hr; 245–400 total hours depending on scope and rework.
- **LKR:** 1 USD = 300 LKR (update for current rate).
- **APIs:** Gemini free tier for light use; no charge for Google OAuth/Drive in normal use.
- **Hosting:** Mix of free tiers (Vercel, Atlas, etc.) with optional paid tiers.
- **No** ongoing full-time salaries or office costs included; treat as project/freelance budget.

---

## 6. Cost drivers in this repo

- **model/image** — PyTorch/ResNet; GPU optional (faster training).
- **model/text** — XGBoost; CPU or GPU; no per-request API cost.
- **model/main.py** — Flask summary API; no paid API.
- **model/chatbot.py** — Google Gemini (gemini-1.5-flash); free tier then paid.
- **client** — Next.js, Google OAuth + Drive, MongoDB/Prisma; hosting + DB.
- **model/liveAgent** — LiveKit; free tier then usage-based.

*Last updated: Feb 2025. Recheck exchange rate and vendor pricing for current figures.*
