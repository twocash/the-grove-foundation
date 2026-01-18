#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Notion Sprint Status Sync Script

Syncs sprint status from Notion Feature Roadmap to local STATUS.md files.
Notion is the source of truth for sprint status.

Usage:
    python scripts/notion_sync.py              # Dry run
    python scripts/notion_sync.py --execute    # Actually update files
    python scripts/notion_sync.py --sprint S8  # Sync specific sprint
"""

import os
import re
import json
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List, Any

# Configuration
SPRINTS_DIR = Path("C:/GitHub/the-grove-foundation/docs/sprints")
DATA_SOURCE_ID = "d94fde99-e81e-4a70-8cfa-9bc3317267c5"

# Status emoji mapping
STATUS_EMOJI = {
    "idea": "idea",
    "draft-spec": "draft-spec",
    "needs-audit": "needs-audit",
    "ready": "ready",
    "in-progress": "in-progress",
    "complete": "complete",
    "archived": "archived",
    "blocked": "blocked"
}


def run_mcp_command(query: str) -> Optional[Dict]:
    """
    Execute Notion MCP query via Claude Code CLI.

    Note: This is a placeholder - actual implementation depends on
    how you want to invoke the Notion MCP. Options:
    1. Use Claude Code's MCP infrastructure directly
    2. Use Notion API directly with API key
    3. Use claude-cli to execute MCP commands
    """
    # For now, return None - actual implementation would call Notion API
    return None


def search_notion_sprints() -> List[Dict]:
    """
    Search Notion Feature Roadmap for all sprints.
    Returns list of sprint records with status.

    In actual use, this would use:
    - Notion API directly with NOTION_API_KEY environment variable
    - Or MCP tool via Claude Code
    """
    print("[INFO] Searching Notion for sprint status...")
    print("[INFO] NOTE: This script requires manual Notion data input")
    print("[INFO] Use 'claude code' with Notion MCP to fetch current status")
    return []


def parse_status_md(sprint_dir: Path) -> Optional[Dict]:
    """Parse existing STATUS.md file."""
    status_file = sprint_dir / "STATUS.md"
    if not status_file.exists():
        return None

    content = status_file.read_text(encoding='utf-8')

    # Extract current status
    status_match = re.search(r'\*\*Status:\*\*\s*(.+?)(?:\s*$|\s*\n)', content)
    status = status_match.group(1).strip() if status_match else None

    # Extract last synced
    synced_match = re.search(r'\*\*Last Synced:\*\*\s*(\d{4}-\d{2}-\d{2})', content)
    last_synced = synced_match.group(1) if synced_match else None

    # Extract Notion page URL
    notion_match = re.search(r'\*\*Notion Page:\*\*\s*(https://[^\s\n]+)', content)
    notion_url = notion_match.group(1) if notion_match else None

    return {
        'status': status,
        'last_synced': last_synced,
        'notion_url': notion_url,
        'content': content
    }


def generate_status_md(
    sprint_name: str,
    status: str,
    notion_url: str,
    timeline: Dict[str, str] = None,
    summary: Dict[str, Any] = None
) -> str:
    """Generate STATUS.md content."""
    today = datetime.now().strftime("%Y-%m-%d")

    timeline = timeline or {}
    summary = summary or {}

    content = f"""# Sprint Status: {sprint_name}

## Current Status
**Status:** {status}
**Last Synced:** {today}
**Notion Page:** {notion_url}

## Timeline
| Stage | Date | Notes |
|-------|------|-------|
| Created | {timeline.get('created', '-')} | {timeline.get('created_notes', '')} |
| Ready | {timeline.get('ready', '-')} | {timeline.get('ready_notes', '')} |
| In Progress | {timeline.get('in_progress', '-')} | {timeline.get('in_progress_notes', '')} |
| Complete | {timeline.get('complete', '-')} | {timeline.get('complete_notes', '')} |
"""

    if summary:
        content += f"""
