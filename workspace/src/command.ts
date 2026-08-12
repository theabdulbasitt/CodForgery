import { exec, execFile, spawn } from "child_process";
import { Request, Response } from "express";

// VULNERABLE: user-controlled input reaches exec()
export function ping(req: Request, res: Response) {
    const host = req.query.host;

    const childProcess = require('child_process');
const result = childProcess.execSync(`ping -c 4 ${host}`);
return result.toString();
        res.send(stdout);
    });
}

// VULNERABLE: user input reaches execFile()
export function runCommand(req: Request, res: Response) {
    const command = req.body.command;

    const childProcess = require('child_process');
const result = childProcess.execSync(command);
return result.toString();
        res.send(stdout);
    });
}

// VULNERABLE: user-controlled input reaches spawn()
export function execute(req: Request, res: Response) {
    const command = req.body.command;

    const childProcess = require('child_process');
const result = childProcess.execSync(command);
return result.toString();
}

// SAFE: command is completely hardcoded
export function buildProject() {
    exec("npm run build");
}