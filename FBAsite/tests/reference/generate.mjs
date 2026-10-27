import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

// Arguments: original FBA JAR, Gson JAR, JOML JAR, JDK bin directory (Java 25+).
const [jar, gson, joml, javaBin] = process.argv.slice(2);
if (!javaBin) throw new Error("Expected: FBA.jar gson.jar joml.jar JDK-bin-directory");
const root = dirname(fileURLToPath(import.meta.url));
const easingNames = ["linear", ...["Quad", "Cubic", "Quart", "Quint", "Sine", "Expo", "Circ", "Back"]
    .flatMap(name => ["In", "Out", "InOut"].map(side => `ease${side}${name}`))];
const animations = easingNames.map(easing => ({
    name: easing, data: { format: 3, id: `audit:${easing.toLowerCase()}`, tracks: {
        "transform.position.x": { keyframes: [{ t: .1, value: -2.3, easing }, { t: .9, value: 4.7 }] },
    } },
}));
for (const order of ["xyz", "xzy", "yxz", "yzx", "zxy", "zyx"]) animations.push({
    name: `pivot_rotation_${order}`, corners: true,
    data: { format: 3, id: `audit:${order}`, pivot: [.2, .8, -.1], rotation: { order, unit: "degrees" },
        transform: { position: [.1, -.2, .3], rotation: [20, 30, 40], scale: [1.2, .7, 1.1] },
        timeline: { duration_source: "preset", duration_ms: 700001 },
        material: { opacity: .7 }, tracks: {
            "transform.rotation": { keyframes: [{ t: 0, value: [0, -90, 15] }, { t: 1, value: [90, 60, -30] }] },
            "transform.scale.y": { keyframes: [{ t: .2, value: .3 }, { t: .8, value: 1.2 }] },
            "material.opacity": { keyframes: [{ t: 0, value: .1 }, { t: 1, value: .9 }] },
        } },
});
for (const name of ["keyframe_pop", "keyframe_fade_in"]) animations.push({
    name, corners: true, data: JSON.parse(readFileSync(join(root, "../fixtures/mod", `${name}.json`))),
});
animations.push({ name: "step_radians", corners: true, data: {
    format: 3, id: "audit:step", rotation: { unit: "radians", order: "zyx" },
    transform: { rotation: [.2, -.4, .5] }, tracks: {
        "transform.scale": [1.1, .9, .7],
        "transform.position.z": { interpolation: "step", keyframes: [{ t: .2, value: -2 }, { t: .8, value: 1 }] },
    },
} });
const sources = ["-2^2", "2^3^2", "2^-2", "--2^3", "1 / 4 + 5 % 2", "clamp(3, 5, 1)",
    "lerp(.25,2,6)", "unknown_variable+1", "sin(PI)+cos(0)+E", "dx+directionX+sx+sideX",
    "dy+directionY+sz+sideZ", "t+e+eased+distance", "easeOutQuint(t)", "easeInOutCubic(t)",
    "easeOutBack(t)", "sqrt(4)+pow(2,3)+min(3,2)+max(3,2)+abs(-1)+floor(2.3)+ceil(2.3)"];
const input = { sourceJarSha256: createHash("sha256").update(readFileSync(jar)).digest("hex"),
    times: [0, .0001, .05, .2, .35, .5, .7, .8, .9999, 1],
    expressions: sources.map(source => ({ source })), animations };
const output = mkdtempSync(join(tmpdir(), "fba-reference-"));
try {
    const cp = [jar, gson, joml].join(delimiter);
    execFileSync(join(javaBin, "javac"), ["-J-Xmx256m", "-proc:none", "-cp", cp, "-d", output, join(root, "RuntimeReference.java")]);
    const result = execFileSync(join(javaBin, "java"), ["-Xmx256m", "-XX:ActiveProcessorCount=2", "-cp", [output, cp].join(delimiter),
        "com.temnikov.freshblocksanimation.animation.json.RuntimeReference"], { input: JSON.stringify(input), maxBuffer: 4 * 1024 * 1024 });
    writeFileSync(join(root, "../fixtures/mod/runtime-reference.json"), result);
    console.log(`Saved original-runtime reference: ${animations.length} animations, ${sources.length} expressions.`);
} finally { rmSync(output, { recursive: true, force: true }); }
