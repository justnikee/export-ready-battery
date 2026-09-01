# Industry, regulation, and product briefing

**Date:** 2026-09-01  
**Status:** Live working brief — education + honest product assessment. Not a rebuild plan.  
**Scope:** Battery product only (`battery-web` + `battery-api`).  
**Companion:** [`PRODUCT_GTM_PLAN.md`](PRODUCT_GTM_PLAN.md) (commercial), [`PRODUCT_SPINE_FIX_PLAN.md`](PRODUCT_SPINE_FIX_PLAN.md) (spine PRs done).  
**Session:** [`sessions/2026-09-01-industry-product-briefing.md`](sessions/2026-09-01-industry-product-briefing.md)

**Do not treat this file as law.** Use it to decide what we sell, what we build next, and which claims are safe. For legal dates, open the **primary** links in §0, not this summary.

---

## 0. Source links — which to trust

**No source in this list should be trusted 100% for product copy except authentic Official Journal acts.** Even EUR-Lex consolidated text says it has “no legal effect.” Commission guidance says it is not an official interpretation. Consultant and CHA pages are sales tools.

Checked 2026-09-01 by fetching the live URLs.

### Trust scale

| Trust | Meaning |
|-------|---------|
| **Law** | Authentic Official Journal act. Use for “what the statute says.” |
| **Working copy** | Official consolidated / Commission page. Good enough to operate; re-check before a sales claim. |
| **Guidance** | Helps implement. Explicitly not binding. Can change. |
| **Admin circular** | Real government instruction, **narrow scope**. |
| **Commercial** | Useful colour. Do not copy dates or product requirements from it. |

### User-supplied links (verified)

