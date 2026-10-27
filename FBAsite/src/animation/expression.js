import { easings } from "./easing.js";

const functions = {
    sin: [Math.sin, 1], cos: [Math.cos, 1], tan: [Math.tan, 1],
    abs: [Math.abs, 1], sqrt: [Math.sqrt, 1], floor: [Math.floor, 1], ceil: [Math.ceil, 1],
    min: [Math.min, 2], max: [Math.max, 2], pow: [Math.pow, 2],
    clamp: [(value, min, max) => Math.max(min, Math.min(max, value)), 3],
    lerp: [(t, a, b) => a + (b - a) * t, 3],
    ...Object.fromEntries(["easeOutQuint", "easeInCubic", "easeOutCubic", "easeInOutCubic", "easeOutBack"]
        .map(key => [key, [easings[key], 1]])),
};
const constants = { PI: Math.PI, pi: Math.PI, E: Math.E };
const variables = new Set(["t", "eased", "e", "directionX", "directionY", "directionZ", "dx", "dy", "dz",
    "sideX", "sideY", "sideZ", "sx", "sy", "sz", "distance"]);

/** Compile FBA math once. User JSON never becomes JavaScript source. */
export function compileExpression(source) {
    if (typeof source === "number" && Number.isFinite(source)) return () => source;
    if (typeof source !== "string" || source.length > 2048) throw new Error("Invalid animation expression");
    const tokens = [];
    const token = /\s*(?:(\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)|([A-Za-z_]\w*)|([()+\-*/%^,]))/y;
    let offset = 0;
    while (offset < source.length) {
        if (!source.slice(offset).trim()) break;
        token.lastIndex = offset;
        const match = token.exec(source);
        if (!match || tokens.length >= 256) throw new Error("Unsupported animation expression");
        tokens.push(match[1] !== undefined ? Number(match[1]) : match[2] || match[3]);
        offset = token.lastIndex;
    }
    let cursor = 0, depth = 0;
    const take = value => tokens[cursor] === value ? (cursor++, true) : false;
    const expect = value => { if (!take(value)) throw new Error(`Expected ${value} in animation expression`); };
    function primary() {
        if (++depth > 32) throw new Error("Animation expression is too deeply nested");
        let result;
        const current = tokens[cursor++];
        if (typeof current === "number") result = () => current;
        else if (current === "(") { result = sum(); expect(")"); }
        else if (typeof current === "string" && /^[A-Za-z_]\w*$/.test(current) && take("(")) {
            if (!Object.hasOwn(functions, current)) throw new Error(`Unknown animation function: ${current}`);
            const args = [];
            if (!take(")")) {
                do { args.push(sum()); } while (take(","));
                expect(")");
            }
            const [fn, count] = functions[current];
            if (args.length !== count) throw new Error(`Invalid arguments for ${current}`);
            result = context => fn(...args.map(arg => arg(context)));
        } else if (Object.hasOwn(constants, current)) result = () => constants[current];
        else if (variables.has(current)) result = context => context[current] ?? 0;
        else if (typeof current === "string" && /^[A-Za-z_]\w*$/.test(current)) result = () => 0;
        else throw new Error(`Unknown animation value: ${String(current)}`);
        depth--;
        return result;
    }
    function unary() {
        if (++depth > 32) throw new Error("Animation expression is too deeply nested");
        let result;
        if (take("-")) { const value = unary(); result = context => -value(context); }
        else if (take("+")) result = unary();
        else result = primary();
        depth--;
        return result;
    }
    function power() {
        if (++depth > 32) throw new Error("Animation expression is too deeply nested");
        let result = unary();
        if (take("^")) { const a = result, b = power(); result = context => a(context) ** b(context); }
        depth--;
        return result;
    }
    function product() {
        let result = power();
        while (["*", "/", "%"].includes(tokens[cursor])) {
            const op = tokens[cursor++], a = result, b = power();
            result = context => op === "*" ? a(context) * b(context) : op === "/" ? a(context) / b(context) : a(context) % b(context);
        }
        return result;
    }
    function sum() {
        let result = product();
        while (["+", "-"].includes(tokens[cursor])) {
            const op = tokens[cursor++], a = result, b = product();
            result = context => op === "+" ? a(context) + b(context) : a(context) - b(context);
        }
        return result;
    }
    const evaluate = sum();
    if (cursor !== tokens.length) throw new Error("Unexpected value in animation expression");
    return context => {
        const value = evaluate(context);
        if (!Number.isFinite(value)) throw new Error("Animation formula produced an invalid number");
        return value;
    };
}
