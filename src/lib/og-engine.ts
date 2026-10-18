import { init } from "satori/standalone";
import { initWasm } from "@resvg/resvg-wasm";
import yogaWasm from "satori/yoga.wasm?module";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm?module";

let engine: Promise<void> | undefined;
export function initEngine() {
  engine ??= Promise.all([init(yogaWasm), initWasm(resvgWasm)]).then(() => {});
  return engine;
}
