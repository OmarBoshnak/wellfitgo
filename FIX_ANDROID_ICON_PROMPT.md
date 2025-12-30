# Fix Android Adaptive Icon: Cropping & Corner Artifacts

## Context
The user is reporting two specific visual bugs with the App Icon on Android:
1.  **Cropping:** The text "WellFitGo" is cut off (appearing as "ell. it. Go!"), violating the Adaptive Icon Safe Zone.
2.  **Corner Artifacts:** The icon corners look faceted/clipped (like an octagon), indicating a "Double Masking" issue where the source image has pre-rounded corners.

## Root Cause Analysis
1.  **Safe Zone Violation:** Android Adaptive Icons (8.0+) enforce a 66dp central safe zone within a 108x108dp canvas. Content outside this circle is cropped.
2.  **Double Masking:** If the source image (`icon.png` or `foreground.png`) already has transparent/rounded corners, the OS-level mask (Squircle/Circle) will clash with it, creating ugly gaps or "cut" corners.

## Instructions for the Designer / Agent

You need to regenerate or modify the source assets (`assets/images/android-icon-foreground.png` and `assets/images/icon.png`) following these strict rules:

### 1. 🟥 Rule #1: FULL SQUARE (No Rounded Corners)
*   **The Problem:** Do **NOT** round the corners of the source image.
*   **The Fix:** The image file must be a **perfect square** with pixels extending all the way to the 4 corners (0,0 to width,height).
*   **Why?** iOS and Android apply the rounding mask automatically. If you provide a pre-rounded image, you get the "faceted" artifact.

### 2. 🎯 Rule #2: THE SAFE ZONE
*   **Canvas Size:** Keep the resolution (e.g., 1024x1024 or 512x512).
*   **Logo Placement:** The critical content (the text "WellFitGo" and the blue circle) must be **centered** and scaled down.
*   **Scaling:**
    *   The "Logo" part should occupy roughly **50% to 60%** of the total canvas width/height.
    *   *Visual Test:* Draw a circle in the center that is 66% of the image size. **All text must fit inside this circle.**
*   **Background:** The blue gradient background (if part of the foreground layer) should extend to the full edges of the square canvas (Bleed), OR if using a separate background layer, ensuring `android-icon-background.png` is a solid full-bleed square.

### 3. Configuration Check (`app.json`)
Ensure the config points to the corrected files:

```json
"android": {
  "adaptiveIcon": {
    "backgroundColor": "#E6F4FE",
    "foregroundImage": "./assets/images/android-icon-foreground.png",
    "backgroundImage": "./assets/images/android-icon-background.png"
  }
}
```

### Summary Checklist for Success
1.  [ ] Source image is a **Square** (no transparent corners).
2.  [ ] Logo text is **Centered** and **Scaled Down** (fits in center 66%).
3.  [ ] Background color/gradient fills the **Entire Canvas** (full bleed).
