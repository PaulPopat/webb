import "geninq";
import { Assert } from "@paulpopat/safe-type";
import { X2jOptions, XMLParser } from "fast-xml-parser";
import {
  EventTrigger,
  GlobalEvent,
  IsParsedScript,
  IsParsedStyle,
  IsParsedTemplate,
  IsParsedXml,
  ParsedTemplate,
  ParsedXml,
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

function GetHandlers(xml: ParsedXml) {
  const scripts = xml.geninq().where((i) => Object.keys(i)[0] === "script");
  const element_events = {} as Record<string, Record<EventTrigger, string>>;
  const global_events = {} as Record<GlobalEvent, string>;
  for (const script of scripts) {
    Assert(IsParsedScript, script, "Invalid script. See documentation.");
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

  return {
    global_events,
    element_events,
  };
}

function GetStyles(xml: ParsedXml) {
  const styles = xml
    .geninq()
    .single((i) => Object.keys(i)[0] === "style", "or-default");
  if (styles) {
    Assert(IsParsedStyle, styles, "Invalid styles. See documentation.");
    const data = styles.style[0]["@_text"];
    if (!data) throw new Error("Invalid styles. See documentation.");
    return data;
  }

  return undefined;
}

function GetTemplate(xml: ParsedXml) {
  const template = xml
    .geninq()
    .single<ParsedTemplate>(IsParsedTemplate, "or-default")?.template;
  if (!template) {
    throw new Error("No template present");
  }

  return template;
}

export function ParseTemplate(xml: string) {
  const result = new XMLParser(options).parse(xml);
  debugger;
  Assert(IsParsedXml, result, "Invalid XML for the webb standard");

  return {
    template: GetTemplate(result),
    ...GetHandlers(result),
    styles: GetStyles(result),
  };
}
