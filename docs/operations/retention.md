# Data retention

## Activity log

Every mutation writes a row to `activity_log`, which is what makes the audit trail trustworthy and also what makes the table the fastest growing thing in the database. Rows older than **90 days** are deleted.

`ACTIVITY_RETENTION_DAYS` sets the window and defaults to 90. The worker prunes once at startup and then every 24 hours.

### Why a time window and not a row cap

A row cap is the obvious idea and it is the wrong one for an audit trail. "Keep the newest 100,000 rows" means one busy week silently deletes a quiet month, and the answer to "what happened in July" depends on how busy September was. Retention that shifts under load is not a policy, it is a side effect.

A time window says the same thing every day: anything inside the window is there, anything outside it is gone. That is a sentence you can put in front of an auditor, and it is a sentence you can hold the system to.

### Why 90 days and not 30

Incidents are usually noticed well after they happen, and the audit trail matters most exactly then. Thirty days is comfortably shorter than the gap between a quiet mistake and the question about it. Ninety days costs little, because the table is narrow and the prune is cheap.

### How the prune runs

It deletes in batches of 1,000 and repeats until a batch comes back short, rather than issuing one unbounded `DELETE`. A single statement across months of rows takes a long lock on a table that every write touches, which turns a maintenance job into an outage.

The cutoff is computed once per run and reused for every batch, so a long prune cannot drift forward and leave a ragged edge.

`activity_log_created_at_idx` already exists, so selecting the stale rows is an index scan rather than a table scan.

Running the prune twice at once is harmless. Both passes delete rows that match, and a row already gone simply does not match again, so two workers do not corrupt anything. There is no lock to coordinate.

## Everything else

| Store | Retained | Why |
|---|---|---|
| `user`, `note`, `custom_role` | Indefinitely | Business records. Deleting them is a product decision, not an operations one |
| `session`, `account`, `verification` | Managed by better-auth | Sessions expire on their own schedule, and a password reset already deletes the user's sessions |
| Upstash Redis | Minutes to a day | Rate-limit counters expire with their window, job de-duplication claims after 24 hours. Nothing there is a record of anything |
| RabbitMQ | Until acknowledged | Except the dead-letter queue, which holds until someone drains it. That is the point of it, and it is why the depth is alerted on rather than pruned |
| Backups | 30 daily, 12 monthly | See [backup-restore.md](backup-restore.md) |

A backup taken today still contains activity rows that the live table has since pruned, and it will for as long as that backup is kept. If the retention window is ever set for a legal reason rather than an operational one, the backup retention has to be part of the same conversation.
