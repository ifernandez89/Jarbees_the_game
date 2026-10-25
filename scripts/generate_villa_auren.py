"""
Villa Auren 3D Environment Generator — Phase 1: Architectural Blockout
=====================================================================
Generates Villa Auren (Alpine Research Residence) procedurally using Blender bpy.

Key architectural specs:
- Total terrain footprint: 32m x 30m
- Building footprint: ~20m x 16m
- Levels: S1 (Underground Lab), PB (Ground Floor), P1 (Upper Floor + Mezzanine + Balcony)
- Vertical Glazed Flight Gallery / Atrium: 4m x 4m vertical flight shaft
- Auren scale reference: 1.85m tall (doors: 2.3m, ceilings: 3.2m PB / 3.0m P1 / 3.2m S1)
- Clean non-destructive collections, PBR blockout materials, UV mapping, metadata JSON
"""

import bpy
import bmesh
import math
import os
import json
from mathutils import Vector, Euler

# ---------------------------------------------------------------------------
# Output Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
BLEND_OUT = os.path.join(PROJECT_ROOT, "villa_auren.blend")
GLB_OUT_PUBLIC = os.path.join(PROJECT_ROOT, "public", "models", "villa_auren.glb")
GLB_OUT_ROOT = os.path.join(PROJECT_ROOT, "villa_auren.glb")
WORLD_JSON_PUBLIC = os.path.join(PROJECT_ROOT, "public", "data", "villa_auren.world.json")
WORLD_JSON_ROOT = os.path.join(PROJECT_ROOT, "villa_auren.world.json")

# ---------------------------------------------------------------------------
# Reset Scene & Configure Metric System
# ---------------------------------------------------------------------------
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0
    scene.unit_settings.length_unit = 'METERS'

# ---------------------------------------------------------------------------
# Collection Manager
# ---------------------------------------------------------------------------
COLLECTION_NAMES = [
    "ENV_Terrain",
    "ARCH_Structure",
    "ARCH_Doors_Windows",
    "ARCH_Roof",
    "INT_Furniture",
    "INT_Laboratory",
    "EXT_Vegetation",
    "COL_Colliders",
    "NAV_Walkable",
    "META_InteractionPoints",
]

COLLECTIONS = {}

def setup_collections():
    scene = bpy.context.scene
    root_col = scene.collection
    for name in COLLECTION_NAMES:
        col = bpy.data.collections.new(name)
        root_col.children.link(col)
        COLLECTIONS[name] = col

def link_to_collection(obj, col_name):
    if col_name in COLLECTIONS:
        if obj.name not in COLLECTIONS[col_name].objects:
            COLLECTIONS[col_name].objects.link(obj)
    else:
        if obj.name not in bpy.context.scene.collection.objects:
            bpy.context.scene.collection.objects.link(obj)

def link_to_nav_and_col(obj, is_walkable=False, is_collider=True):
    if is_collider and "COL_Colliders" in COLLECTIONS:
        if obj.name not in COLLECTIONS["COL_Colliders"].objects:
            COLLECTIONS["COL_Colliders"].objects.link(obj)
    if is_walkable and "NAV_Walkable" in COLLECTIONS:
        if obj.name not in COLLECTIONS["NAV_Walkable"].objects:
            COLLECTIONS["NAV_Walkable"].objects.link(obj)

# ---------------------------------------------------------------------------
# Material Library (PBR Blockout Palette)
# ---------------------------------------------------------------------------
MATERIALS = {}

def create_pbr_material(name, base_color, roughness=0.5, metallic=0.0, emission_color=(0,0,0,1), emission_strength=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (300, 0)

    principled = nodes.new(type='ShaderNodeBsdfPrincipled')
    principled.location = (0, 0)
    principled.inputs['Base Color'].default_value = base_color
    principled.inputs['Roughness'].default_value = roughness
    principled.inputs['Metallic'].default_value = metallic
    
    # Emission support (Blender 4.x / 5.x Principled BSDF has 'Emission Color' and 'Emission Strength')
    if 'Emission Color' in principled.inputs:
        principled.inputs['Emission Color'].default_value = emission_color
    if 'Emission Strength' in principled.inputs:
        principled.inputs['Emission Strength'].default_value = emission_strength
    
    if alpha < 1.0:
        if 'Alpha' in principled.inputs:
            principled.inputs['Alpha'].default_value = alpha
        mat.blend_method = 'BLEND'
    
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])
    MATERIALS[name] = mat
    return mat

def init_materials():
    # Warm Alpine Palette & High-Tech Lab Accents
    create_pbr_material("MAT_Stone_Foundation", (0.22, 0.23, 0.25, 1.0), roughness=0.85, metallic=0.05)
    create_pbr_material("MAT_Stone_Pavement",   (0.35, 0.36, 0.38, 1.0), roughness=0.80, metallic=0.02)
    create_pbr_material("MAT_Wood_Timber",       (0.18, 0.11, 0.06, 1.0), roughness=0.65, metallic=0.0)
    create_pbr_material("MAT_Wood_Floor",        (0.42, 0.28, 0.16, 1.0), roughness=0.45, metallic=0.0)
    create_pbr_material("MAT_Wall_Plaster",      (0.85, 0.83, 0.80, 1.0), roughness=0.90, metallic=0.0)
    create_pbr_material("MAT_Roof_Slate",        (0.12, 0.13, 0.16, 1.0), roughness=0.70, metallic=0.1)
    create_pbr_material("MAT_Metal_Dark",        (0.10, 0.12, 0.14, 1.0), roughness=0.35, metallic=0.85)
    create_pbr_material("MAT_Metal_Gold",        (0.88, 0.70, 0.15, 1.0), roughness=0.30, metallic=0.90)
    create_pbr_material("MAT_Glass_Glazing",     (0.65, 0.85, 0.95, 0.4), roughness=0.10, alpha=0.40)
    create_pbr_material("MAT_Lab_Concrete",      (0.30, 0.32, 0.35, 1.0), roughness=0.60, metallic=0.15)
    create_pbr_material("MAT_JarBees_Cyan_Glow", (0.15, 0.85, 1.0,  1.0), roughness=0.20, emission_color=(0.15, 0.85, 1.0, 1.0), emission_strength=4.5)
    create_pbr_material("MAT_Aurelium_Gold_Glow",(1.0,  0.82, 0.10, 1.0), roughness=0.20, emission_color=(1.0,  0.82, 0.10, 1.0), emission_strength=4.0)

