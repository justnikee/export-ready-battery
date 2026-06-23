# Textile — Cleanup & Missing Work Plan

> Generated: 2026-05-17  
> Scope: `apps/textile-web`, `services/textile-api`

---

## Status Legend

- 🔴 **Critical** — breaks correctness or shows wrong content to users
- 🟡 **Cleanup** — dead code / wrong comment / residual battery reference
- 🟢 **Missing** — feature not yet built, stub page or no handler

---

## Part 1 — `services/textile-api` (Backend)

### 1.1 Critical Bugs

| #   | File                             | Issue                                                                                                                                                                                     |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `internal/auth/magic_link.go:74` | JWT `Issuer` is `"anvayalabs-battery"` — should be `"anvayalabs-textile"`. Textile-issued tokens carry a battery identity claim.                                                          |
| 2   | `cmd/migrate/main.go:17,66-75`   | `expectedTables` includes `battery_tenant_profiles` and the index checker runs against battery columns. Migration health-check will false-positive or miss errors on textile deployments. |

### 1.2 Cleanup — Dead / Wrong Code

| #   | File                                                   | Issue                                                                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3   | `internal/services/bpan_service.go`                    | `BPANService` struct + `GenerateBPANv2` function. BPAN = **Battery** Passport Aadhaar Number. Textile uses the same serial format but under a different name. Either rename the file/type to `serial_service.go` / `SerialService`, or delete it — the actual work is done by `serial.BPANGenerator` inside `passport_service.go`.    |
| 4   | `internal/services/chemistry_liion_test.go`            | File contains only `package services_test` — empty, copied from battery-api. Delete it.                                                                                                                                                                                                                                               |
| 5   | `cmd/server/main.go` (comment at PassportService init) | Comment reads `"5. PassportService — BPAN-V2 serial generation."` — update to describe textile fiber-code serial generation.                                                                                                                                                                                                          |
| 6   | `internal/models/models.go` — `Tenant` struct          | Comment on `ManufacturerCode` says `"BPAN V2:"`. Change to `"Serial V2:"` or remove battery reference.                                                                                                                                                                                                                                |
| 7   | `internal/models/models.go` — `BatteryProfileUpdate`   | Battery-specific struct (`EPRRegistrationNumber`, `BISRNumber`, `IECCode`, etc.) lives in textile-api models. Remove it; textile-api should not know about battery profile fields. The composite `UpdateProfileRequest` should only embed `TextileProfileUpdate`.                                                                     |
| 8   | `internal/services/validation.go`                      | Contains battery-specific regexes: `HSNBatteryRegex` (8507xxxx format), `EPRNumberRegex` (B-XXXXX/YYYY-YY/CPCB), `BISRNumberRegex` (R-XXXXXXXX), `IECCodeRegex`. These are India battery compliance codes. Replace with textile-relevant validators (e.g., HS Chapter 50-63 for textiles, GOTS/GRS cert pattern, or remove entirely). |
| 9   | `internal/config/config.go:39`                         | Comment `"Art 78 Regulator Access (EU Battery Regulation)"` — update to reference EU ESPR if that's the intended regulator access key.                                                                                                                                                                                                |

### 1.3 Missing — Features Not Yet Built

| #   | Area                             | What's Missing                                                                                                                                                                                                                                                                               |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10  | **ESPR Export Handler**          | Battery-api has `cpcb_export_handler.go` and `epr_handler.go`. Textile-api has no equivalent ESPR due-diligence report endpoint. Need `espr_export_handler.go` that streams the `textile_due_diligence_pdf.go` output.                                                                       |
| 11  | **Textile Label/Tag Generation** | Battery-api has a full label PDF endpoint. Textile-api has no equivalent garment/lot tag generation. Need an endpoint that produces textile product tags (lot number, fiber composition, production stage, certifications).                                                                  |
| 12  | **Audit Export**                 | `audit_export_service.go` exists but is copied from battery. Verify it produces a textile-appropriate audit trail (PRODUCE → DYE → FINISH → SELL → COLLECT actions, not ACTIVATE/SHIP/INSTALL).                                                                                              |
| 13  | **Serial naming**                | `passport_service.go` derives `productCode` from `derivePrimaryFiberCode()` and outputs serials like `IN-TEN-CTN-2026-00001`. The concept works, but there's no textile-branded name for these serial IDs in the docs/UI (e.g., TPAN — Textile Product Aadhaar Number). Decide and document. |
| 14  | **Billing / Quota handler**      | `billing_handlers.go` exists but has no test coverage (`billing_handlers_test.go` is missing from textile-api while battery-api has one).                                                                                                                                                    |
| 15  | **Telemetry handler**            | Battery-api has `telemetry_handlers.go`. Textile equivalent (production stage telemetry, IoT integration for dyeing/finishing) is not present. Low priority but should be stubbed.                                                                                                           |

---

## Part 2 — `apps/textile-web` (Frontend)

### 2.1 Critical — Wrong Content Shown to Textile Users

