// Pure math for the transfer "soul flight": camera path from the old robot
// eye to the new one. Rendering-only; no domain or three.js dependency.
export function transferFlightDuration(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return Math.min(0.9, 0.45 + dist * 0.008);
}
function smoothstep(t) {
    const clamped = Math.max(0, Math.min(1, t));
    return clamped * clamped * (3 - 2 * clamped);
}
// Scale envelope for the destination shell visual: materializes fast,
// holds while the soul flies in, then merges (shrinks) as the camera
// arrives so the shell never clips the first-person view.
export function transferShellScale(progress) {
    if (progress <= 0)
        return 0;
    if (progress >= 1)
        return 0;
    if (progress < 0.25)
        return smoothstep(progress / 0.25);
    if (progress < 0.8)
        return 1;
    return 1 - smoothstep((progress - 0.8) / 0.2);
}
// Eased 0..1 progress -> camera position (arced) and look target. While
// flying, the camera looks at the destination shell; near the end it blends
// into the normal first-person view so control resumes without a snap.
export function transferFlightPose(from, to, lookDir, progress, outPos, outLook) {
    const e = smoothstep(progress);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const arc = 5 + dist * 0.12;
    const lift = Math.sin(Math.PI * e) * arc;
    outPos.x = from.x + dx * e;
    outPos.y = from.y + dy * e + lift;
    outPos.z = from.z + dz * e;
    const shellLook = { x: to.x, y: to.y - 1, z: to.z };
    const firstPersonLook = {
        x: to.x + lookDir.x,
        y: to.y + lookDir.y,
        z: to.z + lookDir.z,
    };
    const blend = smoothstep((progress - 0.75) / 0.25);
    outLook.x = shellLook.x + (firstPersonLook.x - shellLook.x) * blend;
    outLook.y = shellLook.y + (firstPersonLook.y - shellLook.y) * blend;
    outLook.z = shellLook.z + (firstPersonLook.z - shellLook.z) * blend;
}
