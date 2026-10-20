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

# 1. Ornaments mask (golden spirals, reliefs, collar scrollwork, leaf fan)
raw_ornament = (((r > b + 10) | (r > 65)) & (lum > 35) & (r > g * 0.92)).astype(np.uint8) * 255
img_ornament = Image.fromarray(raw_ornament).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.0))
ornament_soft = np.array(img_ornament).astype(np.float32) / 255.0

# 2. Crevices / Edge borders around ornaments (the old blood/groove areas)
red_ratio = (r + 1.0) / (g + b + 2.0)
raw_crevice = ((red_ratio > 1.25) & (r > 48)).astype(np.uint8) * 255
img_crevice = Image.fromarray(raw_crevice).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
crevice_soft = np.array(img_crevice).astype(np.float32) / 255.0

# Partition
total = np.clip(ornament_soft + crevice_soft * 0.7, 0.0, 1.0)
base_plate_soft = 1.0 - total

# Paleta JarBees sRGB
col_petroleum = np.array([16.0, 45.0, 70.0], dtype=np.float32)  # #102D46
col_titanium  = np.array([168.0, 196.0, 213.0], dtype=np.float32) # #A8C4D5
col_violet    = np.array([53.0, 32.0, 91.0], dtype=np.float32)   # #35205B
col_cyan      = np.array([85.0, 240.0, 255.0], dtype=np.float32)  # #55F0FF

lum_base = np.clip((lum / 60.0) ** 1.15, 0.55, 1.7)
lum_ornament = np.clip((lum / 105.0) ** 1.05, 0.65, 1.5)
lum_crevice = np.clip((lum / 45.0) ** 1.0, 0.5, 1.6)

# Generate Option 1: Titanium Spirals & Relieves + Violet Grooves + Petroleum Blue Plate
rgb_opt1 = np.zeros_like(arr)
for c in range(3):
    rgb_opt1[:,:,c] += base_plate_soft * (col_petroleum[c] * lum_base * 1.35)
    rgb_opt1[:,:,c] += ornament_soft * (col_titanium[c] * lum_ornament * 1.1)
    rgb_opt1[:,:,c] += crevice_soft * (col_violet[c] * lum_crevice * 1.35)

rgb_opt1 = np.clip(rgb_opt1, 0, 255).astype(np.uint8)
path_opt1 = os.path.abspath('assets_source/models/jarbees_armor/cuirass_basecolor_opt1.png')
Image.fromarray(rgb_opt1).save(path_opt1)

# Generate Option 2: Violet Spirals & Relieves + Titanium Grooves/Borders + Petroleum Blue Plate
rgb_opt2 = np.zeros_like(arr)
for c in range(3):
    rgb_opt2[:,:,c] += base_plate_soft * (col_petroleum[c] * lum_base * 1.35)
    rgb_opt2[:,:,c] += ornament_soft * (col_violet[c] * lum_ornament * 1.7)
    rgb_opt2[:,:,c] += crevice_soft * (col_titanium[c] * lum_crevice * 1.15)

rgb_opt2 = np.clip(rgb_opt2, 0, 255).astype(np.uint8)
path_opt2 = os.path.abspath('assets_source/models/jarbees_armor/cuirass_basecolor_opt2.png')
Image.fromarray(rgb_opt2).save(path_opt2)

# Generate Matching PBR Metallic & Roughness Maps:
mr_opt1 = np.zeros_like(arr)
rough_opt1 = base_plate_soft * (0.25 * 255.0) + ornament_soft * (0.16 * 255.0) + crevice_soft * (0.22 * 255.0)
metal_opt1 = base_plate_soft * (0.84 * 255.0) + ornament_soft * (0.92 * 255.0) + crevice_soft * (0.80 * 255.0)
mr_opt1[:,:,0] = 255
mr_opt1[:,:,1] = np.clip(rough_opt1, 0, 255)
mr_opt1[:,:,2] = np.clip(metal_opt1, 0, 255)
path_mr = os.path.abspath('assets_source/models/jarbees_armor/cuirass_mr.png')
Image.fromarray(mr_opt1.astype(np.uint8)).save(path_mr)

norm_path = os.path.abspath('assets_source/models/jarbees_armor/cuirass_normal.png')
norm_img.save(norm_path)

print("Generated PBR textures successfully!")
