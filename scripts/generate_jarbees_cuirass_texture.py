import numpy as np
from PIL import Image, ImageFilter
import os

os.makedirs('assets_source/models/jarbees_armor', exist_ok=True)

base_img = Image.open('temp_armor_textures/Image_0.png').convert('RGB')
mr_img = Image.open('temp_armor_textures/Image_1.png').convert('RGB')
norm_img = Image.open('temp_armor_textures/Image_2.png')

arr = np.array(base_img).astype(np.float32)
r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
lum = 0.299 * r + 0.587 * g + 0.114 * b

# Robust segmentation
red_ratio = (r + 1.0) / (g + b + 2.0)
raw_red = ((red_ratio > 1.25) & (r > 50)).astype(np.uint8) * 255
raw_gold = (((raw_red == 0) & (r > b + 15) & (g > b + 5) & (lum > 65))).astype(np.uint8) * 255

# Clean with PIL filters: MaxFilter followed by MinFilter (closing), then GaussianBlur
img_gold = Image.fromarray(raw_gold).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.0))
img_red = Image.fromarray(raw_red).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))

gold_soft = np.array(img_gold).astype(np.float32) / 255.0
red_soft = np.array(img_red).astype(np.float32) / 255.0

# Prevent overlap and normalize
total_ornament = np.clip(gold_soft + red_soft, 0.0, 1.0)
base_soft = 1.0 - total_ornament

col_petroleum = np.array([16.0, 45.0, 70.0], dtype=np.float32)
col_titanium  = np.array([168.0, 196.0, 213.0], dtype=np.float32)
col_violet    = np.array([53.0, 32.0, 91.0], dtype=np.float32)
col_cyan      = np.array([85.0, 240.0, 255.0], dtype=np.float32)

lum_norm_base = np.clip((lum / 60.0) ** 1.15, 0.5, 1.8)
lum_norm_gold = np.clip((lum / 110.0) ** 1.05, 0.6, 1.6)
lum_norm_red = np.clip((lum / 50.0) ** 1.0, 0.5, 1.6)

# --- VARIANTE A: Titanium Relieves + Violet Grooves + Petroleum Blue Body ---
rgb_a = np.zeros_like(arr)
for c in range(3):
    rgb_a[:,:,c] += base_soft * (col_petroleum[c] * lum_norm_base * 1.3)
    rgb_a[:,:,c] += gold_soft * (col_titanium[c] * lum_norm_gold * 1.05)
    rgb_a[:,:,c] += red_soft * (col_violet[c] * lum_norm_red * 1.3)

rgb_a = np.clip(rgb_a, 0.0, 255.0).astype(np.uint8)
img_a = Image.fromarray(rgb_a)
path_a = os.path.abspath('assets_source/models/jarbees_armor/cuirass_basecolor_varA.png')
img_a.save(path_a)
print("Saved Variante A:", path_a)

# --- VARIANTE B: Deep Violet Spirals + Titanium Filigree & Borders + Petroleum Body ---
rgb_b = np.zeros_like(arr)
for c in range(3):
    rgb_b[:,:,c] += base_soft * (col_petroleum[c] * lum_norm_base * 1.3)
    rgb_b[:,:,c] += gold_soft * (col_violet[c] * lum_norm_gold * 1.6)
    rgb_b[:,:,c] += red_soft * (col_titanium[c] * lum_norm_red * 1.1)

rgb_b = np.clip(rgb_b, 0.0, 255.0).astype(np.uint8)
img_b = Image.fromarray(rgb_b)
path_b = os.path.abspath('assets_source/models/jarbees_armor/cuirass_basecolor_varB.png')
img_b.save(path_b)
print("Saved Variante B:", path_b)

# --- VARIANTE C: Titanium Spirals + Subtle Cyan Glow Accents in Grooves ---
rgb_c = np.zeros_like(arr)
for c in range(3):
    rgb_c[:,:,c] += base_soft * (col_petroleum[c] * lum_norm_base * 1.3)
    rgb_c[:,:,c] += gold_soft * (col_titanium[c] * lum_norm_gold * 1.05)
    rgb_c[:,:,c] += red_soft * (col_cyan[c] * lum_norm_red * 0.95 + col_violet[c] * 0.25)

rgb_c = np.clip(rgb_c, 0.0, 255.0).astype(np.uint8)
img_c = Image.fromarray(rgb_c)
path_c = os.path.abspath('assets_source/models/jarbees_armor/cuirass_basecolor_varC.png')
img_c.save(path_c)
print("Saved Variante C:", path_c)
