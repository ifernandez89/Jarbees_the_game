#!/usr/bin/env python3
"""
AUREN WORLDLAB — 2D Architectural Blueprint Generator (Phase 1)
================================================================
Reads villa_auren.plan.json and renders clean, high-resolution 2D architectural
floor plans (SVG format) for each level: S1 (Basement Lab), PB (Ground Floor /
Grand Hangar), and P1 (Upper Catwalks & Suite).

Outputs:
- public/plans/villa_auren_s1_basement.svg
- public/plans/villa_auren_pb_ground.svg
- public/plans/villa_auren_p1_upper.svg
"""

import os
import sys
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DEFAULT_PLAN = os.path.join(PROJECT_ROOT, "villa_auren.plan.json")
PLANS_OUT_DIR = os.path.join(PROJECT_ROOT, "public", "plans")

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)

def world_to_svg(x, y, min_x, max_x, min_y, max_y, width_px, height_px, margin=60):
    scale_x = (width_px - 2 * margin) / (max_x - min_x)
    scale_y = (height_px - 2 * margin) / (max_y - min_y)
    scale = min(scale_x, scale_y)

    svg_x = margin + (x - min_x) * scale
    # Invert Y so positive world Y is up
    svg_y = height_px - margin - (y - min_y) * scale
    return svg_x, svg_y, scale

