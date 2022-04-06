import { BuildTemplate } from "./library-builder";
import { ParseTemplate } from "./parser";

type Context = import("webpack").LoaderContext<{ declare: boolean }>;

export default function (this: Context, source: string) {
  return BuildTemplate(ParseTemplate(source), this.resourcePath);
}
