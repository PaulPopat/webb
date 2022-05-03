import object from "./object";
import { AsyncFunction } from "./types";

function* GetExpressions(value: string) {
  let current = "";
  let depth = 0;
  for (const char of value) {
    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        yield current;
        current = "";
      }
    }

    if (depth > 0) {
      current += char;
    }

    if (char === "{") {
      depth += 1;
    }
  }
}

async function Evaluate(
  expression: string,
  data: { name: string; value: any }[]
) {
  const input = [...data.map((d) => d.name), "return " + expression];
  return await new AsyncFunction(...input)(...data.map((d) => d.value));
}

export async function ParseText(text: string, data: object) {
  for (const expression of GetExpressions(text)) {
    text = text.replace(
      `{${expression}}`,
      await Evaluate(expression, [
        ...object.Keys(data).map((key) => ({ name: key, value: data[key] })),
      ])
    );
  }

  return text;
}

export async function RunText(text: string, data: object): Promise<unknown> {
  return await Evaluate(text, [
    ...object.Keys(data).map((key) => ({ name: key, value: data[key] })),
  ]);
}
