import {
  Checker,
  IsArray,
  IsIntersection,
  IsLiteral,
  IsObject,
  IsRecord,
  IsString,
  IsTuple,
  IsType,
  IsUnion,
  Optional,
} from "@paulpopat/safe-type";

export type ParsedXml = (
  | (
      | { [key: string]: ParsedXml }
      | ({ [key: string]: ParsedXml } & {
          ":@"?: { "@attr": Record<string, string> };
        })
    )
  | { "@_text": string }
)[];

export const IsParsedXml: Checker<ParsedXml> = IsArray(
  IsUnion(
    IsUnion(
      IsRecord(IsString, ((args) => IsParsedXml(args)) as Checker<ParsedXml>),
      IsIntersection(
        IsRecord(IsString, ((args) => IsParsedXml(args)) as Checker<ParsedXml>),
        IsObject({
          ":@": IsObject({ "@_attr": IsRecord(IsString, IsString) }),
        })
      )
    ),
    IsObject({ "@_text": IsString })
  )
);

export const IsGlobalEvent = IsUnion(IsLiteral("props"));
export type GlobalEvent = IsType<typeof IsGlobalEvent>;

export const IsEventTrigger = IsUnion(IsLiteral("click"));
export type EventTrigger = IsType<typeof IsEventTrigger>;

export const IsParsedScript = IsObject({
  script: IsTuple(IsObject({ "@_text": IsString })),
  ":@": IsObject({
    "@_attr": IsUnion(
      IsObject({ on: IsGlobalEvent }),
      IsObject({ trigger: IsEventTrigger, selector: IsString })
    ),
  }),
});

export const IsParsedStyle = IsObject({
  style: IsTuple(IsObject({ "@_text": IsString })),
});

export const IsParsedTemplate = IsObject({
  template: IsParsedXml,
});

export type ParsedTemplate = IsType<typeof IsParsedTemplate>;
