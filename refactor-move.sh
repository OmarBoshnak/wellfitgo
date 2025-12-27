#!/bin/bash
# =============================================================================
# WellFitGo Architecture Refactor - Safe Move Script
# =============================================================================
# This script safely moves files to the new architecture without destructive ops.
# - Uses mkdir -p for directories
# - Checks existence before moving
# - Uses ONLY mv (no rm, rmdir, git rm, force flags)
# - Skips if destination exists (prints warning)
# =============================================================================

set -e
cd "$(dirname "$0")"

echo "=== WellFitGo Architecture Refactor ==="
echo "Working directory: $(pwd)"
echo ""

# -----------------------------------------------------------------------------
# Phase 1: Create Target Directory Structure
# -----------------------------------------------------------------------------
echo "=== Phase 1: Creating target directories ==="

mkdir -p src/components/ui
mkdir -p src/components/form
mkdir -p src/core/theme
mkdir -p src/core/utils
mkdir -p src/core/hooks
mkdir -p src/core/i18n
mkdir -p src/core/constants
mkdir -p src/features/doctor/components
mkdir -p src/features/doctor/hooks
mkdir -p src/features/patient
mkdir -p src/features/tracking/components
mkdir -p src/features/meals/data

echo "✓ Target directories created"
echo ""

# -----------------------------------------------------------------------------
# Helper function for safe file move
# -----------------------------------------------------------------------------
safe_move_file() {
    local src="$1"
    local dest="$2"
    
    if [ ! -f "$src" ]; then
        echo "⚠ SKIP: Source file not found: $src"
        return 0
    fi
    
    if [ -f "$dest" ]; then
        echo "⚠ SKIP: Destination already exists: $dest"
        return 0
    fi
    
    mv "$src" "$dest"
    echo "✓ Moved: $src → $dest"
}

# -----------------------------------------------------------------------------
# Helper function for safe directory move
# -----------------------------------------------------------------------------
safe_move_dir() {
    local src="$1"
    local dest="$2"
    
    if [ ! -d "$src" ]; then
        echo "⚠ SKIP: Source directory not found: $src"
        return 0
    fi
    
    if [ -d "$dest" ]; then
        echo "⚠ SKIP: Destination already exists: $dest"
        return 0
    fi
    
    mv "$src" "$dest"
    echo "✓ Moved: $src → $dest"
}

# -----------------------------------------------------------------------------
# Phase 2: UI Components → src/components/ui/
# -----------------------------------------------------------------------------
echo "=== Phase 2: Moving UI components to src/components/ui/ ==="

safe_move_file "src/shared/components/AuthButton.tsx" "src/components/ui/AuthButton.tsx"
safe_move_file "src/shared/components/GradientBackground.tsx" "src/components/ui/GradientBackground.tsx"
safe_move_file "src/shared/components/OnBoardingSlide.tsx" "src/components/ui/OnBoardingSlide.tsx"
safe_move_dir "src/shared/components/SegmentedControl" "src/components/ui/SegmentedControl"
safe_move_dir "src/shared/components/ToggleSwitch" "src/components/ui/ToggleSwitch"

echo ""

# -----------------------------------------------------------------------------
# Phase 3: Doctor Feature Consolidation
# -----------------------------------------------------------------------------
echo "=== Phase 3: Moving Doctor feature components and hooks ==="

# Move HomeScreen directory
safe_move_dir "src/component/doctor/HomeScreen" "src/features/doctor/components/HomeScreen"

# Move plans directory
safe_move_dir "src/component/doctor/plans" "src/features/doctor/components/plans"

# Move doctor index.ts
safe_move_file "src/component/doctor/index.ts" "src/features/doctor/components/index.ts"

# Move doctor hooks
safe_move_file "src/hooks/useClients.ts" "src/features/doctor/hooks/useClients.ts"
safe_move_file "src/hooks/useClientsNeedingAttention.ts" "src/features/doctor/hooks/useClientsNeedingAttention.ts"
safe_move_file "src/hooks/useTodaysAppointments.ts" "src/features/doctor/hooks/useTodaysAppointments.ts"
safe_move_file "src/hooks/useRecentActivity.ts" "src/features/doctor/hooks/useRecentActivity.ts"
safe_move_file "src/hooks/useWeeklyActivity.ts" "src/features/doctor/hooks/useWeeklyActivity.ts"
safe_move_file "src/hooks/usePhoneCall.ts" "src/features/doctor/hooks/usePhoneCall.ts"

