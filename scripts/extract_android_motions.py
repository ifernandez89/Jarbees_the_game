"""
JarBees Humanoid Motion Extractor & Library Builder
Lee los archivos FBX de animaciones de Mixamo del Androide,
extrae las curvas cinemáticas completas (huesos, cuaterniones, euler, traslación)
y las serializa en un formato JSON universal reusable para cualquier modelo humanoide.
"""

import bpy
import json
import math
import mathutils
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_DIR = r"G:\new models\android-3d-model\android-3d-model"
OUTPUT_DIR = os.path.join(BASE_DIR, 'assets_source', 'animations')
OUTPUT_JSON = os.path.join(OUTPUT_DIR, 'humanoid_motion_library.json')

FBX_FILES = [
    ('walk', 'Android Walk.fbx', 'Ciclo de caminata bipedal natural y balanceado'),
    ('run', 'Android Running.fbx', 'Ciclo de carrera atlética con zancada amplia'),
    ('attack', 'Android_Attack.fbx', 'Ataque cuerpo a cuerpo / golpe cinético'),
    ('jump', 'Android_Jump.fbx', 'Secuencia completa de salto vertical acrobático'),
    ('idle', 'Android_Idle.fbx', 'Reposo orgánico con respiración y micro-movimientos'),
    ('damage', 'Android_Damage.fbx', 'Reacción de impacto recibido y recuperación de guardia'),
    ('dead', 'Android_Dead.fbx', 'Colapso cinemático de derrota / desactivación de sistemas')
]

def clean_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)

def extract_all_motions():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("🚀 =================================================================")
    print("📦 INICIANDO EXTRACCIÓN UNIVERSAL DE MOVIMIENTOS ANDROIDE A JSON")
    print(f"📂 Carpeta Origen: {SOURCE_DIR}")
    print(f"💾 Archivo Destino: {OUTPUT_JSON}")
    print("🚀 =================================================================")

    motion_library = {
        "metadata": {
            "name": "JarBees Universal Humanoid Motion Library",
            "version": "1.0.0",
            "source": "Android 3D Model Mixamo Rig",
            "coordinate_system": "Blender / glTF (Z-Up in Blender, Y-Up in Three.js)",
            "frame_rate": 30,
            "created_at": "2026-10-20",
            "total_animations": len(FBX_FILES)
        },
        "bones_hierarchy": [],
        "animations": {}
    }

    first_file = True

    for anim_id, fbx_filename, description in FBX_FILES:
        fbx_path = os.path.join(SOURCE_DIR, fbx_filename)
        if not os.path.exists(fbx_path):
            print(f"⚠️ [OMITIR] Archivo no encontrado: {fbx_path}")
            continue

        clean_scene()
        print(f"\n📂 Importando {fbx_filename} ({anim_id})...")
        bpy.ops.import_scene.fbx(filepath=fbx_path)

        arm_objs = [o for o in bpy.data.objects if o.type == 'ARMATURE']
        if not arm_objs:
            print(f"❌ No se encontró Armature en {fbx_filename}")
            continue

        arm = arm_objs[0]

        # Guardar lista canónica de huesos en el primer archivo
        if first_file:
            motion_library["bones_hierarchy"] = [b.name for b in arm.data.bones]
            print(f"  ✓ Jerarquía de {len(motion_library['bones_hierarchy'])} huesos registrada.")
            first_file = False

        if not bpy.data.actions:
            print(f"⚠️ Sin acciones en {fbx_filename}")
            continue

        action = bpy.data.actions[0]
        arm.animation_data.action = action

        start_frame = int(action.frame_range[0])
        end_frame = int(action.frame_range[1])
        frame_count = end_frame - start_frame + 1
        duration_sec = frame_count / 30.0

        print(f"  ⚡ Acción: '{action.name}' | Frames: {start_frame}..{end_frame} ({frame_count} frames, {duration_sec:.2f}s)")

        anim_data = {
            "id": anim_id,
            "filename": fbx_filename,
            "description": description,
            "fps": 30,
            "start_frame": start_frame,
            "end_frame": end_frame,
            "frame_count": frame_count,
            "duration": round(duration_sec, 4),
            "keyframes": []
        }

        # Extraer fotograma a fotograma
        for f in range(start_frame, end_frame + 1):
            bpy.context.scene.frame_set(f)
            bpy.context.view_layer.update()

            frame_entry = {
                "frame": f - start_frame,
                "time": round((f - start_frame) / 30.0, 4),
                "bones": {}
            }

            for pbone in arm.pose.bones:
                if pbone.rotation_mode == 'QUATERNION':
                    quat = pbone.rotation_quaternion.copy()
                    euler = quat.to_euler('XYZ')
                elif pbone.rotation_mode in ['XYZ', 'XZY', 'YXZ', 'YZX', 'ZXY', 'ZYX']:
                    euler = pbone.rotation_euler.copy()
                    quat = pbone.rotation_euler.to_quaternion()
                else:
                    quat = pbone.rotation_quaternion.copy()
                    euler = quat.to_euler('XYZ')

                bone_entry = {
                    "quat": [round(quat.w, 5), round(quat.x, 5), round(quat.y, 5), round(quat.z, 5)],
                    "euler_deg": [round(math.degrees(euler.x), 2), round(math.degrees(euler.y), 2), round(math.degrees(euler.z), 2)]
                }

                if 'Hips' in pbone.name:
                    loc = pbone.location
                    bone_entry["loc"] = [round(loc.x, 5), round(loc.y, 5), round(loc.z, 5)]

                frame_entry["bones"][pbone.name] = bone_entry

            anim_data["keyframes"].append(frame_entry)

        motion_library["animations"][anim_id] = anim_data
        print(f"  ✅ {anim_id} procesado con éxito ({len(anim_data['keyframes'])} frames extraídos)")

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as jf:
        json.dump(motion_library, jf, indent=2, ensure_ascii=False)

    size_mb = os.path.getsize(OUTPUT_JSON) / (1024 * 1024)
    print(f"\n🎉 ¡Librería Universal de Movimiento exportada con éxito!")
    print(f"💾 Archivo: {OUTPUT_JSON} ({size_mb:.2f} MB)")
    print(f"✨ Animaciones registradas: {list(motion_library['animations'].keys())}")

if __name__ == '__main__':
    extract_all_motions()
