import CLI from "../cli";
import { describe, expect, it } from "vitest";
import fs from "fs";
import { fileURLToPath } from "url";
import * as path from "path";
import FFMPEGManipulator from "../FFMPEGManipulator";

describe("ffmpeg", () => {
  it("gets info", async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filepath = path.join(__dirname, "../../testvideos/rain.mp4");
    const content = await FFMPEGManipulator.getInfo(filepath);
    expect(content).toBeTruthy();
    expect(content.codec_name).toBe("vp9");
  });

  it(
    "slices video",
    async () => {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
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