def render_level_svg(plan, level, out_svg_path):
    width_px = 1200
    height_px = 900
    margin = 80

    min_x = -20.0
    max_x = 20.0
    min_y = -14.0
    max_y = 18.0

    svg_elements = []

    # SVG Header & Background
    svg_elements.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width_px} {height_px}" width="{width_px}" height="{height_px}">')
    svg_elements.append('<defs>')
    # Grid pattern
    svg_elements.append('<pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">')
    svg_elements.append('<path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1f2937" stroke-width="0.8" />')
    svg_elements.append('</pattern>')
    # Blueprint styling
    svg_elements.append('<style>')
    svg_elements.append("""
        text { font-family: 'Consolas', 'Segoe UI', monospace; }
        .title { fill: #00f0ff; font-size: 20px; font-weight: bold; letter-spacing: 1px; }
        .subtitle { fill: #94a3b8; font-size: 13px; }
        .room-label { fill: #ffffff; font-size: 12px; font-weight: bold; text-anchor: middle; }
        .dim-label { fill: #38bdf8; font-size: 10px; text-anchor: middle; }
        .stair-label { fill: #fbbf24; font-size: 11px; font-weight: bold; }
        .void-label { fill: #f43f5e; font-size: 11px; font-weight: bold; }
    """)
    svg_elements.append('</style>')
    svg_elements.append('</defs>')

    # Dark Blueprint background
    svg_elements.append(f'<rect width="{width_px}" height="{height_px}" fill="#0b0f19" />')
    svg_elements.append(f'<rect width="{width_px}" height="{height_px}" fill="url(#grid)" />')

    # Title Card
    lvl_name = level.get("name", "Level")
    lvl_elev = level.get("elevation", 0.0)
    svg_elements.append(f'<text x="50" y="45" class="title">VILLA AUREN — {lvl_name.upper()} (Elev: {lvl_elev:+.1f}m)</text>')
    svg_elements.append(f'<text x="50" y="68" class="subtitle">Escala Galpón CS Assault · Altura Libre Techo: {level.get("ceilingHeight", 3.0)}m · Fuente: villa_auren.plan.json</text>')

    # Draw Site Boundary / Building Boundary
    b_w = plan["dimensions"]["building"]["widthX"]
    b_d = plan["dimensions"]["building"]["depthY"]
    bx1, by1, scale = world_to_svg(-b_w/2, -b_d/2, min_x, max_x, min_y, max_y, width_px, height_px, margin)
    bx2, by2, _ = world_to_svg(b_w/2, b_d/2, min_x, max_x, min_y, max_y, width_px, height_px, margin)
    svg_elements.append(f'<rect x="{bx1}" y="{by2}" width="{abs(bx2-bx1)}" height="{abs(by1-by2)}" fill="none" stroke="#334155" stroke-dasharray="6,4" stroke-width="1.5" />')
    svg_elements.append(f'<text x="{bx1 + 10}" y="{by2 - 8}" fill="#64748b" font-size="10">LÍMITE PERIMETRAL EDIFICIO ({b_w:.1f}m × {b_d:.1f}m)</text>')

    # Courtyard if on PB
    if level["id"] == "PB":
        cy = plan.get("siteExterior", {}).get("courtyard", {})
        if cy:
            cx = cy["centerX"]
            cy_pos = cy["centerY"]
            cw = cy["widthX"]
            cd = cy["depthY"]
            c_x1, c_y1, _ = world_to_svg(cx - cw/2, cy_pos - cd/2, min_x, max_x, min_y, max_y, width_px, height_px, margin)
            c_x2, c_y2, _ = world_to_svg(cx + cw/2, cy_pos + cd/2, min_x, max_x, min_y, max_y, width_px, height_px, margin)
            svg_elements.append(f'<rect x="{c_x1}" y="{c_y2}" width="{abs(c_x2-c_x1)}" height="{abs(c_y1-c_y2)}" fill="#1e293b" fill-opacity="0.5" stroke="#475569" stroke-width="2" />')
            svg_elements.append(f'<text x="{(c_x1+c_x2)/2}" y="{(c_y1+c_y2)/2}" class="room-label" fill="#cbd5e1">PATIO Y CALZADA DE LLEGADA ({cw:.0f}×{cd:.0f}m)</text>')

        # Arrival dais
        dais = plan.get("siteExterior", {}).get("arrivalDais", {})
        if dais:
            dx, dy, _ = world_to_svg(dais["centerX"], dais["centerY"], min_x, max_x, min_y, max_y, width_px, height_px, margin)
            dr = dais["radius"] * scale
            svg_elements.append(f'<circle cx="{dx}" cy="{dy}" r="{dr}" fill="#d97706" fill-opacity="0.3" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4,2" />')
            svg_elements.append(f'<text x="{dx}" y="{dy + 4}" fill="#fcd34d" font-size="10" font-weight="bold" text-anchor="middle">DAIS AURELIUM (SPAWN)</text>')

    # Draw Rooms
    for rm in level.get("rooms", []):
        bounds = rm.get("bounds", {})
        rx1, ry1, _ = world_to_svg(bounds["minX"], bounds["minY"], min_x, max_x, min_y, max_y, width_px, height_px, margin)
        rx2, ry2, _ = world_to_svg(bounds["maxX"], bounds["maxY"], min_x, max_x, min_y, max_y, width_px, height_px, margin)

        rw = abs(rx2 - rx1)
        rh = abs(ry1 - ry2)
        top_y = min(ry1, ry2)

        # Color coding based on room characteristics
        fill_color = "#131b2e"
        stroke_color = "#0284c7"
        if rm.get("isDoubleHeight"):
            fill_color = "#1e1b4b"
            stroke_color = "#818cf8"
        elif "Vault" in rm.get("id", "") or "Core" in rm.get("id", ""):
            fill_color = "#042f2e"
            stroke_color = "#14b8a6"
        elif "Workshop" in rm.get("id", ""):
            fill_color = "#2a1b18"
            stroke_color = "#f97316"
        elif "Suite" in rm.get("id", "") or "Archive" in rm.get("id", ""):
            fill_color = "#201a30"
            stroke_color = "#a855f7"

        # Room brush body
        svg_elements.append(f'<rect x="{rx1}" y="{top_y}" width="{rw}" height="{rh}" fill="{fill_color}" stroke="{stroke_color}" stroke-width="2.5" />')

        # Dimensions & Label
        cx = (rx1 + rx2) / 2
        cy = (ry1 + ry2) / 2
        room_w = bounds["maxX"] - bounds["minX"]
        room_d = bounds["maxY"] - bounds["minY"]

        svg_elements.append(f'<text x="{cx}" y="{cy - 8}" class="room-label">{rm.get("name", rm.get("id"))}</text>')
        svg_elements.append(f'<text x="{cx}" y="{cy + 12}" class="dim-label">{room_w:.1f}m × {room_d:.1f}m</text>')

    # Draw Slab Voids (CRITICAL HIGHLIGHT)
    for vd in level.get("slabVoids", []):
        bounds = vd.get("bounds", {})
        vx1, vy1, _ = world_to_svg(bounds["minX"], bounds["minY"], min_x, max_x, min_y, max_y, width_px, height_px, margin)
        vx2, vy2, _ = world_to_svg(bounds["maxX"], bounds["maxY"], min_x, max_x, min_y, max_y, width_px, height_px, margin)
        vw = abs(vx2 - vx1)
        vh = abs(vy1 - vy2)
        top_vy = min(vy1, vy2)

        svg_elements.append(f'<rect x="{vx1}" y="{top_vy}" width="{vw}" height="{vh}" fill="#f43f5e" fill-opacity="0.15" stroke="#f43f5e" stroke-width="2" stroke-dasharray="6,3" />')
        # Diagonal cross
        svg_elements.append(f'<line x1="{vx1}" y1="{top_vy}" x2="{vx1+vw}" y2="{top_vy+vh}" stroke="#f43f5e" stroke-opacity="0.4" stroke-width="1.5" />')
        svg_elements.append(f'<line x1="{vx1+vw}" y1="{top_vy}" x2="{vx1}" y2="{top_vy+vh}" stroke="#f43f5e" stroke-opacity="0.4" stroke-width="1.5" />')
        svg_elements.append(f'<text x="{(vx1+vx2)/2}" y="{(vy1+vy2)/2}" class="void-label" text-anchor="middle">HUECO EN FORJADO: {vd.get("name")}</text>')

    # Draw Stairs
    for st in level.get("stairs", []):
        sp = st["startPos"]
        ep = st["endPos"]
        st_w = st.get("width", 1.4)
        sx1, sy1, _ = world_to_svg(sp[0] - st_w/2, sp[1], min_x, max_x, min_y, max_y, width_px, height_px, margin)
        sx2, sy2, _ = world_to_svg(ep[0] + st_w/2, ep[1], min_x, max_x, min_y, max_y, width_px, height_px, margin)

        top_sy = min(sy1, sy2)
        sw = abs(sx2 - sx1)
        sh = abs(sy1 - sy2)

        # Stair container
        svg_elements.append(f'<rect x="{sx1}" y="{top_sy}" width="{sw}" height="{sh}" fill="#78350f" fill-opacity="0.4" stroke="#f59e0b" stroke-width="2" />')

        # Draw steps
        steps = st.get("stepCount", 18)
        for i in range(1, steps):
            step_y = top_sy + (sh / steps) * i
            svg_elements.append(f'<line x1="{sx1}" y1="{step_y}" x2="{sx1+sw}" y2="{step_y}" stroke="#fbbf24" stroke-width="1" />')

        # Direction arrow
        arrow_x = (sx1 + sx2) / 2
        svg_elements.append(f'<text x="{arrow_x}" y="{(sy1+sy2)/2}" class="stair-label" text-anchor="middle">SUBE -> {st.get("endLevel")}</text>')

    # Draw Openings & Doors
    for op in plan.get("openings", []):
        if op.get("level") == level["id"]:
            pos = op.get("position", [0, 0, 0])
            w = op.get("width", 1.2)
            op_x, op_y, _ = world_to_svg(pos[0], pos[1], min_x, max_x, min_y, max_y, width_px, height_px, margin)
            dw_px = w * scale

            # Draw doorway symbol (green capsule)
            svg_elements.append(f'<rect x="{op_x - dw_px/2}" y="{op_y - 4}" width="{dw_px}" height="8" rx="3" fill="#22c55e" stroke="#16a34a" stroke-width="1.5" />')
            svg_elements.append(f'<text x="{op_x}" y="{op_y - 8}" fill="#86efac" font-size="9" font-weight="bold" text-anchor="middle">{op.get("name")}</text>')

    # North indicator & Scale bar
    svg_elements.append('<g transform="translate(1120, 80)">')
    svg_elements.append('<polygon points="0,-25 10,15 0,8 -10,15" fill="#ef4444" stroke="#ffffff" stroke-width="1" />')
    svg_elements.append('<text x="0" y="-32" fill="#ef4444" font-size="12" font-weight="bold" text-anchor="middle">N</text>')
    svg_elements.append('</g>')

    # 5m scale bar
    bar_5m = 5.0 * scale
    svg_elements.append(f'<g transform="translate({width_px - 220}, {height_px - 40})">')
    svg_elements.append(f'<rect x="0" y="0" width="{bar_5m}" height="6" fill="#38bdf8" />')
    svg_elements.append(f'<text x="{bar_5m/2}" y="-8" fill="#38bdf8" font-size="11" font-weight="bold" text-anchor="middle">5.0 METROS</text>')
    svg_elements.append('</g>')

    svg_elements.append('</svg>')

    with open(out_svg_path, "w", encoding="utf-8") as f:
        f.write("\n".join(svg_elements))
    print(f"[+] Rendered 2D plan to: {out_svg_path}")

def main():
    plan_file = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PLAN
    if not os.path.exists(plan_file):
        print(f"Error: Plan file not found at {plan_file}")
        sys.exit(1)

    ensure_dir(PLANS_OUT_DIR)
    with open(plan_file, "r", encoding="utf-8") as f:
        plan = json.load(f)

    for lvl in plan.get("levels", []):
        lvl_id = lvl["id"].lower()
        out_name = f"villa_auren_{lvl_id}.svg"
        out_path = os.path.join(PLANS_OUT_DIR, out_name)
        render_level_svg(plan, lvl, out_path)

if __name__ == "__main__":
    main()