| # | Link you gave | What it actually is | Live? | Trust | Use it? |
|---|---------------|---------------------|-------|-------|---------|
| 1 | [EUR-Lex summary — sustainability rules for batteries](https://eur-lex.europa.eu/EN/legal-content/summary/sustainability-rules-for-batteries-and-waste-batteries.html) | Plain-language **summary** of 2023/1542. Last update 1 Aug 2025. Mentions 2025/1561. | Yes | **Working copy** (overview only) | Yes, for orientation. **Not** for article numbers or dates in marketing. |
| 2 | [ELI `…/reg/2023/1542/2023-07-28/eng`](https://eur-lex.europa.eu/eli/reg/2023/1542/2023-07-28/eng) | **Point-in-time** consolidation at **28 Jul 2023** (day of OJ publication). EUR-Lex itself offers “Access current version (31/07/2025)”. **Does not include** Regulation 2025/1561 (due-diligence delay). | Yes — but **stale law** | **Law of that day only** | **Do not use as the working text.** Due diligence still reads 18 Aug 2025 here. |
| 3 | [Sea Air — Battery import compliance India](https://www.seaaircargosystems.com/battery-import-compliance-india.html) | Licensed CHA blog (updated 3 May 2026). **Import into India**, not EU export. | Yes | **Commercial** | Context for BIS / UN 38.3 / EPR / DG when customers **import cells**. Not a product spec. |
| 4 | [BIS guidelines for rated capacity](https://www.crsbis.in/BIS/app_srv/tdc/gl/docs/guidelines_for_rated_capacity.pdf) | BIS Registration Dept circular, 10 Feb 2026, attaching MeitY order W-47/14/2024-IPHW (3 Feb 2026). PDF fetched (~910 KB). | Yes | **Admin circular** | Yes, for **portable sealed secondary lithium cells/batteries under IS 16046 Part 2**. Not the first LMT/industrial EU-passport SKU. |
| 5 | [TÜV Rheinland — EU Battery Regulation landing](https://www.tuv.com/landingpage/en/eu-new-battery-regulation-eu-2023-1542/) | Lab sales page. Category definitions are fine. Timeline still lists **due diligence 18 Aug 2025** and is **wrong**. | Yes | **Commercial** (stale dates) | Category list only. **Do not copy the timeline.** |

### Primary links to use instead

| Need | URL | Trust | Notes |
|------|-----|-------|-------|
| Authentic original regulation | [OJ 2023/1542](https://eur-lex.europa.eu/eli/reg/2023/1542/oj) | **Law** | Day-one text. Missing later amendments. |
| **Working consolidated text** (includes DD delay) | [CELEX `02023R1542-20250731`](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02023R1542-20250731) | **Working copy** | EUR-Lex banner: documentary only. Incorporates 2025/1561 (M2). Later corrigenda exist (C3 Oct 2025, C4 Apr 2026) — re-check “current version” before a legal memo. |
| Due-diligence postponement | [OJ 2025/1561](https://eur-lex.europa.eu/eli/reg/2025/1561/oj) | **Law** | Art. 48(1) date **18 Aug 2025 → 18 Aug 2027**. In force. |
| Commission DPP hub | [Digital Product Passport](https://single-market-economy.ec.europa.eu/single-market/digital-product-passport_en) | **Working copy** | Registry live 20 Jul 2026; timelines marked **indicative**. |
| Battery passport sector page | [DPP for Batteries](https://single-market-economy.ec.europa.eu/single-market/digital-product-passport/batteries_en) | **Working copy** | Who is obliged; 18 Feb 2027 for relevant categories. |
| 71 data points (v2, 15 Aug 2026) | Linked from the batteries page; filename `Digital Batteries Passport - data point by category.pdf` | **Guidance** | **71 points.** Document says it is **not** the Commission’s official position and introduces **no extra legal duties**. Best map of “what to put in a Feb 2027 passport.” Re-download; the file is versioned. |
| Registry goes live | [News, 20 Jul 2026](https://single-market-economy.ec.europa.eu/news/digital-product-passport-registry-now-live-2026-07-20_en) | **Working copy** | Registry + **testing** environment. Index of identifiers, not the passport store. |
| Aug 2026 passport guidance note | [News, 21 Aug 2026](https://single-market-economy.ec.europa.eu/news/guidance-support-preparations-digital-batteries-passport-2026-08-21_en) | **Guidance** | Points at the 71-point PDF. |

### How to read sources (hard rule)

1. **Statute first:** authentic OJ (2023/1542 + 2025/1561), then the latest consolidated CELEX.
2. **Commission second:** DPP pages + 71-point PDF for “what to display in 2027.”
3. **India admin:** BIS/MeitY PDF for rated capacity; CPCB portal for EPR — not CHA blogs.
4. **Never** treat TÜV, Sea Air, our own `docs/*`, or marketing copy as the law.
5. Re-check Commission “indicative” dates before a customer call. Delegated/implementing acts can move Art. 7/8 display dates.

**Bottom line on trust:** the **links are real**. They are **not** all equally true. The user-supplied **2023-07-28 ELI is the most dangerous “official” link** because it looks like the full regulation but **omits the 2027 due-diligence delay**.

---

## 1. One-sentence business

**Anviora should help an Indian pack assembler put a scannable, category-correct digital battery record on each pack an EU buyer will accept after 18 February 2027 — plus keep the India certificates that factory already needs.**

We are not: a notified body, a customs broker, an LCA consultant, CPCB/BIS/NANDO, the EU DPP Registry, a Bitcoin company, or a BMS/fleet company.

If a first sales call sounds like any of those, we lose when a German importer asks “is this the official passport?”

---

## 2. The industry (five layers)

Battery “compliance” is five systems. Mixing them is why the website sounds impressive and the product feels confused.

| Layer | What it is | Who cares | When it bites | Can software make you compliant? |
|-------|------------|-----------|---------------|----------------------------------|
| Product safety & marking | Battery must be safe, labelled, CE-marked (EU) or BIS-licensed (India) | Labs, BIS, notified bodies | Before you ship | **No.** We store evidence. |
| India producer duties | BIS CRS, CPCB EPR, UN 38.3 for transport, AIS for traction | CPCB, BIS, customs, airlines | Every domestic sale and cell import | **No.** We track numbers and can emit a Form 3 CSV. Filing is on the portal. |
| EU placement duties | Carbon (Art. 7), recycled content (Art. 8), removability (Art. 11), due diligence (Ch. VII), EU waste EPR | EU importer / authorised representative | Staggered 2025–2036 | **No.** We hold structured data. |
| Digital Battery Passport | QR-linked record for **certain** batteries (Art. 77) | EU buyer, recycler, market surveillance | **18 Feb 2027** | **This is the software product.** |
| Transport | UN 38.3, DG packing, MSDS | Airlines, CHA, carriers | Every lithium shipment | Adjacent. Sea Air is this layer. |

---

## 3. The actual problem

Not “EU regulations are complicated.”

**Indian pack manufacturers already have most of the papers. They are scattered across labs, Tally, WhatsApp, Excel, and consultants. The EU buyer will soon refuse the PO unless each pack has a QR that opens a living record. The factory cannot tell, in one place, what is complete, what is missing, and what the buyer will scan.**

Why it is serious:

1. **Hard date.** From 18 February 2027, each EV battery, each LMT battery, and each industrial battery **>2 kWh** placed on the EU market or put into service must have a battery passport (Commission batteries page + Art. 77).
2. **The buyer enforces first.** A German e-bike brand or BESS importer writes “no QR, no PO.”
3. **The factory is often not the legal operator.** The obligation sits with whoever **places the finished battery on the EU market** — often the EU importer. We still sell to the Indian factory because the importer will make them produce the data.
4. **It is not “every battery.”** Portable and SLI need labelling/QR under Art. 13, not a full Art. 77 passport.

---

## 4. Who faces it (first customer)

**Primary:** India pack assembler, ~30–200 people, already exporting or contracted to export:

- LMT: e-bike / e-scooter white-label packs for EU brands
- Industrial / BESS / material-handling packs **>2 kWh**

**Buyer:** owner or export/compliance manager. Trigger: EU email “we need a passport/QR by 2027.”

**Do not chase first:** Exide, Amara Raja, Ola, Agratas, Reliance (WATTSync / internal IT).  
**Do not chase first:** domestic-only EPR filers (they need CPCB, not a DPP).

**Second customer (pull):** the EU importer. “We onboard your Indian pack supplier.”

Sea Air’s reader is someone **importing into India**. Different person, different sale.

---

## 5. What we must know before charging money

### 5.1 Categories (Art. 3) — the product switch

| Category | Plain meaning | Passport 18 Feb 2027? |
|----------|---------------|------------------------|
| Portable | Sealed, ≤5 kg, not EV/LMT/SLI | No (QR/label only) |
| SLI | Starter / lighting / ignition | No |
| LMT | Sealed, ≤25 kg, e-bike/e-scooter traction | **Yes** |
| Industrial | Industrial use, or >5 kg and not EV/LMT/SLI | **Yes if >2 kWh** |
| EV | Vehicle traction (or L-category >25 kg) | **Yes** |

If the wizard does not force this choice, every later rule is wrong.

### 5.2 What Feb 2027 actually requires in the passport

Commission **15 Aug 2026** guidance: **71 data points**. Guidance, not law — but it is the best current map.

**Mandatory on day one (typical):** unique ID; who is responsible for the passport; manufacturer name/address; category; model/serial; plant; manufacturing month/year; weight; capacity; chemistry; hazardous substances; extinguishing agent; CRMs >0.1%; share of renewable content; voltages; power; lifetime (with caveats); separate-collection marking; EU Declaration of Conformity; waste-management info.

**Restricted (repairers/recyclers):** detailed cathode/anode/electrolyte; spare part numbers; dismantling diagrams; safety measures.

**Authorities:** test reports proving compliance.

**Individual battery (dynamic):** status original / repurposed / re-used / remanufactured / waste; SoH / capacity fade (category-specific); cycles/events if applicable.

**Explicitly not required in the passport as of February 2027 (per that guidance):**

| Data | Why not yet |
|------|-------------|
| Carbon footprint declaration and class (points 17–18) | Format still in an implementing act |
| Due diligence / responsible sourcing (point 19) | Art. 48 from **August 2027** |
| Recycled Co/Li/Ni/Pb % (points 20–23) | Follows Art. 8 later (documentation ~2028, minima 2031) |

**Carbon class is not the 2027 product.** Identity + QR + public record + restricted dismantling + status/SoH is.

### 5.3 Other EU dates (statute, not TÜV)

From consolidated 2023/1542 + 2025/1561. Several Art. 7 dates also wait on delegated/implementing acts (“whichever is later”).

- **Art. 7 carbon:** EV / industrial >2 kWh / LMT only. Not portable. Not SLI. Declaration, then class, then maximum threshold — different dates per category. Methodology is a Commission delegated act, not a five-input calculator.
- **Art. 8 recycled content:** documentation from ~18 Aug 2028 (after methodology act); minima 16% Co / 6% Li / 6% Ni / 85% Pb from **18 Aug 2031** (then higher in 2036). Not portable.
- **Art. 11:** **removability/replaceability** of portable and LMT — **not** due diligence.
- **Ch. VII / Art. 48:** due diligence postponed to **18 Aug 2027** (2025/1561). Notified-body verification of the **policy**.
- **Art. 13(6):** from 18 Feb 2027 **all** batteries get a QR; only LMT / industrial >2 kWh / EV open a **passport**.
- **DPP Registry (20 Jul 2026):** identifier index + testing environment. Connecting is GTM G18, not a first-pilot feature.

### 5.4 India, honestly

- **BIS CRS (IS 16046 / related):** licence. Software stores R-number and PDF. We cannot be “BIS compliant.”
- **Rated capacity (MeitY 3 Feb 2026 / BIS 10 Feb 2026):** extra lab measurement (IS 16047 cl. 7.3.1) for **portable sealed secondary lithium** under IS 16046 Part 2. New/renewal from **1 May 2027**; existing licensees by 30 Apr 2027 or licence end. Real — not the first EU LMT/industrial SKU.
- **CPCB EPR (BWM Rules 2022):** register, targets, recycler credits, Form 3 **on the portal**. We have a ledger + CSV helper, not filing.
- **UN 38.3:** transport, not EU passport.
- **AIS-156 / AIS-038:** traction type-approval (EV/LMT), not UPS/stationary.

### 5.5 Roles

```
Cell maker → Pack assembler (India) → Exporter → EU importer
                                                 ↓
                                      places on EU market
                                                 ↓
                                      passport obligation
```

Sell software to the pack assembler; the **legal** passport owner may be the importer. The importer must scan **without** an Anviora login.

---

## 6. What the product should do (first year)

```
Create a lot (model + category + plant + dates)
  → attach existing certificates (BIS, UN 38.3, IEC, MSDS, DoC)
  → fill Feb 2027 public fields (missing = missing)
  → activate (quota) → mint serials
  → print QR/labels
  → warehouse SHIP
  → buyer / recycler / regulator see the right slice
  → later IN_SERVICE / RECYCLED
```

**Must-have**

1. Battery **model + lot + category** (the switch).
2. Per-unit identity (serial + QR on the pack).
3. Public passport matching Commission points 1–15, 24, 26–43 as far as we have data — **do not invent the rest**.
4. Restricted vs public vs regulator views.
5. Activation checklist that is **category- and date-correct** (PASS / MISSING / NOT APPLICABLE / NOT YET IN FORCE).
6. Certificate vault with dates — not “PENDING PDF = verified.”
7. India fields the factory already has (EPR, BIS, IEC) without pretending we filed CPCB.
8. Billing that takes INR for passport credits.

**Must not be the headline:** blockchain, W3C VC, Tally “live sync,” carbon class A–G, CMRT-as-due-diligence, DGFT TRACE 75%, fleet/BMS, SAP, “100% audit proof.”

---

## 7. What we have already built correctly

`docs/compare.md` missed this because it only read the website. The **spine is real**.

| Step | In code | Notes |
|------|---------|-------|
| Signup + onboarding | Yes | Self-serve register. GSTIN not collected on manufacturer onboarding. |
| Draft lot / wizard / CSV | Yes | `lot_size` stored; serials are a **separate** generate/CSV step. |
| Activation + quota | Yes | Server validators, fail-closed. 1 credit per passport. Razorpay only (ADR 029). |
| BPAN serials | Yes | House format `{IN\|EU\|GL}-{MFR}-{CHEM}-{YYYY}-{NNNNN}` — **not** a statutory ID. |
| QR + labels | Yes | ACTIVE/ARCHIVED only. Payload `https://…/p/{uuid}`. GTIN is not the URL. |
| Public passport | Yes | Public / partner magic-link / regulator key. |
| Lifecycle hash chain | Yes | SHIP / INSTALL / RECYCLE. INSTALL/RECYCLE need partner roles. |
| Factory-gate SoH 100% | Yes | In-life via lifecycle/telemetry. |
| India validator | Partial | AIS only EV/LMT. PENDING PDFs still count as valid. |
| Art. 8 minima | Warnings dated 2031 | Correct direction (PR1). |
| Partners magic links | Core (Starter) | Needed to close INSTALL/RECYCLE. |
| Carbon calculator | Exists | **Estimator**, not Art. 7. |

We can take a factory from empty tenant to “QR on a crate a third party can scan” **today**. That is a concierge paid pilot. It is not “EU Battery Regulation compliance.”

---

## 8. Missing, wrong, or needs redesign

### 8.1 Wrong legal wiring (fix before a serious demo)

| Issue | Code today | Should be |
|-------|------------|-----------|
| Art. 7 carbon required for **every** EU batch | `eu.go` blocks PORTABLE/SLI too | Only EV / LMT / industrial >2 kWh — and passport **display** of CF is not required Feb 2027 per Commission guidance |
| Calculator labelled `JRC_2024_DECLARED` | Heuristic: chemistry factor + `0.15 kWh/kWh` + homemade A–G | “Screening estimate. Not PEFCR. Not a class assignment.” |
| “Art. 11 = due diligence” | `eu.go`, EU page, marketing | Art. 11 = removability. DD = Ch. VII / Art. 48 from **Aug 2027** |
| DD can **ERROR-block activation now** | If BOM has `supplier_id` and no risk profile | Do not block before Aug 2027 |
| PENDING BIS/EPR PDF = valid | `isCertificateValid` | “Uploaded, not verified” |
| AIS = string `"AIS-156"` | No type-approval evidence | Optional evidence, not a green tick |
| EU AR required even if established in the EU | Over-applied | Only non-EU manufacturers |
| MoRTH code required for **all** India batches | Including portable/UPS | Traction only |
| Form 3 CSV | Internal chemistry rows | Do not imply CPCB accepted it |
| MeitY rated capacity 2027 | Absent | Track later; not P0 for LMT/industrial export |
| DPP Registry | None | P2. Do not advertise. |

### 8.2 Feb 2027 passport content gaps

Weak or missing vs the 71-point list: EU registry unique registration identifier; extinguishing agent; CRMs >0.1% w/w as a distinct disclosure; renewable content; min/nominal/max voltage with temperature range; original power (W) and power limits; lifetime reference test; separate-collection / Cd–Pb marking; actual EU DoC document; Art. 74 waste text; restricted exploded diagrams / fasteners / tools / spare sources; battery status vocabulary original/repurposed/re-used/remanufactured/**waste** (ours is CREATED/ACTIVE/SHIPPED/IN_SERVICE/RECYCLED — close, not the same).

**Identity + QR is ahead of Annex XIII completeness.** Fine for a 2026 pilot if we say so. Not fine for a 2027 market-surveillance scan if we claim completeness.

### 8.3 Overbuilt (hide, don’t keep investing)

24 nav items. First-week exporter needs ~6.

Hide until asked: Fleet, BMS Telemetry, Regulatory RSS, DGFT (includes textile HSNs), Analytics fake +8%/+24%, Templates-as-a-page, Admin Panel in the sidebar, Tally “live sync” (polls `localhost:9000`).

### 8.4 Commercial packaging

- Three names: Anviora / ExportReady / Anvaya Labs; footer **ANVIORA LABS INC.**; invoice dummy GSTIN `09AAICA1234F1Z5`.
- Marketing `/terms` and `/privacy` **404**.
- Waitlist CTA vs open `/register`.
- Starter sold to “first-time exporters” but EU **page** is Growth (activation of an EU batch is still possible on Starter).
- Fake stats: 100% audit proof, 112 fields, live EU & India regulations, Tally Prime auto-sync, TRACE 75%, CPCB CLEARED, “Verified at EU Customs,” carbon Class A–E **and** A–G.
- Textile still on the public site.

---

## 9. Challenges

1. **“Is this official?”** Default QR is on **our** host. If we vanish, labels die (GTM G11).
2. **We are not the notified body.** Answer: we issue the record and store certificates; TÜV still does the tests.
3. **Data factories will not upload** (BOM, supplier names, exact cathode). Restricted-tier data is both the value and the blocker.
4. **Wrong legal customer** if we only sell to the Indian factory and the importer refuses a passport that isn’t in their name.
5. **Registry later.** When customs checks Unique Registration Identifiers, `/p/{uuid}` is not enough.
6. **Honesty crash** on “10,000+ passports” or “JRC methodology.”
7. **Competitors:** WATTSync for Tata-orbit plants; Circuland for EU brands who want the QR on **their** domain. We win as the cheap dual India+EU pack-house tool.
8. **Stale third-party pages.** TÜV still shows DD in 2025. Primary sources only.

---

## 10. Where we stand

| Question | Answer |
|----------|--------|
| Understand the industry well enough to **build**? | Yes, enough to ship the spine. Not enough to write the homepage. |
| Understand it well enough to **sell**? | Not until copy matches Feb 2027 scope. |
| Is the problem real? | Yes. Hard date, buyer-enforced, MSME cannot buy Circulor. |
| Do we have a product? | **Yes, for a concierge passport pilot.** No, for “compliance platform / certified LCA / CPCB filing / EU registry.” |
| #1 product problem | Over-wide product + rules that over-claim (carbon, DD, PENDING=verified). |
| #1 commercial problem | Zero production users, three brands, waitlist vs register, fake stats. |
| Pause and study for months? | **No.** Study **while** one SKU goes on a crate with a customer. |
| Rebuild as evidence-mapping engine (`docs/compare.md`)? | **No.** That is a second product. |

Rough split of the codebase:

- **~30%** real first product (batch → activate → serial → QR → public page → SHIP)
- **~40%** adjacent or premature (carbon theatre, mass balance, DD, DGFT, Tally, fleet, telemetry, regulatory RSS)
- **~30%** packaging that currently **hurts** (marketing claims, nav, entitlements story, legal entity)

---

## 11. What to do next (order)

Do not start new modules.

**Week 1 — learn by rewriting claims (this is the education)**

- Homepage: who (Indian pack exporters) + what (serials, QR, public record, certificate vault) + when (18 Feb 2027 for LMT / industrial >2 kWh / EV).
- Kill: every battery, 100% audit proof, 10,000+ / 99.8%, Tally live, TRACE 75%, CPCB cleared, Bitcoin as headline, carbon A–E/A–G as “automated Art. 7.”
- Fix marketing Terms/Privacy 404. One legal name + real GSTIN.
- Print the 71-point table next to the public passport: have / partial / no / not in force Feb 2027.

**Week 2 — make the machine match that law**

- Carbon: not an activation ERROR for portable/SLI; label the calculator as a screening estimate.
- Due diligence: no activation ERROR before Aug 2027; stop calling it Art. 11.
- PENDING PDF ≠ verified.
- Slim nav (G6). Hide fleet/telemetry/regulatory/DGFT/fake analytics.

**Weeks 2–6 — business, not features**

- 15 named pack assemblers + 10 EU importers.
- One **Pilot SKU**: Growth entitlements, ~1,000 credits, 90 days, we sit with them and issue the first lot.
- Success: **paid (or signed) + one ACTIVE batch + a third party scanned a label without an account.**

**Do not do next:** evidence-mapping rebuild; DPP registry connector before a customer; certified LCA; more AI extraction claims; textile; studying every annex until it feels ready.

---

## 12. How to keep educating (practical)

Do not memorise 2023/1542. Keep this map:

1. **Art. 3** categories — always.
2. **Art. 13 vs Art. 77** — QR for all; passport for some.
3. **71 data points (15 Aug 2026)** — what to put on the passport **now**.
4. **Art. 7 / 8 / 48 dates** — collect later, do not sell now.
5. **India:** BIS licence + CPCB EPR + UN 38.3 as **documents**, not “we filed it.”
6. One factory visit: how they store PDFs and print labels.

Bookmarks (re-check “current version”):

- Consolidated regulation: [CELEX 02023R1542-20250731](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02023R1542-20250731)
- DD delay: [2025/1561](https://eur-lex.europa.eu/eli/reg/2025/1561/oj)
- [Commission batteries DPP](https://single-market-economy.ec.europa.eu/single-market/digital-product-passport/batteries_en) + 71-point PDF (re-download from that page)
- [DPP Registry user guide](https://single-market-economy.ec.europa.eu/single-market/digital-product-passport_en) (economic operators PDF, updated Aug 2026)
- MeitY/BIS rated-capacity PDF — India portable CRS track only

TÜV is a lab’s sales page. Sea Air is a CHA’s import page. Both are useful context and dangerous if copied as product requirements.

---

## 13. Bottom line

The industry problem is real. The first customer is a mid-size Indian pack assembler under an EU buyer’s 2027 QR mandate. The issuance spine already exists.

What stands between that and a business is not more software. It is knowing that **February 2027 is identity + QR + structured record**, not carbon class or Bitcoin — and saying only that out loud.

Sources: **use the primary table in §0.** Do not bookmark the 28 Jul 2023 ELI as “the regulation.”
