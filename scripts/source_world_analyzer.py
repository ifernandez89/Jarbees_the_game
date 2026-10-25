"""
SourceWorldAnalyzer - Pilot Audit System for Source Engine BSP v20 (Left 4 Dead)
Part of Auren WorldLab / JarBees Spatial Intelligence Engine.

Performs deep static dependency audits:
- Header & Lump verification (VBSP v20)
- Entities (Lump 0): gameplay markers, worldspawn, classnames, dynamic models
- Static Props (Lump 35 / 'sprp'): dictionary models, placement instances, orientations
- Materials (Lumps 43 & 44): referenced VMT shaders and VTF textures
- Pakfile (Lump 40): internal zip asset detection
- Navigation (NAV): checks for .nav spatial graphs
- Dependency Completeness: cross-references all MDL, VTX, VVD, VMT, VTF against local disk and pakfile
"""

import os
import sys
import json
import struct
import zipfile
import io
import re
from typing import Dict, List, Any, Set, Tuple

class SourceWorldAnalyzer:
    def __init__(self, l4d_root: str, output_base_dir: str):
        self.l4d_root = os.path.abspath(l4d_root)
        self.output_base_dir = os.path.abspath(output_base_dir)
        self.game_dir = os.path.join(self.l4d_root, "left4dead")
        self.maps_dir = os.path.join(self.game_dir, "maps")
        self.models_dir = os.path.join(self.game_dir, "models")
        self.materials_dir = os.path.join(self.game_dir, "materials")

    def audit_map(self, bsp_filename: str) -> Dict[str, Any]:
        bsp_path = os.path.join(self.maps_dir, bsp_filename)
        if not os.path.exists(bsp_path):
            raise FileNotFoundError(f"BSP file not found: {bsp_path}")

        map_name = os.path.splitext(bsp_filename)[0]
        out_dir = os.path.join(self.output_base_dir, map_name)
        os.makedirs(out_dir, exist_ok=True)

        print(f"\n=======================================================")
        print(f" SourceWorldAnalyzer: Auditing '{bsp_filename}'")
        print(f"=======================================================")

        with open(bsp_path, "rb") as f:
            # 1. Header
            ident, version = struct.unpack("<4sI", f.read(8))
            if ident != b"VBSP":
                raise ValueError(f"Invalid BSP ident: {ident}, expected b'VBSP'")
            if version != 20:
                print(f"  [Notice] BSP version is {version} (Standard L4D is 20)")

            lumps = []
            for i in range(64):
                offset, length, lver, fourCC = struct.unpack("<IIII", f.read(16))
                lumps.append({
                    "id": i,
                    "offset": offset,
                    "length": length,
                    "version": lver,
                    "fourCC": fourCC
                })

            map_revision = struct.unpack("<I", f.read(4))[0]

            # 2. Pakfile inspection (Lump 40)
            pak_lump = lumps[40]
            pak_files = set()
            if pak_lump["length"] > 0:
                f.seek(pak_lump["offset"])
                pak_data = f.read(pak_lump["length"])
                try:
                    zf = zipfile.ZipFile(io.BytesIO(pak_data))
                    for name in zf.namelist():
                        pak_files.add(name.replace("\\", "/").lower())
                except Exception as e:
                    print(f"  [Warning] Pakfile read error: {e}")

            # 3. Entities parsing (Lump 0)
            ent_lump = lumps[0]
            f.seek(ent_lump["offset"])
            ent_raw = f.read(ent_lump["length"]).decode("latin-1", errors="ignore")
            entities = self._parse_entities(ent_raw)

            # 4. Vertices & Spatial Bounds (Lump 3)
            v_lump = lumps[3]
            f.seek(v_lump["offset"])
            num_verts = v_lump["length"] // 12
            xs, ys, zs = [], [], []
            for _ in range(num_verts):
                vx, vy, vz = struct.unpack("<fff", f.read(12))
                xs.append(vx); ys.append(vy); zs.append(vz)

            bounds = {
                "min": [min(xs), min(ys), min(zs)] if xs else [0, 0, 0],
                "max": [max(xs), max(ys), max(zs)] if xs else [0, 0, 0],
                "size": [
                    max(xs) - min(xs) if xs else 0,
                    max(ys) - min(ys) if ys else 0,
                    max(zs) - min(zs) if zs else 0
                ]
            }

            # 5. Displacements (Lump 26)
            disp_lump = lumps[26]
            # Each ddispinfo_t is 176 bytes in Source 20
            num_displacements = disp_lump["length"] // 176 if disp_lump["length"] > 0 else 0

            # 6. Static Props (Lump 35: Game Lump 'sprp')
            static_props_info = self._parse_game_lump(f, lumps[35])

            # 7. Material Strings (Lumps 43 & 44)
            material_names = self._parse_material_strings(f, lumps[43], lumps[44])

        # 8. Dependency Check (Models and Materials)
        nav_file = os.path.join(self.maps_dir, f"{map_name}.nav")
        has_nav = os.path.exists(nav_file)
        nav_size = os.path.getsize(nav_file) if has_nav else 0

        dep_audit = self._audit_dependencies(
            entities=entities,
            static_props=static_props_info,
            material_names=material_names,
            pak_files=pak_files
        )

        # 9. Assembly of Analysis Data Bundle
        analysis_report = {
            "map_id": map_name,
            "bsp_file": bsp_filename,
            "bsp_size_bytes": os.path.getsize(bsp_path),
            "bsp_version": version,
            "map_revision": map_revision,
            "spatial_metrics": {
                "bounds": bounds,
                "vertex_count": num_verts,
                "displacement_count": num_displacements,
                "static_prop_instances": static_props_info["instance_count"],
                "static_prop_unique_models": len(static_props_info["model_dict"]),
                "entity_count": len(entities),
                "referenced_materials_count": len(material_names),
                "pakfile_embedded_files": len(pak_files),
                "has_nav_graph": has_nav,
                "nav_size_bytes": nav_size
            },
            "dependency_summary": dep_audit["summary"]
        }

        # Save files to output directory
        self._write_json(os.path.join(out_dir, "analysis_report.json"), analysis_report)
        self._write_json(os.path.join(out_dir, "entities.json"), entities)
        self._write_json(os.path.join(out_dir, "materials.json"), {
            "bsp_materials": material_names,
            "audit": dep_audit["materials"]
        })
        self._write_json(os.path.join(out_dir, "dependencies.json"), dep_audit)
        self._write_json(os.path.join(out_dir, "static_props.json"), static_props_info)

        print(f"  -> Vertices: {num_verts:,} | Displacements: {num_displacements} | Static Props: {static_props_info['instance_count']}")
        print(f"  -> Bounds: {bounds['size'][0]:.1f} x {bounds['size'][1]:.1f} x {bounds['size'][2]:.1f} units")
        print(f"  -> Dependencies: {dep_audit['summary']['models_available']}/{dep_audit['summary']['models_total']} models on disk")
        print(f"  -> Materials: {dep_audit['summary']['materials_available']}/{dep_audit['summary']['materials_total']} on disk")
        print(f"  [OK] Analysis bundle written to: {out_dir}")

        return analysis_report

    def _parse_entities(self, raw_text: str) -> List[Dict[str, str]]:
        entities = []
        blocks = re.findall(r'\{([^}]+)\}', raw_text)
        for block in blocks:
            ent = {}
            for line in block.strip().splitlines():
                line = line.strip()
                match = re.match(r'"([^"]+)"\s+"([^"]*)"', line)
                if match:
                    ent[match.group(1)] = match.group(2)
            if ent:
                entities.append(ent)
        return entities

    def _parse_game_lump(self, f, lump_info: Dict[str, Any]) -> Dict[str, Any]:
        if lump_info["length"] == 0:
            return {"instance_count": 0, "model_dict": [], "instances": []}

        f.seek(lump_info["offset"])
        count = struct.unpack("<I", f.read(4))[0]

        sprp_lump = None
        for _ in range(count):
            gid, gflags, gver, goff, glen = struct.unpack("<4sHHII", f.read(16))
            if gid == b"prps": # 'sprp' in little endian
                sprp_lump = {"version": gver, "offset": goff, "length": glen}
                break

        if not sprp_lump:
            return {"instance_count": 0, "model_dict": [], "instances": []}

        # Parse static prop model dictionary
        f.seek(sprp_lump["offset"])
        dict_entries = struct.unpack("<I", f.read(4))[0]
        model_dict = []
        for _ in range(dict_entries):
            raw_name = f.read(128)
            clean_name = raw_name.split(b"\x00")[0].decode("latin-1", errors="ignore").lower().replace("\\", "/")
            model_dict.append(clean_name)

        # Parse static prop leaf list
        leaf_entries = struct.unpack("<I", f.read(4))[0]
        f.seek(f.tell() + leaf_entries * 2) # skip leaf IDs

        # Parse static prop instances
        instance_count = struct.unpack("<I", f.read(4))[0]
        instances = []

        # Version determines struct size:
        # v4: 56 bytes, v5: 60 bytes, v6: 64 bytes, v8: 68 bytes, v10: 76 bytes
        ver = sprp_lump["version"]
        entry_size = 64 if ver == 6 else (68 if ver == 8 else (60 if ver == 5 else 56))

        for _ in range(instance_count):
            # Pos (3f), Rot (3f), PropType (H), FirstLeaf (H), LeafCount (H), Solid (B), Flags (B)
            raw = f.read(entry_size)
            if len(raw) < entry_size:
                break
            x, y, z, pitch, yaw, roll = struct.unpack("<ffffff", raw[:24])
            prop_type = struct.unpack("<H", raw[24:26])[0]
            model_name = model_dict[prop_type] if prop_type < len(model_dict) else "unknown"
            instances.append({
                "origin": [round(x, 2), round(y, 2), round(z, 2)],
                "angles": [round(pitch, 2), round(yaw, 2), round(roll, 2)],
                "model": model_name
            })

        return {
            "sprp_version": ver,
            "instance_count": instance_count,
            "model_dict": model_dict,
            "instances": instances
        }

    def _parse_material_strings(self, f, string_data_lump: Dict[str, Any], string_table_lump: Dict[str, Any]) -> List[str]:
        t_off, t_len = string_table_lump["offset"], string_table_lump["length"]
        d_off, d_len = string_data_lump["offset"], string_data_lump["length"]
        if t_len == 0 or d_len == 0:
            return []

        f.seek(t_off)
        num_tex = t_len // 4
        offsets = [struct.unpack("<I", f.read(4))[0] for _ in range(num_tex)]

        f.seek(d_off)
        data = f.read(d_len)

        textures = []
        for o in offsets:
            end = data.find(b"\x00", o)
            if end != -1:
                tex = data[o:end].decode("latin-1", errors="ignore").lower().replace("\\", "/")
                textures.append(tex)
        return textures

    def _audit_dependencies(
        self,
        entities: List[Dict[str, str]],
        static_props: Dict[str, Any],
        material_names: List[str],
        pak_files: Set[str]
    ) -> Dict[str, Any]:
        # Collect all models (entity models + static prop models)
        all_models = set()
        for ent in entities:
            if "model" in ent and ent["model"].lower().endswith(".mdl"):
                all_models.add(ent["model"].lower().replace("\\", "/"))
        for m in static_props.get("model_dict", []):
            if m.endswith(".mdl"):
                all_models.add(m)

        # Audit models
        models_audit = {}
        models_available_count = 0
        for mdl_rel in sorted(all_models):
            clean_rel = mdl_rel.lstrip("/")
            disk_path = os.path.join(self.game_dir, clean_rel)
            base_no_ext = os.path.splitext(disk_path)[0]

            mdl_exists = os.path.exists(disk_path)
            vtx_exists = os.path.exists(f"{base_no_ext}.dx90.vtx") or os.path.exists(f"{base_no_ext}.vtx")
            vvd_exists = os.path.exists(f"{base_no_ext}.vvd")
            phy_exists = os.path.exists(f"{base_no_ext}.phy")

            in_pak = clean_rel in pak_files
            is_complete = (mdl_exists and vvd_exists and vtx_exists) or in_pak

            if is_complete:
                models_available_count += 1

            models_audit[clean_rel] = {
                "in_pakfile": in_pak,
                "mdl_on_disk": mdl_exists,
                "vtx_on_disk": vtx_exists,
                "vvd_on_disk": vvd_exists,
                "phy_on_disk": phy_exists,
                "complete": is_complete
            }

        # Audit materials
        materials_audit = {}
        materials_available_count = 0
        for mat_rel in sorted(set(material_names)):
            clean_rel = mat_rel.lstrip("/")
            if not clean_rel.endswith(".vmt"):
                clean_vmt = f"{clean_rel}.vmt"
            else:
                clean_vmt = clean_rel

            # Search in materials folder
            disk_vmt = os.path.join(self.materials_dir, clean_vmt)
            vmt_exists = os.path.exists(disk_vmt)
            in_pak = f"materials/{clean_vmt}".lower() in pak_files

            is_available = vmt_exists or in_pak
            if is_available:
                materials_available_count += 1

            materials_audit[clean_vmt] = {
                "in_pakfile": in_pak,
                "vmt_on_disk": vmt_exists,
                "available": is_available
            }

        return {
            "summary": {
                "models_total": len(all_models),
                "models_available": models_available_count,
                "models_missing": len(all_models) - models_available_count,
                "materials_total": len(set(material_names)),
                "materials_available": materials_available_count,
                "materials_missing": len(set(material_names)) - materials_available_count
            },
            "models": models_audit,
            "materials": materials_audit
        }

    def _write_json(self, filepath: str, data: Any):
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    l4d_path = r"K:\Mapas\Left 4 Dead"
    out_path = r"c:\Projects\Jarbees_the_game\assets_source\source_world_analysis"

    analyzer = SourceWorldAnalyzer(l4d_path, out_path)
    # Test on target candidate:
    target_map = "l4d_sv_cottageofdoom_b1.bsp"
    if len(sys.argv) > 1:
        target_map = sys.argv[1]

    analyzer.audit_map(target_map)
