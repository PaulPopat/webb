import "geninq";
import Sass from "sass";
import Path from "path";
import { pathToFileURL as PathToUrl } from "url";
import Object from "./utils/object";
import UglifyJs from "uglify-js";

function CompileSass(sass: string | null | undefined, working_dir: string) {
  if (!sass) return "";
  return Sass.compileString(sass, {
    url: PathToUrl(working_dir),
    importer: {
      findFileUrl: (url) => PathToUrl(Path.join(working_dir, url)),
    },
  }).css;
}

function Uglify(js: string) {
  return UglifyJs.minify(js, { mangle: true }).code;
}

export function BuildTemplate(
  template: import("./parser").ParsedTemplate,
  path: string
) {
  return `
    import * as SafeType from "@paulpopat/safe-type";
    export const IsProps = SafeType.IsObject({${Object.Values(
      Object.MapKeys(
        template.props ?? {},
        (val, name) =>
          `${name}:${val.replace(/(DoNotCare|Is[a-zA-Z]+)/gm, "SafeType.$&")},`
      )
    )
      .array()
      .join("")}});
    export const Template = ${JSON.stringify(template.template)};
    export const Css = "${CompileSass(template.styles, Path.dirname(path))
      .replace(/"/gm, '\\"')
      .replace(/\s+/gm, " ")}";
    export const TriggerHandlers = ${JSON.stringify(
      Object.MapKeys(template.element_events ?? {}, (k) =>
        Object.MapKeys(
          k,
          (handler) =>
            `%%FUNCTION_DATA%%async (state, set_state) => {${Uglify(
              handler ?? ""
            )}}%%END_FUNCTION_DATA%%`
        )
      )
    )
      .replace(/\"%%FUNCTION_DATA%%/gm, "")
      .replace(/%%END_FUNCTION_DATA%%\"/gm, "")};
    export const EventHandlers = ${JSON.stringify(
      Object.MapKeys(template.global_events ?? {}, (handler, key) => {
        const args =
          key === "props" ? "(props, state, set_state)" : "(state, set_state)";
        return `%%FUNCTION_DATA%%async ${args} => {${Uglify(
          handler ?? ""
        )}}%%END_FUNCTION_DATA%%`;
      })
    )
      .replace(/\"%%FUNCTION_DATA%%/gm, "")
      .replace(/%%END_FUNCTION_DATA%%\"/gm, "")};
  `;
}
