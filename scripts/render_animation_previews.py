import bpy
import os
import math
import mathutils

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_GLB = os.path.join(BASE_DIR, 'assets_source', 'models', 'jarbees_suit.glb')
OUT_DIR = r"C:\Users\xiphos-pc1\.gemini\antigravity-ide\brain\867d484e-abba-4579-b255-781ac6743d34"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC_GLB)

scene = bpy.context.scene
scene.render.resolution_x = 768
scene.render.resolution_y = 768

if not scene.world:
    scene.world = bpy.data.worlds.new("World")
scene.world.color = (0.02, 0.025, 0.035)

arm = [o for o in scene.objects if o.type == 'ARMATURE'][0]
bpy.context.view_layer.objects.active = arm

# Luces
key_l = bpy.data.lights.new('Key', 'AREA')
key_l.energy = 120
key_l.size = 2.0
key_obj = bpy.data.objects.new('Key', key_l)
key_obj.location = (1.2, -2.5, 1.2)
scene.collection.objects.link(key_obj)

fill_l = bpy.data.lights.new('Fill', 'AREA')
fill_l.energy = 70
fill_l.size = 2.5
fill_l.color = (0.35, 0.65, 1.0)
fill_obj = bpy.data.objects.new('Fill', fill_l)
fill_obj.location = (-1.5, -2.0, 0.5)
scene.collection.objects.link(fill_obj)

rim_l = bpy.data.lights.new('Rim', 'AREA')
rim_l.energy = 90
rim_l.size = 1.8
rim_l.color = (0.8, 0.95, 1.0)
rim_obj = bpy.data.objects.new('Rim', rim_l)
rim_obj.location = (0.0, 2.2, 1.5)
scene.collection.objects.link(rim_obj)

cam_d = bpy.data.cameras.new('Cam')
cam_d.lens = 50
cam_obj = bpy.data.objects.new('Cam', cam_d)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

# Poses clave a renderizar (Fase 1, Fase 2 y Fase 3)
poses = [
    # Fase 1
    ('nexo_idle', 15, (1.4, -2.6, 0.1), (0.0, 0.0, -0.05)),
    ('nexo_walk', 9, (1.5, -2.5, -0.1), (0.0, 0.0, -0.1)),
    ('nexo_run', 11, (1.6, -2.5, 0.0), (0.0, 0.0, -0.05)),
    # Fase 2: Peso e Impacto
    ('nexo_jump_start', 6, (1.5, -2.4, -0.2), (0.0, 0.0, -0.1)),
    ('nexo_jump_loop', 12, (1.6, -2.5, 0.1), (0.0, 0.0, 0.0)),
    ('nexo_jump_land', 6, (1.5, -2.3, -0.2), (0.0, 0.0, -0.15)),
    ('nexo_heavy_fall', 12, (1.6, -2.5, 0.1), (0.0, 0.0, 0.0)),
    ('nexo_heavy_land', 16, (1.4, -2.2, -0.15), (0.0, -0.1, -0.38)),
    ('nexo_recovery', 15, (1.5, -2.4, -0.1), (0.0, 0.0, -0.1)),
    ('nexo_crouch', 24, (1.5, -2.3, -0.2), (0.0, 0.0, -0.15)),
    ('nexo_emote_salute', 20, (1.2, -2.0, 0.2), (0.0, 0.0, 0.2)),
    ('nexo_emote_thumbs_up', 20, (1.2, -2.0, 0.2), (0.0, 0.0, 0.2)),
    ('nexo_emote_point', 20, (1.3, -2.2, 0.15), (0.0, 0.0, 0.15)),
    ('nexo_emote_beckon', 20, (1.2, -2.0, 0.2), (0.0, 0.0, 0.2)),
    ('nexo_emote_cheer', 22, (1.4, -2.4, 0.2), (0.0, 0.0, 0.2)),
    # Fase 3
    ('nexo_hover', 15, (1.4, -2.6, 0.1), (0.0, 0.0, -0.05)),
    ('nexo_fly_forward', 20, (1.6, -2.4, 0.2), (0.0, 0.0, 0.1)),
    ('nexo_boost', 15, (1.8, -2.3, 0.2), (0.0, 0.0, 0.1)),
    ('nexo_air_brake', 8, (1.5, -2.4, 0.1), (0.0, 0.0, 0.0)),
    ('nexo_landing', 14, (1.4, -2.2, -0.15), (0.0, -0.1, -0.38)),
]

for act_name, frame, cam_pos, look_at in poses:
    act = bpy.data.actions.get(act_name)
    if not act:
        print(f"⚠️ Acción {act_name} no encontrada")
        continue

    arm.animation_data.action = act
    scene.frame_set(frame)

    cam_obj.location = cam_pos
    dir_vec = (mathutils.Vector(look_at) - mathutils.Vector(cam_pos)).normalized()
    cam_obj.rotation_euler = dir_vec.to_track_quat('-Z', 'Y').to_euler()

    out_file = os.path.join(OUT_DIR, f"preview_{act_name}.png")
    scene.render.filepath = out_file
    bpy.ops.render.render(write_still=True)
    print(f"📸 Guardada pose {act_name} (frame {frame}): {out_file}")

print("✨ Todas las poses renderizadas con éxito!")
