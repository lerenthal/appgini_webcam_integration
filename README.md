
# AppGini Webcam Integration Guide

## Overview
This document explains the integration of webcam capture functionality into an AppGini-generated application, specifically for the `clone_pics` table, but the approach can be adapted for any table with an image upload field.

---

## Features Implemented
- **Webcam Capture Button**: A button appears next to the file upload field, allowing users to capture images directly from their webcam.
- **Modal Webcam Interface**: Clicking the button opens a modal with a live webcam preview, brightness/contrast controls, and (if supported) manual focus and autofocus controls.
- **Image Preview and Recapture**: Users can preview, recapture, and confirm the image before saving.
- **High-Resolution Capture**: Captured images are saved at the webcam's full resolution and highest JPEG quality.
- **Validation**: Captured images are validated for file type and size (max 5MB, jpg/png/gif/webp).
- **Upgrade-Safe**: All changes are made via hooks and custom JS, so AppGini app updates will not overwrite them.

---

## Files Added/Modified

- `hooks/clone_pics-dv.js`  
  Custom JavaScript for webcam UI, controls, and integration with the AppGini detail view.

- `hooks/clone_pics.php`  
  PHP hook to process and save the captured image as if it were uploaded via the file input.

- (Optional) `images/tmp/`  
  Temporary directory for storing images before record save (not used in the final version, but may be useful for other workflows).

---

## How It Works

1. **User opens the detail view** for a record in the `clone_pics` table.
2. **Webcam button** appears next to the file upload field (`attachement`).
3. **Clicking the button** opens a modal with the webcam preview and controls.
4. **User can adjust brightness, contrast, focus, and autofocus** (if supported by the camera/browser).
5. **User captures and previews the image**. They can recapture or confirm.
6. **On save**, the image is sent as a base64 string and processed by the PHP hook, which saves it to the images folder and attaches it to the record.

---

## How to Use in Other Tables/Applications

1. **Copy the JS file**
   - Rename `clone_pics-dv.js` to match your table: e.g., `mytable-dv.js`.
   - Update the field selector (`#attachement`) to match your upload field's name (e.g., `#photo`, `#image`, etc.).

2. **Copy and adapt the PHP hook**
   - Copy the relevant parts of `clone_pics.php` to your table's hook file (e.g., `mytable.php`).
   - Update the field name in the PHP code to match your upload field.

3. **Ensure the upload field is present** in your AppGini table and is of type 'image' or 'file'.

4. **Deploy the files** to the `hooks/` directory of your AppGini app.

5. **Test** the integration in the detail view of your table.

---

## Notes
- **HTTPS is required** for webcam access in browsers (except on localhost).
- **Camera controls** (focus, autofocus) depend on browser and webcam support.
- **The solution is upgrade-safe** as long as you only modify files in the `hooks/` directory.

---

## Credits
Integration and documentation generated on 2025-06-29 with the help of GPT-4.1.