## Planning Summary
"""
        for key, value in summary.items():
            content += f"- **{key}:** {value}\n"

    return content


def update_status_file(sprint_dir: Path, new_status: str, dry_run: bool = True) -> bool:
    """Update STATUS.md with new status from Notion."""
    status_file = sprint_dir / "STATUS.md"

    if not status_file.exists():
        print(f"   [SKIP] No STATUS.md in {sprint_dir.name}")
        return False

    current = parse_status_md(sprint_dir)
    if not current:
        return False

    # Check if status changed
    current_status = current.get('status', '').lower()
    if new_status.lower() in current_status.lower():
        print(f"   [OK] {sprint_dir.name} - already {new_status}")
        return False

    print(f"   [UPDATE] {sprint_dir.name}: {current_status} -> {new_status}")

    if dry_run:
        return True

    # Update the file
    today = datetime.now().strftime("%Y-%m-%d")
    content = current['content']

    # Update status line
    content = re.sub(
        r'(\*\*Status:\*\*\s*)([^\n]+)',
        f'\\g<1>{new_status}',
        content
    )

    # Update last synced
    content = re.sub(
        r'(\*\*Last Synced:\*\*\s*)(\d{4}-\d{2}-\d{2})',
        f'\\g<1>{today}',
        content
    )

    status_file.write_text(content, encoding='utf-8')
    return True


def sync_from_manual_input(sprint_status_map: Dict[str, str], dry_run: bool = True):
    """
    Sync sprints from manually provided status map.

    sprint_status_map: {"s8-sl-multimodel-v1": "complete", "s9-sl-federation-v1": "ready"}
    """
    print("=" * 60)
    print("NOTION SYNC - Manual Input Mode")
    print("=" * 60)

    updated = 0
    for sprint_pattern, new_status in sprint_status_map.items():
        # Find matching sprint directory
        for sprint_dir in SPRINTS_DIR.iterdir():
            if not sprint_dir.is_dir() or sprint_dir.name == "archive":
                continue

            if sprint_pattern.lower() in sprint_dir.name.lower():
                if update_status_file(sprint_dir, new_status, dry_run):
                    updated += 1

    print(f"\nUpdated {updated} sprints" + (" (dry run)" if dry_run else ""))


def safe_print(text: str):
    """Print with ASCII-safe encoding for Windows."""
    # Replace common emojis with text equivalents
    replacements = {
        '\U0001f680': '[in-progress]',  # rocket
        '\U0001f3af': '[ready]',        # target
        '\u2705': '[complete]',         # check mark
        '\U0001f4e6': '[archived]',     # package
        '\U0001f4a1': '[idea]',         # lightbulb
        '\U0001f4dd': '[draft]',        # memo
        '\U0001f50d': '[audit]',        # magnifier
    }
    for emoji, replacement in replacements.items():
        text = text.replace(emoji, replacement)
    print(text)


def list_sprints_with_status():
    """List all sprints and their current STATUS.md content."""
    print("=" * 60)
    print("LOCAL SPRINT STATUS")
    print("=" * 60)

    for sprint_dir in sorted(SPRINTS_DIR.iterdir()):
        if not sprint_dir.is_dir() or sprint_dir.name == "archive":
            continue

        status = parse_status_md(sprint_dir)
        if status:
            safe_print(f"  {sprint_dir.name}")
            safe_print(f"    Status: {status.get('status', 'unknown')}")
            safe_print(f"    Last Synced: {status.get('last_synced', 'never')}")
            safe_print(f"    Notion: {status.get('notion_url', 'none')}")
        else:
            safe_print(f"  {sprint_dir.name} - NO STATUS.md")


def create_missing_status_files(dry_run: bool = True):
    """Create STATUS.md files for sprints that don't have one."""
    print("=" * 60)
    print("CHECKING FOR MISSING STATUS.MD FILES")
    print("=" * 60)

    # Sprint name patterns that indicate they should have STATUS.md
    tracked_patterns = [
        r"^s\d+-",      # s8-, s9-, s10-, s11-
        r"^epic\d+-",   # epic4-, epic5-
    ]

    created = 0
    for sprint_dir in sorted(SPRINTS_DIR.iterdir()):
        if not sprint_dir.is_dir() or sprint_dir.name == "archive":
            continue

        status_file = sprint_dir / "STATUS.md"
        if status_file.exists():
            continue

        # Check if this sprint should be tracked
        should_track = any(
            re.match(pattern, sprint_dir.name.lower())
            for pattern in tracked_patterns
        )

        if should_track:
            print(f"   [CREATE] {sprint_dir.name}/STATUS.md")

            if not dry_run:
                content = generate_status_md(
                    sprint_name=sprint_dir.name,
                    status="unknown - needs sync from Notion",
                    notion_url="https://www.notion.so/",
                    timeline={"created": datetime.now().strftime("%Y-%m-%d")}
                )
                status_file.write_text(content, encoding='utf-8')

            created += 1

    print(f"\nCreated {created} STATUS.md files" + (" (dry run)" if dry_run else ""))


if __name__ == "__main__":
    import sys

    dry_run = "--execute" not in sys.argv

    if "--list" in sys.argv:
        list_sprints_with_status()
    elif "--create-missing" in sys.argv:
        create_missing_status_files(dry_run)
    elif "--sprint" in sys.argv:
        # Get sprint name after --sprint
        idx = sys.argv.index("--sprint")
        if idx + 1 < len(sys.argv):
            sprint = sys.argv[idx + 1]
            print(f"Syncing specific sprint: {sprint}")
            # Would need Notion data to sync
            print("[INFO] Use Claude Code to query Notion status for this sprint")
    else:
        # Default: show usage and current status
        print("""
Notion Sprint Sync Script
=========================

Usage:
    python scripts/notion_sync.py --list           # List current local status
    python scripts/notion_sync.py --create-missing # Create missing STATUS.md
    python scripts/notion_sync.py --execute        # Execute pending syncs

Integration with Claude Code:
    The script can be used with Claude Code to sync status from Notion:

    1. Query Notion for sprint status using MCP tools
    2. Call sync_from_manual_input() with the status map
    3. STATUS.md files are updated automatically

Example in Claude Code:
    # After querying Notion
    from scripts.notion_sync import sync_from_manual_input

    status_map = {
        "s8-sl-multimodel-v1": "complete",
        "s9-sl-federation-v1": "ready",
        "s10-sl-aicuration-v1": "in-progress"
    }
    sync_from_manual_input(status_map, dry_run=False)
""")
        print()
        list_sprints_with_status()
