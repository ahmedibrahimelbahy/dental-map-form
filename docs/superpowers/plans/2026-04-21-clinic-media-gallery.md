# Clinic Media Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new Step 7 to the clinic registration form for uploading up to 20 clinic photos (10 MB each) and 5 videos (100 MB each) via a single combined drop zone, routed to Cloudinary by MIME type and persisted to Airtable as two separate attachment fields.

**Architecture:** All UI lives in `index.html` (vanilla JS, no build step). Previews render locally via `URL.createObjectURL(file)` — uploads only fire on submit. Backend `api/submit.js` splits the incoming `clinicMedia` array into `Clinic Photos` / `Clinic Videos` Airtable attachment fields by `resource_type`.

**Tech Stack:** Vanilla HTML/CSS/JS, Cloudinary unsigned upload preset (`dental_map_unsigned`), Airtable REST API via Vercel serverless function. No test framework — verification is manual browser testing (the spec's test matrix).

**Spec:** `docs/superpowers/specs/2026-04-21-clinic-media-gallery-design.md`

---

## Preflight (manual, one-time)

- [ ] **Add Airtable fields.** In the Airtable base referenced by `AIRTABLE_BASE` / `AIRTABLE_TABLE`, add two new **Attachment** fields to the table:
  - `Clinic Photos`
  - `Clinic Videos`

  The backend expects these exact field names. Field creation is a manual step in the Airtable UI — no code change here. Confirm before running Task 7's smoke test.

---

## Task 1: Add Step 7 markup and move the Submit button

**Files:**
- Modify: `D:/Projects/Form/index.html` (around lines 665-721 — Step 6, and insert a new Step 7 before the Thank You block at line 723)

- [ ] **Step 1: Change the "Continue" button at the end of Step 6 so it advances to Step 7 (instead of calling submit), and remove the Submit button from Step 6.**

Find the `<div class="nav">` block at the bottom of Step 6 (around line 711–720). Replace it with:

```html
      <div class="nav">
        <button class="btn btn-back" onclick="go(5)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          <span data-i18n="btn-back">Back</span>
        </button>
        <button class="btn btn-next" onclick="go(7)">
          <span data-i18n="btn-continue">Continue</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
```

- [ ] **Step 2: Insert the new Step 7 block.**

Immediately after Step 6's closing `</div>` (the outermost `<div class="step" id="step-6">` — around line 721) and **before** the `<!-- ░░ THANK YOU ░░ -->` comment, insert:

```html
    <!-- ░░ STEP 7 — Clinic Media ░░ -->
    <div class="step" id="step-7">
      <div class="section-header">
        <div class="section-badge">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          <span data-i18n="badge-7">Step 7 of 7</span>
        </div>
        <h1 class="section-title" data-i18n="title-7">Clinic Media</h1>
        <p class="section-desc" data-i18n="desc-7">Upload photos and a video tour of your clinic. Optional but highly recommended — clinics with media get 3× more patient inquiries.</p>
      </div>
      <div class="card">
        <div class="field">
          <label><span data-i18n="label-media">Photos &amp; Videos</span> <span class="opt" data-i18n="optional">(optional)</span></label>
          <div class="upload-zone" id="mediaZone">
            <input type="file" id="mediaInput" accept="image/jpeg,image/png,image/webp,image/svg+xml,video/mp4,video/quicktime,video/webm" multiple onchange="handleMediaSelect(this)" />
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0891B2" stroke-width="1.5" style="margin: 0 auto 7px; display: block; opacity: 0.7;"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <div class="upload-text"><strong data-i18n="upload-media-click">Click to upload photos or videos</strong></div>
            <div class="upload-text" style="margin-top:2px;font-size:11.5px;" data-i18n="upload-media-sub">Images up to 10 MB · Videos up to 100 MB</div>
          </div>
          <div class="media-counter" id="mediaCounter" data-empty="true"></div>
          <div class="field-err-msg" id="mediaErr"></div>
          <div class="media-grid" id="mediaGrid"></div>
        </div>
      </div>
      <div class="nav">
        <button class="btn btn-back" onclick="go(6)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          <span data-i18n="btn-back">Back</span>
        </button>
        <button class="btn btn-submit" onclick="submitForm()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z"/></svg>
          <span data-i18n="btn-submit">Submit Clinic</span>
        </button>
      </div>
    </div>
```

- [ ] **Step 3: Visual verification.**

Start the dev server and open the page:

```bash
cd "D:/Projects/Form" && node serve.mjs
```

In a browser, navigate through the form to Step 6, click Continue, and confirm you now land on a Step 7 with "Clinic Media" title and the upload zone. The Submit button should no longer appear on Step 6. The grid, counter, and any JS wiring won't work yet — that's expected.

- [ ] **Step 4: Commit.**

```bash
git -C "D:/Projects/Form" add index.html
git -C "D:/Projects/Form" commit -m "feat: scaffold step 7 clinic media markup"
```

---

## Task 2: Add CSS for gallery grid, video overlay, counter, and remove button

**Files:**
- Modify: `D:/Projects/Form/index.html` (CSS in `<style>` block, add after the existing `.upload-zone` rules around line 242)

- [ ] **Step 1: Insert gallery styles.**

Find the line `.upload-text strong { color: var(--primary); }` (around line 242). Add the following block immediately after it:

```css
    /* ── Media Gallery (Step 7) ──────────────────────── */
    .media-counter {
      font-size: 12.5px; color: var(--muted); margin-top: 8px;
      font-weight: 500;
    }
    .media-counter[data-empty="true"] { display: none; }
    .media-counter.err { color: var(--error); font-weight: 600; }

    .media-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 10px;
      margin-top: 14px;
    }
    .media-grid:empty { margin-top: 0; }

    .media-item {
      position: relative;
      aspect-ratio: 1 / 1;
      border-radius: 8px;
      overflow: hidden;
      border: 1.5px solid var(--primary-light);
      background: #000;
    }
    .media-item img, .media-item video {
      width: 100%; height: 100%;
      object-fit: cover;
      display: block;
    }
    .media-item .play-overlay {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.25);
      pointer-events: none;
    }
    .media-item .play-overlay svg {
      width: 34px; height: 34px; color: white;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
    }
    .media-item .duration-badge {
      position: absolute; bottom: 6px; right: 6px;
      background: rgba(0,0,0,0.75); color: white;
      font-size: 10.5px; font-weight: 600;
      padding: 2px 6px; border-radius: 4px;
      pointer-events: none;
      font-variant-numeric: tabular-nums;
    }
    .media-item .remove-btn {
      position: absolute; top: 5px; right: 5px;
      width: 22px; height: 22px; border-radius: 50%;
      background: rgba(0,0,0,0.7); border: none;
      color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.15s;
      padding: 0;
    }
    .media-item:hover .remove-btn,
    .media-item:focus-within .remove-btn { opacity: 1; }
    .media-item .remove-btn:hover { background: var(--error); }

    .submit-progress {
      font-size: 12.5px; color: var(--muted);
      margin-top: 8px; text-align: center;
      font-weight: 500;
    }
```

- [ ] **Step 2: Visual verification.**

Reload the page in the browser. Step 7 should still show correctly — no visible change yet because the grid is empty.

- [ ] **Step 3: Commit.**

```bash
git -C "D:/Projects/Form" add index.html
git -C "D:/Projects/Form" commit -m "feat: add clinic media gallery styles"
```

---

## Task 3: Update step-count constant and add all i18n strings

**Files:**
- Modify: `D:/Projects/Form/index.html`
  - `const TOTAL = 6;` (line 859) → `7`
  - Existing `badge-1` through `badge-6` strings for EN (lines 742–743) and AR (lines 800–801)
  - Add new `badge-7`, `title-7`, `desc-7`, `label-media`, `upload-media-click`, `upload-media-sub`, and error strings

- [ ] **Step 1: Bump TOTAL.**

Find `const TOTAL = 6;` (around line 859). Replace with:

```js
    const TOTAL = 7;
```

- [ ] **Step 2: Update all existing EN step badges to "of 7".**

Find the line starting with `'badge-1': 'Step 1 of 6',` (around line 742). Replace the entire two-line block:

```js
        'badge-1': 'Step 1 of 6', 'badge-2': 'Step 2 of 6', 'badge-3': 'Step 3 of 6',
        'badge-4': 'Step 4 of 6', 'badge-5': 'Step 5 of 6', 'badge-6': 'Step 6 of 6',
```

with:

```js
        'badge-1': 'Step 1 of 7', 'badge-2': 'Step 2 of 7', 'badge-3': 'Step 3 of 7',
        'badge-4': 'Step 4 of 7', 'badge-5': 'Step 5 of 7', 'badge-6': 'Step 6 of 7',
        'badge-7': 'Step 7 of 7',
```

- [ ] **Step 3: Add new EN strings for Step 7.**

Find the EN `'title-6': 'Contact Numbers',          'desc-6': ...` line (around line 749). Add a new line directly after it:

```js
        'title-7': 'Clinic Media',             'desc-7': 'Upload photos and a video tour of your clinic. Optional but highly recommended — clinics with media get 3× more patient inquiries.',
```

Find the EN `'label-logo': 'Clinic Logo',` line (around line 751). Add these lines directly after it:

```js
        'label-media': 'Photos & Videos',
        'upload-media-click': 'Click to upload photos or videos',
        'upload-media-sub': 'Images up to 10 MB · Videos up to 100 MB',
        'media-counter': (p, v) => `${p} photo${p === 1 ? '' : 's'} · ${v} video${v === 1 ? '' : 's'}`,
        'err-too-many-photos': 'You can upload up to 20 photos.',
        'err-too-many-videos': 'You can upload up to 5 videos.',
        'err-photo-too-large': 'Photos must be 10 MB or smaller.',
        'err-video-too-large': 'Videos must be 100 MB or smaller.',
        'err-wrong-type': 'Unsupported file type.',
        'submit-progress': (done, total) => `Uploading ${done} / ${total}…`,
```

- [ ] **Step 4: Update all existing AR step badges to "of 7".**

Find the line starting with `'badge-1': 'الخطوة ١ من ٦',` (around line 800). Replace the two-line block:

```js
        'badge-1': 'الخطوة ١ من ٦', 'badge-2': 'الخطوة ٢ من ٦', 'badge-3': 'الخطوة ٣ من ٦',
        'badge-4': 'الخطوة ٤ من ٦', 'badge-5': 'الخطوة ٥ من ٦', 'badge-6': 'الخطوة ٦ من ٦',
```

with:

```js
        'badge-1': 'الخطوة ١ من ٧', 'badge-2': 'الخطوة ٢ من ٧', 'badge-3': 'الخطوة ٣ من ٧',
        'badge-4': 'الخطوة ٤ من ٧', 'badge-5': 'الخطوة ٥ من ٧', 'badge-6': 'الخطوة ٦ من ٧',
        'badge-7': 'الخطوة ٧ من ٧',
```

- [ ] **Step 5: Add new AR strings for Step 7.**

Find the AR `'title-6': 'أرقام التواصل', ...` line (around line 807). Add directly after it:

```js
        'title-7': 'معرض العيادة',             'desc-7': 'ارفع صور وفيديو جولة لعيادتك. اختياري ولكن موصى به بشدة — العيادات التي تعرض صورًا تحصل على ٣ أضعاف استفسارات المرضى.',
```

Find the AR `'label-logo': 'شعار العيادة',` line (around line 809). Add directly after it:

```js
        'label-media': 'الصور والفيديوهات',
        'upload-media-click': 'انقر لرفع الصور أو الفيديوهات',
        'upload-media-sub': 'الصور حتى ١٠ ميجا · الفيديوهات حتى ١٠٠ ميجا',
        'media-counter': (p, v) => `${p} صورة · ${v} فيديو`,
        'err-too-many-photos': 'يمكنك رفع حتى ٢٠ صورة.',
        'err-too-many-videos': 'يمكنك رفع حتى ٥ فيديوهات.',
        'err-photo-too-large': 'يجب ألا يتجاوز حجم الصورة ١٠ ميجا.',
        'err-video-too-large': 'يجب ألا يتجاوز حجم الفيديو ١٠٠ ميجا.',
        'err-wrong-type': 'نوع الملف غير مدعوم.',
        'submit-progress': (done, total) => `جاري الرفع ${done} / ${total}…`,
```

- [ ] **Step 6: Visual verification.**

Reload the page. In EN mode, every step badge should read "Step X of 7". Switch to AR — badges should read "الخطوة X من ٧". On Step 7, the title should read "Clinic Media" / "معرض العيادة" and the upload zone text should render correctly in both languages.

- [ ] **Step 7: Commit.**

```bash
git -C "D:/Projects/Form" add index.html
git -C "D:/Projects/Form" commit -m "feat: bump step count to 7 and add media gallery i18n"
```

---

## Task 4: Generalize `uploadPhoto` into `uploadMedia` (route by MIME type)

**Files:**
- Modify: `D:/Projects/Form/index.html` (around lines 1111–1122)

- [ ] **Step 1: Add a new `uploadMedia` function alongside the existing `uploadPhoto`.**

Find the `uploadPhoto` function (around line 1112). Leave it in place (still used by logo + team member uploads). Add this new function immediately below the closing `}` of `uploadPhoto`:

```js
    /* ── Upload any media (image or video) to Cloudinary ─ */
    async function uploadMedia(file) {
      const isVideo = file.type.startsWith('video/');
      const resourceType = isVideo ? 'video' : 'image';
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_PRESET);
      fd.append('folder', isVideo ? 'dental-map/clinic-videos' : 'dental-map/clinic-photos');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${resourceType}/upload`, {
        method: 'POST', body: fd
      });
      if (!res.ok) throw new Error('Cloudinary upload failed: ' + res.status);
      const data = await res.json();
      return { url: data.secure_url, resource_type: resourceType };
    }
