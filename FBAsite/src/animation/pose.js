/** Map Minecraft's corner-based block coordinates to the centered Three.js preview mesh. */
export function applyAnimationPose(animation, pose, transform, block) {
    const { pivot, legacy, rotationOrder } = animation;
    if (legacy) {
        // CompiledAnimation.offset = position + (1 - scale) * pivot;
        // NativeRuntime then applies translation * rotation * scale to [0, 1] vertices.
        block.position.set(.5, .5, .5);
        transform.position.set(...pose.position.map((value, i) =>
            value + (1 - pose.scale[i]) * pivot[i] - (i === 1 ? 0 : .5)));
    } else {
        block.position.set(.5 - pivot[0], .5 - pivot[1], .5 - pivot[2]);
        transform.position.set(pose.position[0] + pivot[0] - .5, pose.position[1] + pivot[1], pose.position[2] + pivot[2] - .5);
    }
    transform.scale.set(...pose.scale);
    transform.rotation.set(...pose.rotation, rotationOrder);
}
