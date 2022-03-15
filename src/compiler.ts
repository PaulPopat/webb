import { BuildTemplate } from "./library-builder";
import { ParseTemplate } from "./parser";
import Fs from "./utils/file-system";
import { Lib, Source } from "./locations";

export async function CompileApp() {
  for await (const [js, path] of Fs.ReadWholeDir(Source)
    .where((p) => p.endsWith(".webb"))
    .select(async (p) => [await Fs.readFile(p, "utf-8"), p] as const)
    .select(([content, path]) => [ParseTemplate(content), path] as const)
    .select(([template, path]) => [BuildTemplate(template, path), path])
    .select(([js, path]) => [js, path.replace(Source, Lib)] as const)) {
    await Fs.writeFile(js, path);
  }
}
