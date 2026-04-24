# Lifecycle And Compliance Audit

Date: 2026-04-24

Implementation note, 2026-04-25:

- Internal lifecycle handlers now use a shared tenant-scoped passport access guard for transitions discovery, events, SoH read/write, repair logging, replacement logging, verify-chain, transition execution, and EPCIS export.
- The duplicated SoH history append in the lifecycle service has been removed, so each SoH update now writes a single history entry plus the immutable `SOH_UPDATED` audit event.
- The internal `GET /api/v1/passports/{uuid}/transitions` route now filters actions by resolved internal actor role instead of returning status-only actions.
- The lifecycle dashboard row-action menu now fetches allowed actions from the backend transitions endpoint for each visible passport instead of using a local static transition map.
- The gap analysis below remains useful as the baseline that drove that change, but the object-authorization gap for those internal handler routes has now been partially addressed in code.

## Scope

This document audits the current battery lifecycle implementation in the codebase, with emphasis on:

- canonical lifecycle state handling
- lifecycle security and tenant isolation
- auditability and evidence capture
- repair, replacement, state-of-health, and ownership history
- partner and external workflow support
- alignment with what stronger battery passport platforms usually do

This is a code-grounded audit, not a legal opinion. Where older internal documents disagree with current code, this report treats the code as the source of truth and explicitly calls out the drift.

## Executive Summary

The platform already has a meaningful lifecycle foundation. It has a canonical transition map, immutable event logging with a hash chain, evidence validation, reason-code enforcement, bulk transitions, GPS capture for field actions, outbound lifecycle webhooks, OTP-gated magic-link flows for external partners, ownership transfer logging, document listing, and EPCIS export.

The main problem is no longer that lifecycle is missing. The main problem is that lifecycle governance is inconsistent across endpoints and UI surfaces. The write path for core transitions is materially stronger than before, but several adjacent lifecycle endpoints still appear to rely on authentication without consistently verifying tenant ownership of the target passport. In parallel, the frontend still drives lifecycle choices from a static status map instead of the backend's policy decisions, so the UI can drift from the real authorization model.

The platform is therefore best described as:

- strong on lifecycle mechanics and audit primitives
- partial on lifecycle governance and consistency
- partial on advanced compliance-grade attestations and ecosystem interoperability
- behind major players on policy centralization, verifier trust models, and externally provable claims

## Current Lifecycle Surface

### 1. Canonical lifecycle state machine

The backend defines a canonical action and transition model in `backend/internal/models/models.go`.

Current canonical actions:

- `ACTIVATE`: `CREATED -> ACTIVE`
- `SHIP`: `ACTIVE -> SHIPPED`
- `INSTALL`: `SHIPPED -> IN_SERVICE`
- `RECYCLE`: `IN_SERVICE | RECALLED -> RECYCLED`
- `CLOSE`: `RECYCLED | RECALLED -> END_OF_LIFE`
- `RECALL`: `ACTIVE | SHIPPED | IN_SERVICE -> RECALLED`

Current role model on the canonical transition path:

- `SHIP` is allowed for `INTERNAL_OPERATOR`, `LOGISTICS`, and `ADMIN`
- `ADMIN` is now allowed to ship, which fixes the earlier mismatch where admins could manage the platform but could not execute a shipment transition

### 2. Transition execution path

The core mutation path is in `backend/internal/services/lifecycle.go` and `backend/internal/handlers/lifecycle_handlers.go`.

The transition path currently does the important things correctly:

- validates the action is known
- validates actor context is present and coherent
- validates the actor role is allowed for the action
- validates the current state allows the action
- validates required evidence
- validates reason codes where needed
- persists a lifecycle event into the passport event stream
- links event hashes into an audit chain
- appends owner and geolocation history where relevant
- dispatches an outbound lifecycle webhook after success
- verifies tenant ownership before the transition is allowed from the protected internal route

This means the main lifecycle write path is materially stronger than some older internal gap notes suggest.

### 3. Partner lifecycle path

The external partner flow in `backend/internal/handlers/magic_link_handlers.go` is a real differentiator.

It supports:

- action-specific magic links
- role binding on the link
- OTP escalation when required
- resend and confirm flows for OTP
- recycler-specific closing guardrails

This is stronger than a basic "public link triggers a change" implementation. It shows the platform is already thinking in terms of contextual lifecycle authorization rather than only internal staff workflows.

### 4. Extended lifecycle evidence surfaces

The lifecycle system is broader than only status changes.

Implemented adjacent lifecycle data surfaces include:

- passport event history
- state-of-health updates and history
- repair event logging
- replacement event logging
- ownership transfer and ownership history
- document listing for passport-linked evidence
- EPCIS export
- audit-chain verification

This is the right shape for a serious passport platform. The remaining work is mostly about making these surfaces equally governed and equally canonical.

## What Is Good Today

### 1. Canonical lifecycle exists and is enforced on the main path

Many battery passport products never get beyond free-form status updates. This codebase is already beyond that stage. The main transition path is explicit, typed, and validated.

### 2. Audit chain support is real, not cosmetic

The event chain hashing in the lifecycle service is meaningful. The system can verify chain integrity, and core transitions write immutable lifecycle events with `PreviousHash` linkage.

That gives the platform a serious compliance and audit foundation compared with systems that only overwrite a current status field.

### 3. Evidence-aware lifecycle design is present

The platform requires evidence for lifecycle actions such as shipment, installation, recycling, and recall. This is important because compliance is rarely about the status alone. It is about whether the status change is evidenced and attributable.

### 4. EPCIS export already exists

The EPCIS export path is important because large customers and more mature ecosystems eventually expect interoperable event exchange. Not every competitor exposes this cleanly early on.

### 5. External workflow support is stronger than average

The magic-link plus OTP lifecycle path is useful for recyclers, logistics partners, or field actors who should not need full internal accounts. This is a practical product advantage if tightened with stronger tenant scoping and policy consistency.

### 6. Outbound lifecycle webhooks exist

Successful transitions dispatch outbound webhooks from the lifecycle service. This is important because it means the platform already supports event-driven integration patterns instead of forcing every partner to poll.

That is another place where some older internal gap notes are now stale.

## Verified Gaps And Risks

### 1. Tenant ownership enforcement is inconsistent across lifecycle endpoints

This is the highest-priority remaining issue.

The internal protected transition route verifies that the passport belongs to the authenticated tenant before changing state. The EPCIS export route also verifies tenant ownership. Ownership transfer also verifies tenant ownership in the service layer. Document listing is tenant-scoped.

However, several other lifecycle endpoints appear not to perform the same tenant-ownership check before reading or mutating passport-specific lifecycle data:

- `GET /api/v1/passports/{uuid}/transitions`
- `GET /api/v1/passports/{uuid}/events`
- `POST /api/v1/passports/{uuid}/soh`
- `GET /api/v1/passports/{uuid}/soh/history`
- `POST /api/v1/passports/{uuid}/repairs`
- `POST /api/v1/passports/{uuid}/replacements`
- `GET /api/v1/passports/{uuid}/verify-chain`

These routes are protected by authentication, but the handler logic currently appears to parse the passport UUID and call service methods directly without the same tenant ownership guard used on the main transition path.

Why this matters:

- authenticated access is not the same as object-level authorization
- a leaked or guessed passport UUID may still let an authenticated user query or mutate another tenant's lifecycle-adjacent data
- compliance posture is weakened if the strongest controls protect only the central status transition and not the surrounding lifecycle evidence surfaces

Recommended fix:

- create one shared guard for lifecycle passport access
- apply it to every lifecycle read and write endpoint that accepts a passport UUID
- keep policy decisions server-side and avoid endpoint-by-endpoint exceptions unless explicitly justified

### 2. Allowed-actions discovery is status-based, not actor-aware

Historically, `GET /api/v1/passports/{uuid}/transitions` derived `allowed_actions` from `models.GetAllowedActions(passport.Status)`.

That meant the endpoint answered: "what actions are valid from this status?" instead of fully answering: "what actions is this authenticated actor allowed to perform on this passport right now?"

The internal handler path has now been updated to filter by resolved internal actor role, but the broader architectural point still stands: action discovery should remain fully policy-driven and consistent across all lifecycle surfaces, including any external or partner-facing discovery flows.

The original status-only approach created several problems:

- the returned action list can overstate what a user is actually permitted to execute
- the UI may present actions that later fail at execution time
- role-aware policy remains fragmented between static frontend logic and deeper backend enforcement

For a strong lifecycle product, action availability should be computed from at least:

- current state
- actor role
- tenant ownership
- whether evidence prerequisites are satisfied
- whether the actor is internal, external partner, recycler, or logistics actor
- any additional business policy gates

### 3. Frontend lifecycle actions are still driven by a static map

Historically, the dashboard page in `frontend/app/(dashboard)/lifecycle/page.tsx` used a local static `TRANSITIONS` map for row actions.

The row-action path has now been updated to fetch allowed actions from the backend transitions endpoint for the currently visible passports. That removes the most obvious UI-side policy duplication for single-passport actions.