| #   | File                                          | Issue                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `app/terms/page.tsx`                          | Entire page is battery-focused: "EU Battery Regulation 2023/1542", "CPCB Battery Waste Management Rules 2022", "digital battery passport". Needs a complete textile rewrite covering ESPR, GOTS/GRS, Legal Metrology, supply chain obligations.                                                                                                                                                                                                                  |
| 2   | `app/privacy/page.tsx`                        | References "battery product specifications", "digital battery passport generation", "Battery Passport". Replace with textile traceability / supply chain data privacy text.                                                                                                                                                                                                                                                                                      |
| 3   | `app/docs/page.tsx`                           | Renders battery API documentation (Battery icon, "Digital Battery Passports" section, "EU Battery Regulation 2023/1542"). Replace with Textile Traceability API docs.                                                                                                                                                                                                                                                                                            |
| 4   | `components/batches/create-batch-dialog.tsx`  | The old merged battery form with `const isTextile = true` hardcoded. All battery state variables remain (`capacity`, `voltage`, `chemistry`, `batteryCategory`, `hsnCode`, `cellSource`, `pliCompliant`, `dvaSource`, `billOfEntryNo`, `materialComposition`, `hazardousSubstances`, etc.). `CreateTextileLotDialog` is already built and correct. **Remove `create-batch-dialog.tsx` from textile-web** and ensure all call sites use `CreateTextileLotDialog`. |
| 5   | `components/batches/DownloadLabelsDialog.tsx` | All copy is BPAN/battery: "BPAN Serial Format (21-char)", "Decoded battery descriptor (chemistry, year, sequence)", "Battery specs (voltage, capacity, manufacturer)". For textile, this should generate garment/lot product tags showing: lot number, fiber composition, production stage, certifications (GOTS/GRS), country of origin.                                                                                                                        |
| 6   | `components/auth/login-form.tsx:227`          | Google OAuth URL fallback: `product_type=${product?.type \|\| "BATTERY"}`. In textile-web the fallback must be `"TEXTILE"`.                                                                                                                                                                                                                                                                                                                                      |
| 7   | `components/passport/manual-soh-entry.tsx`    | SoH (State of Health) is a battery concept (battery degradation %). Textile passports have no SoH. Remove this component from textile-web or replace with a textile-equivalent (e.g., condition report / certification status update).                                                                                                                                                                                                                           |

### 2.2 Cleanup — Dead Battery Code

| #   | File                                                    | Issue                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8   | `app/p/[uuid]/action/page.tsx`                          | `BATTERY_ACTION_CONFIG` and `BATTERY_EVIDENCE_FIELDS` objects are dead code — the page uses `isTextile ? TEXTILE_ACTION_CONFIG : BATTERY_ACTION_CONFIG` but `isTextile` is always derived from passport type (and this is textile-web). Remove the battery constants.                                                                                                 |
| 9   | `app/blog/[slug]/page.tsx`                              | CTA at the bottom reads "Ready to simplify battery compliance?" / "Join 50+ manufacturers using AnvayaLabs to generate digital battery…". Replace with textile traceability CTA.                                                                                                                                                                                      |
| 10  | `components/batches/upload-csv.tsx`                     | Prop `chemistry?: string` with comment "For dynamic BPAN prefix (e.g., 'LFP', 'NMC')". For textile, this should be `fiber_type?: string` driving a textile serial prefix (e.g., 'CTN', 'POL').                                                                                                                                                                        |
| 11  | `components/batches/dva-calculator.tsx`                 | DVA (Domestic Value Addition) is India battery PLI scheme specific. Text says "Net selling price of battery excluding GST." Remove from textile-web — DVA has no textile equivalent under current India policy.                                                                                                                                                       |
| 12  | `components/dashboard/dashboard-layout-shell.tsx:33-41` | Contains `pathname.startsWith("/battery") ? "battery" : "textile"` and fallback to `"/battery"`. Should be removed; in textile-web all paths are textile.                                                                                                                                                                                                             |
| 13  | `context/auth-context.tsx:41`                           | Comment `"// Product type — set after Phase 1 backend lands; defaults to BATTERY"`. Change default to TEXTILE.                                                                                                                                                                                                                                                        |
| 14  | `context/auth-context.test.tsx`                         | Tests use `product_type: "BATTERY"` and assert redirect to `/battery/dashboard`, `/battery/login`. Replace with TEXTILE scenarios matching textile-web routing.                                                                                                                                                                                                       |
| 15  | `lib/passport-template-config.ts`                       | Defines `BATTERY_STANDARD_CONFIG`, `BATTERY_INDIA_CONFIG`, and the `PassportTemplateFamily` type includes `"battery"`. The interface has `showCapacityBadge`, `showSoh`, `showCrm` — all battery concepts. Strip battery configs; rewrite interface to only have textile-relevant fields (`showFiberComposition`, `showSupplyChain`, `showChemicalCompliance`, etc.). |
| 16  | `components/passport/certificate-view.tsx`              | Imports `Battery` icon from lucide-react. Uses `resolvePassportTemplateConfig` which will still evaluate battery config branches. Verify the rendered view is textile-only; remove battery icon import.                                                                                                                                                               |

