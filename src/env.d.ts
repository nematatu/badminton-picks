declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "*.wasm?module" {
  const module: WebAssembly.Module;
  export default module;
}
