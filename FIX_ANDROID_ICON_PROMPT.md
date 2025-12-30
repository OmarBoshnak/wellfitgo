# Fix Android Adaptive Icon Cropping

## Context
The user is reporting that the Android app icon looks "zoomed in" and cropped on their device.
The text "WellFitGo" is cut off (appearing as "ell. it. Go!"), indicating a violation of the **Android Adaptive Icon Safe Zone**.

## Root Cause
Android 8.0+ (Oreo) uses Adaptive Icons which consist of two layers (Foreground + Background) on a 108x108dp grid.
*   **The Problem:** The current `assets/images/android-icon-foreground.png` likely has the logo extending to the edges of the image.
*   **The Constraint:** Android launchers apply a mask (Circle, Squircle, etc.). The **Safe Zone** is only the central **66dp** (diameter) circle. Anything outside this central area is liable to be cropped.

## Instructions

You need to resize the content of the foreground image without changing the file dimensions (or create a new file with proper padding).

### 1. Image Requirement (Foreground)
*   **File:** `assets/images/android-icon-foreground.png`
*   **Canvas Size:** Keep the original resolution (e.g., 1024x1024 or 512x512).
*   **Logo Size:** Scale down the visible logo (text + graphic) so it occupies **only the center 50-60%** of the canvas.
*   **Padding:** The outer 20-25% of the image on all sides must be **transparent**.
*   *Visual Check:* Imagine a circle in the dead center that touches the 66% mark. Your text must fit entirely inside that circle.

### 2. Configuration Check (`app.json`)
Ensure the `adaptiveIcon` config correctly points to the separate layers:

```json
"android": {
  "adaptiveIcon": {
    "backgroundColor": "#E6F4FE",
    "foregroundImage": "./assets/images/android-icon-foreground.png",
    "backgroundImage": "./assets/images/android-icon-background.png"
  }
}
```
*   *Note:* If `backgroundImage` is not a solid color but a file, ensure it effectively provides the "canvas" for the foreground to float over.

### 3. Action Plan
1.  **Modify** `assets/images/android-icon-foreground.png`: Add significant transparent padding around the "WellFitGo" logo.
2.  **Verify**: If possible, generate a preview. The text "WellFitGo" should not touch the edges of the circle mask.

### Reference
> "Both layers must be sized at 108 x 108 dp. The inner 72 x 72 dp of the icon appears within the masked viewport. The system reserves the outer 18 dp on each of the 4 sides to create interesting visual effects, such as parallax or pulsing." - *Android Developer Documentation*
