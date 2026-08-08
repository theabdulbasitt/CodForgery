import { exec, execFile, spawn } from "child_process";
import { Request, Response } from "express";

// VULNERABLE: user-controlled input reaches exec()
export function ping(req: Request, res: Response) {
    const host = req.query.host;

    exec(`ping -c 4 ${host}`, (error, stdout) => {
        res.send(stdout);
    });
}

// VULNERABLE: user input reaches execFile()
export function runCommand(req: Request, res: Response) {
    const command = req.body.command;

    execFile(command, (error, stdout) => {
        res.send(stdout);
    });
}

// VULNERABLE: user-controlled input reaches spawn()
export function execute(req: Request, res: Response) {
    const command = req.body.command;

    spawn(command);
}

// SAFE: command is completely hardcoded
export function buildProject() {
    exec("npm run build");
}