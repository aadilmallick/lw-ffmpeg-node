import { spawn } from "child_process";
import CLI from "./cli";
import fs from "fs/promises";

interface ProcessOptions {
  quiet?: boolean;
  detached?: boolean;
}

export default class FFMPEGManipulator {
  static async getInfo(filePath: string) {
    const jsonPath = CLI.getFilePath("info.json");
    const part1 =
      "ffprobe -v error -print_format json -select_streams v:0 -show_format -show_streams";
    const part2 =
      "-show_entries stream=codec_name,width,height,bit_rate,r_frame_rate";
    const part3 = "-show_entries format=duration,filename,nb_streams,size";
    await CLI.linux(`${part1} ${part2} ${part3} ${filePath} > ${jsonPath}`);
    const content = await fs.readFile(jsonPath, "utf-8");
    const data = JSON.parse(content);
    if (!data) {
      throw new Error("No data found");
    }
    await fs.unlink(jsonPath);
    const info = {
      codec_name: data.streams[0].codec_name as string,
      width: Number(data.streams[0].width),
      height: Number(data.streams[0].height),
      bit_rate: Number(data.streams[0].bit_rate),
      r_frame_rate: this.convertFractionStringToNumber(
        data.streams[0].r_frame_rate
      ),
      filename: data.format.filename as string,
      duration: Number(data.format.duration),
      nb_streams: data.format.nb_streams as number,
      size: Number(data.format.size),
    };
    return info;
  }

  static async getVideoDuration(filePath: string) {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    const duration = await CLI.linuxWithData(`${command}`);
    return Number(duration);
  }

  static async getVideoFramerate(filePath: string) {
    const command = `ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    const frameRate = await CLI.linuxWithData(`${command}`);
    console.log(frameRate);
    return this.convertFractionStringToNumber(frameRate);
  }

  private static convertFractionStringToNumber(fractionString: string) {
    const [numerator, denominator] = fractionString.split("/").map(Number);
    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
      throw new Error("Invalid fraction string");
    }
    return numerator / denominator;
  }

  /**
   *
   * @param inputPath the path to the input file
   * @param outputPath the path to the output file
   * @description compresses a video file, copies audio track without encoding, encodes video using libx264
   */
  static async compress(
    inputPath: string,
    outputPath: string,
    options?: ProcessOptions
  ) {
    await CLI.linux(
      `ffmpeg -y -i ${inputPath} -vcodec libx264 -crf 28 -acodec copy  ${outputPath}`,
      options
    );
  }

  static async createVideoSlice(
    input_path: string,
    output_path: string,
    inpoint: number,
    outpoint: number,
    options?: ProcessOptions
  ) {
    if (inpoint >= outpoint) {
      throw new Error("inpoint must be less than outpoint");
    }
    if (inpoint < 0) {
      throw new Error("inpoint must be greater than or equal to 0");
    }
    const duration = await FFMPEGManipulator.getVideoDuration(input_path);
    if (outpoint > duration || inpoint > duration) {
      throw new Error("outpoint must be less than the video duration");
    }

    await CLI.linux(
      `ffmpeg -y -ss ${inpoint} -t ${
        outpoint - inpoint
      } -i ${input_path} -c copy ${output_path}`,
      options
    );
    return output_path;
  }

  static async cropVideo(
    inputPath: string,
    outputPath: string,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: ProcessOptions
  ) {
    await CLI.linux(
      `ffmpeg -y -i ${inputPath} -vf "crop=${width}:${height}:${x}:${y}" ${outputPath}`,
      options
    );
  }
  static async changeSize(
    inputPath: string,
    outputPath: string,
    width: number,
    height: number,
    options?: ProcessOptions
  ) {
    await CLI.linux(
      `ffmpeg -y -i ${inputPath} -s ${width}x${height} ${outputPath}`,
      options
    );
  }
  static async changeFramerate(
    inputPath: string,
    outputPath: string,
    frameRate: number,
    options?: ProcessOptions
  ) {
    await CLI.linux(
      `ffmpeg -y -i ${inputPath} -r ${frameRate} ${outputPath}`,
      options
    );
  }

  static async saveThumbnail(
    inputPath: string,
    outputPath: string,
    time: number,
    options?: ProcessOptions
  ) {
    await CLI.linux(
      `ffmpeg -y -ss ${time} -i ${inputPath} -vframes 1 ${outputPath}`,
      options
    );
  }
}
