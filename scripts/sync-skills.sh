#!/bin/bash
# scripts/sync-skills.sh
# Syncs skills from repo to local Claude Code installation
#
# Usage:
#   ./scripts/sync-skills.sh           # Default: repo -> local
#   ./scripts/sync-skills.sh --reverse # Reverse: local -> repo
#
# Cross-platform: macOS, Linux, Windows (Git Bash/WSL)

set -e

# Colors for output (works in most terminals)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Determine script and repo locations
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
REPO_SKILLS="$REPO_ROOT/.agent/skills"
LOCAL_SKILLS="$HOME/.claude/skills"

# Parse arguments
REVERSE_MODE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --reverse|-r)
            REVERSE_MODE=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --reverse, -r    Sync from local to repo (for development)"
            echo "  --verbose, -v    Show detailed output"
            echo "  --help, -h       Show this help message"
            echo ""
            echo "Default behavior: Sync from repo to local ~/.claude/skills/"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Validate source directory exists
if [ "$REVERSE_MODE" = true ]; then
    SOURCE="$LOCAL_SKILLS"
    DEST="$REPO_SKILLS"
    echo -e "${YELLOW}Reverse sync: local -> repo${NC}"
else
    SOURCE="$REPO_SKILLS"
    DEST="$LOCAL_SKILLS"
    echo "Syncing skills: repo -> local"
fi

if [ ! -d "$SOURCE" ]; then
    echo -e "${RED}Error: Source directory does not exist: $SOURCE${NC}"
    exit 1
fi

# Create destination if needed
mkdir -p "$DEST"

echo "  Source: $SOURCE"
echo "  Dest:   $DEST"
echo ""

# Track counts
synced=0
skipped=0

# Sync each skill directory
for item in "$SOURCE"/*; do
    if [ -e "$item" ]; then
        name=$(basename "$item")

        if [ -d "$item" ]; then
            # It's a directory - sync recursively
            if [ "$VERBOSE" = true ]; then
                echo "  Syncing directory: $name"
            fi
            mkdir -p "$DEST/$name"
            cp -r "$item"/* "$DEST/$name/" 2>/dev/null || true
            synced=$((synced + 1))
        elif [ -f "$item" ]; then
            # It's a file - copy directly
            if [ "$VERBOSE" = true ]; then
                echo "  Syncing file: $name"
            fi
            cp "$item" "$DEST/"
            synced=$((synced + 1))
        fi
    fi
done

echo ""
echo -e "${GREEN}Done!${NC} Synced $synced items to $DEST"

# Show summary of what was synced
if [ "$VERBOSE" = true ]; then
    echo ""
    echo "Synced skills:"
    ls -1 "$DEST" | sed 's/^/  - /'
fi
