import { spawnSync, spawn, execFile } from "child_process";
import * as path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import os from "os";
import { ProcessOptions } from "./FFMPEGManipulator";

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

export class FileManager {
  static async exists(filePath: string) {
    try {
      await fs.access(filePath);
      return true; // The file exists
    } catch (error) {
      return false; // The file does not exist
    }
  }

  static async createDirectory(
    directoryPath: string,
    options?: {
      overwrite?: boolean;
    }
  ) {
    if (await this.exists(directoryPath)) {
      if (options?.overwrite) {
        await fs.rm(directoryPath, { recursive: true, force: true });
        await fs.mkdir(directoryPath, { recursive: true });
      }
    } else {
      await fs.mkdir(directoryPath, { recursive: true });
    }
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

  static getAbsolutePath(filePath: string) {
    return path.join(__dirname, path.normalize(filePath));
  }

  /**
   *
   * Synchronous linux command execution. Returns the stdout
   */
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

  /**
   * Asynchronous command execution for executable files
   *
   * @param filepath the path to the executable
   * @param command any commands to pass to the executable
   * @param options cli options
   * @returns stdout or stderr
   */
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

  /**
   * Asynchronous command execution for bash shell
   *
   * @param command the command to run
   * @param options cli options
   * @returns stdout or stderr
   */
  static linux(command: string, options?: ProcessOptions): Promise<string> {
    try {
      // send back stderr and stdout
      return new Promise((resolve, reject) => {
        const child = spawn(command, {
          shell: true,
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
