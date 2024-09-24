import CLI from "../cli";
import { describe, expect, it } from "vitest";
import fs from "fs";
import { fileURLToPath } from "url";
import * as path from "path";
import FFMPEGManipulator from "../FFMPEGManipulator";
import { YTDLPModel } from "../FFMPEGPathManipulator";

describe("ffmpeg", () => {
  it("gets info", async () => {
    // const __filename = fileURLToPath(import.meta.url);
    // const __dirname = path.dirname(__filename);
    const filepath = path.join(__dirname, "../../testvideos/rain.mp4");
    const content = await FFMPEGManipulator.getInfo(filepath);
    expect(content).toBeTruthy();
    expect(content.codec_name).toBe("vp9");
  });

  it(
    "slices video",
    async () => {
      // const __filename = fileURLToPath(import.meta.url);
      // const __dirname = path.dirname(__filename);
      const filepath = path.join(__dirname, "../../testvideos/rain.mp4");
      const output = path.join(__dirname, "../../testvideos/output.mp4");
      await FFMPEGManipulator.createVideoSlice(filepath, output, 4, 10, {
        quiet: true,
      });
    },
    {
      timeout: 1000 * 60,
    }
  );
});

const basicModel = new YTDLPModel();

describe("ytdlp", () => {
  it("gets info", async () => {
    const stdout = await basicModel.getVersion();
    expect(stdout).toBeTruthy();
  }, 30000);

  it("downloads vid", async () => {
    const destinationpath = path.join(__dirname, "../../testvideos");
    const stdout = await basicModel.downloadVideo(
      "https://www.youtube.com/watch?v=BZP1rYjoBgI",
      destinationpath
    );
    expect(stdout).toBeTruthy();
  }, 30000);
});
