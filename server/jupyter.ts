import { spawn } from "child_process";
import { promisify } from "util";
import { randomBytes } from "crypto";
import { log } from "./vite";
import fs from "fs";

const sleep = promisify(setTimeout);

interface JupyterInstance {
  processId: string;
  url: string;
  token: string;
  process: any;
}

// Export active instances so they can be accessed by other modules
export const activeInstances: Map<string, JupyterInstance> = new Map();
// Store in global for easy access
(global as any).activeJupyterInstances = activeInstances;

export async function startJupyterInstance(userId?: number): Promise<{ processId: string; url: string; token: string } | null> {
  try {
    const token = randomBytes(32).toString("hex");
    const processId = randomBytes(16).toString("hex");
    
    // Create user-specific workspace directory
    const userWorkspace = userId ? `/tmp/jupyter/${userId}` : '/tmp/jupyter/default';
    await fs.promises.mkdir(userWorkspace, { recursive: true });
    
    // Command to start Jupyter notebook with user isolation
    const jupyterProcess = spawn("jupyter", [
      "notebook",
      "--no-browser",
      "--ip=0.0.0.0",
      "--port=8888",
      `--notebook-dir=${userWorkspace}`,
      `--NotebookApp.token=${token}`,
      "--NotebookApp.allow_origin=*",
      "--NotebookApp.disable_check_xsrf=True"
    ]);
    
    let outputData = "";
    
    jupyterProcess.stdout.on("data", (data) => {
      outputData += data.toString();
      log(`Jupyter stdout: ${data}`, "jupyter");
    });
    
    jupyterProcess.stderr.on("data", (data) => {
      outputData += data.toString();
      log(`Jupyter stderr: ${data}`, "jupyter");
    });
    
    jupyterProcess.on("close", (code) => {
      log(`Jupyter process exited with code ${code}`, "jupyter");
      activeInstances.delete(processId);
    });
    
    // Wait for the server to start
    await sleep(2000);
    
    // Store in our active instances map
    // Use the Replit URL format instead of localhost
    const replitUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    const jupyterUrl = `${replitUrl}:8888`;
    
    const instance: JupyterInstance = {
      processId,
      url: jupyterUrl,
      token,
      process: jupyterProcess
    };
    
    activeInstances.set(processId, instance);
    
    return {
      processId,
      url: jupyterUrl,
      token
    };
  } catch (error) {
    log(`Error starting Jupyter: ${error}`, "jupyter");
    return null;
  }
}

export async function stopJupyterInstance(processId: string): Promise<boolean> {
  const instance = activeInstances.get(processId);
  
  if (!instance) {
    return false;
  }
  
  try {
    // Kill the process
    instance.process.kill();
    
    // Remove from our tracking
    activeInstances.delete(processId);
    
    return true;
  } catch (error) {
    log(`Error stopping Jupyter: ${error}`, "jupyter");
    return false;
  }
}

export async function checkJupyterStatus(processId: string): Promise<string> {
  const instance = activeInstances.get(processId);
  
  if (!instance) {
    return "not_found";
  }
  
  // Check if process is still running
  if (instance.process.killed) {
    activeInstances.delete(processId);
    return "stopped";
  }
  
  return "running";
}
