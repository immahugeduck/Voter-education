# Security Specification for Firestore Rules

## 1. Data Invariants

- **User Profiles (`/users/{userId}`)**:
  - Only authenticated users can access profile records.
  - A user can only read, create, and update their own document matching their UID (`request.auth.uid == userId`).
  - Users cannot delete profiles directly from the client.
  - The `email` must match the authenticated token email.

- **Citizen Votes (`/votes/{voteId}`)**:
  - Authenticated users can only read and write their own votes (`resource.data.userId == request.auth.uid` or `incoming().userId == request.auth.uid`).
  - The `vote` field must be strictly constrained to `'yea'` or `'nay'`.
  - The `billId` must be a valid non-empty string.
  - Deletions are forbidden from client SDKs.

- **Baseline Data (`/baseline_data/{dataType}`)**:
  - Baseline data documents store current active snapshots of congressional bills, roll-call voting, committee sessions, and vote alerts.
  - Public read access is permitted (`allow read: if true;`) so all citizens and visitor sessions can view current baseline data even when offline or before external API synchronization.
  - Writes (creates and updates) are strictly restricted to authenticated users or verified administrators (`request.auth != null`) with bounded item counts and valid document IDs (`isValidId(dataType)`).
  - Deletions are strictly prohibited.

- **Daily Backups (`/daily_backups/{backupId}`)**:
  - Daily backup records preserve daily snapshots of congressional legislative records to prevent the system from falling back to weeks-old data.
  - Public read access is permitted (`allow read: if true;`) to retrieve historical daily baselines.
  - Writes are restricted to authenticated users / admins (`request.auth != null`), ensuring document IDs match the date pattern or valid identifier, and records contain valid backup metadata.
  - Deletions are strictly prohibited.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Payload 1: Identity Impersonation on Profile Create**
   - Attempt: Create `/users/victim_123` with `auth.uid = attacker_456`.
   - Expected: `PERMISSION_DENIED`.

2. **Payload 2: Profile Update Tampering**
   - Attempt: Update `/users/user_123` with `auth.uid = attacker_999`.
   - Expected: `PERMISSION_DENIED`.

3. **Payload 3: Vote Spoofing (Voting on Behalf of Another Citizen)**
   - Attempt: Write `/votes/vote_789` with `userId = victim_user_id` by `attacker_uid`.
   - Expected: `PERMISSION_DENIED`.

4. **Payload 4: Invalid Vote Option Value Injection**
   - Attempt: Write `/votes/vote_100` with `vote = "super_vote_exploit"` or non-enum string.
   - Expected: `PERMISSION_DENIED`.

5. **Payload 5: Massive String Buffer Injection (Denial of Wallet)**
   - Attempt: Write `/votes/vote_101` where `billId` is a 2MB string.
   - Expected: `PERMISSION_DENIED` (`isValidId` / `.size() <= 128`).

6. **Payload 6: Unauthenticated Baseline Data Write / Poisoning**
   - Attempt: Write `/baseline_data/bills` with malicious payload without authentication (`request.auth == null`).
   - Expected: `PERMISSION_DENIED`.

7. **Payload 7: Baseline Path Traversal / Poisoned Doc ID**
   - Attempt: Write `/baseline_data/../../admin_override` or docId exceeding 128 characters or containing illegal characters.
   - Expected: `PERMISSION_DENIED` (`isValidId(dataType)`).

8. **Payload 8: Unauthenticated Daily Backup Overwrite**
   - Attempt: Write `/daily_backups/2026-09-07` without authentication.
   - Expected: `PERMISSION_DENIED`.

9. **Payload 9: Deletion of Citizen Vote Records**
   - Attempt: Delete `/votes/vote_123` from client.
   - Expected: `PERMISSION_DENIED` (`allow delete: if false`).

10. **Payload 10: Deletion of Baseline Legislative Records**
    - Attempt: Delete `/baseline_data/bills`.
    - Expected: `PERMISSION_DENIED` (`allow delete: if false`).

11. **Payload 11: Cross-User Vote Read Snooping**
    - Attempt: Read `/votes/private_vote_456` belonging to another user.
    - Expected: `PERMISSION_DENIED`.

12. **Payload 12: Admin Role Injection on User Profile**
    - Attempt: Write `/users/user_123` with `{ role: "admin", isAdmin: true }` to gain administrative rights.
    - Expected: `PERMISSION_DENIED`.

---

## 3. Test Runner Specification

The test runner verifies that all 12 dirty payloads fail with `PERMISSION_DENIED`, while legitimate operations succeed.
