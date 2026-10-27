package com.temnikov.freshblocksanimation.animation.json;

import com.google.gson.*;
import java.io.*;
import org.joml.*;

/** Runs the original JAR's pure math classes; no Minecraft startup or config writes. */
public final class RuntimeReference {
    private static final Gson JSON = new GsonBuilder().setPrettyPrinting().create();

    private static JsonArray vector(Vector3f v) {
        JsonArray a = new JsonArray(); a.add(v.x); a.add(v.y); a.add(v.z); return a;
    }

    public static void main(String[] args) throws Exception {
        JsonObject input = JsonParser.parseReader(new InputStreamReader(System.in)).getAsJsonObject();
        for (JsonElement item : input.getAsJsonArray("expressions")) {
            JsonObject c = item.getAsJsonObject();
            var context = new ModularAnimationRegistry.Context(.37, .9, -.6, -.2, -.8, .8, 0, -.6, 0);
            double result = new ModularAnimationRegistry.Parser(c.get("source").getAsString()).parse().eval(context);
            if (!Double.isFinite(result)) throw new IllegalStateException("Non-finite reference expression");
            c.addProperty("expected", result);
        }
        for (JsonElement item : input.getAsJsonArray("animations")) {
            JsonObject c = item.getAsJsonObject();
            var animation = KeyframeDefinition.parse(c.getAsJsonObject("data"));
            JsonArray samples = new JsonArray();
            for (JsonElement time : input.getAsJsonArray("times")) {
                float t = time.getAsFloat();
                Vector3f scale = animation.scale(t);
                Quaternionf q = animation.rotation(t);
                Vector3f offset = animation.offset(t, scale, .5f, .5f, .5f);
                JsonObject pose = new JsonObject();
                pose.add("position", vector(animation.position(t)));
                pose.add("scale", vector(scale));
                pose.addProperty("opacity", animation.opacity(t));
                pose.add("pivot", vector(animation.pivot(.5f, .5f, .5f)));
                pose.add("quaternion", JSON.toJsonTree(new float[]{q.x, q.y, q.z, q.w}));
                // NativeRuntime applies translate(offset) * rotate(q) * scale(s) to block corners.
                Matrix4f matrix = new Matrix4f().translate(offset).rotate(q).scale(scale);
                if (c.has("corners")) {
                    JsonArray corners = new JsonArray();
                    for (int x = 0; x <= 1; x++) for (int y = 0; y <= 1; y++) for (int z = 0; z <= 1; z++)
                        corners.add(vector(matrix.transformPosition(new Vector3f(x, y, z))));
                    pose.add("corners", corners);
                }
                samples.add(pose);
            }
            c.addProperty("durationMs", animation.durationMs(1000));
            c.add("samples", samples);
        }
        System.out.println(JSON.toJson(input));
    }
}
