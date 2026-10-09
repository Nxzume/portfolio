"""
Build a stylized two-octave piano keyboard strip and export as GLB.

Usage:
  blender --background --python scripts/blender/build_piano_keyboard.py
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "models" / "piano-keyboard.glb"
BLEND_OUT = ROOT / "public" / "models" / "piano-keyboard.blend"

WHITE_NOTES = [
    "C3", "D3", "E3", "F3", "G3", "A3", "B3",
    "C4", "D4", "E4", "F4", "G4", "A4", "B4",
]
BLACK_AFTER = {0: "Cs", 1: "Ds", 3: "Fs", 4: "Gs", 5: "As"}

WHITE_W = 0.023
WHITE_D = 0.145
WHITE_H = 0.012
BLACK_W = 0.014
BLACK_D = 0.095
BLACK_H = 0.008
GAP = 0.0012
# Space under key bottoms for tip travel when hinges rotate (~0.1 rad).
KEYBED_CLEARANCE = 0.02


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials):
        for item in list(block):
            block.remove(item)


def make_material(
    name: str,
    color: tuple[float, float, float, float],
    roughness: float,
    metallic: float = 0.0,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = metallic
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def add_key(
    name: str,
    size: tuple[float, float, float],
    location: tuple[float, float, float],
    mat: bpy.types.Material,
    is_black: bool,
) -> None:
    """Create a key mesh parented to an empty at the rear hinge."""
    w, d, h = size
    x, y, z = location

    # Hinge empty at the far edge of the key (toward the fallboard)
    hinge = bpy.data.objects.new(f"Hinge_{name}", None)
    hinge.empty_display_type = "PLAIN_AXES"
    hinge.empty_display_size = 0.01
    hinge.location = (x, y + d / 2, z)
    bpy.context.collection.objects.link(hinge)
    hinge["note"] = name.split("_", 1)[1]
    hinge["is_black"] = 1 if is_black else 0

    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z + h / 2))
    key = bpy.context.active_object
    key.name = name
    key.scale = (w / 2, d / 2, h / 2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    key.data.materials.append(mat)
    key.parent = hinge
    # Keep world position after parenting
    key.matrix_parent_inverse = hinge.matrix_world.inverted()


def build_keyboard() -> None:
    clear_scene()

    ivory = make_material("Ivory", (0.93, 0.91, 0.87, 1.0), 0.32)
    ebony = make_material("Ebony", (0.035, 0.035, 0.04, 1.0), 0.25)
    wood = make_material("CaseWood", (0.11, 0.065, 0.04, 1.0), 0.48)
    rail = make_material("RailMetal", (0.62, 0.58, 0.52, 1.0), 0.2, metallic=0.9)

    total_w = len(WHITE_NOTES) * (WHITE_W + GAP) - GAP

    # Chassis sits below the keys. Top face is KEYBED_CLEARANCE under z=0
    # (white-key bottoms) so a pressed tip cannot clip the wood.
    case_h = 0.028
    case_top = -KEYBED_CLEARANCE
    case_z = case_top - case_h / 2
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.01, case_z))
    case = bpy.context.active_object
    case.name = "Case"
    case.scale = ((total_w + 0.045) / 2, (WHITE_D + 0.055) / 2, case_h / 2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    case.data.materials.append(wood)

    # Side cheeks / front apron — visual wrap without filling the keybed well.
    cheek_w = 0.012
    cheek_h = KEYBED_CLEARANCE + WHITE_H * 0.35
    for sign, name in ((-1, "Cheek_L"), (1, "Cheek_R")):
        x = sign * (total_w / 2 + cheek_w / 2 + 0.004)
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(x, 0.01, case_top + cheek_h / 2),
        )
        cheek = bpy.context.active_object
        cheek.name = name
        cheek.scale = (cheek_w / 2, (WHITE_D + 0.04) / 2, cheek_h / 2)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        cheek.data.materials.append(wood)

    bpy.ops.mesh.primitive_cube_add(
        size=1,
        location=(0, -WHITE_D / 2 - 0.006, case_top + cheek_h / 2),
    )
    apron = bpy.context.active_object
    apron.name = "FrontApron"
    apron.scale = ((total_w + 0.045) / 2, 0.008, cheek_h / 2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apron.data.materials.append(wood)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, WHITE_D / 2 + 0.01, 0.012))
    lip = bpy.context.active_object
    lip.name = "Fallboard"
    lip.scale = ((total_w + 0.035) / 2, 0.014, 0.03)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    lip.data.materials.append(wood)

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, WHITE_D / 2 - 0.004, 0.028))
    bar = bpy.context.active_object
    bar.name = "NameRail"
    bar.scale = ((total_w * 0.5) / 2, 0.0035, 0.0018)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bar.data.materials.append(rail)

    start_x = -total_w / 2 + WHITE_W / 2
    white_centers: list[float] = []

    for i, note in enumerate(WHITE_NOTES):
        x = start_x + i * (WHITE_W + GAP)
        white_centers.append(x)
        add_key(f"W_{note}", (WHITE_W, WHITE_D, WHITE_H), (x, 0.0, 0.0), ivory, False)

    for octave, base in enumerate((3, 4)):
        offset = octave * 7
        for white_i, suffix in BLACK_AFTER.items():
            idx = offset + white_i
            if idx >= len(white_centers) - 1:
                continue
            x = (white_centers[idx] + white_centers[idx + 1]) / 2
            note = f"{suffix}{base}"
            add_key(
                f"B_{note}",
                (BLACK_W, BLACK_D, BLACK_H + WHITE_H * 0.5),
                (x, (WHITE_D - BLACK_D) / 2, WHITE_H * 0.55),
                ebony,
                True,
            )

    bpy.ops.object.camera_add(
        location=(0.04, -0.38, 0.26),
        rotation=(math.radians(60), 0, math.radians(6)),
    )
    bpy.context.scene.camera = bpy.context.active_object

    world = bpy.data.worlds.new("Studio")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.015, 0.016, 0.02, 1.0)
    bg.inputs[1].default_value = 0.35


def export_glb(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        use_selection=False,
        export_format="GLB",
        export_apply=True,
        export_extras=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
    )


def main() -> int:
    build_keyboard()
    export_glb(OUT)
    BLEND_OUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")
    print(f"Wrote {BLEND_OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
