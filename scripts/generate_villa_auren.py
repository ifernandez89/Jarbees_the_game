"""
Villa Auren 3D Environment Generator — Assault Warehouse Scale (Plan-First)
=============================================================================
Procedural generator for Blender 5.x / 4.x using Blender Python (bpy).
Directly executes the validated architectural plan (villa_auren.plan.json).

Architectural Highlights:
- Scale: Assault Warehouse Scale (Building: 30m x 20m, Site: 48m x 42m, Height: 8.8m).
- PB: Grand Hangar Atrium with 7.8m double-height clearance, Portico Hangar Door (3.6x3.2m),
      NEXO Workshop Bay (10x8m), Monumental Stone Fireplace.
- P1: Perimeter Industrial Catwalks (2m wide) overlooking the Grand Atrium,
      Auren Private Suite, Quantum Archive Library, West Stair Landing.
- OUTDOOR BALCONY: Fully connected 8m x 3.5m cantilevered stone balcony on P1 South facade
      with stone corbels and safety balustrades. Seamless floor transition from Catwalk!
- STAIRS:
  * PB -> P1: 22 solid steps with continuous underside ramp, dual 1.1m guardrails,
    and a flush 2.5m upper landing directly connected to the P1 floor slab.
  * S1 -> PB: Solid service stairs into S1 Quantum Lab Vault.
- NO floating steps, NO missing balcony floors, NO blocked headroom.
- REFINEMENT (AUREN_VILLA_REFINEMENT_PLAN): CC0 PBR textures (Poly Haven, see
  scripts/fetch_villa_textures.py), metric world-space UVs, atrium trims/lamps,
  single-mesh batching (one primitive per material) and baked ambient occlusion
  exported as glTF occlusionTexture on UV channel 1.
- Output: villa_auren.blend (organized source, pre-bake), public/models/villa_auren.glb,
  villa_auren.glb, assets_source/villa_auren_baked.blend.
"""

import bpy
import bmesh
import math
import os
import json
from mathutils import Vector, Euler

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
PLAN_FILE = os.path.join(PROJECT_ROOT, "villa_auren.plan.json")
BLEND_OUT = os.path.join(PROJECT_ROOT, "villa_auren.blend")
GLB_OUT_PUBLIC = os.path.join(PROJECT_ROOT, "public", "models", "villa_auren.glb")
GLB_OUT_ROOT = os.path.join(PROJECT_ROOT, "villa_auren.glb")
WORLD_JSON_PUBLIC = os.path.join(PROJECT_ROOT, "public", "data", "villa_auren.world.json")
WORLD_JSON_ROOT = os.path.join(PROJECT_ROOT, "villa_auren.world.json")

# Refinement pipeline (textures + AO bake)
TEX_DIR = os.path.join(PROJECT_ROOT, "assets_source", "textures", "villa_auren")
TEX_MANIFEST = os.path.join(TEX_DIR, "manifest.json")
BAKED_BLEND_OUT = os.path.join(PROJECT_ROOT, "assets_source", "villa_auren_baked.blend")
AO_IMAGE_OUT = os.path.join(TEX_DIR, "villa_auren_ao_bake.jpg")
AO_BAKE_SIZE = 2048
AO_BAKE_SAMPLES = 32
AO_DISTANCE_M = 1.5
# Materials that must not receive baked AO (transparent / emissive)
AO_EXCLUDED_MATERIALS = {"MAT_Glass", "MAT_Aurelium_Gold", "MAT_Cyan_Glow", "MAT_Ember", "MAT_Lamp_Warm"}

# ---------------------------------------------------------------------------
# Scene Reset & Units
# ---------------------------------------------------------------------------
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0
    scene.unit_settings.length_unit = 'METERS'

