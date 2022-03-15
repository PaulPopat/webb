import { BuildTemplate } from "./library-builder";

jest.mock("sass", () => ({
  compileString: (sass: string) => ({ css: "Compiled-Sass => " + sass }),
}));

it("Builds a full template", () => {
  expect(
    BuildTemplate(
      {
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
    import * as SafeType from \"@paulpopat/safe-type\";
    export const IsProps = SafeType.IsObject({test:SafeType.DoNotCare,another:SafeType.IsString,});
    export const Template = [{\"tag\":\"div\",\"attributes\":{\"class\":\"test\"},\"children\":[]}];
    export const Css = \"Compiled-Sass => a { text-decoration: underline; span { color: red; } }\";
    export const TriggerHandlers = {\".test-selector\":{\"click\":async (state, set_state) => {const a=\\\"test\\\";set_state(a);}}};
    export const EventHandlers = {\"props\":async (props, state, set_state) => {set_state(props);},\"render\":async (state, set_state) => {console.log(\\\"Hello world\\\");}};
  `);
});
