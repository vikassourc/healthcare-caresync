# System Design — Healthcare Appointment & Follow-up Manager

## 1. Concurrency Control & Double-Booking Prevention
In relational databases, exclusion constraints and `SELECT ... FOR UPDATE` serialize slot acquisition. MongoDB lacks row locks and exclusion constraints. We bridge this relational-safety gap at the database engine level via a **unique compound partial index** on `{ doctorId: 1, slotStartTime: 1 }` with `partialFilterExpression: { status: { $in: ['HELD', 'CONFIRMED'] } }`.

When concurrent requests target the exact same doctor and slot:
1. Both requests invoke `Appointment.findOneAndUpdate` using an atomic `$setOnInsert` upsert filter matching on `{ doctorId, slotStartTime, status: { $in: ['HELD', 'CONFIRMED'] } }`.
2. MongoDB's WiredTiger storage engine serializes document insertion on the unique index key.
3. The first request acquires the document hold and returns `201 Created`.
4. The subsequent request encounters a duplicate key collision (`E11000`).
5. The application layer catches error code `11000`, queries next-available slots via `SlotService`, and returns a clean, structured `409 Conflict` with alternative slot suggestions.

**Trade-off:** Mongoose `save()` following `find()` introduces a classic read-then-write race window. By avoiding read-then-write and relying on atomic `findOneAndUpdate` with partial unique indexing, slot safety is guaranteed across distributed Node.js worker instances without external distributed lock overhead (e.g. Redlock).

---

## 2. Short-Lived Slot Hold Mechanism
To prevent race conditions during patient symptom intake (where two patients attempt to book the same slot simultaneously and only find out after filling out a 3-minute form), we employ an explicit state machine:
$$\text{AVAILABLE} \xrightarrow{\text{holdSlot()}} \text{HELD (5-min TTL)} \xrightarrow{\text{confirmAppointment()}} \text{CONFIRMED}$$

- When a patient selects a slot, an appointment document is created in `HELD` status with `holdExpiresAt = now + 5m`.
- `confirmAppointment` performs an atomic transition: `findOneAndUpdate({ _id, patientId, status: 'HELD', holdExpiresAt: { $gt: now } }, { $set: { status: 'CONFIRMED' } })`.
- If the hold has expired, the update returns null and fails with a `409 Conflict`.
- A background worker (`Agenda`) executes an `expire-stale-holds` sweep every 60 seconds, transitioning expired holds to `EXPIRED` so slots become instantly re-bookable.

**Trade-off:** We chose MongoDB document state transitions over Redis TTL key expiration because medical compliance and audit logs require persistent visibility of patient intent and abandoned booking funnels.

---

## 3. Doctor Leave & Conflict Resolution
When an administrator registers doctor leave for a date range containing pre-existing confirmed bookings:
1. The admin HTTP endpoint registers the `DoctorLeave` record with `status: PENDING` and responds in $<50\text{ms}$ with `202 Accepted`.
2. An asynchronous background job (`process-doctor-leave`) is dispatched to the `Agenda` queue.
3. The worker queries all `CONFIRMED` appointments within the leave window, transitions their status to `CANCELLED` with reason `"Doctor on approved leave"`, and calculates next-available slots for each affected patient.
4. The worker fans out personalized email alerts containing instant reschedule links.
5. The leave status transitions to `PROCESSED` with `affectedAppointmentsCount`.

**Trade-off:** Asynchronous processing prevents HTTP timeout risks during large calendar fan-outs (e.g. 40 appointments cancelled at once). There is a sub-second eventual consistency window where an appointment is being cancelled in the background, which is acceptable for clinical scheduling.

---

## 4. Resilient Asynchronous Notification Pipeline
Email delivery and external integrations (Google Calendar, Anthropic LLM) are decoupled from the core request-response cycle:
- **Idempotency Guarantee:** Every notification generates a deterministic hash:
  $$\text{idempotencyKey} = \text{SHA-256}(\text{type} + \text{recipientId} + \text{appointmentId})$$
  Before inserting or sending, the system checks `NotificationLog`. If a record is already in `SENT` status, duplicates are discarded.
- **Exponential Backoff:** Failed email transmissions are retried at staggered intervals: Attempt 1 ($+1\text{m}$), Attempt 2 ($+5\text{m}$), Attempt 3 ($+30\text{m}$).
- **Dead-Letter Queue (DLQ):** After 3 failed attempts, notifications transition to `DEAD_LETTER`. Administrators inspect failure diagnostics and trigger manual retries via the Admin Portal.

---

## 5. Graceful LLM Degradation
Clinical pre-visit triage and post-visit patient summaries use Claude via Anthropic's SDK:
- Every LLM invocation is wrapped in a strict **10-second timeout guarantee** (`Promise.race`).
- Prompts mandate structured JSON output, parsed defensively via `safeParseJSON`.
- On API timeout, rate limiting, or invalid output, the system falls back to a deterministic clinical heuristic, setting `llmFailed: true`.
- **The booking flow and clinical note submission never fail due to LLM outages.**
