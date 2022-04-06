import { BuildTemplate } from "./library-builder";

it("Builds a full template", () => {
  expect(
    BuildTemplate(
      {
        dependencies: ["./test/path", "./another/path"],
        template: [{ tag: "div", attributes: { class: "test" }, children: [] }],
        props: { test: "DoNotCare", another: "IsString" },
        element_events: {
          ".test-selector": {
            click: "const a = 'test'; set_state(a);",
          },
        },

        global_events: {
          props: "set_state(props);",
          render: "console.log('Hello world')",
        },

        styles: "a { text-decoration: underline; span { color: red; } }",
      },
      "test"
    )
  ).toBe(`
import * as SafeType from "@paulpopat/safe-type";
import Component from "@paulpopat/webb/lib/component";
import "./test/path.webb"; import "./another/path.webb";
const result = Component(
  {test:SafeType.DoNotCare,another:SafeType.IsString,},
  [{"tag":"div","attributes":{"class":"test"},"children":[]}],
  "a { text-decoration: underline; } a span { color: red; }",
  {".test-selector":{"click":async (event, state, set_state) => {const a = 'test'; set_state(a);}}},
  {"props":async (props, state, set_state) => {set_state(props);},"render":async (state, set_state) => {console.log('Hello world')}}
);
window.customElements.define("test", result);
  `);
});
