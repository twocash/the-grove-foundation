@echo off
cd /d C:\GitHub\the-grove-foundation
del commit-skill.bat
git add -A
git commit -m "chore: cleanup temp files"
git push
del cleanup2.bat