The broader architectural warning still applies: the frontend should not maintain separate lifecycle policy rules anywhere that affect what actions users see or trust.

Why this matters:

- UI and backend will drift over time
- new backend role rules can be correct while the UI remains wrong
- lifecycle confusion becomes a product problem even when backend enforcement is technically right
- the system becomes harder to trust in demos, onboarding, and regulated customer reviews

This is exactly the class of mismatch that tends to produce user reports like "why can I see this action here but not execute it" or "why does one flow show a different set of lifecycle options than another".

### 4. Repair and replacement are implemented, but not canonicalized

This area is more nuanced than older docs suggest.

Repair and replacement are not completely missing. The backend has dedicated protected endpoints:

- `POST /api/v1/passports/{uuid}/repairs`
- `POST /api/v1/passports/{uuid}/replacements`

The service layer records immutable events for them:

- `REPAIR_LOGGED`
- `REPLACEMENT_LOGGED`

This means the platform does support repair and replacement history.

But they are not modeled as canonical lifecycle actions in the main transition map. They behave more like side-channel event logs than first-class lifecycle stages or policy-controlled subflows.

What is missing relative to a stronger lifecycle design:

- clear state semantics for repair and replacement
- policy rules for who may log them and under what conditions
- tenant ownership verification on those endpoints
- frontend workflows that expose and explain them consistently
- linkage between repair or replacement evidence and operational consequences such as warranty, state-of-health, or service eligibility

So the correct conclusion is not "repair and replacement do not exist". The correct conclusion is "repair and replacement exist, but only as partial event logging rather than as a canonical lifecycle capability".

### 5. State-of-health is now audit-logged, but its API governance is still weak

Another older gap note is now stale.

`UpdateStateOfHealth` in the lifecycle service updates SoH, appends history rows, and creates an immutable `SOH_UPDATED` passport event with hash-chain linkage. That means SoH changes do not bypass the audit trail anymore.

However, there are still two concerns.

First, the API path itself does not appear to enforce tenant ownership before updating or reading SoH history.

Second, historical code review found that `UpdateStateOfHealth` had duplicated the SoH history append. That implementation issue has now been fixed so a single update produces one history row and one immutable audit event.

Recommended fix:

- add the same tenant ownership guard used on protected lifecycle transitions
- decide whether all SoH writes should also carry stronger source provenance, device identity, or attestation metadata when they originate from telemetry rather than manual input

### 6. Some lifecycle security findings in internal docs are now stale, but that creates its own risk

Several older internal documents no longer match current code reality.

Examples of claims that are now stale or incomplete:

- transition path missing tenant ownership check
- transfer path missing tenant ownership check
- SoH updates bypass audit hash chain
- repair and replacement have no endpoints
- lifecycle has no partner notification path
- `SHIP` is not admin-allowed

This matters because stale internal compliance docs are dangerous in two directions:

- they can overstate risk and make the team fix already-fixed issues again
- they can hide the actual remaining problems by keeping attention on resolved ones

The current main gaps are now more about consistency, centralization, and object-level authorization coverage.

### 7. There is still no strong verifier or attestation model

This is where the platform still trails more mature market players.

The system captures events and documents, but it does not yet show a strong trust model for claims such as:

- who verified a carbon value
- who attested recycled content
- whether a repair statement came from an authorized service center
- whether SoH came from a trusted device or only from a user entry
- whether a recycling claim is self-declared or externally validated

In stronger battery passport platforms, the difference between "data exists" and "data is trusted" is fundamental.

### 8. Lifecycle policy is distributed instead of centrally authored

Right now lifecycle policy is spread across:

- backend transition maps
- backend role rules
- handler-level tenant checks on some routes but not others
- magic-link-specific rules
- frontend static transition maps

This makes the product harder to reason about, harder to test comprehensively, and easier to drift.

For a compliance-heavy domain, lifecycle policy should behave more like one policy engine and less like several partial rule sets.

## What Big Players Usually Do Better

The strongest platforms in this space, including enterprise traceability vendors and OEM-aligned passport ecosystems, usually separate themselves in the following ways.

### 1. They centralize policy

They do not let the UI invent lifecycle permissions. The backend owns action discovery, authorization, evidence requirements, and actor-specific workflow rules.

### 2. They enforce object-level authorization everywhere

Every read and write path that touches a passport or its evidence is tenant-scoped and policy-checked, not just the most obvious mutation endpoint.

### 3. They distinguish internal facts from attested claims

A strong platform records not only that a value exists, but also:

- who supplied it
- who verified it
- what evidence supports it
- whether it is self-declared, partner-declared, device-observed, or third-party-certified

