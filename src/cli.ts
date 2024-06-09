import { spawnSync, spawn } from "child_process";
import * as path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import os from "os";

class LinuxError extends Error {
  constructor(command: string, extraData?: string) {
    super(`Running the '${command}' command caused this error`);
    console.error(extraData);
  }
}

export default class CLI {
  static isLinux() {
    const platform = os.platform();
    return platform === "linux";
  }

  static isWindows() {
    const platform = os.platform();
    return platform === "win32";
  }

  static getFilePath(filePath: string) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.join(__dirname, path.normalize(filePath));
  }

  static linux_sync(command: string, args: string[] = []) {
    try {
      const { status, stdout, stderr } = spawnSync(command, args, {
        encoding: "utf8",
      });
      if (stderr) {
        throw new LinuxError(command, stderr);
      }
      return stdout;
    } catch (e) {
      console.error(e);
      throw new LinuxError(command);
    }
  }

  static async linuxWithData(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, { shell: true });

      let output = "";
      let errorOutput = "";

      child.stdout.on("data", (data) => {
        output += data.toString();
      });

      child.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe exited with code ${code}: ${errorOutput}`));
        } else {
          resolve(output.trim());
        }
      });
    });
  }

  static async linux(
    command: string,
    { quiet = false, detached = false } = {}
  ) {
    try {
      // send back stderr and stdout
      return new Promise((resolve, reject) => {
        const child = spawn(command, {
          shell: true,
          stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit",
          detached,
        });
        let stdout = "";
        let stderr = "";

        child.stdout?.on("data", (data) => {
          stdout += data.toString();
        });

        child.stderr?.on("data", (data) => {
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
