# Clinic Media Gallery — Design

**Date:** 2026-04-21
**Status:** Approved, ready for implementation plan

## Summary

Add a new Step 7 to the clinic registration form for uploading clinic photos and videos (a combined "Clinic Media" gallery). Uploads route through the existing Cloudinary unsigned preset and are persisted to Airtable, split into two attachment fields for downstream querying.

## Goals

- Let clinics showcase their space (interior, equipment, team in action) and provide a video tour.
- Keep the form fast: zero mandatory fields in this step, clear progress feedback during uploads.
- Preserve the existing form's upload pipeline and i18n patterns — no new dependencies.
- Store photos and videos as separate Airtable fields so downstream consumers can filter by media type.

## Non-goals

- Reordering media (drag-to-reorder) — not needed for v1.
- Cropping, filters, or client-side editing.
- Chunked/resumable uploads — Cloudinary direct upload is sufficient at 100 MB.
- Per-asset captions or alt text.

## UX

### Step placement
- New Step 7, inserted after Step 6 (Contact Numbers).
- Every existing step badge updates from "Step X of 6" → "Step X of 7" (EN) and matching AR.
- Submit CTA lives on Step 7.

### Copy (EN)
- **Badge:** "Step 7 of 7"
- **Title:** "Clinic Media"
- **Description:** "Upload photos and a video tour of your clinic. Optional but highly recommended — clinics with media get 3× more patient inquiries."
- **Upload CTA:** "Click to upload photos or videos"
- **Sub-text:** "Images up to 10 MB · Videos up to 100 MB"
- **Counter:** "{N} photos · {M} videos"

### Copy (AR)
- **Badge:** "الخطوة ٧ من ٧"
- **Title:** "معرض العيادة"
- **Description:** "ارفع صور وفيديو جولة لعيادتك. اختياري ولكن موصى به بشدة — العيادات التي تعرض صورًا تحصل على ٣ أضعاف استفسارات المرضى."
- **Upload CTA:** "انقر لرفع الصور أو الفيديوهات"
- **Sub-text:** "الصور حتى ١٠ ميجا · الفيديوهات حتى ١٠٠ ميجا"
- **Counter:** "{N} صورة · {M} فيديو"

### Interaction
- Single drop zone spans the card width. Click to open a file picker (multiple selection enabled) — matches existing form pattern, no drag-and-drop in v1.
- As users add files, a responsive thumbnail grid appears below the drop zone.
- Each thumbnail is rendered locally from the `File` object via `URL.createObjectURL()` — no network call until submit:
  - **Image:** `<img>` with object-fit cover
  - **Video:** `<video preload="metadata">` tag (first frame shows automatically), with a centered play-icon overlay and a duration badge. Duration is read from the `<video>` element's `duration` property after its `loadedmetadata` event fires.
  - Small × button visible on hover to remove the asset (also revokes the object URL to avoid leaks).
- Live counter below the grid shows current photo/video count; turns red and shows an inline error if limits are exceeded.
- All fields optional. The Submit button works with zero media attached.

## Limits & validation

Client-side validation before any upload fires:

| Type | Max count | Max size/file | Accepted MIME types |
|------|-----------|---------------|---------------------|
| Images | 20 | 10 MB | `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml` |
| Videos | 5 | 100 MB | `video/mp4`, `video/quicktime`, `video/webm` |

Rejections surface as inline error text under the drop zone (matches existing form error style). Already-selected valid files are kept.

## Upload pipeline

- Extend the existing `uploadPhoto(file)` into a generalized `uploadMedia(file)`.
- Route to Cloudinary based on MIME type:
  - `image/*` → `https://api.cloudinary.com/v1_1/{CLOUD}/image/upload`
  - `video/*` → `https://api.cloudinary.com/v1_1/{CLOUD}/video/upload`
- Same unsigned preset (`dental_map_unsigned`) for both.
- Uploads fire on form submit (matches current `teamPhotos` / `clinicLogo` pattern). Thumbnails during editing use local `URL.createObjectURL()` previews — no Cloudinary round-trip until submit.
- Submit button shows a progress indicator: "Uploading {done} / {total}…" so users get feedback during a potentially minute-plus video upload.
- After upload, store Cloudinary's returned `secure_url` and the original filename in the submission payload. `resource_type` is inferred from the original MIME type (already known client-side before upload).

## Data flow

### Client → `/api/submit` payload
Add one new top-level field:

```js
clinicMedia: [
  { url: "https://res.cloudinary.com/.../clinic_a.jpg", filename: "clinic_a.jpg", resource_type: "image" },
  { url: "https://res.cloudinary.com/.../tour.mp4",      filename: "tour.mp4",     resource_type: "video" },
  // ...
]
```

### `/api/submit` → Airtable
Mirror the existing `teamPhotos` / `clinicLogo` pattern. Split `clinicMedia` by `resource_type` into two Airtable attachment fields:

- `Clinic Photos` — array of `{ url, filename }` where `resource_type === "image"`
- `Clinic Videos` — array of `{ url, filename }` where `resource_type === "video"`

Delete `clinicMedia` from the outgoing fields object before POSTing to Airtable.

### Airtable schema change (manual, documented in plan)
Two new attachment fields must be added to the Airtable table:
- `Clinic Photos` (Attachment)
- `Clinic Videos` (Attachment)

This is a one-time base configuration step and will be called out in the implementation plan's preflight.

## Files touched

- **`index.html`**
  - New Step 7 markup (badge, title, description, drop zone, thumbnail grid, nav)
  - Update step count in every existing step badge ("of 6" → "of 7")
  - Move Submit button from Step 6 to Step 7
  - JS: `uploadMedia()` generalization, drop-zone handlers, thumbnail-grid renderer, client-side validation, submit-progress indicator, collect `clinicMedia` into the payload
  - i18n strings (EN + AR) for all new copy
  - CSS: thumbnail grid, video play-icon overlay, duration badge, remove button — reuse existing `.upload-zone` tokens where possible

- **`api/submit.js`**
  - Split incoming `clinicMedia` into `Clinic Photos` and `Clinic Videos` attachment fields by `resource_type`
  - Delete the `clinicMedia` key before sending to Airtable

## Error handling

- **Client validation fails (wrong type / oversize / over count):** inline error under drop zone, offending files skipped, valid selections preserved.
- **Cloudinary upload fails for one asset:** surface which file failed, let the user retry or remove it; don't block other uploads.
- **All uploads succeed but Airtable POST fails:** existing submit-error handling applies (no change).

## Testing

Manual test matrix:
- Submit with zero media → succeeds, Airtable record has empty media fields.
- Submit with 20 images + 5 videos at max size → all appear in the correct Airtable fields.
- Try to add a 21st image or 6th video → blocked with clear error.
- Try an 11 MB image or 101 MB video → blocked with clear error.
- Try a `.gif` or `.avi` → blocked (not in accepted MIME list).
- Remove an asset after adding → counter updates, asset excluded from submission.
- Submit flow works in both EN and AR.
- Submit progress indicator visible during a slow video upload (throttle network in DevTools).

## Open questions

None — all resolved during brainstorming.