# ---------------------------------------------------------------------------
# Geometry Helpers (Clean Box, UV Projection, Normal Recalculation)
# ---------------------------------------------------------------------------
def create_box(name, size, location, material=None, col_name="ARCH_Structure", is_collider=True, is_walkable=False):
    """Creates an axis-aligned box with clean geometry, UV cube projection and assigned material."""
    if not is_walkable and any(w in name.lower() for w in ["floor", "terrain", "pavement", "balcony", "dais", "walkway"]):
        is_walkable = True
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    
    # Scale each axis
    sx, sy, sz = size
    bmesh.ops.scale(bm, vec=Vector((sx, sy, sz)), verts=bm.verts)
    
    bm.to_mesh(mesh)
    bm.free()
    
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    link_to_collection(obj, col_name)
    
    if material and material in MATERIALS:
        mesh.materials.append(MATERIALS[material])
    
    # Generate UVs with simple smart projection / cube projection
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    
    # Unwrap UVs
    bm = bmesh.new()
    bm.from_mesh(mesh)
    uv_layer = bm.loops.layers.uv.new("UVMap")
    
    # Simple planar/cube UV mapping per face normal
    for face in bm.faces:
        norm = face.normal
        for loop in face.loops:
            v = loop.vert.co
            if abs(norm.z) > 0.6:
                uv = Vector((v.x, v.y))
            elif abs(norm.x) > 0.6:
                uv = Vector((v.y, v.z))
            else:
                uv = Vector((v.x, v.z))
            loop[uv_layer].uv = uv * 0.5  # 1 UV unit per 2 meters
    
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    
    link_to_nav_and_col(obj, is_walkable=is_walkable, is_collider=is_collider)

    obj.select_set(False)
    return obj

def create_staircase(name, start_pos, rise, run, width, steps_count, material, col_name="ARCH_Structure"):
    """Creates a functional staircase with solid step treads for raycasting ground collisions."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    
    step_rise = rise / steps_count
    step_run = run / steps_count
    
    for i in range(steps_count):
        # Step box bottom starts at start_pos.z (solid underneath for no-fall through raycast)
        z_bottom = start_pos.z
        z_top = start_pos.z + (i + 1) * step_rise
        y_front = start_pos.y + i * step_run
        y_back = start_pos.y + (i + 1) * step_run
        x_min = start_pos.x - width / 2.0
        x_max = start_pos.x + width / 2.0
        
        # 8 vertices for step box
        v0 = bm.verts.new((x_min, y_front, z_bottom))
        v1 = bm.verts.new((x_max, y_front, z_bottom))
        v2 = bm.verts.new((x_max, y_back, z_bottom))
        v3 = bm.verts.new((x_min, y_back, z_bottom))
        v4 = bm.verts.new((x_min, y_front, z_top))
        v5 = bm.verts.new((x_max, y_front, z_top))
        v6 = bm.verts.new((x_max, y_back, z_top))
        v7 = bm.verts.new((x_min, y_back, z_top))
        
        bm.faces.new((v0, v1, v5, v4)) # front
        bm.faces.new((v1, v2, v6, v5)) # right
        bm.faces.new((v2, v3, v7, v6)) # back
        bm.faces.new((v3, v0, v4, v7)) # left
        bm.faces.new((v4, v5, v6, v7)) # top tread
        bm.faces.new((v3, v2, v1, v0)) # bottom
    
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    
    obj = bpy.data.objects.new(name, mesh)
    link_to_collection(obj, col_name)
    link_to_nav_and_col(obj, is_walkable=True, is_collider=True)
    if material in MATERIALS:
        mesh.materials.append(MATERIALS[material])
    mesh.update()
    return obj

def create_pitched_roof(name, location, width, length, height, overhang=0.8, material="MAT_Roof_Slate"):
    """Creates an alpine pitched roof (gabled / a dos aguas) with eaves overhang and vertical flight aperture."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    
    half_w = (width / 2.0) + overhang
    half_l = (length / 2.0) + overhang
    h = height
    
    # 6 vertices of a triangular prism (gabled roof) along Y axis
    v_s_left = bm.verts.new((-half_w, -half_l, 0))
    v_s_right = bm.verts.new((half_w, -half_l, 0))
    v_s_ridge = bm.verts.new((0, -half_l, h))
    
    v_n_left = bm.verts.new((-half_w, half_l, 0))
    v_n_right = bm.verts.new((half_w, half_l, 0))
    v_n_ridge = bm.verts.new((0, half_l, h))
    
    bm.faces.new((v_s_left, v_s_right, v_s_ridge)) # South gable
    bm.faces.new((v_n_right, v_n_left, v_n_ridge)) # North gable
    bm.faces.new((v_s_left, v_s_ridge, v_n_ridge, v_n_left)) # West slope
    bm.faces.new((v_s_ridge, v_s_right, v_n_right, v_n_ridge)) # East slope
    bm.faces.new((v_s_right, v_s_left, v_n_left, v_n_right)) # Bottom ceiling
    
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    link_to_collection(obj, "ARCH_Roof")
    link_to_nav_and_col(obj, is_walkable=True, is_collider=True)
    if material in MATERIALS:
        mesh.materials.append(MATERIALS[material])
    mesh.update()
    return obj

