import bpy
import math
import mathutils
import os
import numpy as np
from PIL import Image, ImageFilter

# -------------------------------------------------------------
# 1. TEXTURE SYNTHESIS (JARBEES OFFICIAL SUIT PALETTE)
# -------------------------------------------------------------
os.makedirs('assets_source/models/jarbees_armor', exist_ok=True)
base_img = Image.open('temp_armor_textures/Image_0.png').convert('RGB')
mr_img = Image.open('temp_armor_textures/Image_1.png').convert('RGB')
norm_img = Image.open('temp_armor_textures/Image_2.png')

arr = np.array(base_img).astype(np.float32)
r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
lum = 0.299 * r + 0.587 * g + 0.114 * b

# Robust masks
# 1. Ornaments mask (golden spirals, reliefs, collar scrollwork, leaf fan)
raw_ornament = (((r > b + 10) | (r > 65)) & (lum > 35) & (r > g * 0.92)).astype(np.uint8) * 255
# Morphological closing with PIL to make it solid and smooth
img_ornament = Image.fromarray(raw_ornament).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.0))
ornament_soft = np.array(img_ornament).astype(np.float32) / 255.0

# 2. Crevices / Edge borders around ornaments (the old blood/groove areas)
red_ratio = (r + 1.0) / (g + b + 2.0)
raw_crevice = ((red_ratio > 1.25) & (r > 48)).astype(np.uint8) * 255
img_crevice = Image.fromarray(raw_crevice).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
crevice_soft = np.array(img_crevice).astype(np.float32) / 255.0

# Normalize masks so they partition smoothly
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
# Green = Roughness: Base 0.25, Titanium Relieves 0.16, Violet Crevices 0.22
rough_opt1 = base_plate_soft * (0.25 * 255.0) + ornament_soft * (0.16 * 255.0) + crevice_soft * (0.22 * 255.0)
# Blue = Metallic: Base 0.84, Titanium Relieves 0.92, Violet Crevices 0.80
metal_opt1 = base_plate_soft * (0.84 * 255.0) + ornament_soft * (0.92 * 255.0) + crevice_soft * (0.80 * 255.0)
mr_opt1[:,:,0] = 255 # Occlusion
mr_opt1[:,:,1] = np.clip(rough_opt1, 0, 255)
mr_opt1[:,:,2] = np.clip(metal_opt1, 0, 255)
path_mr = os.path.abspath('assets_source/models/jarbees_armor/cuirass_mr.png')
Image.fromarray(mr_opt1.astype(np.uint8)).save(path_mr)

norm_path = os.path.abspath('assets_source/models/jarbees_armor/cuirass_normal.png')
norm_img.save(norm_path)

print("Generated PBR textures successfully!")

# -------------------------------------------------------------
# 2. BLENDER FIT, RIGGING AND RENDERING
# -------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)

SUIT_PATH = r'C:\Projects\Jarbees_the_game\assets_source\models\jarbees_suit.glb'
bpy.ops.import_scene.gltf(filepath=SUIT_PATH)
arm = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]

for name in ['JarBees_Armor_PlexusShield', 'JarBees_Armor_PlexusHook']:
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)

ARMOR_PATH = r'G:\new models\armor.glb'
existing_objs = set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=ARMOR_PATH)
new_objs = [o for o in bpy.context.scene.objects if o not in existing_objs]
cuirass_mesh = [o for o in new_objs if o.type == 'MESH'][0]

mw = cuirass_mesh.matrix_world.copy()
cuirass_mesh.parent = None
cuirass_mesh.matrix_world = mw

for o in new_objs:
    if o.type == 'EMPTY':
        bpy.data.objects.remove(o, do_unlink=True)

cuirass_mesh.name = "JarBees_Cuirass_Pechera"

# Measure bounds
xs = [v.co.x for v in cuirass_mesh.data.vertices]
ys = [v.co.y for v in cuirass_mesh.data.vertices]
zs = [v.co.z for v in cuirass_mesh.data.vertices]
w_orig = max(xs) - min(xs)
h_orig = max(zs) - min(zs)
cx = (min(xs) + max(xs)) / 2.0
cy = (min(ys) + max(ys)) / 2.0
cz = (min(zs) + max(zs)) / 2.0

