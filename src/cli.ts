import { spawnSync, spawn, execFile } from "child_process";
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

export class Print {
  private static colors = {
    RED: "\x1b[31m",
    GREEN: "\x1b[32m",
    YELLOW: "\x1b[33m",
    BLUE: "\x1b[34m",
    MAGENTA: "\x1b[35m",
    CYAN: "\x1b[36m",
  };
  private static RESET = "\x1b[0m";
  static red = (...args: any[]) =>
    console.log(Print.colors.RED, ...args, Print.RESET);
  static green = (...args: any[]) =>
    console.log(Print.colors.GREEN, ...args, Print.RESET);
  static yellow = (...args: any[]) =>
    console.log(Print.colors.YELLOW, ...args, Print.RESET);
  static blue = (...args: any[]) =>
    console.log(Print.colors.BLUE, ...args, Print.RESET);
  static magenta = (...args: any[]) =>
    console.log(Print.colors.MAGENTA, ...args, Print.RESET);
  static cyan = (...args: any[]) =>
    console.log(Print.colors.CYAN, ...args, Print.RESET);
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

  static cmd(
    filepath: string,
    command: string,
    options?: { cwd?: string }
  ): Promise<string> {
    const args = command.split(" ");
    const cliOptions = options ? options : {};
    return new Promise((resolve, reject) => {
      execFile(
        filepath,
        args,
        {
          maxBuffer: 500 * 1_000_000,
          ...cliOptions,
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
