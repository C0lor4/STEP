import numpy as np
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

def find_plot_box(gray):
    is_black = gray < 120
    row_sums = is_black.sum(axis=1)
    col_sums = is_black.sum(axis=0)
    h_lines = np.where(row_sums > (gray.shape[1] * 0.4))[0]
    v_lines = np.where(col_sums > (gray.shape[0] * 0.4))[0]
    return h_lines[0], h_lines[-1], v_lines[0], v_lines[-1]

def get_accurate_ticks(gray, bottom, left, right):
    tick_strip = gray[bottom + 1 : bottom + 8, left : right + 1]
    v_sums = (tick_strip < 160).sum(axis=0)
    ticks = []
    i = 0
    while i < len(v_sums):
        if v_sums[i] > 0:
            start = i
            while i < len(v_sums) and v_sums[i] > 0:
                i += 1
            ticks.append(left + (start + i - 1) / 2.0)
        else:
            i += 1
    return np.array(ticks)

def draw_debug_overlay(img, box, ticks, pink_centers, heights, output_path):
    draw = ImageDraw.Draw(img)
    top, bottom, left, right = box
    for tx in ticks:
        draw.line([(tx, bottom), (tx, bottom + 8)], fill=(0, 255, 0), width=1)
    for i, cx in enumerate(pink_centers):
        h = heights[i]
        # Draw visualization relative to the corrected baseline offset
        y_top = (bottom - 2) - h
        draw.line([(cx, bottom - 2), (cx, max(top, y_top))], fill=(255, 0, 255), width=1)
        draw.text((cx - 5, max(0, y_top - 12)), str(int(h)), fill=(255, 0, 0))
    img.save(output_path)

def main(image_path):
    img_path = Path(image_path)
    img_orig = Image.open(img_path).convert("RGB")
    img_np = np.array(img_orig)
    gray = np.array(ImageOps.grayscale(img_orig))
    top, bottom, left, right = find_plot_box(gray)
    
    green_ticks = get_accurate_ticks(gray, bottom, left, right)
    pink_centers = (green_ticks[:-1] + green_ticks[1:]) / 2.0
    
    bar_mask = (img_np[:,:,0] > 110) & (img_np[:,:,0] < 190) & \
               (img_np[:,:,1] > 110) & (img_np[:,:,1] < 190) & \
               (img_np[:,:,2] > 110) & (img_np[:,:,2] < 190)
    
    heights = []
    for i in range(len(pink_centers)):
        x_left = int(green_ticks[i]) + 1
        x_right = int(green_ticks[i+1]) - 1
        bin_width = x_right - x_left
        
        bin_mask = bar_mask[top:bottom-2, x_left:x_right]
        row_counts = np.sum(bin_mask, axis=1)
        
        h = 0
        for r in range(len(row_counts) - 1, -1, -1):
            if row_counts[r] > bin_width * 0.3:
                h = len(row_counts) - r
            elif h > 0:
                break
        heights.append(h)
    
    draw_debug_overlay(img_orig, (top, bottom, left, right), 
                       green_ticks, pink_centers, heights,
                       img_path.with_name("debug_overlay.png"))

if __name__ == "__main__":
    main(r"F:\project\public\downloads\stats\2025_III.png")