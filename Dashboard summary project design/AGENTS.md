<!-- vvv:start -->
## vvv

skill 1.9.0 · injected 2026-09-22

The `/vvv` skill writes this section. Edits between the markers are replaced on the next submit; keep
anything of your own outside them. `vvv.json` is the `/vvv` skill's file: do not edit it, and take this
application's shape from the environment in this section rather than from it.

### Environment

Every revision gets `VVV_ENVIRONMENT_NAME` and `VVV_IS_PRODUCTION`; `VVV_BUCKET_NAME`,
`VVV_DATABASE_URL` and `VVV_FIRESTORE_DATABASE_ID` appear when this application has that resource. Values
differ per environment — read them at startup, never hardcode one. There is no project id and no credential
file: authenticate as the revision's own service account with Application Default Credentials.

Listen on `$PORT` and answer `GET /health` with 200 within about a minute of starting, or the revision
never goes live. Your Application may run several copies at once. Keep state in Firestore, Cloud SQL or
Cloud Storage, never in the container's memory or filesystem.

### Files

There is no durable local disk. Anything this application would have written to the filesystem — uploads,
generated files, exports — goes in its Cloud Storage bucket, named by `VVV_BUCKET_NAME`.

- **Keys may contain `/` and behave like folders**, so an existing path layout usually transfers unchanged.
- **A write replaces a key with no version history, and two concurrent writes can lose one.** Anything
  read-modify-write needs a generation precondition (`ifGenerationMatch`).
- **Stream an upload into an object.** Do not buffer the file in memory and do not land it on `/tmp` first.
- **Keep the original extension on the object key, and set Content-Type on write.** Sanitise the stem if
  you must; do not store a bare UUID. The uploader's type may be absent or wrong — determine it from the
  object name or bytes. Indexers that dispatch on `.pdf` will refuse a key with no suffix.
- **The UI lists the same row the upload just wrote.** Insert it as `pending` and return. Each later poll
  indexes the next bounded batch of that object through the Storage SDK and updates the row. A container
  gets no CPU between requests, so work started after the response does not finish. An in-memory list, a
  local folder, or a collection written only after the index succeeds stays empty while the object sits
  in the bucket. vvv does not run a worker job.
- **Stream a download the same way.** `download_as_bytes` and `download_to_filename` are the memory and
  `/tmp` mistakes again.
- **Do not mount the bucket.** vvv injects a name; it does not attach a volume. Use the Storage SDK.

### Version

Keep `VERSION` at the repository root current: one line, strict SemVer, no leading `v`.
If this project has its own version, copy it here. vvv reads this file to label the release.
<!-- vvv:end -->
