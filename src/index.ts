import { CompileApp } from "./compiler";

(async () => {
  await CompileApp();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
