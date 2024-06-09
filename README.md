# Lightweight ffmpeg node

`lw-ffmpeg-node` is a lightweight Node.js library for manipulating video files using FFmpeg. It provides various methods to retrieve information about video files, compress videos, create video slices, crop videos, change video size and frame rate, and save video thumbnails. This library is designed to be simple yet comprehensive for developers to integrate into their projects easily.

## Installation

```bash
npm install lw-ffmpeg-node
```

## Usage

### Importing the Library

```javascript
import FFMPEGManipulator from "lw-ffmpeg-node";
```

### Methods

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

## Installing ffmpeg on wsl

```bash
sudo add-apt-repository ppa:mc3man/trusty-media
sudo apt-get update
sudo apt-get dist-upgrade
sudo apt-get install ffmpeg
```
