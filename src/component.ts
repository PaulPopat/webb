import {
  Assert,
  Checker,
  DoNotCare,
  IsArray,
  IsBoolean,
  IsString,
} from "@paulpopat/safe-type";
import { EventTrigger, GlobalEvent } from "./types";
import { RunText, ParseText } from "./utils/expression";
import Object from "./utils/object";

type XmlElements = import("./parser").XmlElement[];
type XmlNode = import("./parser").XmlNode;

type EventHandlers = Record<
  GlobalEvent,
  (
    state: unknown,
    set_state: (new_state: unknown) => void,
    props: unknown
  ) => void
>;
type TriggerHandlers = Record<
  string,
  Record<
    EventTrigger,
    (
      event: Event,
      state: unknown,
      set_state: (new_state: unknown) => void
    ) => void
  >
>;

async function AddAttributes(
  node: XmlNode,
  element: HTMLElement,
  props: object
) {
  for (const key of Object.Keys(node.attributes)) {
    const value = node.attributes[key];
    if (typeof value === "boolean") {
      element.setAttribute(key, value.toString());
    } else if (value.startsWith(":")) {
      const input = await RunText(value.substring(1), props);
      if (typeof input !== "string")
        element.setAttribute(key, "%%JSON%%" + JSON.stringify(input));
      else element.setAttribute(key, input);
    } else {
      element.setAttribute(key, value);
    }
  }
}

async function CreateElement(item: XmlNode, props: object) {
  const element = document.createElement(item.tag);
  await AddAttributes(item, element, props);
  for await (const node of Render(item.children, props))
    element.appendChild(node);
  return element;
}

async function CreateText(item: string, props: object) {
  return document.createTextNode(await ParseText(item, props));
}

async function* CreateForEach(item: XmlNode, props: object) {
  const subject_attr = item.attributes.subject;
  if (
    !subject_attr ||
    typeof subject_attr !== "string" ||
    !subject_attr.startsWith(":")
  )
    throw new Error("For loops must have a calculated subject");

  const subject = await RunText(subject_attr.substring(1), props);
  Assert(IsArray(DoNotCare), subject, "For loop subjects must be arrays");

  for (const sub of subject)
    yield* Render(item.children, { ...props, subject: sub });
}

async function* CreateIf(item: XmlNode, props: object) {
  const subject_attr = item.attributes.subject;
  if (
    !subject_attr ||
    typeof subject_attr !== "string" ||
    !subject_attr.startsWith(":")
  )
    throw new Error("If statements must have a calculated subject");

  const subject = await RunText(subject_attr.substring(1), props);
  Assert(IsBoolean, subject, "If statements must have boolean subjects");
}

async function* Render(xml: XmlElements, props: object): AsyncGenerator<Node> {
  for (const item of xml) {
    if (IsString(item)) yield CreateText(item, props);
    else if (item.tag === "for-each") yield* CreateForEach(item, props);
    else if (item.tag === "if-statement") yield* CreateIf(item, props);
    else yield await CreateElement(item, props);
  }
}

function ParseAttributeValue(val: string) {
  return val.startsWith("%%JSON%%")
    ? JSON.parse(val.replace("%%JSON%%", ""))
    : val;
}

export default function <TProps extends Record<string, any>>(
  IsProps: { [TKey in keyof TProps]: Checker<TProps[TKey]> },
  Template: XmlElements,
  Css: string,
  TriggerHandlers: TriggerHandlers,
  EventHandlers: EventHandlers
) {
  function Attributes(map: NamedNodeMap) {
    const result = {} as TProps;
    for (const item of map) {
      const value = ParseAttributeValue(item.value);
      const key = item.name as keyof TProps;
      Assert(IsProps[key], value);
    }

    for (const key of Object.Keys(IsProps))
      if (!(key in result)) throw new Error("Invalid props for component");

    return result;
  }

  return class extends HTMLElement {
    readonly #root: ShadowRoot;
    #state: unknown;
    #props: TProps;

    #trigger(event: keyof EventHandlers) {
      if (!EventHandlers[event]) return;
      EventHandlers[event](this.#state, this.#set_state, this.#props);
    }

    async #render() {
      const input_state =
        typeof this.#state === "object" ? this.#state : { state: this.#state };
      const input = document.createElement("template");
      for await (const ele of Render(Template, input_state ?? {})) {
        input.appendChild(ele);
      }

      const style = document.createElement("style");
      style.innerHTML = Css;
      this.#root.replaceChildren(style, ...input.childNodes);

      for (const selector of Object.Keys(TriggerHandlers)) {
        const targets = this.#root.querySelectorAll(selector);
        const handlers = TriggerHandlers[selector];
        for (const target of targets)
          for (const event of Object.Keys(handlers)) {
            target.addEventListener(event, (e) => {
              handlers[event](e, this.#state, this.#set_state);
            });
          }
      }

      this.#trigger("render");
    }

    #set_state(new_state: unknown) {
      this.#state = new_state;
      this.#trigger("state");
      this.#render();
    }

    #new_props() {
      this.#props = Attributes(this.attributes);
      this.#trigger("props");
    }

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: "open" });
      this.#state = {};
      this.#props = {} as any;
      this.#new_props();
      this.#render();
    }

    static get observedAttributes() {
      return Object.Keys(IsProps);
    }

    attributeChangedCallback(
      name: string,
      old_value: string,
      new_value: string
    ) {
      this.#new_props();
    }
  };
}
