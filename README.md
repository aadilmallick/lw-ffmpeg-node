# Lightweight ffmpeg node

`lw-ffmpeg-node` is a lightweight Node.js library for manipulating video files using FFmpeg. It provides various methods to retrieve information about video files, compress videos, create video slices, crop videos, change video size and frame rate, and save video thumbnails. This library is designed to be simple yet comprehensive for developers to integrate into their projects easily.

## Installation

These libraries requires yt-dlp and ffmpeg to be installed on the system. You can install them using the following commands.

Install ffmpeg on WSL:

```bash
sudo add-apt-repository ppa:mc3man/trusty-media
sudo apt-get update
sudo apt-get dist-upgrade
sudo apt-get install ffmpeg
```

Install yt-dlp on WSL:

```bash
sudo apt-get install python3-pip
pip3 install yt-dlp
```

You can then install the library like so:

```bash
npm install lw-ffmpeg-node
```

## Usage

### `FFMPEGManipulator`

```javascript
import FFMPEGManipulator from "lw-ffmpeg-node";
```

The `FFMPEGManipulator` class provides various methods for manipulating video files. This expects that the `ffmpeg` command is available in the system path.

All these methods are static methods on the class.

- `getInfo(filePath: string)` : Retrieves detailed information about a video file, including codec name, width, height, bit rate, frame rate, filename, duration, number of streams, and size.
- `getVideoDuration(filePath: string)`: Gets the duration of a video file in seconds.
- `getVideoFramerate(filePath: string)`: Retrieves the frame rate of a video file.
  compress(inputPath: string, outputPath: string, options?: ProcessOptions)
  Compresses a video file, copying the audio track without re-encoding and encoding the video using the libx264 codec.
- `createVideoSlice(inputPath: string, outputPath: string, inpoint: number, outpoint: number, options?: ProcessOptions)`: Creates a slice of a video file from inpoint to outpoint.
- `cropVideo(inputPath: string, outputPath: string, x: number, y: number, width: number, height: number, options?: ProcessOptions)`: Crops a video file to the specified dimensions.
- `changeSize(inputPath: string, outputPath: string, width: number, height: number, options?: ProcessOptions)`: Changes the size of a video file to the specified width and height.
- `changeFramerate(inputPath: string, outputPath: string, frameRate: number, options?: ProcessOptions)`: Changes the frame rate of a video file.
- `saveThumbnail(inputPath: string, outputPath: string, time: number, options?: ProcessOptions)`:
  Saves a thumbnail image from a video file at the specified time.

```javascript
async function main() {
  const filePath = "path/to/video.mp4";
  const outputPath = "path/to/output.mp4";

  // Get video information
  const info = await FFMPEGManipulator.getInfo(filePath);
  console.log(info);

  // Compress video
  await FFMPEGManipulator.compress(filePath, outputPath);

  // Create video slice
  await FFMPEGManipulator.createVideoSlice(filePath, outputPath, 3, 6);

  // Crop video
  await FFMPEGManipulator.cropVideo(filePath, outputPath, 100, 100, 640, 480);

  // Change video size
  await FFMPEGManipulator.changeSize(filePath, outputPath, 1280, 720);

  // Change video frame rate
  await FFMPEGManipulator.changeFramerate(filePath, outputPath, 30);

  // Save video thumbnail
  await FFMPEGManipulator.saveThumbnail(filePath, "path/to/thumbnail.png", 10);
}

main();
```

### CLI

This is the basis behind how ffmpeg and ytdlp work with the command line. The CLI class is a wrapper around the child_process module in Node.js. It provides a simple way to execute commands in the terminal.

```ts
export default class CLI {
  static cmd(
    filepath: string,
    command: string,
    options?: ProcessOptions
  ): Promise<string> {
    const args = command
      .match(/(?:[^\s"]+|"[^"]*")+/g)
      ?.map((arg) => arg.replace(/"/g, ""));
    if (!args) {
      throw new Error("Invalid command");
    }
    return new Promise((resolve, reject) => {
      execFile(
        filepath,
        args,
        {
          maxBuffer: 500 * 1_000_000,
          ...options,
        },
        (error, stdout, stderr) => {
          if (error) {
            Print.yellow(`Error executing ${path.basename(filepath)}:`, error);
            reject(stderr);
          } else {
            resolve(stdout);
          }
        }
      );
    });
  }

  static linux(command: string, options?: ProcessOptions) {
    try {
      // send back stderr and stdout
      return new Promise((resolve, reject) => {
        const child = spawn(command, {
          shell: "bash",
          ...options,
        });
        let stdout = "";
        let stderr = "";

        child.stdout?.on("data", (data) => {
          options?.quiet === false && console.log(data.toString());
          stdout += data.toString();
        });

        child.stderr?.on("data", (data) => {
          options?.quiet === false && console.log(data.toString());
          stderr += data.toString();
        });

        child.on("close", (code) => {
          if (code !== 0) {
            reject(new LinuxError(command, stderr));
          } else {
            resolve(stdout);
          }
        });
      });
    } catch (e) {
      throw new LinuxError(command);
    }
  }
}
```

### FileManager

### Print

### YTDLPModel

There are two ways to use YTDLPModel:

1. Use with ytdlp sitting on the path.
2. Point to a specific binary of ytdlp.

```javascript
import { YTDLPModel } from "./src/FFMPEGPathManipulator";

const path = "C:\\Users\\Waadl\\src\\binaries\\yt-dlp.exe";

const url = "https://www.youtube.com/watch?v=_Td7JjCTfyc";

const ytdlp = new YTDLPModel(path);
async function main() {
  // downloads video to current directory
  await ytdlp.downloadVideo(url, "./", {
    // shouldOverwite enables the --force-overwrites flag to overwrite downloading same video
    shouldOverwrite: true,
    // if quality is high, ensures mp4 download
    quality: "high",
    // cliOptions to determine command line behavior
    cliOptions: {
      // quiet flag to suppress output. If false, then prints the output as it comes
      quiet: false,
    },
  });
}

main();
```
