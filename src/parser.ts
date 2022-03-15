import "geninq";
import {
  Assert,
  Checker,
  IsArray,
  IsBoolean,
  IsIntersection,
  IsObject,
  IsRecord,
  IsString,
  IsTuple,
  IsType,
  IsUnion,
  Optional,
} from "@paulpopat/safe-type";
import { X2jOptions, XMLParser } from "fast-xml-parser";
import {
  IsGlobalEvent,
  IsEventTrigger,
  EventTrigger,
  GlobalEvent,
} from "./types";

const options: X2jOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "",
  allowBooleanAttributes: true,
  alwaysCreateTextNode: true,
  attributesGroupName: "@_attr",
  attributeValueProcessor: (_, val) => val,
  cdataPropName: "@_cdata",
  commentPropName: "@_comment",
  ignoreDeclaration: true,
  ignorePiTags: true,
  isArray: () => false,
  numberParseOptions: { leadingZeros: false, hex: false, skipLike: /[0-9]+/gm },
  parseAttributeValue: false,
  parseTagValue: false,
  preserveOrder: true,
  processEntities: false,
  removeNSPrefix: false,
  stopNodes: ["script", "style"],
  tagValueProcessor: (_, val) => val,
  textNodeName: "@_text",
  trimValues: true,
  unpairedTags: [],
  htmlEntities: false,
};

type Xml = (
  | (
      | { [key: string]: Xml }
      | ({ [key: string]: Xml } & {
          ":@"?: { "@attr": Record<string, string> };
        })
    )
  | { "@_text": string }
)[];

const IsElement = IsRecord(IsString, ((args) => IsXml(args)) as Checker<Xml>);

const WithAttributes = IsIntersection(
  IsElement,
  IsObject({
    ":@": IsObject({
      "@_attr": IsRecord(IsString, IsUnion(IsString, IsBoolean)),
    }),
  })
);

const IsText = IsObject({ "@_text": IsString });

const IsXml: Checker<Xml> = IsArray(IsUnion(IsElement, WithAttributes, IsText));

const IsScript = IsObject({
  script: IsTuple(IsObject({ "@_text": IsString })),
  ":@": IsObject({
    "@_attr": IsUnion(
      IsObject({ on: IsGlobalEvent }),
      IsObject({ trigger: IsEventTrigger, selector: IsString })
    ),
  }),
});

const IsStyle = IsObject({
  style: IsTuple(IsObject({ "@_text": IsString })),
});

const IsTemplate = IsObject({
  template: IsXml,
});

const IsProps = IsObject({
  props: IsArray(
    IsObject({
      prop: IsTuple(),
      ":@": IsObject({
        "@_attr": IsUnion(
          IsObject({ name: IsString }),
          IsObject({
            name: IsString,
            complex: IsBoolean,
            validation: IsString,
          })
        ),
      }),
    })
  ),
});

type Template = IsType<typeof IsTemplate>;

export type XmlElement =
  | {
      tag: string;
      attributes: Record<string, string | boolean>;
      children: XmlElement[];
    }
  | string;

function GetTag(ele: Xml[number]) {
  return Object.keys(ele)
    .geninq()
    .single((k) => k !== ":@");
}

function TransformXml(xml: Xml): XmlElement[] {
  return xml
    .geninq()
    .select((o) =>
      IsText(o)
        ? o["@_text"]
        : {
            tag: GetTag(o),
            attributes: WithAttributes(o) ? o[":@"]["@_attr"] : {},
            children: TransformXml(o[GetTag(o)]),
          }
    )
    .array();
}

function GetHandlers(xml: Xml) {
  const scripts = xml.geninq().where((i) => GetTag(i) === "script");
  const element_events = {} as Record<string, Record<EventTrigger, string>>;
  const global_events = {} as Record<GlobalEvent, string>;
  for (const script of scripts) {
    Assert(IsScript, script, "Invalid script. See documentation.");
    const attr = script[":@"]["@_attr"];
    const data = script.script[0]["@_text"];
    if (!data) throw new Error("Invalid script. See documentation.");
    if ("on" in attr) global_events[attr.on] = data;
    else
      element_events[attr.selector] = {
        ...element_events[attr.selector],
        [attr.trigger]: data,
      };
  }

  const result = {} as {
    element_events?: typeof element_events;
    global_events?: typeof global_events;
  };
  if (Object.keys(element_events).length)
    result.element_events = element_events;
  if (Object.keys(global_events).length) result.global_events = global_events;

  return result;
}

function GetStyles(xml: Xml) {
  const styles = xml
    .geninq()
    .single((i) => GetTag(i) === "style", "or-default");
  if (styles) {
    Assert(IsStyle, styles, "Invalid styles. See documentation.");
    const data = styles.style[0]["@_text"];
    if (!data) throw new Error("Invalid styles. See documentation.");
    return { styles: data };
  }

  return {};
}

function GetProps(xml: Xml) {
  const props = xml.geninq().single((i) => GetTag(i) === "props", "or-default");
  if (!props) return {};
  Assert(IsProps, props, "Props are invalid");
  const result = {} as Record<string, string>;
  for (const prop of props.props) {
    const attr = prop[":@"]["@_attr"];
    result[attr.name] =
      "complex" in attr && attr.complex ? attr.validation : "DoNotCare";
  }

  return { props: result };
}

function GetTemplate(xml: Xml) {
  const template = xml
    .geninq()
    .single<Template>(IsTemplate, "or-default")?.template;
  if (!template) {
    throw new Error("No template present");
  }

  return TransformXml(template);
}

export function ParseTemplate(xml: string) {
  const result = new XMLParser(options).parse(xml);
  Assert(IsXml, result, "Invalid XML for the webb standard");

  return {
    template: GetTemplate(result),
    ...GetHandlers(result),
    ...GetStyles(result),
    ...GetProps(result),
  };
}
