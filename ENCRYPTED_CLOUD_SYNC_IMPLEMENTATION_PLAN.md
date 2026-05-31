# Encrypted Cloud Sync Implementation Plan

## Objective

Implement end-to-end encrypted cloud backup for ChatGPT Notebook so that:

1. Cloud-stored notebook content is unreadable to operators and infrastructure admins.
2. Users can sync across devices.
3. Users can unlock with either:
   1. passphrase, or
   2. recovery phrase.
4. Local notebook storage remains unchanged (plaintext local DB), per product requirement.

## Product Flows

### 1) New User Enabling Encrypted Cloud Sync

1. User signs in with Google/Supabase.
2. User clicks `Enable encrypted cloud sync`.
3. User creates passphrase.
4. Extension generates on-device:
   1. `MK` (master key, 256-bit random),
   2. recovery phrase (24 words),
   3. wrapping metadata.
5. Extension forces recovery phrase save/export and confirmation challenge.
6. Extension stores wrapped key material in Supabase keyring table.
7. Extension uploads encrypted snapshot and encrypted assets.
8. UI status becomes `Cloud sync encrypted and active`.

### 2) Existing User Signing In On New Device

1. User signs in with same account.
2. Extension finds encrypted keyring + encrypted cloud backup metadata.
3. User picks unlock method:
   1. passphrase, or
   2. recovery phrase.
4. Extension derives KEK locally and unwraps `MK` locally.
5. Extension downloads encrypted objects, decrypts locally, merges into local DB.
6. Device enters unlocked state and starts encrypted cloud sync.

### 3) Local Device Storage Model

1. Notes, folders, and assets in local IndexedDB remain plaintext.
2. No plaintext passphrase is persisted.
3. Unwrapped `MK` is cached only in `storage.session` while unlocked.
4. On browser restart/reload, cloud sync returns to locked state until user unlocks.

### 4) Cloud Storage Privacy Model

1. Supabase stores ciphertext objects and non-sensitive metadata.
2. RLS still restricts per-user access.
3. If RLS is bypassed via privileged server key, attacker sees ciphertext only.
4. Without passphrase/recovery phrase, content remains unreadable.

## Threat Model and Security Guarantees

## Protects Against

1. Reading note contents from Supabase DB/Storage directly.
2. Accidental data exposure through storage object access.
3. Unauthorized data reads even with broad backend visibility.

## Does Not Protect Against

1. Compromised user endpoint while unlocked.
2. Malware/keyloggers on user machine.
3. Loss of both passphrase and recovery phrase (data becomes unrecoverable).

## Trust Assumptions

1. Browser WebCrypto is trusted.
2. Extension code delivered to user is trusted.
3. User keeps passphrase/recovery phrase secret.

## Cryptographic Design

### Algorithms

1. Content encryption: `AES-256-GCM`.
2. Key wrapping: `AES-KW (A256KW)`.
3. KDF: `PBKDF2-HMAC-SHA-256`.
4. Random source: `crypto.getRandomValues`.

### Key Hierarchy

1. `MK` (Master Key): random 32 bytes, per account.
2. `DEK` (Data Encryption Key): random 32 bytes, per encrypted object.
3. `KEK_passphrase`: derived from passphrase + salt + iterations.
4. `KEK_recovery`: derived from recovery phrase + salt + iterations.

### Wrapping Strategy

1. `MK` wrapped by `KEK_passphrase`.
2. `MK` wrapped by `KEK_recovery`.
3. Each `DEK` wrapped by `MK`.
4. Encrypted payload uses `DEK` with GCM IV and AAD.

### Nonce and AAD Rules

1. New random 96-bit IV per AES-GCM encryption.
2. IV never reused with same `DEK`.
3. AAD format:
   1. `cgpt-notebook|enc-v1|userId|objectPath|revision`.

### KDF Parameters

1. Baseline: PBKDF2-SHA256, `600000` iterations.
2. Store iterations and salt in keyring row for future upgrades.
3. Optional future calibration:
   1. target 250-700ms derive on first setup,
   2. store calibrated iteration count.

## Data Model Changes

### A) New Table: `public.cloud_keyrings`