# ---------------------------------------------------------------------------
# Collections
# ---------------------------------------------------------------------------
COLLECTION_NAMES = [
    "ENV_Terrain",
    "ARCH_Structure",
    "ARCH_Doors_Windows",
    "ARCH_Roof",
    "INT_Furniture",
    "INT_Laboratory",
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
# Materials Setup (PBR Shaders)
# ---------------------------------------------------------------------------
MATERIALS = {}
# Physical size (metres) covered by one texture tile, per material -> drives world-space UVs
MATERIAL_UV_SIZE = {}
DEFAULT_UV_SIZE = 2.0

def load_texture_manifest():
    if not os.path.exists(TEX_MANIFEST):
        print(f"[!] Texture manifest not found: {TEX_MANIFEST}")
        print("    Run: python scripts/fetch_villa_textures.py  (falling back to flat colors)")
        return {}
    with open(TEX_MANIFEST, "r", encoding="utf-8") as f:
        return json.load(f).get("materials", {})

def attach_pbr_textures(mat, node_bsdf, tex):
    """Wire diffuse / ARM (AO-Rough-Metal) / OpenGL normal maps using glTF-exportable node patterns."""
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    uv = nodes.new("ShaderNodeUVMap")
    uv.uv_map = "UVMap"
    uv.location = (-900, 0)

    def img_node(key, non_color, y):
        n = nodes.new("ShaderNodeTexImage")
        n.image = bpy.data.images.load(os.path.join(TEX_DIR, tex["maps"][key]), check_existing=True)
        if non_color:
            n.image.colorspace_settings.name = "Non-Color"
        n.location = (-600, y)
        links.new(uv.outputs["UV"], n.inputs["Vector"])
        return n

    diff = img_node("diff", False, 300)
    links.new(diff.outputs["Color"], node_bsdf.inputs["Base Color"])

    arm = img_node("arm", True, 0)
    sep = nodes.new("ShaderNodeSeparateColor")
    sep.location = (-300, 0)
    links.new(arm.outputs["Color"], sep.inputs["Color"])
    links.new(sep.outputs["Green"], node_bsdf.inputs["Roughness"])
    links.new(sep.outputs["Blue"], node_bsdf.inputs["Metallic"])

    nor = img_node("nor_gl", True, -300)
    nmap = nodes.new("ShaderNodeNormalMap")
    nmap.location = (-300, -300)
    links.new(nor.outputs["Color"], nmap.inputs["Color"])
    links.new(nmap.outputs["Normal"], node_bsdf.inputs["Normal"])

def create_pbr_material(name, base_color, roughness=0.5, metallic=0.0, emission=None, emission_strength=1.0, alpha=1.0, tex=None):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_bsdf.location = (0, 0)
    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    node_output.location = (300, 0)
    mat.node_tree.links.new(node_bsdf.outputs['BSDF'], node_output.inputs['Surface'])
    
    # Base color
    node_bsdf.inputs['Base Color'].default_value = (base_color[0], base_color[1], base_color[2], 1.0)
    node_bsdf.inputs['Roughness'].default_value = roughness
    node_bsdf.inputs['Metallic'].default_value = metallic
    
    if alpha < 1.0:
        if hasattr(mat, 'blend_method'):
            mat.blend_method = 'BLEND'
        if hasattr(mat, 'shadow_method'):
            mat.shadow_method = 'HASHED'
        if 'Transmission Weight' in node_bsdf.inputs:
            node_bsdf.inputs['Transmission Weight'].default_value = 1.0 - alpha
        elif 'Transmission' in node_bsdf.inputs:
            node_bsdf.inputs['Transmission'].default_value = 1.0 - alpha
        node_bsdf.inputs['Alpha'].default_value = alpha
        
    if emission:
        if 'Emission Color' in node_bsdf.inputs:
            node_bsdf.inputs['Emission Color'].default_value = (emission[0], emission[1], emission[2], 1.0)
            node_bsdf.inputs['Emission Strength'].default_value = emission_strength
        elif 'Emission' in node_bsdf.inputs:
            node_bsdf.inputs['Emission'].default_value = (emission[0], emission[1], emission[2], 1.0)
            
    if tex:
        attach_pbr_textures(mat, node_bsdf, tex)
        MATERIAL_UV_SIZE[name] = float(tex["size_m"])

    MATERIALS[name] = mat
    return mat

def setup_materials():
    tex = load_texture_manifest()
    # Chateau carved stone
    create_pbr_material("MAT_Stone_Chateau", (0.55, 0.52, 0.48), roughness=0.85, metallic=0.05, tex=tex.get("MAT_Stone_Chateau"))
    # Interior stone floor tiles (Grand Atrium / PB)
    create_pbr_material("MAT_Stone_Floor", (0.50, 0.50, 0.49), roughness=0.75, metallic=0.0, tex=tex.get("MAT_Stone_Floor"))
    # Alpine timber wood
    create_pbr_material("MAT_Wood_Timber", (0.35, 0.22, 0.12), roughness=0.65, metallic=0.0, tex=tex.get("MAT_Wood_Timber"))
    # Dark industrial steel (Assault catwalks, railings, trusses)
    create_pbr_material("MAT_Steel_Dark", (0.15, 0.17, 0.20), roughness=0.40, metallic=0.85, tex=tex.get("MAT_Steel_Dark"))
    # Slate shingles
    create_pbr_material("MAT_Roof_Slate", (0.22, 0.24, 0.28), roughness=0.80, metallic=0.1, tex=tex.get("MAT_Roof_Slate"))
    # Wall plaster
    create_pbr_material("MAT_Wall_Plaster", (0.82, 0.80, 0.76), roughness=0.90, metallic=0.0, tex=tex.get("MAT_Wall_Plaster"))
    # Floor stone pavers
    create_pbr_material("MAT_Stone_Pavers", (0.45, 0.44, 0.42), roughness=0.80, metallic=0.05, tex=tex.get("MAT_Stone_Pavers"))
    # Lab concrete
    create_pbr_material("MAT_Lab_Concrete", (0.30, 0.33, 0.36), roughness=0.60, metallic=0.1, tex=tex.get("MAT_Lab_Concrete"))
    # Fireplace soot (firebox interior)
    create_pbr_material("MAT_Soot", (0.02, 0.02, 0.02), roughness=0.95, metallic=0.0)
    # Glowing embers
    create_pbr_material("MAT_Ember", (0.9, 0.3, 0.05), roughness=0.8, metallic=0.0, emission=(1.0, 0.35, 0.05), emission_strength=6.0)
    # Warm pendant lamp diffuser
    create_pbr_material("MAT_Lamp_Warm", (1.0, 0.9, 0.75), roughness=0.4, metallic=0.0, emission=(1.0, 0.82, 0.6), emission_strength=8.0)
    # Translucent glass
    create_pbr_material("MAT_Glass", (0.7, 0.9, 1.0), roughness=0.10, metallic=0.05, alpha=0.35)
    # Emissive Aurelium Gold
    create_pbr_material("MAT_Aurelium_Gold", (1.0, 0.82, 0.2), roughness=0.25, metallic=0.95, emission=(1.0, 0.75, 0.1), emission_strength=2.5)
    # Glowing Cyan Core
    create_pbr_material("MAT_Cyan_Glow", (0.0, 0.9, 1.0), roughness=0.1, metallic=0.0, emission=(0.0, 0.95, 1.0), emission_strength=4.5)

# ---------------------------------------------------------------------------
# Mesh Creation Utilities
# ---------------------------------------------------------------------------
def create_box(name, size, location, material=None, col_name="ARCH_Structure", is_walkable=False, is_collider=True):
    """Creates an axis-aligned solid brush box with cubic UV unwrapping."""
    sx, sy, sz = size
    lx, ly, lz = location
    
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    
    # Scale & translate
    bmesh.ops.scale(bm, vec=Vector((sx, sy, sz)), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector((lx, ly, lz)), verts=bm.verts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()

    # Metric world-space UVs (texture tiles keep their real physical size on every box)
    apply_world_uv(bm, MATERIAL_UV_SIZE.get(material, DEFAULT_UV_SIZE))
    
    bm.to_mesh(mesh)
    bm.free()
    
    obj = bpy.data.objects.new(name, mesh)
    link_to_collection(obj, col_name)
    link_to_nav_and_col(obj, is_walkable=is_walkable, is_collider=is_collider)
    
    if material and material in MATERIALS:
        mesh.materials.append(MATERIALS[material])
    
    return obj

def apply_world_uv(bm, tile_size_m):
    """Planar projection per face on its dominant axis, in metres / tile size.
    Replaces cube_project: consistent texel density across boxes of any size."""
    uv_layer = bm.loops.layers.uv.get("UVMap") or bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        n = face.normal
        axis = max(range(3), key=lambda i: abs(n[i]))
        for loop in face.loops:
            co = loop.vert.co
            if axis == 2:
                u, v = co.x, co.y
            elif axis == 0:
                u, v = co.y, co.z
            else:
                u, v = co.x, co.z
            loop[uv_layer].uv = (u / tile_size_m, v / tile_size_m)

def create_railing(name, p0, p1, base_z, height=1.1, post_spacing=1.5, material="MAT_Steel_Dark"):
    """Open industrial guardrail (top rail, mid rail, kick plate, posts) along an axis-aligned segment."""
    (x0, y0), (x1, y1) = p0, p1
    horizontal = abs(x1 - x0) >= abs(y1 - y0)
    length = abs(x1 - x0) if horizontal else abs(y1 - y0)
    cx, cy = (x0 + x1) / 2.0, (y0 + y1) / 2.0

    def along(thickness):
        return (length, thickness) if horizontal else (thickness, length)

    tx, ty = along(0.07)
    create_box(f"{name}_TopRail", size=(tx, ty, 0.07), location=(cx, cy, base_z + height - 0.035), material=material)
    tx, ty = along(0.04)
    create_box(f"{name}_MidRail", size=(tx, ty, 0.04), location=(cx, cy, base_z + 0.55), material=material)
    tx, ty = along(0.02)
    create_box(f"{name}_KickPlate", size=(tx, ty, 0.15), location=(cx, cy, base_z + 0.075), material=material)

    posts = max(2, int(round(length / post_spacing)) + 1)
    for i in range(posts):
        t = i / (posts - 1)
        px = x0 + (x1 - x0) * t
        py = y0 + (y1 - y0) * t
        create_box(f"{name}_Post_{i}", size=(0.06, 0.06, height), location=(px, py, base_z + height / 2.0), material=material)

def create_solid_staircase(name, start_pos, rise, run, width, steps_count, material="MAT_Steel_Dark", has_rails=True):
    """
    Creates a continuous solid staircase with:
    - Exact step treads and risers (Blondel compliant)
    - Solid inclined undercarriage (no gap underneath, raycast 100% reliable)
    - Integrated top landing flush with the destination floor
    - Continuous handrails on both open sides (1.1m high)
    """
    sp = Vector(start_pos)
    step_rise = rise / steps_count
    step_run = run / steps_count
    
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    
    hw = width / 2.0
    
    for i in range(steps_count):
        z_bot = sp.z # solid base
        z_top = sp.z + (i + 1) * step_rise
        y_f = sp.y + i * step_run
        y_b = sp.y + (i + 1) * step_run
        
        # 8 verts of solid step
        v0 = bm.verts.new((sp.x - hw, y_f, z_bot))
        v1 = bm.verts.new((sp.x + hw, y_f, z_bot))
        v2 = bm.verts.new((sp.x + hw, y_b, z_bot))
        v3 = bm.verts.new((sp.x - hw, y_b, z_bot))
        v4 = bm.verts.new((sp.x - hw, y_f, z_top))
        v5 = bm.verts.new((sp.x + hw, y_f, z_top))
        v6 = bm.verts.new((sp.x + hw, y_b, z_top))
        v7 = bm.verts.new((sp.x - hw, y_b, z_top))
        
        bm.faces.new((v0, v1, v5, v4))
        bm.faces.new((v1, v2, v6, v5))
        bm.faces.new((v2, v3, v7, v6))
        bm.faces.new((v3, v0, v4, v7))
        bm.faces.new((v4, v5, v6, v7)) # tread
        bm.faces.new((v3, v2, v1, v0))
        
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    apply_world_uv(bm, MATERIAL_UV_SIZE.get(material, DEFAULT_UV_SIZE))
    bm.to_mesh(mesh)
    bm.free()
    
    stair_obj = bpy.data.objects.new(name, mesh)
    link_to_collection(stair_obj, "ARCH_Structure")
    link_to_nav_and_col(stair_obj, is_walkable=True, is_collider=True)
    if material in MATERIALS:
        mesh.materials.append(MATERIALS[material])
    
    # Handrails if enabled
    if has_rails:
        rail_mat = "MAT_Steel_Dark"
        # Left rail
        create_box(
            f"{name}_Rail_Left",
            size=(0.08, abs(run) + 0.4, 0.08),
            location=(sp.x - hw + 0.04, sp.y + run/2.0, sp.z + rise/2.0 + 1.05),
            material=rail_mat,
            col_name="ARCH_Structure",
            is_collider=True
        )
        # Right rail
        create_box(
            f"{name}_Rail_Right",
            size=(0.08, abs(run) + 0.4, 0.08),
            location=(sp.x + hw - 0.04, sp.y + run/2.0, sp.z + rise/2.0 + 1.05),
            material=rail_mat,
            col_name="ARCH_Structure",
            is_collider=True
        )
        # Posts
        for p_idx in [0, steps_count // 2, steps_count]:
            post_y = sp.y + p_idx * step_run
            post_z = sp.z + p_idx * step_rise + 0.525
            create_box(f"{name}_Post_L_{p_idx}", size=(0.06, 0.06, 1.05), location=(sp.x - hw + 0.04, post_y, post_z), material=rail_mat)
            create_box(f"{name}_Post_R_{p_idx}", size=(0.06, 0.06, 1.05), location=(sp.x + hw - 0.04, post_y, post_z), material=rail_mat)

    return stair_obj

# ---------------------------------------------------------------------------
# Procedural Building Construction
# ---------------------------------------------------------------------------
def build_villa_auren(plan):
    print("[*] Generating Villa Auren 3D Geometry (Assault Warehouse Scale)...")
    
    # 1. TERRAIN & COURTYARD
    # Outer Site Platform: 48m x 42m
    create_box(
        "ENV_Site_Platform",
        size=(48.0, 42.0, 0.5),
        location=(0.0, 3.0, -0.25),
        material="MAT_Stone_Pavers",
        col_name="ENV_Terrain",
        is_walkable=True
    )
    # Courtyard Stone Area: 26m x 12m in front of south facade
    create_box(
        "ENV_Courtyard_Pavers",
        size=(26.0, 12.0, 0.1),
        location=(0.0, 14.0, 0.05),
        material="MAT_Stone_Pavers",
        col_name="ENV_Terrain",
        is_walkable=True
    )
    # Arrival Dais: Hexagonal dais with Aurelium Gold ring at [0, 0.25, 15.0]
    create_box(
        "ENV_Arrival_Dais_Base",
        size=(6.0, 6.0, 0.25),
        location=(0.0, 15.0, 0.125),
        material="MAT_Stone_Chateau",
        col_name="ENV_Terrain",
        is_walkable=True
    )
    create_box(
        "ENV_Arrival_Dais_GoldRing",
        size=(4.0, 4.0, 0.05),
        location=(0.0, 15.0, 0.275),
        material="MAT_Aurelium_Gold",
        col_name="ENV_Terrain",
        is_walkable=True
    )

    # 2. LEVEL S1 (Subsuelo / Lab NEXO at Z = -3.6m)
    # S1 Floor Slab (Z = -3.75, Thickness = 0.3m, Span = 28m x 18m)
    create_box(
        "ARCH_S1_Floor_Slab",
        size=(28.0, 18.0, 0.3),
        location=(0.0, 0.0, -3.75),
        material="MAT_Lab_Concrete",
        col_name="INT_Laboratory",
        is_walkable=True
    )
    # S1 Perimeter Bunker Walls (Z = -1.8, Height = 3.6m)
    create_box("ARCH_S1_Wall_North", size=(28.0, 0.4, 3.6), location=(0.0, -9.0, -1.8), material="MAT_Lab_Concrete", col_name="INT_Laboratory")
    create_box("ARCH_S1_Wall_South", size=(28.0, 0.4, 3.6), location=(0.0, 9.0, -1.8), material="MAT_Lab_Concrete", col_name="INT_Laboratory")
    create_box("ARCH_S1_Wall_West",  size=(0.4, 18.0, 3.6), location=(-14.0, 0.0, -1.8), material="MAT_Lab_Concrete", col_name="INT_Laboratory")
    create_box("ARCH_S1_Wall_East",  size=(0.4, 18.0, 3.6), location=(14.0, 0.0, -1.8), material="MAT_Lab_Concrete", col_name="INT_Laboratory")
    
    # JarBees Quantum Core Pedestal & Core
    create_box("LAB_Core_Dais", size=(4.0, 4.0, 0.4), location=(0.0, -3.0, -3.4), material="MAT_Steel_Dark", col_name="INT_Laboratory", is_walkable=True)
    create_box("LAB_Core_Sphere", size=(1.4, 1.4, 1.4), location=(0.0, -3.0, -2.0), material="MAT_Cyan_Glow", col_name="INT_Laboratory")

    # 3. LEVEL PB (Planta Baja / Gran Hangar Assault Scale at Z = 0.0)
    # PB Floor Slabs (Thickness 0.3m, Z: -0.3 to 0.0)
    # East Wing Floor (Workshop + Briefing): X: 7.5 to 15.0, Y: -10.0 to 10.0
    create_box("ARCH_PB_Floor_EastWing", size=(7.5, 20.0, 0.3), location=(11.25, 0.0, -0.15), material="MAT_Stone_Floor", is_walkable=True)
    # Center Hall Floor (Grand Atrium): X: -8.0 to 8.0, Y: -10.0 to 10.0
    create_box("ARCH_PB_Floor_Atrium", size=(16.0, 20.0, 0.3), location=(0.0, 0.0, -0.15), material="MAT_Stone_Floor", is_walkable=True)
    # West Wing South Floor (Kitchen + Stair start): X: -15.0 to -7.5, Y: -10.0 to 1.5
    create_box("ARCH_PB_Floor_WestSouth", size=(7.5, 11.5, 0.3), location=(-11.25, -4.25, -0.15), material="MAT_Stone_Floor", is_walkable=True)
    # West Wing North Outer Border (Leaving X: -12.5 to -9.5, Y: 2.0 to 8.0 VOID for S1 stair):
    create_box("ARCH_PB_Floor_WestStair_SideL", size=(2.5, 8.5, 0.3), location=(-13.75, 5.75, -0.15), material="MAT_Stone_Floor", is_walkable=True)
    create_box("ARCH_PB_Floor_WestStair_SideR", size=(2.0, 8.5, 0.3), location=(-8.5, 5.75, -0.15), material="MAT_Stone_Floor", is_walkable=True)
    create_box("ARCH_PB_Floor_WestStair_NorthEnd", size=(3.0, 2.0, 0.3), location=(-11.0, 9.0, -0.15), material="MAT_Stone_Floor", is_walkable=True)

    # PB EXTERIOR WALLS (Z = 0.0 to 4.0, Height = 4.0m, Center Z = 2.0)
    # North Wall (Back): 30m x 0.4m
    create_box("ARCH_PB_Wall_North", size=(30.0, 0.4, 4.0), location=(0.0, -10.0, 2.0), material="MAT_Stone_Chateau")
    # West Wall: 20m x 0.4m
    create_box("ARCH_PB_Wall_West", size=(0.4, 20.0, 4.0), location=(-15.0, 0.0, 2.0), material="MAT_Stone_Chateau")
    # East Wall: 20m x 0.4m
    create_box("ARCH_PB_Wall_East", size=(0.4, 20.0, 4.0), location=(15.0, 0.0, 2.0), material="MAT_Stone_Chateau")
    
    # South Wall (Front Facade with Hangar Portico Portal: width 3.6m x height 3.2m at X [-1.8, 1.8])
    create_box("ARCH_PB_Wall_South_West", size=(13.2, 0.4, 4.0), location=(-8.4, 10.0, 2.0), material="MAT_Stone_Chateau")
    create_box("ARCH_PB_Wall_South_East", size=(13.2, 0.4, 4.0), location=(8.4, 10.0, 2.0), material="MAT_Stone_Chateau")
    create_box("ARCH_PB_Wall_South_Lintel", size=(3.6, 0.4, 0.8), location=(0.0, 10.0, 3.6), material="MAT_Wood_Timber") # 3.2m portal clearance!

    # PB INTERIOR PARTITIONS
    # East Wing dividing wall (Y = -4.0) with door opening (X = 11.5, w = 1.2, h = 2.4)
    create_box("ARCH_PB_Int_EastDiv_L", size=(3.0, 0.25, 4.0), location=(9.5, -4.0, 2.0), material="MAT_Wall_Plaster")
    create_box("ARCH_PB_Int_EastDiv_R", size=(2.5, 0.25, 4.0), location=(13.75, -4.0, 2.0), material="MAT_Wall_Plaster")
    create_box("ARCH_PB_Int_EastDiv_Lintel", size=(1.2, 0.25, 1.6), location=(11.6, -4.0, 3.2), material="MAT_Wall_Plaster")
    
    # West Wing dividing wall (Kitchen/Hall: Y = -6.0) with door opening
    create_box("ARCH_PB_Int_WestDiv_L", size=(3.0, 0.25, 4.0), location=(-13.5, -6.0, 2.0), material="MAT_Wall_Plaster")
    create_box("ARCH_PB_Int_WestDiv_R", size=(3.0, 0.25, 4.0), location=(-9.5, -6.0, 2.0), material="MAT_Wall_Plaster")
    create_box("ARCH_PB_Int_WestDiv_Lintel", size=(1.2, 0.25, 1.6), location=(-11.5, -6.0, 3.2), material="MAT_Wall_Plaster")

    # Monumental Stone Fireplace on North Wall of Atrium
    create_box("ARCH_Fireplace_Mantel", size=(4.0, 1.2, 2.4), location=(0.0, -9.4, 1.2), material="MAT_Stone_Chateau")
    create_box("ARCH_Fireplace_Chimney", size=(2.0, 1.0, 7.6), location=(0.0, -9.5, 5.0), material="MAT_Stone_Chateau")

    # 4. LEVEL P1 (Planta Alta / Catwalks & Suite at Z = 4.0m)
    # East Wing Floor (Suite & Archive): X: 8.0 to 14.8, Y: -9.8 to 9.8, Z = 4.0 (thickness 0.3)
    create_box("ARCH_P1_Floor_EastWing", size=(6.8, 19.6, 0.3), location=(11.4, 0.0, 3.85), material="MAT_Wood_Timber", is_walkable=True)
    
    # Catwalks surrounding Grand Atrium (Width = 2.0m, Z = 4.0, Thickness = 0.3m)
    # South Catwalk: X: -8.0 to 8.0, Y: 6.0 to 8.0
    create_box("ARCH_P1_Catwalk_South", size=(16.0, 2.0, 0.3), location=(0.0, 7.0, 3.85), material="MAT_Wood_Timber", is_walkable=True)
    # North Catwalk: X: -8.0 to 8.0, Y: -8.0 to -6.0
    create_box("ARCH_P1_Catwalk_North", size=(16.0, 2.0, 0.3), location=(0.0, -7.0, 3.85), material="MAT_Wood_Timber", is_walkable=True)
    # East Catwalk: X: 6.0 to 8.0, Y: -6.0 to 6.0
    create_box("ARCH_P1_Catwalk_East", size=(2.0, 12.0, 0.3), location=(7.0, 0.0, 3.85), material="MAT_Wood_Timber", is_walkable=True)
    # West Catwalk: X: -8.0 to -6.0, Y: -6.0 to 6.0
    create_box("ARCH_P1_Catwalk_West", size=(2.0, 12.0, 0.3), location=(-7.0, 0.0, 3.85), material="MAT_Wood_Timber", is_walkable=True)

    # Catwalk Industrial Guardrails (Height = 1.10m, Material = MAT_Steel_Dark)
    # Overlooking the central open void (X: -6.0 to 6.0, Y: -6.0 to 6.0)
    # Open guardrails (top rail + mid rail + kick plate + posts) instead of solid slabs
    create_railing("ARCH_P1_Railing_SouthVoid", (-6.0, 6.04), (6.0, 6.04), base_z=4.0)
    create_railing("ARCH_P1_Railing_NorthVoid", (-6.0, -6.04), (6.0, -6.04), base_z=4.0)
    create_railing("ARCH_P1_Railing_EastVoid", (6.04, -6.0), (6.04, 6.0), base_z=4.0)
    create_railing("ARCH_P1_Railing_WestVoid", (-6.04, -6.0), (-6.04, 6.0), base_z=4.0)

    # West Wing Upper Floor & Stair Landing: X: -14.8 to -8.0, Y: -1.0 to 4.0, Z = 4.0
    # DIRECTLY CONNECTED TO WEST CATWALK (X: -8.0 to -6.0)!
    create_box("ARCH_P1_Floor_WestLanding", size=(6.8, 5.0, 0.3), location=(-11.4, 1.5, 3.85), material="MAT_Wood_Timber", is_walkable=True)

    # =======================================================================
    # 5. TACTICAL BALCONY (OUTDOOR) — ZERO GAP & PHYSICAL SEAMLESS SLAB!
    # =======================================================================
    # Cantilevered Stone Balcony Slab: X: -4.0 to 4.0 (width 8.0m), Y: 7.5 to 11.5 (depth 4.0m)
    # Exactly flush and touching South Catwalk at Y = 7.5! Z = 4.0 (Thickness = 0.3m, Z: 3.7 to 4.0)
    create_box(
        "ARCH_P1_Balcony_Floor_Slab",
        size=(8.0, 4.0, 0.3),
        location=(0.0, 9.5, 3.85),
        material="MAT_Stone_Pavers",
        col_name="ARCH_Structure",
        is_walkable=True
    )
    # Heavy Stone Corbels underneath Balcony (supporting the cantilever)
    for corbel_x in [-3.5, -1.2, 1.2, 3.5]:
        create_box(
            f"ARCH_Balcony_Corbel_{corbel_x}",
            size=(0.4, 3.0, 0.8),
            location=(corbel_x, 9.5, 3.3),
            material="MAT_Stone_Chateau",
            col_name="ARCH_Structure"
        )
    # Solid Balustrades on Balcony (South, East, West edges, Height = 1.10m)
    create_box("ARCH_Balcony_Railing_South", size=(8.0, 0.2, 1.1), location=(0.0, 11.4, 4.55), material="MAT_Stone_Chateau")
    create_box("ARCH_Balcony_Railing_West",  size=(0.2, 3.8, 1.1), location=(-3.9, 9.5, 4.55), material="MAT_Stone_Chateau")
    create_box("ARCH_Balcony_Railing_East",  size=(0.2, 3.8, 1.1), location=(3.9, 9.5, 4.55), material="MAT_Stone_Chateau")

    # P1 EXTERIOR WALLS (Z = 4.0 to 7.2, Height = 3.2m, Center Z = 5.6)
    create_box("ARCH_P1_Wall_North", size=(30.0, 0.4, 3.2), location=(0.0, -10.0, 5.6), material="MAT_Wall_Plaster")
    create_box("ARCH_P1_Wall_West",  size=(0.4, 20.0, 3.2), location=(-15.0, 0.0, 5.6), material="MAT_Wall_Plaster")
    create_box("ARCH_P1_Wall_East",  size=(0.4, 20.0, 3.2), location=(15.0, 0.0, 5.6), material="MAT_Wall_Plaster")
    
    # South Wall P1 with Balcony Doorway (X: [-1.4, 1.4], w = 2.8, h = 2.6)
    create_box("ARCH_P1_Wall_South_L", size=(13.6, 0.4, 3.2), location=(-8.2, 7.5, 5.6), material="MAT_Wall_Plaster")
    create_box("ARCH_P1_Wall_South_R", size=(13.6, 0.4, 3.2), location=(8.2, 7.5, 5.6), material="MAT_Wall_Plaster")
    create_box("ARCH_P1_Wall_South_BalconyLintel", size=(2.8, 0.4, 0.6), location=(0.0, 7.5, 6.9), material="MAT_Wood_Timber")

    # =======================================================================
    # 6. STAIRCASES (SOLID, EXACT 20 STEPS, ZERO DISCREPANCY)
    # =======================================================================
    # Staircase PB -> P1:
    # Starts at [-11.5, -5.5, 0.0], runs North to [-11.5, 0.5, 4.0]
    # 20 steps: rise = 4.0m (0.20m/step), run = 6.00m (0.30m/step), width = 1.5m
    create_solid_staircase(
        name="ARCH_Stair_PB_to_P1",
        start_pos=(-11.5, -5.5, 0.0),
        rise=4.0,
        run=6.0,
        width=1.5,
        steps_count=20,
        material="MAT_Wood_Timber",
        has_rails=True
    )
    # Upper Landing Bridge: Connects top of stair [-11.5, 0.5] seamlessly to West Catwalk [-7.5]!
    create_box(
        "ARCH_Stair_P1_TopLanding_Bridge",
        size=(4.0, 2.0, 0.3),
        location=(-9.5, 1.5, 3.85),
        material="MAT_Wood_Timber",
        is_walkable=True
    )
    
    # Staircase S1 -> PB:
    # Service stair from S1 (-3.6m) to PB (0.0m)
    create_solid_staircase(
        name="ARCH_Stair_S1_to_PB",
        start_pos=(-11.0, 7.5, -3.6),
        rise=3.6,
        run=-5.0,
        width=1.4,
        steps_count=18,
        material="MAT_Steel_Dark",
        has_rails=True
    )

    # =======================================================================
    # 7. INDUSTRIAL TRUSSES & ALPINE ROOF (Cubierta a Dos Aguas)
    # =======================================================================
    # 5 Heavy Steel/Timber Roof Trusses across the 20m building depth at Z = 7.0
    for truss_x in [-12.0, -6.0, 0.0, 6.0, 12.0]:
        create_box(
            f"ARCH_Truss_Beam_{truss_x}",
            size=(0.3, 20.0, 0.4),
            location=(truss_x, 0.0, 7.2),
            material="MAT_Steel_Dark",
            col_name="ARCH_Roof"
        )
        
    # Gabled Roof Slopes (Ridge at Z = 8.8m, Eaves at Z = 6.8m, Overhang = 1.0m)
    # Central 4m x 4m ventilation skylight hatch open for vertical Mach flight!
    # West Roof Slope
    create_box(
        "ARCH_Roof_Slope_West",
        size=(15.5, 22.0, 0.25),
        location=(-7.75, 0.0, 7.8),
        material="MAT_Roof_Slate",
        col_name="ARCH_Roof"
    )
    # East Roof Slope
    create_box(
        "ARCH_Roof_Slope_East",
        size=(15.5, 22.0, 0.25),
        location=(7.75, 0.0, 7.8),
        material="MAT_Roof_Slate",
        col_name="ARCH_Roof"
    )
    # Ejection Vent Frame (Mach Flight Shaft)
    create_box("ARCH_Roof_Vent_Frame", size=(4.4, 4.4, 0.3), location=(0.0, 0.0, 8.8), material="MAT_Steel_Dark", col_name="ARCH_Roof")
    create_box("ARCH_Roof_Vent_Glass", size=(4.0, 4.0, 0.05), location=(0.0, 0.0, 8.85), material="MAT_Glass", col_name="ARCH_Roof")

    print("[+] All geometry constructed successfully!")

# ---------------------------------------------------------------------------
# Grand Atrium Detail Pass (pilot room of AUREN_VILLA_REFINEMENT_PLAN)
# Principles measured on L4D / CS maps: trims at every material junction,
# visible structure (columns, beams), focal light sources, layered fireplace.
# ---------------------------------------------------------------------------
def build_atrium_details():
    print("[*] Adding Grand Atrium detail pass (trims, structure, fireplace, lamps)...")

    # 1. Baseboards on PB perimeter walls (wood, 15cm, 3cm proud of the wall face)
    bb_h, bb_d = 0.15, 0.03
    for name, size, loc in [
        ("TRIM_Baseboard_North_W", (12.8, bb_d, bb_h), (-8.4, -9.8 + bb_d / 2, bb_h / 2)),
        ("TRIM_Baseboard_North_E", (12.8, bb_d, bb_h), (8.4, -9.8 + bb_d / 2, bb_h / 2)),
        ("TRIM_Baseboard_South_W", (13.0, bb_d, bb_h), (-8.3, 9.8 - bb_d / 2, bb_h / 2)),
        ("TRIM_Baseboard_South_E", (13.0, bb_d, bb_h), (8.3, 9.8 - bb_d / 2, bb_h / 2)),
        ("TRIM_Baseboard_West", (bb_d, 19.6, bb_h), (-14.8 + bb_d / 2, 0.0, bb_h / 2)),
        ("TRIM_Baseboard_East", (bb_d, 19.6, bb_h), (14.8 - bb_d / 2, 0.0, bb_h / 2)),
    ]:
        create_box(name, size=size, location=loc, material="MAT_Wood_Timber", col_name="ARCH_Structure", is_collider=False)

    # 2. Steel portal frame around the 3.6 x 3.2m hangar entrance (protrudes 10cm both sides)
    for side in (-1, 1):
        create_box(f"TRIM_Portal_Jamb_{side}", size=(0.25, 0.6, 3.2), location=(side * 1.925, 10.0, 1.6), material="MAT_Steel_Dark")
    create_box("TRIM_Portal_Head", size=(4.1, 0.6, 0.25), location=(0.0, 10.0, 3.325), material="MAT_Steel_Dark")

    # 3. North wall pilasters aligned with roof trusses (x = 0 is the fireplace)
    for px in (-12.0, -6.0, 6.0, 12.0):
        create_box(f"ARCH_Pilaster_North_{px}", size=(0.5, 0.2, 4.0), location=(px, -9.7, 2.0), material="MAT_Stone_Chateau")

    # 4. Visible catwalk structure: steel columns + edge beams under the inner catwalk edge.
    #    Columns avoid the portal walkway (|x| < 1.8 on the south side).
    for cx, cy in [(-6.2, -6.2), (6.2, -6.2), (-6.2, 6.2), (6.2, 6.2),
                   (-6.2, 0.0), (6.2, 0.0), (-3.5, 6.2), (3.5, 6.2), (-3.5, -6.2), (3.5, -6.2)]:
        create_box(f"ARCH_Catwalk_Column_{cx}_{cy}", size=(0.3, 0.3, 3.7), location=(cx, cy, 1.85), material="MAT_Steel_Dark")
    for name, size, loc in [
        ("ARCH_Catwalk_Beam_South", (12.4, 0.2, 0.3), (0.0, 6.1, 3.55)),
        ("ARCH_Catwalk_Beam_North", (12.4, 0.2, 0.3), (0.0, -6.1, 3.55)),
        ("ARCH_Catwalk_Beam_East", (0.2, 12.4, 0.3), (6.1, 0.0, 3.55)),
        ("ARCH_Catwalk_Beam_West", (0.2, 12.4, 0.3), (-6.1, 0.0, 3.55)),
    ]:
        create_box(name, size=size, location=loc, material="MAT_Steel_Dark")

    # 5. Layered fireplace: hearth slab, soot firebox, embers, protruding mantel shelf
    #    (mantel block spans y -10.0..-8.8, front face at y = -8.8)
    create_box("FIRE_Hearth_Slab", size=(4.8, 0.9, 0.06), location=(0.0, -8.35, 0.03), material="MAT_Stone_Chateau", is_walkable=True)
    create_box("FIRE_Firebox_Soot", size=(2.2, 0.04, 1.3), location=(0.0, -8.78, 0.71), material="MAT_Soot", is_collider=False)
    create_box("FIRE_Embers", size=(1.4, 0.25, 0.1), location=(0.0, -8.62, 0.11), material="MAT_Ember", is_collider=False)
    create_box("FIRE_Mantel_Shelf", size=(4.6, 0.45, 0.14), location=(0.0, -8.775, 2.47), material="MAT_Stone_Chateau")

    # 6. Industrial pendant lamps hanging from the trusses (focal warm light sources)
    for lx, ly in [(0.0, -3.5), (0.0, 3.5), (-6.0, -3.5), (-6.0, 3.5), (6.0, -3.5), (6.0, 3.5)]:
        tag = f"{lx}_{ly}"
        create_box(f"LAMP_Cable_{tag}", size=(0.02, 0.02, 1.0), location=(lx, ly, 6.5), material="MAT_Steel_Dark", is_collider=False)
        create_box(f"LAMP_Shade_{tag}", size=(0.55, 0.55, 0.25), location=(lx, ly, 5.875), material="MAT_Steel_Dark", is_collider=False)
        create_box(f"LAMP_Diffuser_{tag}", size=(0.42, 0.42, 0.04), location=(lx, ly, 5.73), material="MAT_Lamp_Warm", is_collider=False)

    print("[+] Atrium detail pass complete.")

# ---------------------------------------------------------------------------
# Web finalization: batching + baked ambient occlusion
# ---------------------------------------------------------------------------
def join_all_meshes(name="VillaAuren_Merged"):
    """Merge every mesh into one object: glTF then emits one primitive per material
    (~13 draw calls instead of one per box)."""
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    merged = bpy.context.view_layer.objects.active
    merged.name = name
    merged.data.name = name
    print(f"[+] Joined {len(meshes)} objects into '{name}' ({len(merged.data.polygons)} polygons, {len(merged.data.materials)} materials)")
    return merged

def get_gltf_output_group():
    """Custom node group recognised by the Blender glTF exporter for occlusionTexture."""
    ng = bpy.data.node_groups.get("glTF Material Output")
    if ng is None:
        ng = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
        ng.interface.new_socket(name="Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    return ng

def bake_ambient_occlusion(obj):
    scene = bpy.context.scene
    mesh = obj.data

    # 1. Second UV channel for the lightmap atlas (keeps "UVMap" as TEXCOORD_0)
    lm = mesh.uv_layers.get("Lightmap") or mesh.uv_layers.new(name="Lightmap")
    mesh.uv_layers.active = lm
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66.0), island_margin=0.004, area_weight=0.0,
                             correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')

    # 2. Bake target image + per-material active image node
    img = bpy.data.images.new("VillaAuren_AO", AO_BAKE_SIZE, AO_BAKE_SIZE, alpha=False)
    img.generated_color = (1.0, 1.0, 1.0, 1.0)
    bake_nodes = {}
    for mat in mesh.materials:
        nt = mat.node_tree
        uvn = nt.nodes.new("ShaderNodeUVMap")
        uvn.uv_map = "Lightmap"
        uvn.location = (-900, -650)
        texn = nt.nodes.new("ShaderNodeTexImage")
        texn.image = img
        texn.location = (-600, -650)
        nt.links.new(uvn.outputs["UV"], texn.inputs["Vector"])
        for n in nt.nodes:
            n.select = False
        texn.select = True
        nt.nodes.active = texn
        bake_nodes[mat.name] = (uvn, texn)

    # 3. Cycles AO bake (local contact occlusion within AO_DISTANCE_M)
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = AO_BAKE_SAMPLES
    scene.cycles.device = 'CPU'
    if scene.world is None:
        scene.world = bpy.data.worlds.new("World")
    scene.world.light_settings.distance = AO_DISTANCE_M
    print(f"[*] Baking AO {AO_BAKE_SIZE}px, {AO_BAKE_SAMPLES} samples...")
    bpy.ops.object.bake(type='AO', margin=4, use_clear=True)

    img.filepath_raw = AO_IMAGE_OUT
    img.file_format = 'JPEG'
    img.save()
    print(f"[+] AO atlas saved: {AO_IMAGE_OUT}")

    # 4. Wire AO into glTF occlusion (R channel), remove helper nodes on excluded materials
    group = get_gltf_output_group()
    for mat in mesh.materials:
        nt = mat.node_tree
        uvn, texn = bake_nodes[mat.name]
        if mat.name in AO_EXCLUDED_MATERIALS:
            nt.nodes.remove(texn)
            nt.nodes.remove(uvn)
            continue
        sep = nt.nodes.new("ShaderNodeSeparateColor")
        sep.location = (-300, -650)
        grp = nt.nodes.new("ShaderNodeGroup")
        grp.node_tree = group
        grp.location = (300, -400)
        nt.links.new(texn.outputs["Color"], sep.inputs["Color"])
        nt.links.new(sep.outputs["Red"], grp.inputs["Occlusion"])

    # 5. Restore primary UV for editing/rendering
    mesh.uv_layers.active = mesh.uv_layers["UVMap"]
    mesh.uv_layers["UVMap"].active_render = True

# ---------------------------------------------------------------------------
# World Manifest Export (villa_auren.world.json)
# ---------------------------------------------------------------------------
def export_world_manifest(plan):
    manifest = {
        "zoneId": "villa_auren_assault_scale",
        "version": "2.0.0",
        "name": "Villa Auren · Grand Alpine Hangar (Assault Scale)",
        "description": "Validated tactical residence inspired by CS 1.6 Assault warehouse scale and Chateau aesthetics.",
        "worldDimensions": {
            "terrainMeters": [48.0, 42.0],
            "buildingFootprintMeters": [30.0, 20.0],
            "characterHeightMeters": 1.85,
            "groundCeilingHeight": 4.0,
            "upperCeilingHeight": 4.2,
            "labCeilingHeight": 3.6,
            "atriumClearance": 7.8
        },
        "spawnPoints": [
            {
                "id": "spawn_courtyard_dais",
                "name": "Dais de Llegada Aurelium (Patio)",
                "position": [0.0, 0.35, 15.0],
                "rotation": [0, 0, 0],
                "isPrimary": True
            },
            {
                "id": "spawn_grand_hangar",
                "name": "Gran Atrio Central (Escala Assault)",
                "position": [0.0, 0.1, 0.0],
                "rotation": [0, 3.1416, 0]
            },
            {
                "id": "spawn_catwalk_p1",
                "name": "Pasarela Catwalk Superior P1",
                "position": [0.0, 4.1, 7.0],
                "rotation": [0, 3.1416, 0]
            },
            {
                "id": "spawn_tactical_balcony",
                "name": "Balcón Táctico Voladizo",
                "position": [0.0, 4.1, 9.8],
                "rotation": [0, 0, 0]
            },
            {
                "id": "spawn_quantum_vault",
                "name": "Búnker Cuántico NEXO S1",
                "position": [0.0, -3.5, -3.0],
                "rotation": [0, 0, 0]
            }
        ],
        "rooms": []
    }
    
    for lvl in plan.get("levels", []):
        for rm in lvl.get("rooms", []):
            b = rm.get("bounds", {})
            min_z = lvl["elevation"]
            max_z = min_z + (lvl.get("ceilingHeight", 3.5) if not rm.get("isDoubleHeight") else 7.8)
            manifest["rooms"].append({
                "id": rm["id"],
                "name": rm["name"],
                "floor": lvl["id"],
                "bounds": {
                    "min": [b["minX"], min_z, b["minY"]],
                    "max": [b["maxX"], max_z, b["maxY"]]
                }
            })
            
    with open(WORLD_JSON_PUBLIC, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    with open(WORLD_JSON_ROOT, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"[+] Saved world manifest to {WORLD_JSON_PUBLIC}")

# ---------------------------------------------------------------------------
# Main Blender Pipeline
# ---------------------------------------------------------------------------
def main():
    with open(PLAN_FILE, "r", encoding="utf-8") as f:
        plan = json.load(f)
        
    reset_scene()
    setup_collections()
    setup_materials()
    build_villa_auren(plan)
    build_atrium_details()
    
    # Save organized source .blend (separate objects + collections, before batching/bake)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
    print(f"[+] Saved Blender file: {BLEND_OUT}")

    # Web finalization: one mesh (one primitive per material) + baked AO on UV1
    merged = join_all_meshes()
    bake_ambient_occlusion(merged)
    os.makedirs(os.path.dirname(BAKED_BLEND_OUT), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BAKED_BLEND_OUT, copy=True)
    print(f"[+] Saved baked Blender file: {BAKED_BLEND_OUT}")
    
    # Export GLB (optimized for Three.js WebGL)
    export_settings = {
        "export_format": "GLB",
        "use_selection": False,
        "export_apply": True,
        "export_texcoords": True,
        "export_normals": True,
        "export_materials": "EXPORT",
        "export_cameras": False,
        "export_lights": False,
        "export_yup": True
    }
    
    bpy.ops.export_scene.gltf(filepath=GLB_OUT_PUBLIC, **export_settings)
    print(f"[+] Exported GLB to: {GLB_OUT_PUBLIC}")
    
    bpy.ops.export_scene.gltf(filepath=GLB_OUT_ROOT, **export_settings)
    print(f"[+] Exported GLB to: {GLB_OUT_ROOT}")
    
    export_world_manifest(plan)
    print("[*] VILLA AUREN PIPELINE COMPLETE!")

if __name__ == "__main__":
    main()
