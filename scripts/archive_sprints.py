#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sprint Archive Script

Moves legacy sprints to archive directory based on:
1. Notion status (if tracked): 📦 archived or ✅ complete
2. Naming patterns (v0.x series = legacy)
3. Age/staleness (no updates in 90+ days)

Active sprints (s8-s11 SL series, etc.) are preserved.
"""

import os
import shutil
from pathlib import Path
from datetime import datetime, timedelta

# Configuration
SPRINTS_DIR = Path("C:/GitHub/the-grove-foundation/docs/sprints")
ARCHIVE_DIR = SPRINTS_DIR / "archive"

# Active sprint patterns - these are NOT archived
ACTIVE_PATTERNS = [
    "s8-sl-",    # MultiModel (complete but recent)
    "s9-sl-",    # Federation (ready)
    "s10-sl-",   # AI Curation (in-progress)
    "s11-sl-",   # Attribution (in-progress)
    "epic4-",    # Current epic series
    "epic5-",    # Current epic series
    "auto-advancement",  # Recent sprint
    "bedrock-ui-compact",  # Recent sprint
]

# Legacy patterns - these ARE archived
LEGACY_PATTERNS = [
    "v0.",           # All v0.x series
    "sprint-",       # Old naming convention
    "engagement-bus",
    "custom-lens",
    "active-grove",
    "terminal-v",
    "foundation-v",
    "audio-cms",
    "rag-manager",
    "sprout-lifecycle",
    "bedrock-conversion",
    "surface-foundation",
    "tailwind-npm",
    "tiered-rag",
    "experience-sequence",
    "ab-testing",
    "kinetic",
    "progressive",
    "scroll-",
    "readme-",
    "gardeninspector-",
]


def is_active_sprint(name: str) -> bool:
    """Check if sprint matches active patterns."""
    name_lower = name.lower()
    return any(pattern in name_lower for pattern in ACTIVE_PATTERNS)


def is_legacy_sprint(name: str) -> bool:
    """Check if sprint matches legacy patterns."""
    name_lower = name.lower()
    return any(pattern in name_lower for pattern in LEGACY_PATTERNS)


def get_sprint_age_days(sprint_path: Path) -> int:
    """Get the age of a sprint based on most recent file modification."""
    most_recent = None
    for file_path in sprint_path.rglob("*"):
        if file_path.is_file():
            mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
            if most_recent is None or mtime > most_recent:
                most_recent = mtime

    if most_recent:
        return (datetime.now() - most_recent).days
    return 999  # Unknown age = very old


def categorize_sprints():
    """Categorize all sprints into active, legacy, and unknown."""
    active = []
    legacy = []
    unknown = []

    for item in SPRINTS_DIR.iterdir():
        if not item.is_dir() or item.name == "archive":
            continue

        name = item.name

        if is_active_sprint(name):
            active.append(name)
        elif is_legacy_sprint(name):
            legacy.append(name)
        else:
            # Check age for unknown sprints
            age = get_sprint_age_days(item)
            if age > 90:
                legacy.append(name)
            else:
                unknown.append(name)

    return sorted(active), sorted(legacy), sorted(unknown)


def archive_sprints(dry_run: bool = True):
    """Move legacy sprints to archive directory."""
    ARCHIVE_DIR.mkdir(exist_ok=True)

    active, legacy, unknown = categorize_sprints()

    print("=" * 60)
    print("SPRINT ARCHIVE ANALYSIS")
    print("=" * 60)

    print(f"\n[ACTIVE] SPRINTS ({len(active)}) - Will be preserved:")
    for name in active:
        print(f"   - {name}")

    print(f"\n[LEGACY] SPRINTS ({len(legacy)}) - Will be archived:")
    for name in legacy:
        print(f"   - {name}")

    print(f"\n[UNKNOWN] SPRINTS ({len(unknown)}) - Review needed:")
    for name in unknown:
        age = get_sprint_age_days(SPRINTS_DIR / name)
        print(f"   - {name} (age: {age} days)")

    if dry_run:
        print("\n" + "=" * 60)
        print("DRY RUN - No files moved")
        print("Run with --execute to perform archive")
        print("=" * 60)
        return

    # Perform the archive
    print("\n" + "=" * 60)
    print("ARCHIVING LEGACY SPRINTS...")
    print("=" * 60)

    moved = 0
    for name in legacy:
        src = SPRINTS_DIR / name
        dst = ARCHIVE_DIR / name

        if dst.exists():
            print(f"   [WARN] {name} already exists in archive, skipping")
            continue

        try:
            shutil.move(str(src), str(dst))
            print(f"   [OK] {name} -> archive/")
            moved += 1
        except Exception as e:
            print(f"   [ERR] {name}: {e}")

    print(f"\nArchived {moved} sprints")


if __name__ == "__main__":
    import sys

    dry_run = "--execute" not in sys.argv
    archive_sprints(dry_run=dry_run)
