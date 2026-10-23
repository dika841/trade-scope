# Baselines

**A reported saving is a claim, and a claim nobody can recompute is a rumour.** "We cut review time by 40%" is worth nothing without the three things behind it: where the number came from, what unit it is in, and what counted as one event. Two people measuring the same week will get different answers unless those are fixed in advance, and the one who reports first wins the argument rather than the one who is right.

So no saving, error rate, or volume figure is reported from this system until it has a row in the register below. The register is currently empty on purpose: nothing here is being reported yet.

## What every baseline carries

| Field | Means | Supplied by |
|---|---|---|
| Name | What is being measured, in the words the reader already uses | The PM |
| Event definition | What counts as one occurrence, and what explicitly does not | The PM, from the list engineering can actually emit |
| Source | The exact table, log field, or metric the number is read from | Engineering |
| Unit | Seconds, count, count per day, percentage of what denominator | The PM |
| Measurement method | The query or procedure, written out, so a second person gets the same number | Engineering |
| Window | The period measured, and why that period is representative | The PM |
| Baseline value | The number before the change, with the date it was taken | Whoever runs the method |
| Approved on | The date the definition was agreed, before any value was reported | The PM |

A row is only complete when the definition was approved **before** the value was measured. Agreeing the definition afterwards is how a number gets fitted to the story it is meant to support.

## The register

No baseline has been defined yet, so no saving or error figure may be reported.

| Name | Event definition | Source | Unit | Method | Window | Baseline | Approved on |
|---|---|---|---|---|---|---|---|
| None yet | | | | | | | |

## What this system can currently count

A definition is only usable if the system actually emits the event. Today that is four sources, and nothing else.

| Source | What it records | Watch out for |
|---|---|---|
| `activity_log` | Every mutation, by actor, action, resource type and resource id, from the `ACTIVITY_ACTION` vocabulary in `@app/activity` | Kept for `ACTIVITY_RETENTION_DAYS`, 90 by default, so no window may reach further back than that |
| Request log lines | Method, path, status and duration per request, tied together by `reqId` | Stdout by default. Nothing retains them unless a transport is configured, see [logging.md](logging.md) |
| Job outcomes | A job that retried, was dead-lettered, or was suppressed as a repeat delivery | Read from logs today, not from a counter, so a count is only as complete as log retention |
| `mail.send.failed` | A password reset or other mail that could not be sent, with its template | Records the failure, not the delivery. It cannot tell you a mail was read |

Three limits are worth stating before a definition is written against them.

The retention window is a hard floor. `activity_log` is pruned daily, so a baseline that wants a full quarter cannot be taken from it retroactively; raise `ACTIVITY_RETENTION_DAYS` first and wait, or accept the shorter window in the row.

There are no metrics and no traces yet. The compliance matrix in [../kpi/README.md](../kpi/README.md) tracks that as open. Until it closes, anything phrased as a rate or a percentile has to be computed from log lines that may not be retained anywhere, which usually means the honest answer is that the number cannot be produced yet.

Nothing here measures human effort. Time saved per case, review time, and rework rate are not in any table or log line. They come from a timed sample or an observed process, and the method for that belongs in the row like any other.

## Reporting a change against a baseline

Re-run the recorded method, unchanged, over a window of the same shape. State both numbers and both dates, and name anything else that changed in between. A comparison that quietly switches the method, the window, or the event definition is not a measurement, and it will be found the first time someone tries to reproduce it.
