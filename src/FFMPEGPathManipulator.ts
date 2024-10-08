/**
 * A class that allows support for using FFMPEG by providing a path to it.
 */

import CLI, { FileManager } from "./cli";
import { ProcessOptions } from "./FFMPEGManipulator";

type WithKeys<T, V extends keyof T> = {
  [K in V]: T[K];
};

type WithoutKeys<T, V extends keyof T> = {
  [K in Exclude<keyof T, V>]: T[K];
};

export class YTDLPModel {
  constructor(private ytdlpPath?: string) {
    ytdlpPath &&
      FileManager.exists(ytdlpPath).then((exists) => {
        if (!exists) {
          throw new Error(
            `yt-dlp path does not exist. Path provided: ${ytdlpPath}`
          );
        }
      });
  }

  private async linuxCmd(command: string, options?: ProcessOptions) {
    return (await CLI.linux(`yt-dlp ${command}`, options)) as unknown as string;
  }

  cmd: (command: string, options?: ProcessOptions) => Promise<string> = this
    .ytdlpPath
    ? CLI.cmd.bind(null, this.ytdlpPath)
    : this.linuxCmd;

  async getVersion() {
    return await this.cmd("--version");
  }

  async downloadVideo(
    url: string,
    destination: string,
    options?: {
      cliOptions?: Partial<WithoutKeys<ProcessOptions, "cwd">>;
      shouldOverwrite?: boolean;
      quality?: "high";
    }
  ) {
    const { ytUrl } = YTDLPModel.getYoutubeId(url);
    const qualityOption =
      options?.quality === "high"
        ? `-f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'`
        : "";
    const overwriteOption = options?.shouldOverwrite
      ? "--force-overwrites"
      : "";
    const stdout = await this.cmd(
      `${overwriteOption} ${qualityOption} ${ytUrl}`,
      {
        cwd: destination,
        ...options?.cliOptions,
      }
    );
    return stdout;
  }

  static getYoutubeId(url: string) {
    const youtubeVideoRegex = /https:\/\/www\.youtube\.com\/watch\?v=((\w|-)+)/;
    let ytUrl: string | null = null;

    ytUrl = youtubeVideoRegex.exec(url)![0];

    if (!ytUrl) {
      throw new Error("Invalid Youtube URL");
    }
    const videoId = ytUrl.split("=")[1];
    return {
      videoId,
      ytUrl,
    };
  }
}

export class FFMPEGPathModel {
  public ffprobe: FFPROBEModel;
  constructor(private ffmpegPath: string, private ffprobePath: string) {
    this.ffprobe = new FFPROBEModel(this.ffprobePath);
  }

  cmd: (command: string) => Promise<string> = CLI.cmd.bind(
    null,
    this.ffmpegPath
  );

  async getVersion() {
    return await this.cmd("-version");
  }

  async compress(inputPath: string, outputPath: string) {
    const stdout = await this.cmd(
      `-y -i ${inputPath} -vcodec libx264 -crf 28 -acodec copy ${outputPath}`
    );
    return stdout;
  }

  async createVideoSlice(
    input_path: string,
    output_path: string,
    inpoint: number,
    outpoint: number,
    options?: {
      compressAndConvertToMP4?: boolean;
    }
  ) {
    if (inpoint >= outpoint) {
      throw new Error("inpoint must be less than outpoint");
    }
    if (inpoint < 0) {
      throw new Error("inpoint must be greater than or equal to 0");
    }
    const duration = await this.ffprobe.getVideoDuration(input_path);
    if (outpoint > duration || inpoint > duration) {
      throw new Error("outpoint must be less than the video duration");
    }

    if (options?.compressAndConvertToMP4) {
      await this.cmd(
        `-y -ss ${inpoint} -t ${
          outpoint - inpoint
        } -i ${input_path} -vcodec libx264 -crf 28 -acodec aac ${output_path}`
      );
    } else {
      await this.cmd(
        `-y -ss ${inpoint} -t ${
          outpoint - inpoint
        } -i ${input_path} -c copy ${output_path}`
      );
    }

    return output_path;
  }

  async cropVideo(
    inputPath: string,
    outputPath: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    await this.cmd(
      `-y -i ${inputPath} -vf "crop=${width}:${height}:${x}:${y}" ${outputPath}`
    );
  }
  async changeSize(
    inputPath: string,
    outputPath: string,
    width: number,
    height: number
  ) {
    await this.cmd(`-y -i ${inputPath} -s ${width}x${height} ${outputPath}`);
  }
  async changeFramerate(
    inputPath: string,
    outputPath: string,
    frameRate: number
  ) {
    await this.cmd(`-y -i ${inputPath} -r ${frameRate} ${outputPath}`);
  }

  async saveThumbnail(inputPath: string, outputPath: string, time: number) {
    await this.cmd(`-y -ss ${time} -i ${inputPath} -vframes 1 ${outputPath}`);
  }
}

class FFPROBEModel {
  constructor(private ffprobePath: string) {}
  cmd: (command: string) => Promise<string> = CLI.cmd.bind(
    null,
    this.ffprobePath
  );

  async getVersion() {
    return await this.cmd("-version");
  }

  async getVideoInfo(filepath: string) {
    const part1 =
      "-v error -print_format json -select_streams v:0 -show_format -show_streams";
    const part2 =
      "-show_entries stream=codec_name,width,height,bit_rate,r_frame_rate";
    const part3 = "-show_entries format=duration,filename,nb_streams,size";
    const stdout = await this.cmd(`${part1} ${part2} ${part3} ${filepath}`);
    const data = JSON.parse(stdout);
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

  async getVideoDuration(filePath: string) {
    const command = `-v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${filePath}`;
    const duration = await this.cmd(command);
    return Number(duration);
  }

  async getVideoFrameRate(filePath: string) {
    try {
      const command = `-v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 ${filePath}`;
      const framerate = await this.cmd(command);
      return this.convertFractionStringToNumber(framerate);
    } catch (e) {
      console.error("Error getting frame rate:", e);
      return 30;
    }
  }

  private convertFractionStringToNumber(fractionString: string) {
    const [numerator, denominator] = fractionString.split("/").map(Number);
    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
      throw new Error("Invalid fraction string");
    }
    return numerator / denominator;
  }
}