### 4. They make repair, replacement, refurbishment, and second-life first-class flows

Leading systems treat these as operationally meaningful lifecycle phases, not merely loose notes attached to a passport.

### 5. They treat dynamic operational data as provenance-bearing data

Telemetry, SoH, warranty events, service records, and recycler actions are tied to source provenance, device identity, and explicit trust decisions.

### 6. They invest more heavily in ecosystem interoperability

EPCIS export is a good start. The next maturity step is broader ecosystem-ready exchange and claim semantics that make passport data consumable across supply-chain, compliance, and OEM networks.

## Where ExportReady Is Different In A Good Way

ExportReady is not only behind. It already has some practical strengths that are useful in real operations.

### 1. Magic-link lifecycle operations are pragmatic

This is a strong workflow pattern for external actors who need constrained, auditable participation without full portal adoption.

### 2. The platform already thinks in terms of evidence and audit chain, not only CRUD

That is the right architectural instinct. Many products do not get this right early.

### 3. EPCIS export and webhook dispatch mean the system already leans toward event-driven interoperability

That foundation is valuable and should be expanded, not replaced.

## Corrections To Existing Internal Documentation

The following points should be treated as corrected by current code review.

### Corrected from older documents

- The protected internal lifecycle transition route does verify tenant ownership before changing state.
- Ownership transfer does verify tenant ownership in the service layer.
- SoH updates are written into the passport event audit chain.
- Repair and replacement endpoints do exist.
- Outbound lifecycle webhooks do exist.
- `SHIP` is currently allowed for admins in code.

### Still valid in principle, but needs reframing

- The real security gap is no longer only "transition path missing tenant guard". It is now "lifecycle object authorization is inconsistent across the full endpoint surface".
- The real repair and replacement gap is no longer "not built". It is now "built only as partial event logging, not as first-class lifecycle policy and workflow".
- The real SoH gap is no longer "not audit logged". It is now "API governance and provenance are weaker than the audit primitive itself".

## Recommended Roadmap

### Priority 0: close object-level authorization gaps

Apply tenant ownership verification to every lifecycle endpoint that accepts a passport UUID, not only core transition and EPCIS export routes.

This includes at minimum:

- transitions discovery
- events retrieval
- SoH update and history retrieval
- repair logging
- replacement logging
- audit-chain verification

### Priority 1: make lifecycle action discovery server-owned and actor-aware

Replace status-only action discovery with a backend decision that considers:

- tenant ownership
- actor role
- workflow type
- evidence prerequisites
- business rules

Then remove or heavily reduce the frontend static transition map.

### Priority 2: canonicalize repair and replacement

Decide whether these should be:

- lifecycle sub-actions
- service events with policy gates
- dedicated service-state transitions

Whichever model is chosen, make it explicit and enforceable end to end.

### Priority 3: strengthen claim trust and attestation

Introduce a clearer trust model for lifecycle-adjacent data:

- self-declared versus verified
- internal actor versus external partner versus device source
- supporting document or certificate references
- verifier identity and timestamp

### Priority 4: harden dynamic operational data provenance

For SoH, telemetry, service records, and recycling evidence, capture richer provenance and, where applicable, device or system identity.

### Priority 5: clean documentation drift

Update lifecycle documentation so product, sales, engineering, and compliance stakeholders are not working from outdated assumptions.

## A Solid Compliance-Oriented Target State

If the goal is a more compliance-solid lifecycle system, the target state should look like this:

- one canonical backend lifecycle policy surface
- one actor-aware allowed-actions API
- tenant-scoped authorization on every lifecycle read and write
- first-class repair, replacement, refurbishment, and second-life modeling
- evidence and provenance attached to every meaningful claim
- explicit distinction between raw data, asserted claims, and verified claims
- interoperable event export and partner notifications as standard behavior
- UI that renders server policy rather than recreating it

That would move the platform from "good lifecycle mechanics with uneven governance" to "credible compliance-grade lifecycle orchestration".

## Final Assessment

The lifecycle implementation is not weak. It is already real, structured, and closer to enterprise shape than a simple status tracker.

But the next maturity step is not adding more lifecycle nouns. The next maturity step is governance consistency.

The biggest practical improvements are:

- apply tenant-scoped object authorization uniformly
- move allowed-action decisions fully server-side
- canonicalize repair and replacement
- add stronger trust and attestation semantics to lifecycle-adjacent claims
- eliminate documentation drift so the team is solving today's gaps, not yesterday's

If those changes are made, the platform will be materially stronger both for compliance reviews and for product credibility against more mature battery passport vendors.
