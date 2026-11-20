// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Node module hooks for rendering a theme outside the shop: `@theme/<path>` resolves like the core's tsconfig (the
// theme's src/ first, then the default theme), TypeScript and TSX are transpiled with the theme's own TypeScript,
// stylesheets are empty, and the Next modules a theme may use are small stand-ins (no router, no image server).
import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

let ROOT;
let ts;

export async function initialize({ root }) {
  ROOT = root;
  ts = createRequire(join(root, "package.json"))("typescript");
}

const STUBS = {
  "next/link": `
    import { createElement } from "react";
    export default function Link({ href, children, prefetch, scroll, replace, shallow, locale, ...props }) {
      return createElement("a", { href: typeof href === "string" ? href : String(href?.pathname ?? "#"), ...props }, children);
    }
    export function useLinkStatus() { return { pending: false }; }`,
  "next/image": `
    import { createElement } from "react";
    export default function Image({ src, alt, fill, sizes, priority, loading, quality, placeholder, blurDataURL, unoptimized, ...props }) {
      return createElement("img", { src: typeof src === "string" ? src : String(src?.src ?? ""), alt, ...props });
    }`,
  "next/dynamic": `
    import { lazy } from "react";
    export default function dynamic(load) {
      return lazy(() => load().then((m) => ({ default: typeof m === "function" ? m : (m.default ?? m) })));
    }`,
  "next/navigation": `
    const router = { push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {} };
    export const useRouter = () => router;
    export const usePathname = () => "/";
    export const useParams = () => ({});
    export const useSearchParams = () => new URLSearchParams();
    export function notFound() { throw new Error("notFound() outside the shop"); }
    export function redirect() { throw new Error("redirect() outside the shop"); }`,
  css: "export default {};",
};

const is_file = (path) => existsSync(path) && statSync(path).isFile();
const find = (base) => ["", ".tsx", ".ts", "/index.tsx", "/index.ts"].map((ext) => base + ext).find(is_file) ?? null;

export async function resolve(specifier, context, next) {
  // A stand-in's own imports (react) come from the theme's packages.
  if (context.parentURL?.startsWith("entirius-stub:")) {
    return next(specifier, { ...context, parentURL: pathToFileURL(join(ROOT, "package.json")).href });
  }
  if (Object.hasOwn(STUBS, specifier)) return { url: `entirius-stub:${specifier}`, shortCircuit: true };
  if (specifier.endsWith(".css")) return { url: "entirius-stub:css", shortCircuit: true };
  if (specifier.startsWith("@theme/")) {
    const path = specifier.slice("@theme/".length);
    const file = find(join(ROOT, "src", path)) ?? find(join(ROOT, "node_modules/@entirius/theme-default/src", path));
    if (!file) throw new Error(`${specifier}: no such file in the theme or the default theme`);
    return { url: pathToFileURL(file).href, shortCircuit: true };
  }
  // TypeScript sources import each other without the extension.
  if (/^\.\.?\//.test(specifier) && /\.tsx?$/.test(context.parentURL ?? "")) {
    const file = find(fileURLToPath(new URL(specifier, context.parentURL)));
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.startsWith("entirius-stub:")) {
    return { format: "module", source: STUBS[url.slice("entirius-stub:".length)], shortCircuit: true };
  }
  if (/\.tsx?$/.test(url)) {
    const file = fileURLToPath(url);
    const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
      fileName: file,
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        // Errors point at the theme's own lines.
        inlineSourceMap: true,
        inlineSources: true,
      },
    });
    return { format: "module", source: outputText, shortCircuit: true };
  }
  return next(url, context);
}
