import { AsyncFunction } from "./types";

export default {
  Keys<T extends object>(subject: T): (keyof T)[] {
    return Object.keys(subject) as any;
  },
  MapKeys<T extends object, TResult extends { [TKey in keyof T]: any }>(
    subject: T,
    selector: <TKey extends keyof T>(item: T[TKey], key: TKey) => TResult[TKey]
  ): TResult {
    const result: any = {};
    for (const key of this.Keys(subject)) {
      result[key] = selector(subject[key], key);
    }

    return result;
  },
  *Values<T extends object>(subject: T): Generator<T[any]> {
    for (const key of this.Keys(subject)) {
      yield subject[key];
    }
  },
  Stringify(obj: any, depth = 1): string {
    if (obj == null) {
      return String(obj);
    }
    switch (typeof obj) {
      case "string":
        return '"' + obj + '"';
      case "function":
        return (obj instanceof AsyncFunction ? "async " : "") + obj.toString();
      case "object":
        const indent = Array(1).join("\t"),
          isArray = Array.isArray(obj);
        return (
          "{["[+isArray] +
          Object.keys(obj)
            .map((key) => {
              return (
                "\n\t" +
                indent +
                key +
                ": " +
                this.Stringify(obj[key], depth + 1)
              );
            })
            .join(",") +
          "\n" +
          indent +
          "}]"[+isArray]
        );
      default:
        return obj.toString();
    }
  },
};