def create_empty_marker(name, location, rotation_euler=(0,0,0), marker_type='PLAIN_AXES', size=1.0):
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_type = marker_type
    empty.empty_display_size = size
    empty.location = location
    empty.rotation_euler = rotation_euler
    link_to_collection(empty, "META_InteractionPoints")
    return empty

# ---------------------------------------------------------------------------
# BUILD VILLA AUREN — PHASE 1: ARCHITECTURAL BLOCKOUT
# ---------------------------------------------------------------------------
def build_phase_1():
    print(">>> [Villa Auren] Building Phase 1: Architectural Blockout...")

    # =======================================================================
    # 1. ENV_Terrain: 32m x 30m Local Terrain Slab & Courtyard
    # =======================================================================
    # Base terrain slab (Z = -0.4 to 0.0)
    create_box(
        name="ENV_Terrain_Base",
        size=(32.0, 30.0, 0.4),
        location=(0.0, 0.0, -0.2),
        material="MAT_Stone_Foundation",
        col_name="ENV_Terrain"
    )
    # Courtyard front pavement (X: -14 to 14, Y: -14 to -5.5, Z = 0.05)
    create_box(
        name="ENV_Courtyard_Pavement",
        size=(28.0, 8.5, 0.1),
        location=(0.0, -9.75, 0.05),
        material="MAT_Stone_Pavement",
        col_name="ENV_Terrain"
    )
    # Low perimeter stone retaining walls (North, East, West borders of plot)
    create_box(
        name="ENV_Wall_West",
        size=(0.6, 28.0, 0.8),
        location=(-15.5, 0.0, 0.4),
        material="MAT_Stone_Foundation",
        col_name="ENV_Terrain"
    )
    create_box(
        name="ENV_Wall_East",
        size=(0.6, 28.0, 0.8),
        location=(15.5, 0.0, 0.4),
        material="MAT_Stone_Foundation",
        col_name="ENV_Terrain"
    )
    create_box(
        name="ENV_Wall_North",
        size=(31.6, 0.6, 0.8),
        location=(0.0, 14.5, 0.4),
        material="MAT_Stone_Foundation",
        col_name="ENV_Terrain"
    )
    # Auren Landing Dais in Courtyard (Hexagonal platform blockout)
    create_box(
        name="ENV_Landing_Dais_Base",
        size=(4.4, 4.4, 0.15),
        location=(0.0, -10.5, 0.075),
        material="MAT_Metal_Dark",
        col_name="ENV_Terrain"
    )
    create_box(
        name="ENV_Landing_Dais_Core",
        size=(2.0, 2.0, 0.05),
        location=(0.0, -10.5, 0.175),
        material="MAT_JarBees_Cyan_Glow",
        col_name="ENV_Terrain"
    )

    # =======================================================================
    # 2. ARCH_Structure: Foundation & Floors
    # =======================================================================
    # Building Footprint: Width X = 20m (-10.0 to 10.0), Depth Y = 16m (-6.0 to 10.0)

    # Ground Floor Slab (PB) — Z = 0.0 to 0.25 (with opening for vertical flight shaft & lab stairs)
    # West wing PB slab: X [-10, -2], Y [-6, 10]
    create_box(
        name="ARCH_Floor_PB_West",
        size=(8.0, 16.0, 0.25),
        location=(-6.0, 2.0, 0.125),
        material="MAT_Wood_Floor",
        col_name="ARCH_Structure"
    )
    # East wing PB slab: X [2, 10], Y [-6, 10]
    create_box(
        name="ARCH_Floor_PB_East",
        size=(8.0, 16.0, 0.25),
        location=(6.0, 2.0, 0.125),
        material="MAT_Wood_Floor",
        col_name="ARCH_Structure"
    )
    # Central entrance / vestibule PB slab: X [-2, 2], Y [-6, -2]
    create_box(
        name="ARCH_Floor_PB_Vestibule",
        size=(4.0, 4.0, 0.25),
        location=(0.0, -4.0, 0.125),
        material="MAT_Stone_Pavement",
        col_name="ARCH_Structure"
    )
    # Central flight gallery PB base: X [-2, 2], Y [-2, 2]
    create_box(
        name="ARCH_Floor_PB_Atrium_Base",
        size=(4.0, 4.0, 0.25),
        location=(0.0, 0.0, 0.125),
        material="MAT_Metal_Dark",
        col_name="ARCH_Structure"
    )
    # Rear North PB hallway slab: X [-2, 2], Y [6, 10]
    create_box(
        name="ARCH_Floor_PB_NorthHall",
        size=(4.0, 4.0, 0.25),
        location=(0.0, 8.0, 0.125),
        material="MAT_Wood_Floor",
        col_name="ARCH_Structure"
    )

    # First Floor Slab (P1) — Z = 3.2 to 3.45 (0.25m thickness)
    # Note: Double-height void over Living Room X [-9, -2], Y [-2, 4]
    # and Flight Gallery shaft X [-2, 2], Y [-2, 2] are open!
    create_box(
        name="ARCH_Floor_P1_MasterSuite",
        size=(8.0, 6.0, 0.25),
        location=(-6.0, 7.0, 3.325),
        material="MAT_Wood_Floor",
        col_name="ARCH_Structure"
    )
    create_box(
        name="ARCH_Floor_P1_FrontBalcony",
        size=(8.0, 2.5, 0.25),
        location=(-6.0, -4.75, 3.325),
        material="MAT_Wood_Timber",
        col_name="ARCH_Structure"
    )
    create_box(
        name="ARCH_Floor_P1_Workshop_East",
        size=(8.0, 8.0, 0.25),
        location=(6.0, -2.0, 3.325),
        material="MAT_Metal_Dark",
        col_name="ARCH_Structure"
    )
    create_box(
        name="ARCH_Floor_P1_Library_NorthEast",
        size=(8.0, 8.0, 0.25),
        location=(6.0, 6.0, 3.325),
        material="MAT_Wood_Floor",
        col_name="ARCH_Structure"
    )
    # Mezzanine gallery walkway connecting East and West wings (Y: 2.5 to 5.5, X: -2 to 2)
    create_box(
        name="ARCH_Floor_P1_Mezzanine_Walkway",
        size=(4.0, 3.0, 0.25),
        location=(0.0, 4.0, 3.325),
        material="MAT_Wood_Timber",
        col_name="ARCH_Structure"
    )
    # Exterior Cantilevered Balcony overlooking Courtyard: X [-4, 4], Y [-8, -6]
    create_box(
        name="ARCH_Floor_P1_Observation_Balcony",
        size=(8.0, 2.0, 0.25),
        location=(0.0, -7.0, 3.325),
        material="MAT_Wood_Timber",
        col_name="ARCH_Structure"
    )
    # Balcony perimeter railing
    create_box("ARCH_Railing_Balcony_Front", size=(8.0, 0.15, 1.05), location=(0.0, -7.925, 3.975), material="MAT_Metal_Dark")
    create_box("ARCH_Railing_Balcony_West",  size=(0.15, 2.0, 1.05), location=(-3.925, -7.0, 3.975), material="MAT_Metal_Dark")
    create_box("ARCH_Railing_Balcony_East",  size=(0.15, 2.0, 1.05), location=(3.925, -7.0, 3.975), material="MAT_Metal_Dark")

    # =======================================================================
    # 3. ARCH_Structure: Exterior & Interior Walls
    # =======================================================================
    # Wall thickness: 0.35m. Height PB = 3.2m (Z: 0.0 to 3.2). Height P1 = 3.0m (Z: 3.4 to 6.4)
    
    # Ground Floor Exterior Walls (PB, Z = 1.6)
    # West Wall PB (X = -9.825)
    create_box("ARCH_Wall_PB_Ext_West", size=(0.35, 16.0, 3.2), location=(-9.825, 2.0, 1.6), material="MAT_Stone_Foundation")
    # East Wall PB (X = 9.825)
    create_box("ARCH_Wall_PB_Ext_East", size=(0.35, 16.0, 3.2), location=(9.825, 2.0, 1.6), material="MAT_Stone_Foundation")
    # North Wall PB (Y = 9.825)
    create_box("ARCH_Wall_PB_Ext_North", size=(19.3, 0.35, 3.2), location=(0.0, 9.825, 1.6), material="MAT_Stone_Foundation")
    # South Wall PB (Y = -5.825) — With wide entrance portal (door opening X [-1.5, 1.5], lintel above)
    create_box("ARCH_Wall_PB_Ext_South_West", size=(8.0, 0.35, 3.2), location=(-5.75, -5.825, 1.6), material="MAT_Stone_Foundation")
    create_box("ARCH_Wall_PB_Ext_South_East", size=(8.0, 0.35, 3.2), location=(5.75, -5.825, 1.6), material="MAT_Stone_Foundation")
    # Lintel over entrance door (Z = 2.4 to 3.2)
    create_box("ARCH_Wall_PB_Entrance_Lintel", size=(3.5, 0.35, 0.8), location=(0.0, -5.825, 2.8), material="MAT_Wood_Timber")

    # Upper Floor Exterior Walls (P1, Z = 4.9, Height = 3.0m)
    # West Wall P1
    create_box("ARCH_Wall_P1_Ext_West", size=(0.35, 16.0, 3.0), location=(-9.825, 2.0, 4.9), material="MAT_Wall_Plaster")
    # East Wall P1
    create_box("ARCH_Wall_P1_Ext_East", size=(0.35, 16.0, 3.0), location=(9.825, 2.0, 4.9), material="MAT_Wall_Plaster")
    # North Wall P1
    create_box("ARCH_Wall_P1_Ext_North", size=(19.3, 0.35, 3.0), location=(0.0, 9.825, 4.9), material="MAT_Wall_Plaster")
    # South Wall P1 — with balcony portal opening X [-2, 2]
    create_box("ARCH_Wall_P1_Ext_South_West", size=(7.5, 0.35, 3.0), location=(-6.0, -5.825, 4.9), material="MAT_Wall_Plaster")
    create_box("ARCH_Wall_P1_Ext_South_East", size=(7.5, 0.35, 3.0), location=(6.0, -5.825, 4.9), material="MAT_Wall_Plaster")
    create_box("ARCH_Wall_P1_Balcony_Lintel", size=(4.5, 0.35, 0.6), location=(0.0, -5.825, 6.1), material="MAT_Wood_Timber")

    # Timber Structural Columns (Alpine Architecture)
    col_coords = [
        (-9.6, -5.6), (-9.6, 9.6), (9.6, -5.6), (9.6, 9.6),
        (-2.0, -2.0), (-2.0, 2.0), (2.0, -2.0), (2.0, 2.0),
        (-2.0, 5.5), (2.0, 5.5)
    ]
    for idx, (cx, cy) in enumerate(col_coords):
        create_box(
            f"ARCH_Column_Timber_{idx+1}",
            size=(0.4, 0.4, 6.4),
            location=(cx, cy, 3.2),
            material="MAT_Wood_Timber",
            col_name="ARCH_Structure"
        )

    # Interior Partitions (PB)
    # Living Room / Kitchen partition (Y = 4.0, X [-9.6, -2.0]) with door opening
    create_box("ARCH_Wall_PB_Int_Kitchen_West", size=(4.0, 0.2, 3.2), location=(-7.6, 4.0, 1.6), material="MAT_Wall_Plaster")
    create_box("ARCH_Wall_PB_Int_Kitchen_Lintel", size=(1.6, 0.2, 0.8), location=(-4.8, 4.0, 2.8), material="MAT_Wall_Plaster")
    create_box("ARCH_Wall_PB_Int_Kitchen_East", size=(2.0, 0.2, 3.2), location=(-3.0, 4.0, 1.6), material="MAT_Wall_Plaster")

    # Tech Office / Study partition (Y = 4.0, X [2.0, 9.6])
    create_box("ARCH_Wall_PB_Int_Study_West", size=(2.0, 0.2, 3.2), location=(3.0, 4.0, 1.6), material="MAT_Wall_Plaster")
    create_box("ARCH_Wall_PB_Int_Study_Lintel", size=(1.6, 0.2, 0.8), location=(4.8, 4.0, 2.8), material="MAT_Wall_Plaster")
    create_box("ARCH_Wall_PB_Int_Study_East", size=(3.2, 0.2, 3.2), location=(7.2, 4.0, 1.6), material="MAT_Wall_Plaster")

    # Fireplace Niche (Grand Salon West Wall)
    create_box("ARCH_Fireplace_Mantel", size=(1.2, 3.0, 1.8), location=(-9.2, 1.0, 0.9), material="MAT_Stone_Foundation")
    create_box("ARCH_Fireplace_Chimney_Shaft", size=(1.0, 1.4, 8.5), location=(-9.3, 1.0, 4.25), material="MAT_Stone_Foundation")

    # =======================================================================
    # 4. VERTICAL GLAZED FLIGHT GALLERY / ATRIUM (Auren Mach Flight Channel)
    # =======================================================================
    # Unobstructed 4m x 4m vertical flight shaft from PB (Z=0.0) through P1 to Roof Skylight (Z=8.8)
    # Glazed frames on corner columns
    create_box("ARCH_Gallery_Glazing_West", size=(0.1, 4.0, 6.4), location=(-2.0, 0.0, 3.2), material="MAT_Glass_Glazing", col_name="ARCH_Doors_Windows")
    create_box("ARCH_Gallery_Glazing_East", size=(0.1, 4.0, 6.4), location=(2.0, 0.0, 3.2), material="MAT_Glass_Glazing", col_name="ARCH_Doors_Windows")
    create_box("ARCH_Gallery_Glazing_South", size=(4.0, 0.1, 6.4), location=(0.0, -2.0, 3.2), material="MAT_Glass_Glazing", col_name="ARCH_Doors_Windows")
    # North side connects to Mezzanine and upper bridge

    # Mezzanine protective railings overlooking the Grand Salon void
    create_box("ARCH_Railing_Mezzanine_West", size=(0.1, 6.0, 1.05), location=(-2.05, 1.0, 3.975), material="MAT_Metal_Dark")
    create_box("ARCH_Railing_Mezzanine_South", size=(7.6, 0.1, 1.05), location=(-5.8, -2.05, 3.975), material="MAT_Metal_Dark")

    # =======================================================================
    # 5. STAIRCASES (PB to P1 & S1 to PB)
    # =======================================================================
    # Ground Floor (PB) to Upper Floor (P1):
    # Stair starts at X = 3.5, Y = 6.0, rising South along East corridor to landing at Z = 1.7, then turning
    create_staircase(
        name="ARCH_Stair_PB_to_Mid",
        start_pos=Vector((3.5, 6.0, 0.25)),
        rise=1.5,
        run=2.4,
        width=1.4,
        steps_count=9,
        material="MAT_Wood_Timber"
    )
    # Stair landing at Z = 1.75
    create_box("ARCH_Stair_Landing_PB_P1", size=(1.8, 1.6, 0.25), location=(3.5, 8.8, 1.75), material="MAT_Wood_Timber")
    # Upper run from landing to P1 floor (Z = 1.875 to 3.325)
    create_staircase(
        name="ARCH_Stair_Mid_to_P1",
        start_pos=Vector((5.2, 8.8, 1.875)),
        rise=1.45,
        run=-2.4,
        width=1.4,
        steps_count=9,
        material="MAT_Wood_Timber"
    )

    # =======================================================================
    # 6. S1: UNDERGROUND RESEARCH LABORATORY (Subsuelo)
    # =======================================================================
    # Lab floor at Z = -3.5m, ceiling at Z = -0.3m (3.2m clearance)
    # Lab floor slab (X: -10 to 10, Y: -6 to 10)
    create_box(
        name="ARCH_Lab_Floor_Slab",
        size=(20.0, 16.0, 0.3),
        location=(0.0, 2.0, -3.65),
        material="MAT_Lab_Concrete",
        col_name="INT_Laboratory"
    )
    # Lab perimeter foundation walls (Z = -3.5 to -0.3, Height = 3.2m, center Z = -1.9)
    create_box("ARCH_Lab_Wall_West",  size=(0.4, 16.0, 3.2), location=(-9.8, 2.0, -1.9), material="MAT_Lab_Concrete", col_name="INT_Laboratory")
    create_box("ARCH_Lab_Wall_East",  size=(0.4, 16.0, 3.2), location=(9.8, 2.0, -1.9), material="MAT_Lab_Concrete", col_name="INT_Laboratory")
    create_box("ARCH_Lab_Wall_North", size=(19.2, 0.4, 3.2), location=(0.0, 9.8, -1.9), material="MAT_Lab_Concrete", col_name="INT_Laboratory")
    create_box("ARCH_Lab_Wall_South", size=(19.2, 0.4, 3.2), location=(0.0, -5.8, -1.9), material="MAT_Lab_Concrete", col_name="INT_Laboratory")

    # Lab Staircase from S1 (Z = -3.5) up to PB North Hallway (Z = 0.25):
    create_staircase(
        name="ARCH_Stair_S1_to_PB",
        start_pos=Vector((0.0, 4.0, -3.5)),
        rise=3.65,
        run=5.0,
        width=1.6,
        steps_count=18,
        material="MAT_Metal_Dark",
        col_name="ARCH_Structure"
    )

    # JarBees Core Vault (Underground focal point)
    # Elevated hexagonal dais for the Core
    create_box("LAB_Core_Dais_Base", size=(4.0, 4.0, 0.3), location=(0.0, 7.5, -3.35), material="MAT_Metal_Dark", col_name="INT_Laboratory")
    create_box("LAB_Core_Dais_Ring", size=(3.0, 3.0, 0.1), location=(0.0, 7.5, -3.15), material="MAT_Metal_Gold", col_name="INT_Laboratory")
    # Floating JarBees Core Blockout (glowing octahedron/cube blockout)
    create_box("LAB_JarBees_Core_Sphere", size=(1.2, 1.2, 1.2), location=(0.0, 7.5, -2.1), material="MAT_JarBees_Cyan_Glow", col_name="INT_Laboratory")

    # Auren Recharge / Maintenance Pad Alcove (East wing of S1: X = 6.5, Y = -1.0)
    create_box("LAB_Auren_Charging_Station", size=(2.6, 2.6, 0.2), location=(6.5, -1.0, -3.4), material="MAT_Metal_Dark", col_name="INT_Laboratory")
    create_box("LAB_Auren_Charging_Ring", size=(2.0, 2.0, 0.05), location=(6.5, -1.0, -3.275), material="MAT_Aurelium_Gold_Glow", col_name="INT_Laboratory")

    # Main Control Console Blockout (Center S1: X = 0.0, Y = -1.0)
    create_box("LAB_Console_Main_Bank", size=(4.2, 1.4, 0.95), location=(0.0, -1.0, -3.025), material="MAT_Metal_Dark", col_name="INT_Laboratory")
    create_box("LAB_Console_Holo_Strip", size=(3.8, 0.3, 0.05), location=(0.0, -1.0, -2.525), material="MAT_JarBees_Cyan_Glow", col_name="INT_Laboratory")

    # Server Equipment Racks (West wing of S1: X = -6.5, Y = 0.0)
    for s_idx in range(4):
        create_box(
            f"LAB_Server_Rack_{s_idx+1}",
            size=(1.2, 1.8, 2.6),
            location=(-7.5, -3.0 + s_idx * 2.2, -2.2),
            material="MAT_Metal_Dark",
            col_name="INT_Laboratory"
        )

    # =======================================================================
    # 7. ARCH_Roof: Alpine Pitched Roof & Flight Hatch Aperture
    # =======================================================================
    # Roof sits on top of P1 walls (Z = 6.4m). Ridge reaches Z = 9.2m (height = 2.8m).
    # Building is 20m wide (X: -10 to 10), 16m deep (Y: -6 to 10).
    create_pitched_roof(
        name="ARCH_Roof_Alpine_Main",
        location=(0.0, 2.0, 6.4),
        width=20.4,
        length=16.8,
        height=2.8,
        overhang=1.0,
        material="MAT_Roof_Slate"
    )

    # Vertical Flight Hatch Dormer Opening in Roof above the Atrium (X [-2, 2], Y [-2, 2])
    # Timber framing around the open skylight
    create_box("ARCH_Roof_Flight_Col_NW", size=(0.4, 0.4, 3.0), location=(-2.0, 2.0, 7.9), material="MAT_Wood_Timber", col_name="ARCH_Roof")
    create_box("ARCH_Roof_Flight_Col_NE", size=(0.4, 0.4, 3.0), location=(2.0, 2.0, 7.9), material="MAT_Wood_Timber", col_name="ARCH_Roof")
    create_box("ARCH_Roof_Flight_Col_SW", size=(0.4, 0.4, 3.0), location=(-2.0, -2.0, 7.9), material="MAT_Wood_Timber", col_name="ARCH_Roof")
    create_box("ARCH_Roof_Flight_Col_SE", size=(0.4, 0.4, 3.0), location=(2.0, -2.0, 7.9), material="MAT_Wood_Timber", col_name="ARCH_Roof")
    create_box("ARCH_Roof_Flight_Lintel_N", size=(4.4, 0.4, 0.4), location=(0.0, 2.0, 9.2), material="MAT_Wood_Timber", col_name="ARCH_Roof")
    create_box("ARCH_Roof_Flight_Lintel_S", size=(4.4, 0.4, 0.4), location=(0.0, -2.0, 9.2), material="MAT_Wood_Timber", col_name="ARCH_Roof")

    # =======================================================================
    # 8. META_InteractionPoints: Spawns, Doors & Flight Markers
    # =======================================================================
    # Spawn 1: Courtyard Dais (Primary entrance spawn)
    create_empty_marker("SPAWN_Courtyard_Dais", location=Vector((0.0, -10.5, 0.3)), rotation_euler=(0, 0, 0))
    # Spawn 2: Underground Lab Core
    create_empty_marker("SPAWN_Lab_Core", location=Vector((0.0, 5.0, -3.3)), rotation_euler=(0, 0, 0))
    # Spawn 3: Upper Balcony
    create_empty_marker("SPAWN_Balcony_Flight", location=Vector((0.0, -7.0, 3.5)), rotation_euler=(0, 0, 0))
    # Door Interaction: Main Entrance
    create_empty_marker("INTERACT_Door_Main_Entrance", location=Vector((0.0, -5.8, 1.2)), rotation_euler=(0, 0, 0))
    # Door Interaction: Lab Stair Access
    create_empty_marker("INTERACT_Stair_Lab", location=Vector((0.0, 3.8, 0.5)), rotation_euler=(0, 0, 0))
    # Flight Portal: Roof Egress
    create_empty_marker("FLIGHT_Corridor_Sky_Egress", location=Vector((0.0, 0.0, 9.8)), rotation_euler=(0, 0, 0))
    # Flight Portal: Ground Atrium Shaft
    create_empty_marker("FLIGHT_Corridor_Atrium_Base", location=Vector((0.0, 0.0, 0.5)), rotation_euler=(0, 0, 0))
    # Interaction: Auren Charging Station
    create_empty_marker("INTERACT_Auren_Chamber", location=Vector((6.5, -1.0, -3.1)), rotation_euler=(0, 0, 0))
    # Interaction: Fireplace Hearth
    create_empty_marker("INTERACT_Fireplace_Hearth", location=Vector((-8.2, 1.0, 0.3)), rotation_euler=(0, 0, 0))

    print(">>> [Villa Auren] Phase 1 Geometry Built Successfully.")

