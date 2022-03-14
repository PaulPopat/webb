import { ParseTemplate } from "./parser";

it.each([
  [
    "<template>Hello</template>",
    {
      template: [{ "@_text": "Hello" }],
      element_events: {},
      global_events: {},
    },
  ],
  [
    '<template>Hello</template><script on="props"><testdata/></script>',
    {
      template: [{ "@_text": "Hello" }],
      global_events: { props: "<testdata/>" },
      element_events: {},
    },
  ],
  [
    '<template>Hello</template><script trigger="click" selector="test"><testdata/></script>',
    {
      template: [{ "@_text": "Hello" }],
      global_events: {},
      element_events: { test: { click: "<testdata/>" } },
    },
  ],
  [
    "<template>Hello</template><style><testdata/></style>",
    {
      template: [{ "@_text": "Hello" }],
      global_events: {},
      element_events: {},
      styles: "<testdata/>",
    },
  ],
  [
    "<template><div>This<b>is</b>a test</template>",
    {
      template: [
        {
          div: [
            { "@_text": "This" },
            { b: [{ "@_text": "is" }] },
            { "@_text": "a test" },
          ],
        },
      ],
      global_events: {},
      element_events: {},
    },
  ],
])("renders %s correctly", (xml, expected) => {
  expect(ParseTemplate(xml)).toEqual(expected);
});

it.each([
  ["<div>Hello</div>", new Error("No template present")],
  [
    "<template>Hello</template><script><testdata/></script>",
    new Error("Invalid script. See documentation."),
  ],
  [
    '<template>Hello</template><script on="Invalid"><testdata/></script>',
    new Error("Invalid script. See documentation."),
  ],
  [
    '<template>Hello</template><script on="props"></script>',
    new Error("Invalid script. See documentation."),
  ],
  [
    "<template>Hello</template><style></style>",
    new Error("Invalid styles. See documentation."),
  ],
  [
    '<template>Hello</template><style test="wrong">test</style>',
    new Error("Invalid styles. See documentation."),
  ],
])("fails on %s", (xml, error) => {
  expect(() => ParseTemplate(xml)).toThrowError(error);
});
