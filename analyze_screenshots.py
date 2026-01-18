#!/usr/bin/env python3
"""
Screenshot Analyzer
Analyzes screenshots to detect error pages, loading spinners, or actual UI content
"""

import os
import sys
try:
    from PIL import Image
except ImportError:
    print("PIL not available")
    sys.exit(1)

def analyze_image(path):
    """Analyze an image to determine if it's an error/loading or actual UI"""
    try:
        img = Image.open(path)
        width, height = img.size

        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Get pixel data
        pixels = list(img.getdata())
        unique_colors = len(set(pixels))

        # Calculate mean brightness
        brightness_sum = sum(sum(pixel) for pixel in pixels)
        mean_brightness = brightness_sum / (len(pixels) * 3)

        # Simple variance calculation
        mean_pixel = tuple(int(sum(color[i] for color in pixels) / len(pixels)) for i in range(3))
        variance = sum(sum((pixel[i] - mean_pixel[i]) ** 2 for i in range(3)) for pixel in pixels) / len(pixels)

        # Count most common color
        color_counts = {}
        for pixel in pixels[:10000]:  # Sample first 10000 pixels
            color_counts[pixel] = color_counts.get(pixel, 0) + 1
        most_common_count = max(color_counts.values()) if color_counts else 0
        common_ratio = most_common_count / min(len(pixels), 10000)

        analysis = {
            'path': path,
            'size': (width, height),
            'unique_colors': unique_colors,
            'mean_brightness': mean_brightness,
            'variance': variance,
            'common_ratio': common_ratio,
        }

        # Heuristic detection
        is_error = False
        is_loading = False
        is_ui = False

        # Error pages often have:
        # - Very few unique colors (< 100)
        # - High brightness (white background with text)
        if unique_colors < 100 and mean_brightness > 200:
            is_error = True

        # Loading spinners often have:
        # - Few unique colors
        # - High common ratio (solid background)
        if unique_colors < 50 and common_ratio > 0.5:
            is_loading = True

        # Actual UI has:
        # - Many unique colors (> 200)
        # - Good variance
        if unique_colors > 200 and variance > 1000:
            is_ui = True

        analysis['is_error'] = is_error
        analysis['is_loading'] = is_loading
        analysis['is_ui'] = is_ui

        return analysis

    except Exception as e:
        return {
            'path': path,
            'error': str(e),
        }

def main():
    screenshot_dir = 'docs/sprints/epic4-multimodel-v1/screenshots'

    if not os.path.exists(screenshot_dir):
        print(f"Error: {screenshot_dir} not found")
        sys.exit(1)

    print("=== SCREENSHOT ANALYSIS ===\n")

    all_files = []
    for root, dirs, files in os.walk(screenshot_dir):
        for file in files:
            if file.endswith('.png'):
                all_files.append(os.path.join(root, file))

    all_files.sort()

    error_count = 0
    loading_count = 0
    ui_count = 0
    unknown_count = 0

    for path in all_files:
        analysis = analyze_image(path)

        if 'error' in analysis:
            print(f"❌ ERROR: {path}")
            print(f"   {analysis['error']}\n")
            unknown_count += 1
            continue

        size = analysis['size']
        unique_colors = analysis['unique_colors']
        mean_brightness = analysis['mean_brightness']
        common_ratio = analysis['common_ratio']

        # Determine type
        if analysis['is_error']:
            error_count += 1
            status = "[ERROR PAGE]"
        elif analysis['is_loading']:
            loading_count += 1
            status = "[LOADING/ANIMATION]"
        elif analysis['is_ui']:
            ui_count += 1
            status = "[ACTUAL UI]"
        else:
            unknown_count += 1
            status = "[UNKNOWN]"

        print(f"{status}: {os.path.basename(path)}")
        print(f"   Path: {path}")
        print(f"   Size: {size[0]}x{size[1]}")
        print(f"   Unique colors: {unique_colors}")
        print(f"   Brightness: {mean_brightness:.1f}")
        print(f"   Common ratio: {common_ratio:.3f}")

        if analysis['is_error']:
            print(f"   [ERROR] LIKELY ERROR PAGE: Low color count ({unique_colors}), high brightness ({mean_brightness:.1f})")
        elif analysis['is_loading']:
            print(f"   [WARNING] LIKELY LOADING: Very few colors ({unique_colors}), solid background")
        elif analysis['is_ui']:
            print(f"   [OK] APPEARS TO BE REAL UI: High color count ({unique_colors}), good variation")

        print()

    print("=== SUMMARY ===")
    print(f"Total screenshots: {len(all_files)}")
    print(f"[ERROR] Error pages: {error_count}")
    print(f"[WARNING] Loading/animations: {loading_count}")
    print(f"[OK] Actual UI: {ui_count}")
    print(f"[UNKNOWN] Unknown: {unknown_count}")

    if error_count + loading_count > 0:
        print(f"\n[WARNING]: {error_count + loading_count} screenshots appear to be errors or loading!")
        print("This confirms the test infrastructure was broken during execution.")
    else:
        print(f"\n[OK] All screenshots appear to be valid UI content.")

    return 0

if __name__ == '__main__':
    sys.exit(main())