```sql
create table if not exists public.cloud_keyrings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  key_version integer not null default 1,
  wrap_alg text not null default 'A256KW' check (wrap_alg in ('A256KW')),
  passphrase_kdf text not null default 'PBKDF2-SHA256' check (passphrase_kdf in ('PBKDF2-SHA256')),
  passphrase_salt_b64 text not null,
  passphrase_iterations integer not null,
  passphrase_wrapped_mk_b64 text not null,
  recovery_kdf text not null default 'PBKDF2-SHA256' check (recovery_kdf in ('PBKDF2-SHA256')),
  recovery_salt_b64 text not null,
  recovery_iterations integer not null,
  recovery_wrapped_mk_b64 text not null,
  recovery_phrase_format text not null default 'words24-v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### B) Extend `public.cloud_backups`

Add fields:

1. `encryption_version smallint not null default 1`
2. `key_version integer not null default 1`
3. `snapshot_iv_b64 text not null default ''`
4. `snapshot_wrapped_dek_b64 text not null default ''`
5. `snapshot_aad text not null default ''`
6. `plaintext_sha256 text not null default ''`

Retain:

1. `encrypted boolean` but set to `true` for all new backups.

### C) Storage Object Naming

1. Snapshot object: `/<uid>/snapshots/rev-...json.enc`
2. Latest snapshot alias: `/<uid>/snapshots/latest.enc`
3. Asset object: `/<uid>/assets/<contentHash>.<ext>.enc`

## RLS Policies

### `public.cloud_keyrings`

1. `SELECT`: `auth.uid() = user_id`
2. `INSERT`: `auth.uid() = user_id`
3. `UPDATE`: `auth.uid() = user_id`
4. `DELETE`: `auth.uid() = user_id`

### `public.cloud_backups` and `storage.objects`

1. Keep current per-user policies.
2. Continue prefix isolation by user id.
3. Preserve `SELECT/INSERT/UPDATE/DELETE` required for `upsert`.

## Extension Architecture Changes

### New Modules

1. `extension/src/core/cryptoCloud.ts`
   1. encode/decode helpers (base64url/base64),
   2. AES-GCM encrypt/decrypt,
   3. AES-KW wrap/unwrap,
   4. PBKDF2 derive KEK,
   5. random generation utilities.

2. `extension/src/core/recoveryPhrase.ts`
   1. generate 24-word phrase from CSPRNG entropy,
   2. validate phrase format,
   3. normalize and join phrase for KDF input.

3. `extension/src/background/cloudKeyring.ts`
   1. create/update/load keyring row,
   2. unlock with passphrase,
   3. unlock with recovery phrase,
   4. rotate passphrase.

### Existing Files to Update

1. `extension/src/core/cloudBackup.ts`
   1. add encrypted manifest types,
   2. mark encrypted backups with encryption metadata,
   3. update list item serialization.

2. `extension/src/background/cloudBackup.ts`
   1. encrypt snapshot/assets before upload,
   2. decrypt on restore path,
   3. block upload if locked.

3. `extension/src/background/background.ts`
   1. add new runtime message handlers for encryption setup/unlock.

4. `extension/src/core/ports.ts`
   1. add runtime message types and response types for:
      1. setup encrypted sync,
      2. unlock with passphrase,
      3. unlock with recovery phrase,
      4. rotate passphrase,
      5. download recovery phrase.

5. `extension/src/sidebar/main.tsx`
   1. onboarding UI,
   2. lock/unlock states,
   3. recovery phrase flow,
   4. cloud status messaging.

6. `extension/src/core/models.ts`
   1. add app setting keys for encryption state.

7. `extension/src/core/repository.ts`
   1. persist non-secret encryption flags/status/settings.

## Runtime State and Settings

### Session-only Key Cache

1. Store unwrapped `MK` only in `storage.session`.
2. Do not expose session key cache to content scripts.
3. Clear cache on:
   1. sign out,
   2. disable encrypted cloud sync,
   3. explicit lock action.

### Local App Settings Additions

Add AppSetting keys:

1. `cloudEncryptionEnabled`
2. `cloudEncryptionVersion`
3. `cloudEncryptionLocked`
4. `cloudKeyVersion`
5. `cloudLastDecryptError`

## UX and Copy Requirements

### Setup Screen

1. Explain: cloud data is encrypted before upload.
2. Explain: local storage remains unchanged.
3. Explain unrecoverable risk if passphrase and recovery phrase are both lost.

### Recovery Phrase Screen

1. Show once during setup.
2. Require explicit download.
3. Require confirmation challenge:
   1. ask for word positions (example: word 4 and word 17).

### Unlock Screen

1. Primary: passphrase.
2. Secondary: recovery phrase.
3. Optional action: reset passphrase after recovery unlock.

### Cloud Status States

1. `locked`: backup queued but blocked.
2. `pending`: local changes waiting.
3. `uploading`: encrypting/uploading.
4. `error`: clear decrypt/encrypt error message.
5. `idle`: last encrypted backup timestamp.

## Backup and Restore Protocol v1

### Backup

1. Build plaintext snapshot in memory.
2. Generate `DEK_snapshot`.
3. Encrypt snapshot JSON with AES-GCM.
4. Wrap `DEK_snapshot` with `MK`.
5. For each asset:
   1. generate `DEK_asset`,
   2. encrypt asset blob,
   3. wrap `DEK_asset` with `MK`.
6. Upload encrypted objects.
7. Upsert manifest row with encryption metadata.
8. Mark local cloud backup metadata success.

### Restore

1. Fetch manifest row and encrypted snapshot.
2. Verify user unlocked (`MK` present in session cache).
3. Unwrap `DEK_snapshot` with `MK`.
4. Decrypt snapshot.
5. For each asset metadata:
   1. download encrypted asset,
   2. unwrap `DEK_asset`,
   3. decrypt asset blob.
6. Merge restored plaintext into local DB.
7. Never persist decrypted cloud files outside local DB write path.

## Migration Plan

### Existing Plaintext Cloud Backups

1. Detect legacy rows where:
   1. `encrypted = false`, or
   2. missing encryption metadata.
2. Keep restore compatibility for plaintext legacy backups temporarily.
3. On first unlock + next backup:
   1. create encrypted backup,
   2. verify decryptability locally,
   3. update manifest to encrypted.
4. After successful encrypted backup:
   1. remove legacy plaintext snapshot/asset objects.

### Rollback Safety

1. Do not delete legacy objects until encrypted backup verification passes.
2. Keep feature flag gate during rollout.

## Error Handling

### User-Facing Errors

1. Wrong passphrase.
2. Wrong recovery phrase.
3. Corrupted encrypted object (GCM auth failure).
4. Missing keyring row.
5. Legacy migration partially failed.

### Recovery Behavior

1. Decrypt/auth failure must abort restore transaction.
2. Keep existing local data unchanged on restore failure.
3. Mark cloud status error with actionable message.

## Test Plan

### Unit Tests

1. AES-GCM encrypt/decrypt roundtrip.
2. IV uniqueness behavior.
3. AES-KW wrap/unwrap roundtrip.
4. PBKDF2 deterministic derivation with known vectors.
5. Wrong KEK unwrap fails.
6. Recovery phrase generator and parser validation.
7. Manifest serialization/deserialization for encrypted fields.

### Integration Tests

1. Full setup -> backup -> restore on same device.
2. New-device restore with passphrase.
3. New-device restore with recovery phrase.
4. Passphrase rotation keeps data decryptable.
5. Locked state blocks upload and resumes after unlock.
6. Legacy plaintext migration to encrypted backups.

### Negative Tests

1. Tampered ciphertext.
2. Tampered AAD metadata.
3. Missing asset object.
4. Wrong key version reference.
5. Interrupted upload and retry.

### Manual QA Matrix

1. Firefox latest.
2. Chrome latest.
3. Small notes only.
4. Large notes + max image assets.
5. Multi-device account scenario.

## Rollout Plan

### Phase 0: Internal

1. Implement behind `encryptedCloudSyncV1` feature flag.
2. Validate migration and restore paths with seeded data.

### Phase 1: Opt-in

1. Enable for new installs only.
2. Keep existing users on legacy until they opt in.
3. Monitor restore failures and lock/unlock friction.

### Phase 2: Default On

1. New users default to encrypted cloud sync when enabling cloud backup.
2. Existing users prompted to migrate.

### Phase 3: Legacy Removal

1. Remove plaintext cloud backup write path.
2. Keep plaintext read path for limited compatibility window.
3. Announce sunset date for plaintext cloud restore.

## Documentation Updates

Update:

1. `README.md`
   1. encrypted cloud sync behavior,
   2. recovery phrase responsibilities,
   3. local plaintext note storage clarification.

2. `PRIVACY.md`
   1. exact statement of cloud E2EE model,
   2. metadata visibility limitations.

3. `STORE_SUBMISSION.md`
   1. reviewer notes about client-side encryption and recovery flow.

4. `supabase/cloud-backup-schema.sql`
   1. include new tables/columns/policies in canonical schema script.

## Acceptance Criteria

1. Cloud objects and snapshot payloads are always encrypted for new backups.
2. Decryption requires passphrase or recovery phrase on a new device.
3. No plaintext master key is persisted in cloud or local durable storage.
4. Existing users can migrate without data loss.
5. Restore success rate on encrypted backups matches current baseline.
6. User-facing recovery flow is understandable and test-confirmed.

## Open Decisions (Default Recommendations Included)

1. Recovery phrase format:
   1. Recommendation: 24-word list-based phrase.

2. KDF tuning:
   1. Recommendation: PBKDF2-SHA256, 600k baseline iterations.

3. Remember-unlock behavior:
   1. Recommendation: session-only unlock by default.

4. Passphrase reset policy:
   1. Recommendation: allow reset only with valid recovery phrase or unlocked session.

## Implementation Order (Execution Checklist)

1. Add SQL schema changes (`cloud_keyrings`, `cloud_backups` encrypted fields, policies).
2. Add crypto primitives module and tests.
3. Add keyring background service (setup/unlock/rotate).
4. Add UI flows for onboarding, unlock, recovery phrase export.
5. Switch cloud backup upload path to encrypted objects.
6. Switch cloud restore path to decrypt pipeline.
7. Add locked-state cloud status and queue behavior.
8. Implement legacy migration path.
9. Add docs updates.
10. Release behind feature flag and run phased rollout.