# ---------------------------------------------------------------------------
# World Metadata Exporter (JSON)
# ---------------------------------------------------------------------------
def generate_world_metadata():
    """
    Generates villa_auren.world.json compatible with Three.js engine and auren_mansion_nodes.json specs.
    Note coordinate transform:
    Blender X -> Three.js X
    Blender Y -> Three.js -Z
    Blender Z -> Three.js Y
    """
    def to_three_pos(bx, by, bz):
        return [round(bx, 2), round(bz, 2), round(-by, 2)]

    world_meta = {
        "zoneId": "villa_auren_alpine",
        "version": "1.0.0",
        "name": "Villa Auren · Alpine Research Residence",
        "description": "Original compact alpine residence combining warm timber/stone architecture with a discreet subterranean research lab. Generated procedurally with Blender bpy for seamless Three.js integration.",
        "author": "Auren WorldLab & JarBees Core",
        "worldDimensions": {
            "terrainMeters": [32.0, 30.0],
            "buildingFootprintMeters": [20.0, 16.0],
            "characterHeightMeters": 1.85,
            "groundCeilingHeight": 3.2,
            "upperCeilingHeight": 3.0,
            "labCeilingHeight": 3.2,
            "levels": ["S1_Lab", "PB_Residence", "P1_Gallery", "ROOF_Alpine"]
        },
        "spawnPoints": [
            {
                "id": "spawn_courtyard_dais",
                "name": "Courtyard Dais · Main Arrival",
                "position": to_three_pos(0.0, -10.5, 0.35),
                "rotation": [0, 0, 0],
                "isPrimary": True,
                "description": "Hexagonal arrival dais in the stone courtyard with direct view of the alpine facade."
            },
            {
                "id": "spawn_lab_core",
                "name": "Quantum Lab Core · Subterranean Vault",
                "position": to_three_pos(0.0, 5.0, -3.25),
                "rotation": [0, 3.1416, 0],
                "isPrimary": False,
                "description": "Underground research facility before the illuminated JarBees Core."
            },
            {
                "id": "spawn_balcony_flight",
                "name": "Alpine Mezzanine Balcony · Mach Egress",
                "position": to_three_pos(0.0, -7.0, 3.55),
                "rotation": [0, 0, 0],
                "isPrimary": False,
                "description": "Cantilevered upper balcony overlooking courtyard with direct runway into mountain flight."
            }
        ],
        "rooms": [
            {
                "id": "courtyard_gardens",
                "name": "Courtyard & Arrival Dais",
                "floor": "EXT",
                "bounds": {
                    "min": [-16.0, 0.0, 5.5],
                    "max": [16.0, 4.0, 15.0]
                },
                "features": ["Hexagonal Dais", "Stone Pavement", "Perimeter Stone Walls"]
            },
            {
                "id": "vestibule_entrance",
                "name": "Entrance Vestibule & Foyer",
                "floor": "PB",
                "bounds": {
                    "min": [-3.5, 0.0, 2.0],
                    "max": [3.5, 3.4, 6.0]
                },
                "features": ["Alpine Double Door", "Stone Tiles", "Coat Lockers"]
            },
            {
                "id": "grand_salon",
                "name": "Grand Salon & Fireplace Hearth",
                "floor": "PB",
                "bounds": {
                    "min": [-10.0, 0.0, -4.5],
                    "max": [-2.0, 6.4, 2.0]
                },
                "features": ["Stone Hearth", "Double-Height Void", "Timber Trusses"]
            },
            {
                "id": "kitchen_dining",
                "name": "Kitchen & Alpine Dining Wing",
                "floor": "PB",
                "bounds": {
                    "min": [-10.0, 0.0, -10.0],
                    "max": [-2.0, 3.4, -4.0]
                },
                "features": ["Cedar Dining Table", "Pantry", "Terrace Access"]
            },
            {
                "id": "jarbees_study",
                "name": "JarBees Tech Study & Office",
                "floor": "PB",
                "bounds": {
                    "min": [2.0, 0.0, -4.0],
                    "max": [10.0, 3.4, 4.0]
                },
                "features": ["Terminal Desk", "Schematic Wall", "North Windows"]
            },
            {
                "id": "vertical_flight_gallery",
                "name": "Vertical Glazed Flight Gallery",
                "floor": "PB_P1_ROOF",
                "bounds": {
                    "min": [-2.2, 0.0, -2.2],
                    "max": [2.2, 9.8, 2.2]
                },
                "features": ["Vertical Mach Launch Shaft", "Glass Envelope", "Roof Egress Hatch"]
            },
            {
                "id": "mezzanine_library",
                "name": "Mezzanine Library & Walkway",
                "floor": "P1",
                "bounds": {
                    "min": [2.0, 3.4, -10.0],
                    "max": [10.0, 6.8, 2.0]
                },
                "features": ["Bookcases", "Reading Lounge", "Overlook Railing"]
            },
            {
                "id": "auren_workshop",
                "name": "Auren Armor Maintenance Workshop",
                "floor": "P1",
                "bounds": {
                    "min": [2.0, 3.4, -4.0],
                    "max": [10.0, 6.8, 4.0]
                },
                "features": ["Armor Gantry", "Tool Matrix", "Telemetry Screen"]
            },
            {
                "id": "master_suite",
                "name": "Private Alpine Bedroom Suite",
                "floor": "P1",
                "bounds": {
                    "min": [-10.0, 3.4, -10.0],
                    "max": [-2.0, 6.8, -4.0]
                },
                "features": ["Timber Bed", "Mountain Panorama Windows", "Balcony Door"]
            },
            {
                "id": "underground_laboratory",
                "name": "Subterranean Research Lab & Core Vault",
                "floor": "S1",
                "bounds": {
                    "min": [-10.0, -3.7, -10.0],
                    "max": [10.0, 0.0, 6.0]
                },
                "features": ["Illuminated JarBees Core (432 Hz)", "Auren Fast-Charge Gantry", "Server Matrix", "Quantum Console"]
            },
            {
                "id": "alpine_rooftops",
                "name": "Alpine Slate Rooftops & Flight Egress",
                "floor": "ROOF",
                "bounds": {
                    "min": [-11.0, 6.4, -11.0],
                    "max": [11.0, 10.0, 7.0]
                },
                "features": ["Slate Gabled Roofs", "Chimney Tower", "Flight Aperture Hatch"]
            }
        ],
        "flightCorridors": [
            {
                "id": "flight_atrium_shaft",
                "name": "Atrium Vertical Flight Corridor",
                "entryPoint": to_three_pos(0.0, 0.0, 0.5),
                "exitPoint": to_three_pos(0.0, 0.0, 9.8),
                "diameterMeters": 4.0,
                "flightModesAllowed": ["HOVER", "SUPERSONIC_BURST"]
            },
            {
                "id": "flight_balcony_launch",
                "name": "Mezzanine Balcony Runway",
                "launchPoint": to_three_pos(0.0, -7.0, 3.6),
                "vector": [0, 0.2, 1.0],
                "flightModesAllowed": ["CRUISE", "MACH_RUN"]
            }
        ],
        "interactionPoints": [
            {"id": "door_main_entrance", "type": "DOOR", "position": to_three_pos(0.0, -5.8, 1.2)},
            {"id": "stair_lab_access", "type": "STAIRCASE", "position": to_three_pos(0.0, 3.8, 0.5)},
            {"id": "jarbees_core_console", "type": "CONSOLE", "position": to_three_pos(0.0, 5.0, -3.0)},
            {"id": "auren_charging_pad", "type": "CHARGING_DOCK", "position": to_three_pos(6.5, -1.0, -3.2)},
            {"id": "salon_fireplace", "type": "FIREPLACE", "position": to_three_pos(-8.2, 1.0, 0.3)}
        ]
    }

    with open(WORLD_JSON_PUBLIC, 'w', encoding='utf-8') as f:
        json.dump(world_meta, f, indent=2, ensure_ascii=False)
    with open(WORLD_JSON_ROOT, 'w', encoding='utf-8') as f:
        json.dump(world_meta, f, indent=2, ensure_ascii=False)

    print(f">>> [Villa Auren] Saved metadata: {WORLD_JSON_PUBLIC}")