# EXTENDED HEIGHT AND WIDTH:
# Scale width to 0.435, height to 0.455 (covers all the way up to collar/chin)
scale_x = 0.435 / w_orig
scale_y = 0.435 / w_orig
scale_z = 0.455 / h_orig

for v in cuirass_mesh.data.vertices:
    v.co.x = (v.co.x - cx) * scale_x
    v.co.y = (v.co.y - cy) * scale_y
    v.co.z = (v.co.z - cz) * scale_z

# Pitch forward 9.5 degrees and translate Z center up to 0.418, Y to -0.191
m_rot = mathutils.Euler((math.radians(9.5), 0, 0)).to_matrix().to_4x4()
m_trans = mathutils.Matrix.Translation(mathutils.Vector((0.000, -0.191, 0.418)))
cuirass_mesh.data.transform(m_trans @ m_rot)
cuirass_mesh.matrix_world = mathutils.Matrix.Identity(4)

# Rigging to spine
inv_arm_mat = arm.matrix_world.inverted()
cuirass_mesh.data.transform(inv_arm_mat)
cuirass_mesh.parent = arm
cuirass_mesh.matrix_local = mathutils.Matrix.Identity(4)

mod = cuirass_mesh.modifiers.new(name='Armature', type='ARMATURE')
mod.object = arm
vg = cuirass_mesh.vertex_groups.new(name='mixamorig:Spine1_03')
vg.add([v.index for v in cuirass_mesh.data.vertices], 1.0, 'REPLACE')

# Connect new PBR textures to the material
mat = cuirass_mesh.data.materials[0]
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links

bsdf = nodes.get('Principled BSDF')
img_base_node = nodes.get('Image Texture')
img_mr_node = nodes.get('Image Texture.001')
norm_map_node = nodes.get('Normal Map')
img_norm_node = nodes.get('Image Texture.002')

# Load and assign new textures
img_base_opt1 = bpy.data.images.load(path_opt1)
img_mr = bpy.data.images.load(path_mr)
img_norm = bpy.data.images.load(norm_path)

if img_base_node:
    img_base_node.image = img_base_opt1
if img_mr_node:
    img_mr_node.image = img_mr
if img_norm_node:
    img_norm_node.image = img_norm

# Lighting and camera
scene = bpy.context.scene
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024

if not scene.world:
    scene.world = bpy.data.worlds.new("World")
scene.world.color = (0.02, 0.025, 0.035)

key_light = bpy.data.lights.new(name="KeyLight", type='AREA')
key_light.energy = 110
key_light.size = 1.4
key_light.color = (1.0, 0.97, 0.94)
key_obj = bpy.data.objects.new("KeyLight", key_light)
key_obj.location = (0.8, -1.8, 1.1)
scene.collection.objects.link(key_obj)

fill_light = bpy.data.lights.new(name="FillLight", type='AREA')
fill_light.energy = 65
fill_light.size = 2.2
fill_light.color = (0.35, 0.65, 1.0)
fill_obj = bpy.data.objects.new("FillLight", fill_light)
fill_obj.location = (-1.1, -1.7, 0.4)
scene.collection.objects.link(fill_obj)

rim_light = bpy.data.lights.new(name="RimLight", type='AREA')
rim_light.energy = 95
rim_light.size = 1.5
rim_light.color = (0.8, 0.9, 1.0)
rim_obj = bpy.data.objects.new("RimLight", rim_light)
rim_obj.location = (0.0, 2.0, 1.5)
scene.collection.objects.link(rim_obj)

cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 55
cam_obj = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Camera framing: Torso + Chin + Shoulders
cam_obj.location = (0.0, -1.45, 0.44)
cam_obj.rotation_euler = (math.radians(90.0), 0, 0)

# Render Option 1
os.makedirs('temp_render', exist_ok=True)
out_render_opt1 = os.path.abspath('temp_render/cuirass_jarbees_opt1_front.png')
scene.render.filepath = out_render_opt1
bpy.ops.render.render(write_still=True)
print("Rendered Option 1:", out_render_opt1)

# Render Option 2 (Violet Spirals)
img_base_opt2 = bpy.data.images.load(path_opt2)
if img_base_node:
    img_base_node.image = img_base_opt2
out_render_opt2 = os.path.abspath('temp_render/cuirass_jarbees_opt2_front.png')
scene.render.filepath = out_render_opt2
bpy.ops.render.render(write_still=True)
print("Rendered Option 2:", out_render_opt2)
