import { ParseTemplate } from "./parser";

it.each([
  [
    "<template>Hello</template>",
    {
      template: ["Hello"],
    },
  ],
  [
    '<template>Hello</template><script on="props"><testdata/></script>',
    {
      template: ["Hello"],
      global_events: { props: "<testdata/>" },
    },
  ],
  [
    '<template>Hello</template><script trigger="click" selector="test"><testdata/></script>',
    {
      template: ["Hello"],
      element_events: { test: { click: "<testdata/>" } },
    },
  ],
  [
    "<template>Hello</template><style><testdata/></style>",
    {
      template: ["Hello"],
      styles: "<testdata/>",
    },
  ],
  [
    "<template><div>This<b>is</b>a test</div></template>",
    {
      template: [
        {
          tag: "div",
          attributes: {},
          children: [
            "This",
            {
              tag: "b",
              attributes: {},
              children: ["is"],
            },
            "a test",
          ],
        },
      ],
    },
  ],
  [
    '<template><div class="test">This is a test</div></template>',
    {
      template: [
        {
          tag: "div",
          attributes: { class: "test" },
          children: ["This is a test"],
        },
      ],
    },
  ],
  [
    '<props><prop name="test" /></props><template>This is a test</template>',
    {
      props: {
        test: "DoNotCare"
      },
      template: ["This is a test"],
    },
  ],
  [
    '<props><prop name="test" complex validation="IsString" /></props><template>This is a test</template>',
    {
      props: {
        test: "IsString"
      },
      template: ["This is a test"],
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
  [
    '<props><prop name="hello">Invalid Children</prop></props><template>Hello</template>',
    new Error("Props are invalid"),
  ],
])("fails on %s", (xml, error) => {
  expect(() => ParseTemplate(xml)).toThrowError(error);
});