```

- [ ] **Step 2: Verify syntax.**

Reload the page in the browser. Open DevTools Console — there should be no JavaScript errors on load. `uploadMedia` won't be called yet; Task 6 wires it in.

- [ ] **Step 3: Commit.**

```bash
git -C "D:/Projects/Form" add index.html
git -C "D:/Projects/Form" commit -m "feat: add uploadMedia helper routing by MIME type"
```

---

## Task 5: Implement media gallery state, file picker, validation, and preview grid

**Files:**
- Modify: `D:/Projects/Form/index.html` (add a new block of JS above `/* ── Collect team members ─── */` around line 1124)

- [ ] **Step 1: Add gallery state and handler functions.**

Find the comment `/* ── Collect team members ─────────────────────────── */` (around line 1124). Insert the following block **immediately before** it:

```js
    /* ── Media Gallery (Step 7) ──────────────────────── */
    const MEDIA_LIMITS = {
      photoMax: 20, videoMax: 5,
      photoSize: 10 * 1024 * 1024,   // 10 MB
      videoSize: 100 * 1024 * 1024,  // 100 MB
      imageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
      videoTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
    };

    // Each entry: { id, file, kind: 'image'|'video', previewUrl }
    let mediaItems = [];
    let mediaIdSeq = 0;

    function formatDuration(seconds) {
      if (!isFinite(seconds) || seconds < 0) return '';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function showMediaError(key) {
      const el = document.getElementById('mediaErr');
      el.textContent = t(key);
      el.classList.add('show');
    }

    function clearMediaError() {
      const el = document.getElementById('mediaErr');
      el.textContent = '';
      el.classList.remove('show');
    }

    function updateMediaCounter() {
      const counter = document.getElementById('mediaCounter');
      const photos = mediaItems.filter(m => m.kind === 'image').length;
      const videos = mediaItems.filter(m => m.kind === 'video').length;
      if (photos === 0 && videos === 0) {
        counter.dataset.empty = 'true';
        counter.textContent = '';
      } else {
        counter.dataset.empty = 'false';
        counter.textContent = t('media-counter', photos, videos);
      }
      counter.classList.toggle('err',
        photos > MEDIA_LIMITS.photoMax || videos > MEDIA_LIMITS.videoMax);
    }

    function renderMediaItem(item) {
      const grid = document.getElementById('mediaGrid');
      const wrap = document.createElement('div');
      wrap.className = 'media-item';
      wrap.dataset.id = item.id;

      if (item.kind === 'image') {
        wrap.innerHTML = `
          <img src="${item.previewUrl}" alt="" />
          <button type="button" class="remove-btn" onclick="removeMediaItem(${item.id})" aria-label="Remove">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        `;
      } else {
        wrap.innerHTML = `
          <video src="${item.previewUrl}" preload="metadata" muted playsinline></video>
          <div class="play-overlay">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <span class="duration-badge" id="dur-${item.id}"></span>
          <button type="button" class="remove-btn" onclick="removeMediaItem(${item.id})" aria-label="Remove">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        `;
        const videoEl = wrap.querySelector('video');
        videoEl.addEventListener('loadedmetadata', () => {
          const badge = document.getElementById('dur-' + item.id);
          if (badge) badge.textContent = formatDuration(videoEl.duration);
        });
      }

      grid.appendChild(wrap);
    }

    function handleMediaSelect(input) {
      clearMediaError();
      const files = Array.from(input.files || []);
      input.value = ''; // allow re-selecting the same file after removal

      let currentPhotos = mediaItems.filter(m => m.kind === 'image').length;
      let currentVideos = mediaItems.filter(m => m.kind === 'video').length;

      for (const file of files) {
        const isImage = MEDIA_LIMITS.imageTypes.includes(file.type);
        const isVideo = MEDIA_LIMITS.videoTypes.includes(file.type);
        if (!isImage && !isVideo) { showMediaError('err-wrong-type'); continue; }

        if (isImage) {
          if (file.size > MEDIA_LIMITS.photoSize) { showMediaError('err-photo-too-large'); continue; }
          if (currentPhotos >= MEDIA_LIMITS.photoMax) { showMediaError('err-too-many-photos'); continue; }
          currentPhotos++;
        } else {
          if (file.size > MEDIA_LIMITS.videoSize) { showMediaError('err-video-too-large'); continue; }
          if (currentVideos >= MEDIA_LIMITS.videoMax) { showMediaError('err-too-many-videos'); continue; }
          currentVideos++;
        }

        const item = {
          id: ++mediaIdSeq,
          file,
          kind: isImage ? 'image' : 'video',
          previewUrl: URL.createObjectURL(file),
        };
        mediaItems.push(item);
        renderMediaItem(item);
      }

      updateMediaCounter();
    }

    function removeMediaItem(id) {
      const idx = mediaItems.findIndex(m => m.id === id);
      if (idx === -1) return;
      URL.revokeObjectURL(mediaItems[idx].previewUrl);
      mediaItems.splice(idx, 1);
      const node = document.querySelector(`.media-item[data-id="${id}"]`);
      if (node) node.remove();
      clearMediaError();
      updateMediaCounter();
    }
```

- [ ] **Step 2: Make `.field-err-msg` visible when text is present.**

The existing `.field-err-msg.show` class handles display. `showMediaError` already adds `show`. Verify this rule exists by searching the CSS — it's around line 182. No change needed; documenting that the existing rule is reused.

- [ ] **Step 3: Manual smoke — add and remove photos.**

Start the dev server (skip if already running). Navigate to Step 7. Click the upload zone and select 3 images. Confirm:
- 3 thumbnails appear in the grid
- Counter reads "3 photos · 0 videos"
- Hovering a thumbnail shows a remove (×) button
- Clicking × removes the thumbnail and the counter updates

Then try selecting a 4th image via the same zone — it should append to the existing 3, not replace them.

- [ ] **Step 4: Manual smoke — add a video.**

Select an `.mp4` file. Confirm:
- Thumbnail shows a video frame with a play-icon overlay
- A duration badge appears in the bottom-right (e.g., "0:12") after the metadata loads
- Counter reads something like "3 photos · 1 video"

- [ ] **Step 5: Manual smoke — validation.**

Try each of the following. Each should surface the appropriate inline error under the drop zone **and not add the offending file**, while keeping any already-valid files in the grid:
- A file with extension `.gif` → "Unsupported file type."
- An image > 10 MB → "Photos must be 10 MB or smaller."
- A video > 100 MB → "Videos must be 100 MB or smaller."
- After adding 20 images, try one more → "You can upload up to 20 photos."
- After adding 5 videos, try one more → "You can upload up to 5 videos."

- [ ] **Step 6: Commit.**

```bash
git -C "D:/Projects/Form" add index.html
git -C "D:/Projects/Form" commit -m "feat: implement clinic media picker with validation and previews"
```

---

## Task 6: Upload clinic media on submit with progress indicator

**Files:**
- Modify: `D:/Projects/Form/index.html`, `submitForm()` around lines 1161–1242

- [ ] **Step 1: Add a progress-indicator element inside the submit button area.**

In Task 1 we kept the existing button structure. We'll inject a small status node under the nav on submit. Find the Step 7 `<div class="nav">` block (added in Task 1). It already contains the submit button. No HTML change here — we'll create the progress element dynamically in JS.

- [ ] **Step 2: Refactor `submitForm()` to upload `mediaItems` and include the results in the payload.**

Find the `submitForm` function (around line 1161). Locate the section labeled `// Upload photos & collect team data` (around line 1181). Immediately **after** the `const teamPhotos = ...` block (which ends around line 1193) and **before** the `const services = ...` line, insert the clinic-media upload logic. The updated `submitForm` should look like this in its entirety — replace the whole function:

```js
    /* ── Submit ───────────────────────────────────────── */
    async function submitForm() {
      if (!validate(6)) return;

      // Disable submit button & show loading state
      const submitBtn = document.querySelector('.btn-submit');
      const origHTML  = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 0.8s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> <span data-i18n="submitting">Sending…</span>`;

      // Create / reuse a progress indicator below the nav on Step 7
      const step7Nav = document.querySelector('#step-7 .nav');
      let progressEl = document.getElementById('submitProgress');
      if (!progressEl && step7Nav) {
        progressEl = document.createElement('div');
        progressEl.id = 'submitProgress';
        progressEl.className = 'submit-progress';
        step7Nav.insertAdjacentElement('afterend', progressEl);
      }
      const totalUploads =
        (document.getElementById('clinicLogo')?.files[0] ? 1 : 0) +
        document.querySelectorAll('.member-card input[type="file"]').length +
        mediaItems.length;
      let uploadsDone = 0;
      const tickProgress = () => {
        uploadsDone++;
        if (progressEl) progressEl.textContent = t('submit-progress', uploadsDone, totalUploads);
      };

      try {
        // Upload clinic logo
        let clinicLogoAttachment = null;
        const logoFile = document.getElementById('clinicLogo')?.files[0];
        if (logoFile) {
          try {
            const logoUrl = await uploadPhoto(logoFile);
            clinicLogoAttachment = [{ url: logoUrl, filename: logoFile.name }];
          } catch(e) {}
          tickProgress();
        }

        // Upload photos & collect team data
        const teamMembers = await collectTeamMembers(tickProgress);
        const teamText = teamMembers.map(m =>
          `• ${m.name}${m.role ? ' — ' + m.role : ''}${m.bio ? '\n  ' + m.bio : ''}`
        ).join('\n\n');

        // Build photo attachments array for Airtable
        const teamPhotos = teamMembers
          .filter(m => m.photo)
          .map(m => ({
            url: m.photo,
            filename: `${m.name || 'member'}.jpg`
          }));

        // Upload clinic media (photos + videos)
        const clinicMedia = [];
        for (const item of mediaItems) {
          try {
            const uploaded = await uploadMedia(item.file);
            clinicMedia.push({
              url: uploaded.url,
              filename: item.file.name,
              resource_type: uploaded.resource_type,
            });
          } catch(e) {
            console.error('Media upload failed:', item.file.name, e);
          }
          tickProgress();
        }

        const services = [...document.querySelectorAll('.svc-cb:checked')].map(cb => cb.value).join(', ');
        const otherSvc = document.getElementById('otherServiceText')?.value.trim();

        const record = {
          'Clinic Name':         document.getElementById('clinicName').value.trim(),
          'About the Clinic':    document.getElementById('clinicAbout').value.trim(),
          'Services':            services + (otherSvc ? `, ${otherSvc}` : ''),
          'Location - Address':  document.getElementById('addressLine').value.trim(),
          'Location - District': document.getElementById('district').value,
          'Location - Landmark': document.getElementById('landmark').value.trim(),
          'Google Maps Link':    document.getElementById('mapsLink').value.trim(),
          'Team Members':        teamText,
          'Pricing':             collectPricing(),
          'Phone (Calls)':       document.getElementById('phoneCall').value.trim(),
          'Phone (WhatsApp)':    document.getElementById('phoneWp').value.trim(),
          'Language':            lang === 'ar' ? 'Arabic' : 'English',
          'Submitted At':        new Date().toISOString(),
          teamPhotos:            teamPhotos,
          clinicLogo:            clinicLogoAttachment,
          clinicMedia:           clinicMedia,
        };

        // Remove empty fields
        Object.keys(record).forEach(k => { if (!record[k] || (Array.isArray(record[k]) && record[k].length === 0)) delete record[k]; });

        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });

        if (!res.ok) throw new Error('Submit error: ' + res.status);

        // Success
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        document.getElementById('thankyou').classList.add('active');
        document.getElementById('progressFill').style.width = '100%';
        document.getElementById('stepCounter').textContent = t('submitted');
        window.scrollTo({ top: 0, behavior: 'smooth' });

      } catch(err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origHTML;
        if (progressEl) progressEl.textContent = '';
        alert(lang === 'ar'
          ? 'حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.'
          : 'Something went wrong. Please try again.');
        console.error(err);
      }
    }