# ---------------------------------------------------------------------------
# Export Scene (.blend & .glb)
# ---------------------------------------------------------------------------
def export_scene():
    # Save .blend
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
    print(f">>> [Villa Auren] Saved blend: {BLEND_OUT}")

    # Export GLB (glTF 2.0 Binary)
    # Blender's export_scene.gltf handles Z-up to Y-up conversion automatically.
    # Set export_apply=True to apply all modifiers and transforms cleanly.
    os.makedirs(os.path.dirname(GLB_OUT_PUBLIC), exist_ok=True)
    
    export_args = dict(
        filepath=GLB_OUT_PUBLIC,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_materials='EXPORT'
    )
    
    bpy.ops.export_scene.gltf(**export_args)
    print(f">>> [Villa Auren] Exported GLB to: {GLB_OUT_PUBLIC}")

    # Also copy to root GLB deliverable
    try:
        import shutil
        shutil.copyfile(GLB_OUT_PUBLIC, GLB_OUT_ROOT)
        print(f">>> [Villa Auren] Copied GLB to: {GLB_OUT_ROOT}")
    except Exception as e:
        print(f"Warning copying GLB to root: {e}")

# ---------------------------------------------------------------------------
# Main Execution
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    reset_scene()
    setup_collections()
    init_materials()
    build_phase_1()
    generate_world_metadata()
    export_scene()
    print(">>> [Villa Auren] Phase 1 Architectural Blockout Completed Successfully!")
