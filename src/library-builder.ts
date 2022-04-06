import Sass from "sass";
import Path from "path";
import { pathToFileURL as PathToUrl } from "url";
import Object from "./utils/object";

function CompileSass(sass: string | null | undefined, working_dir: string) {
  if (!sass) return "";
  return Sass.compileString(sass, {
    url: PathToUrl(working_dir),
    importer: {
      findFileUrl: (url) => PathToUrl(Path.join(working_dir, url)),
    },
  }).css;
}

export function BuildTemplate(
  template: import("./parser").ParsedTemplate,
  path: string
) {
  const name = Path.basename(path).replace(".webb", "");
  const imports =
    template.dependencies?.map((d) => `import "${d}.webb";`).join(" ") ?? "";
  const is_props = [
    ...Object.Values(
      Object.MapKeys(
        template.props ?? {},
        (val, name) =>
          `${name}:${val.replace(/(DoNotCare|Is[a-zA-Z]+)/gm, "SafeType.$&")},`
      )
    ),
  ].join("");
  const input_template = JSON.stringify(template.template);
  const css = CompileSass(template.styles, Path.dirname(path))
    .replace(/"/gm, '\\"')
    .replace(/\s+/gm, " ");
  const trigger_handlers = JSON.stringify(
    Object.MapKeys(template.element_events ?? {}, (k) =>
      Object.MapKeys(
        k,
        (handler) =>
          `%%FUNCTION_DATA%%async (event, state, set_state) => {${
            handler ?? ""
          }}%%END_FUNCTION_DATA%%`
      )
    )
  )
    .replace(/\"%%FUNCTION_DATA%%/gm, "")
    .replace(/%%END_FUNCTION_DATA%%\"/gm, "");
  const event_handlers = JSON.stringify(
    Object.MapKeys(template.global_events ?? {}, (handler, key) => {
      const args =
        key === "props" ? "(props, state, set_state)" : "(state, set_state)";
      return `%%FUNCTION_DATA%%async ${args} => {${
        handler ?? ""
      }}%%END_FUNCTION_DATA%%`;
    })
  )
    .replace(/\"%%FUNCTION_DATA%%/gm, "")
    .replace(/%%END_FUNCTION_DATA%%\"/gm, "");
  return `
import * as SafeType from "@paulpopat/safe-type";
import Component from "@paulpopat/webb/lib/component";
${imports}
const result = Componet(
  {${is_props}},
  ${input_template},
  "${css}",
  ${trigger_handlers},
  ${event_handlers}
);
window.customElements.define("${name}", result);
  `;
}
