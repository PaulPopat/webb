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
};