### 2.3 Missing — Stub Pages and Unbuilt Features

| #   | Route / Component                      | What's Missing                                                                                                                                                                                                                                                                                                                                         |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 17  | `/dashboard/exports`                   | `UnderDevelopment` stub. Build: ESPR Compliance Report download (PDF), Supply Chain Due Diligence export (PDF), GRS/GOTS certificate bundle export (ZIP), CSV traceability export per lot. Backend endpoints already partially exist (`export_job_handlers.go`).                                                                                       |
| 18  | `/dashboard/dispatch`                  | `UnderDevelopment` stub. Build: Shipment / dispatch management — create shipment records, update lot status to SHIPPED, track logistics partner.                                                                                                                                                                                                       |
| 19  | `/dashboard/billing`                   | `UnderDevelopment` stub. Build: Quota balance display, quota purchase flow, subscription plan management. Same shape as battery billing — just needs the UI.                                                                                                                                                                                           |
| 20  | `/dashboard/analytics`                 | `UnderDevelopment` stub. Build: Traceability analytics — lot velocity chart, compliance score trend, supply chain depth distribution, scan heatmap.                                                                                                                                                                                                    |
| 21  | `/dashboard/rewards`                   | `UnderDevelopment` stub. Low priority — decide whether rewards apply to textile and either build or remove the route.                                                                                                                                                                                                                                  |
| 22  | **Public passport page** (`/p/[uuid]`) | `certificate-view.tsx` renders a generic passport. A textile-specific view section is needed: fiber composition table, supply chain stage timeline (PRODUCE → DYE → FINISH → SHIP), chemical compliance indicators, care instructions, end-of-life circularity guidance. The current view likely shows capacity/voltage/SoH fields (battery sections). |
| 23  | **Textile-specific `/terms`**          | Full textile terms of service: ESPR obligations, supply chain data, GRS/GOTS certification language, India Legal Metrology disclosure, warranty disclaimers for fiber data.                                                                                                                                                                            |
| 24  | **Textile-specific `/privacy`**        | Full textile privacy policy: what supply chain data is collected, how fiber/chemical data is stored, GDPR/DPDP Act compliance, partner data sharing rules.                                                                                                                                                                                             |
| 25  | **Textile-specific `/docs`**           | Full textile developer documentation: API reference for `POST /batches` with textile specs, lifecycle actions (PRODUCE/DYE/FINISH), ESPR compliance fields, fiber composition format, serial number format.                                                                                                                                            |
| 26  | **CSV upload (textile columns)**       | `upload-csv.tsx` has a `chemistry` prop for BPAN. A textile CSV template needs columns: `lot_name`, `material_profile`, `fiber_composition_json`, `gsm`, `production_stage`, `country_of_origin`, `certifications`, `dye_process`, `water_usage_liters`.                                                                                               |
| 27  | **Partner / regulator portal**         | Battery-api has `external_handlers.go` for the Art 78 regulator view. Textile equivalent for EU ESPR Art. 7 inspector or ZDHC auditor access is not present in textile-web.                                                                                                                                                                            |

---

## Suggested Fix Order

### Sprint 1 — Critical / Correctness (do first)

1. Fix JWT issuer → `"anvayalabs-textile"` (`textile-api/internal/auth/magic_link.go`)
2. Fix migration checker — remove `battery_tenant_profiles` (`cmd/migrate/main.go`)
3. Fix OAuth login fallback → `"TEXTILE"` (`textile-web/components/auth/login-form.tsx`)
4. Remove / replace `create-batch-dialog.tsx` in textile-web with `CreateTextileLotDialog`
5. Rewrite `app/terms/page.tsx`, `app/privacy/page.tsx` with textile content

### Sprint 2 — Dead Code Removal

6. Delete `bpan_service.go` from textile-api (or rename to `serial_service.go`)
7. Delete `chemistry_liion_test.go` from textile-api
8. Remove `BatteryProfileUpdate` from `textile-api/internal/models/models.go`
9. Remove battery state variables from `components/batches/DownloadLabelsDialog.tsx`, rewrite for textile lot tags
10. Remove `manual-soh-entry.tsx` from textile-web or replace with textile equivalent
11. Strip battery configs from `lib/passport-template-config.ts` in textile-web
12. Remove `BATTERY_ACTION_CONFIG` / `BATTERY_EVIDENCE_FIELDS` from `app/p/[uuid]/action/page.tsx`
13. Remove DVA calculator (`dva-calculator.tsx`) from textile-web
14. Fix `dashboard-layout-shell.tsx` battery path check

### Sprint 3 — Content & Docs

15. Rewrite `app/docs/page.tsx` with textile API documentation
16. Fix blog CTA at `app/blog/[slug]/page.tsx`
17. Update `context/auth-context.tsx` default and tests
18. Update serial naming — decide on TPAN or neutral name and apply

### Sprint 4 — Missing Features (build out stubs)

19. Textile exports page — ESPR report + CSV download
20. Textile public passport view — fiber composition + supply chain timeline
21. Billing UI
22. Analytics UI
23. Dispatch page
24. Textile CSV upload template + handler
