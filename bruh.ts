import { YTDLPModel } from "./src/FFMPEGPathManipulator";

const model = new YTDLPModel();
async function main() {
  const stdout = await model.getVersion();
}

main();