```

- [ ] **Step 3: Update `collectTeamMembers` to accept an optional progress callback.**

Find `collectTeamMembers` (around line 1125). Replace it with:

```js
    /* ── Collect team members ─────────────────────────── */
    async function collectTeamMembers(onUpload) {
      const cards = document.querySelectorAll('.member-card');
      const members = [];
      for (const card of cards) {
        const id = card.id.replace('member-', '');
        const name = card.querySelector(`[name="memberName_${id}"]`)?.value.trim() || '';
        const role = card.querySelector(`[name="memberRole_${id}"]`)?.value.trim() || '';
        const bio  = card.querySelector(`[name="memberBio_${id}"]`)?.value.trim() || '';
        const fileInput = card.querySelector('input[type="file"]');
        let photoUrl = '';
        if (fileInput?.files[0]) {
          try { photoUrl = await uploadPhoto(fileInput.files[0]); } catch(e) {}
          if (onUpload) onUpload();
        }
        if (name) members.push({ name, role, bio, photo: photoUrl });
      }
      return members;
    }
```

- [ ] **Step 4: Manual smoke — end-to-end submit.**

Fill out the form end-to-end. On Step 7, add 2 images and 1 video. Click Submit. Confirm:
- Submit button shows a spinner
- Progress text appears below the nav: "Uploading 1 / 3…", "Uploading 2 / 3…", "Uploading 3 / 3…"
- Thank-you screen appears on success
- In Airtable, the new record has `Clinic Photos` populated with 2 attachments and `Clinic Videos` with 1 attachment. If the fields are empty, proceed — the next task implements the backend split. (Before that change, `clinicMedia` is sent raw and Airtable will reject unknown fields.)

**Note:** If the backend hasn't been updated yet, Airtable may return a 422 error. That's expected — Task 7 fixes it. For now, verify the payload in the browser Network tab: the request body should contain a `clinicMedia` array.

- [ ] **Step 5: Commit.**

```bash
git -C "D:/Projects/Form" add index.html
git -C "D:/Projects/Form" commit -m "feat: upload clinic media on submit with progress"
```

---

## Task 7: Split `clinicMedia` into two Airtable attachment fields in the backend

**Files:**
- Modify: `D:/Projects/Form/api/submit.js` (entire file — add a block mirroring the existing `teamPhotos`/`clinicLogo` handling)

- [ ] **Step 1: Replace the file with the updated version.**

Replace the contents of `D:/Projects/Form/api/submit.js` with:

```js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE  = process.env.AIRTABLE_BASE;
  const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE || !AIRTABLE_TABLE) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const body = req.body;

    // Extract photo URLs from team members and format as Airtable attachments
    // The form sends teamPhotos as an array of { url, filename } objects
    const fields = { ...body };

    if (Array.isArray(body.teamPhotos) && body.teamPhotos.length > 0) {
      fields['Team Photos'] = body.teamPhotos.map(p => ({
        url: p.url,
        filename: p.filename || 'photo.jpg',
      }));
    }
    delete fields.teamPhotos;

    if (Array.isArray(body.clinicLogo) && body.clinicLogo.length > 0) {
      fields['Clinic Logo'] = body.clinicLogo.map(p => ({
        url: p.url,
        filename: p.filename || 'logo.jpg',
      }));
    }
    delete fields.clinicLogo;

    // Split clinicMedia by resource_type into two attachment fields
    if (Array.isArray(body.clinicMedia) && body.clinicMedia.length > 0) {
      const photos = body.clinicMedia
        .filter(m => m.resource_type === 'image')
        .map(m => ({ url: m.url, filename: m.filename || 'photo.jpg' }));
      const videos = body.clinicMedia
        .filter(m => m.resource_type === 'video')
        .map(m => ({ url: m.url, filename: m.filename || 'video.mp4' }));
      if (photos.length) fields['Clinic Photos'] = photos;
      if (videos.length) fields['Clinic Videos'] = videos;
    }
    delete fields.clinicMedia;

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    const data = await airtableRes.json();

    if (!airtableRes.ok) {
      return res.status(airtableRes.status).json({ error: data });
    }

    return res.status(200).json({ id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
```

- [ ] **Step 2: End-to-end smoke — final.**

Make sure the preflight Airtable fields (`Clinic Photos`, `Clinic Videos`) were created. Then deploy or run the full submit flow against the live Vercel function (this backend is only exercised when `/api/submit` is actually hit — local `node serve.mjs` won't run serverless functions).

Submit a full form with 2 images and 1 video on Step 7. Confirm in Airtable:
- A new record exists
- `Clinic Photos` field has 2 attachments (thumbnails render)
- `Clinic Videos` field has 1 attachment (video plays)
- No `clinicMedia` raw field leaked through

- [ ] **Step 3: Commit.**

```bash
git -C "D:/Projects/Form" add api/submit.js
git -C "D:/Projects/Form" commit -m "feat: split clinic media into separate Airtable attachment fields"
```

---

## Task 8: Full test-matrix pass

**Files:** none — verification only.

- [ ] **Step 1: Run each scenario from the spec's testing section. Keep a checklist; all must pass before considering the feature shipped.**

1. Submit with zero media → succeeds; Airtable record has empty `Clinic Photos` and `Clinic Videos` fields.
2. Submit with 20 images + 5 videos at max size → all appear correctly in the two Airtable fields.
3. Try to add a 21st image → blocked with "You can upload up to 20 photos."
4. Try to add a 6th video → blocked with "You can upload up to 5 videos."
5. Try an 11 MB image → blocked with "Photos must be 10 MB or smaller."
6. Try a 101 MB video → blocked with "Videos must be 100 MB or smaller."
7. Try a `.gif` or `.avi` → blocked with "Unsupported file type."
8. Remove an asset after adding → counter updates; removed asset is excluded from submission (verify in Airtable).
9. Submit flow works in both EN and AR (switch language before submitting; strings render correctly on Step 7 and in error messages).
10. Throttle network in DevTools to "Slow 3G", add 2 photos + 1 small video, submit. The progress indicator below the nav should count up during the upload.

- [ ] **Step 2: If any scenario fails, file it as a follow-up and fix before shipping.**

- [ ] **Step 3: No commit needed for verification-only task.**

---

## Rollback

If the feature needs to be rolled back, every task is a single focused commit. Revert commits in reverse order (Task 7 → Task 6 → … → Task 1) and the Airtable schema fields can be left in place harmlessly.