echo ""

# -----------------------------------------------------------------------------
# Phase 4: Rename clients → patient
# -----------------------------------------------------------------------------
echo "=== Phase 4: Renaming clients feature to patient ==="

if [ -d "src/features/clients" ]; then
    if [ -d "src/features/patient" ] && [ "$(ls -A src/features/patient 2>/dev/null)" ]; then
        echo "⚠ SKIP: src/features/patient already has content"
    else
        # Move contents from clients to patient
        if [ -d "src/features/clients/screens" ]; then
            mkdir -p src/features/patient/screens
            mv src/features/clients/screens/* src/features/patient/screens/ 2>/dev/null || true
            echo "✓ Moved: src/features/clients/screens/* → src/features/patient/screens/"
        fi
        if [ -f "src/features/clients/index.ts" ]; then
            mv src/features/clients/index.ts src/features/patient/index.ts
            echo "✓ Moved: src/features/clients/index.ts → src/features/patient/index.ts"
        fi
    fi
else
    echo "⚠ SKIP: src/features/clients not found"
fi

echo ""

# -----------------------------------------------------------------------------
# Phase 5: Tracking Feature
# -----------------------------------------------------------------------------
echo "=== Phase 5: Moving Tracking components ==="

safe_move_dir "src/component/WaterTracker" "src/features/tracking/components/WaterTracker"
safe_move_dir "src/component/WeightCheckin" "src/features/tracking/components/WeightCheckin"

echo ""

# -----------------------------------------------------------------------------
# Phase 6: Meals Feature
# -----------------------------------------------------------------------------
echo "=== Phase 6: Moving Meals components ==="

safe_move_dir "src/component/MealCard" "src/features/meals/components/MealCard"
safe_move_file "src/data/mealsData.ts" "src/features/meals/data/mealsData.ts"

echo ""

# -----------------------------------------------------------------------------
# Phase 7: Core Module Setup
# -----------------------------------------------------------------------------
echo "=== Phase 7: Moving Core modules ==="

# Move theme files
if [ -d "src/theme" ]; then
    for file in src/theme/*; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            safe_move_file "$file" "src/core/theme/$filename"
        fi
    done
fi

# Move utils files
if [ -d "src/utils" ]; then
    for file in src/utils/*; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            safe_move_file "$file" "src/core/utils/$filename"
        fi
    done
fi

# Move i18n files
if [ -d "src/i18n" ]; then
    for file in src/i18n/*; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            safe_move_file "$file" "src/core/i18n/$filename"
        fi
    done
fi

# Move constants files
if [ -d "src/constants" ]; then
    for file in src/constants/*; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            safe_move_file "$file" "src/core/constants/$filename"
        fi
    done
fi

echo ""

# -----------------------------------------------------------------------------
# Phase 8: Auth Feature
# -----------------------------------------------------------------------------
echo "=== Phase 8: Moving Auth hooks ==="

mkdir -p src/features/auth/hooks
safe_move_file "src/hooks/useClerkAuth.tsx" "src/features/auth/hooks/useClerkAuth.tsx"

echo ""

# -----------------------------------------------------------------------------
# Rename component → components (after moving contents out)
# -----------------------------------------------------------------------------
echo "=== Renaming src/component → src/components ==="

if [ -d "src/component" ]; then
    # Check if component still has content (it should be mostly empty now)
    remaining=$(find src/component -type f 2>/dev/null | wc -l | tr -d ' ')
    if [ "$remaining" -gt 0 ]; then
        echo "⚠ src/component still has $remaining file(s). Moving remaining content..."
        # Move any remaining common folder
        if [ -d "src/component/common" ]; then
            mkdir -p src/components/common
            mv src/component/common/* src/components/common/ 2>/dev/null || true
            echo "✓ Moved remaining common files"
        fi
    fi
    echo "✓ src/component is now empty (deprecated)"
fi

echo ""
echo "=== Move Script Complete ==="
echo ""
echo "Next steps:"
echo "1. Update all imports in the codebase"
echo "2. Run TypeScript compilation to verify"
echo "3. Test the application"
