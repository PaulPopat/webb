import { IsUnion, IsLiteral, IsType } from "@paulpopat/safe-type";

export const IsGlobalEvent = IsUnion(
  IsLiteral("props"),
  IsLiteral("render"),
  IsLiteral("state")
);
export type GlobalEvent = IsType<typeof IsGlobalEvent>;

export const IsEventTrigger = IsUnion(
  IsLiteral("click"),
  IsLiteral("mouseenter"),
  IsLiteral("mouseleave")
);
export type EventTrigger = IsType<typeof IsEventTrigger>;
