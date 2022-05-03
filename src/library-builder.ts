import Sass from "sass";
import Path from "path";
import { pathToFileURL as PathToUrl } from "url";
import object from "./utils/object";
import { AsyncFunction } from "./utils/types";

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
    ...object.Values(
      object.MapKeys(
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
  const trigger_handlers = object.Stringify(
    object.MapKeys(template.element_events ?? {}, (k) =>
      object.MapKeys(
        k,
        (handler) =>
          new AsyncFunction("event", "state", "set_state", handler ?? "")
      )
    )
  );
  const event_handlers = object.Stringify(
    object.MapKeys(
      template.global_events ?? {},
      (handler, key) =>
        new AsyncFunction("state", "set_state", "props", handler ?? "")
    )
  );
  return `
import * as SafeType from "@paulpopat/safe-type";
import Component from "@paulpopat/webb/lib/component";
${imports}
const result = Component(
  {${is_props}},
  ${input_template},
  "${css}",
  ${trigger_handlers},
  ${event_handlers}
);
window.customElements.define("${name}", result);
  `;
}
