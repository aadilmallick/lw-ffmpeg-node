import { YTDLPModel } from "./src/FFMPEGPathManipulator";

const model = new YTDLPModel();
async function main() {
  const stdout = await model.downloadVideo(
    "https://www.youtube.com/watch?v=qcrJ3b-mQ6c",
    "./"
  );
  console.log(stdout);
}

main();
