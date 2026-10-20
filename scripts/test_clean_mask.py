import numpy as np
from PIL import Image, ImageFilter
import os

base_img = Image.open('temp_armor_textures/Image_0.png').convert('RGB')
arr = np.array(base_img).astype(np.float32)
r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
lum = 0.299 * r + 0.587 * g + 0.114 * b

# Gold ornament detection: where original texture was gold/bronze OR red blood inside the gold areas
# Notice that all gold and red are parts of the decorative relief!
relief_mask = ((r > b + 15) | (r > 60)) & (lum > 40)
# But wait, let's look at the normal map (Image_2):
# The normal map has the true 3D embossed relief of the spirals!
norm_img = Image.open('temp_armor_textures/Image_2.png').convert('RGB')
norm_arr = np.array(norm_img).astype(np.float32)
# In a normal map, flat surface is ~ [128, 128, 255] (Z pointing straight out).
# Where there is relief, the normal deviates from [128, 128, 255]!
nz = norm_arr[:,:,2]
nx = norm_arr[:,:,0] - 128.0
ny = norm_arr[:,:,1] - 128.0
tilt = np.sqrt(nx**2 + ny**2)

print(f"Normal tilt mean: {np.mean(tilt):.2f}, max: {np.max(tilt):.2f}")

# Let's save a view of the relief mask filled cleanly
raw_gold = (((r > b + 12) & (lum > 55)) | ((r > 80) & (r > g * 1.1))).astype(np.uint8) * 255
img_gold = Image.fromarray(raw_gold).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.GaussianBlur(1.2))
img_gold.save('temp_render/gold_clean_mask.png')
print("Saved clean gold mask")
