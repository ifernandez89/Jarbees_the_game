"""
Script para inspeccionar el modelo de abeja en Blender
Verifica animaciones, geometría y optimizaciones necesarias

Uso:
    blender --background --python inspect_bee_model.py
"""

import bpy
import os
import sys

def inspect_bee_model():
    # Limpiar escena
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Ruta del modelo
    bee_path = r"C:\Projects\Jarbees_the_game\public\models\bee.glb"
    
    if not os.path.exists(bee_path):
        print(f"❌ ERROR: No se encontró el modelo en {bee_path}")
        return
    
    print(f"📂 Cargando modelo desde: {bee_path}")
    
    # Importar GLB
    bpy.ops.import_scene.gltf(filepath=bee_path)
    
    # Información general
    print("\n" + "="*60)
    print("🐝 INSPECCIÓN DEL MODELO DE ABEJA")
    print("="*60)
    
    # Objetos en la escena
    print(f"\n📦 Objetos en la escena: {len(bpy.data.objects)}")
    for obj in bpy.data.objects:
        print(f"   - {obj.name} ({obj.type})")
    
    # Meshes
    print(f"\n🔺 Meshes: {len(bpy.data.meshes)}")
    total_verts = 0
    total_faces = 0
    for mesh in bpy.data.meshes:
        verts = len(mesh.vertices)
        faces = len(mesh.polygons)
        total_verts += verts
        total_faces += faces
        print(f"   - {mesh.name}: {verts} vértices, {faces} caras")
    
    print(f"\n   TOTAL: {total_verts} vértices, {total_faces} caras")
    
    # Animaciones
    print(f"\n🎬 Animaciones: {len(bpy.data.actions)}")
    if bpy.data.actions:
        for action in bpy.data.actions:
            print(f"   - {action.name}")
            print(f"     Duración: {action.frame_range[1] - action.frame_range[0]} frames")
            print(f"     Canales: {len(action.fcurves)}")
    else:
        print("   ⚠️ NO HAY ANIMACIONES - Necesario crear aleteo")
    
    # Materiales
    print(f"\n🎨 Materiales: {len(bpy.data.materials)}")
    for mat in bpy.data.materials:
        print(f"   - {mat.name}")
        if mat.use_nodes:
            print(f"     Nodos: {len(mat.node_tree.nodes)}")
    
    # Texturas
    print(f"\n🖼️  Imágenes: {len(bpy.data.images)}")
    for img in bpy.data.images:
        if img.filepath:
            size = img.size[0] * img.size[1] if img.size[0] > 0 else 0
            print(f"   - {img.name}: {img.size[0]}x{img.size[1]} ({size} pixels)")
    
    # Recomendaciones
    print("\n" + "="*60)
    print("💡 RECOMENDACIONES")
    print("="*60)
    
    if total_verts > 5000:
        print("⚠️  El modelo tiene muchos vértices (>5000)")
        print("   → Considerar decimación o retopología")
    else:
        print(f"✅ Vértices OK ({total_verts} < 5000)")
    
    if not bpy.data.actions:
        print("❌ NO HAY ANIMACIONES")
        print("   → Necesario crear animación de aleteo de alas")
    else:
        print(f"✅ Animaciones presentes ({len(bpy.data.actions)})")
    
    # Verificar si hay alas identificables
    wing_objects = [obj for obj in bpy.data.objects if 'wing' in obj.name.lower() or 'ala' in obj.name.lower()]
    if wing_objects:
        print(f"\n✅ Alas encontradas: {len(wing_objects)}")
        for obj in wing_objects:
            print(f"   - {obj.name}")
    else:
        print("\n⚠️  No se encontraron objetos con 'wing' o 'ala' en el nombre")
        print("   Objetos disponibles para animar:")
        for obj in bpy.data.objects:
            if obj.type == 'MESH':
                print(f"   - {obj.name}")
    
    print("\n" + "="*60)
    print("✅ INSPECCIÓN COMPLETA")
    print("="*60)

if __name__ == "__main__":
    inspect_bee_model()
