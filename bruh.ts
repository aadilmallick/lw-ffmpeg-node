import { YTDLPModel } from "./src/FFMPEGPathManipulator";

const path =
  "C:\\Users\\Waadl\\Documents\\aadildev\\projects\\electron-youtube-download-trimmer\\yt-trimmer\\src\\binaries\\yt-dlp.exe";

const url = "https://www.youtube.com/watch?v=_Td7JjCTfyc";

const model = new YTDLPModel(path);
async function main() {
  await model.downloadVideo(url, "./", {
    shouldOverwrite: true,
    quality: "high",
    cliOptions: {
      quiet: false,
    },
  });
}

main();
