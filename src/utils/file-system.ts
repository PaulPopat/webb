import Fs from "fs-extra";
import Path from "path";

export default {
  ...Fs,
  async *ReadWholeDir(dir: string): AsyncGenerator<string> {
    const content = await Fs.readdir(dir);
    for (const file of content) {
      const path = Path.join(dir, file);
      const stat = await Fs.stat(path);
      if (stat.isDirectory()) yield* this.ReadWholeDir(path);
      else yield path;
    }
  },
};
