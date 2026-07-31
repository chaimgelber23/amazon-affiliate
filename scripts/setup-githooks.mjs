import { spawnSync } from "node:child_process";

const insideWorktree = spawnSync(
    "git",
    ["rev-parse", "--is-inside-work-tree"],
    { stdio: "ignore", windowsHide: true },
);

if (insideWorktree.status === 0) {
    const configured = spawnSync(
        "git",
        ["config", "core.hooksPath", ".githooks"],
        { stdio: "ignore", windowsHide: true },
    );

    if (configured.error || configured.status !== 0) {
        console.warn("Skipping local Git hook setup.");
    }
}
