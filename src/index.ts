#!/usr/bin/env node
/**
 * AgentGIF CLI (Node.js) — GIF for humans. Cast for agents.
 *
 * Install: npm install -g @agentgif/cli
 * Usage:   agentgif login | upload | search | list | info | embed | badge
 *
 * Full documentation: https://agentgif.com/docs/cli/
 */
import { Command } from "commander";
import { readFileSync } from "fs";
import { execSync } from "child_process";

import { deviceLogin } from "./auth.js";
import { Client, AgentGIFError } from "./client.js";
import { getApiKey, saveCredentials, clearCredentials } from "./config.js";

const VERSION = "0.2.0";

function requireAuth(): void {
  if (!getApiKey()) {
    console.error("Not logged in. Run: agentgif login");
    process.exit(1);
  }
}

function handleError(err: unknown): never {
  if (err instanceof AgentGIFError) {
    console.error(`Error: ${err.message}`);
  } else if (err instanceof Error) {
    console.error(`Error: ${err.message}`);
  } else {
    console.error("Unknown error");
  }
  process.exit(1);
}

function detectRepo(): string {
  try {
    const url = execSync("git remote get-url origin", {
      timeout: 5000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    const name = url.replace(/\/$/, "").split("/").pop() ?? "";
    return name.replace(/\.git$/, "");
  } catch {
    return "";
  }
}

async function checkForUpdates(): Promise<void> {
  try {
    const client = new Client();
    const data = await client.cliVersion();
    if (data.latest && data.latest !== VERSION) {
      console.log(`Update available: ${VERSION} → ${data.latest}. Run: npm install -g @agentgif/cli`);
    }
  } catch {
    // Best-effort — silently ignore network errors
  }
}

// ── Program ─────────────────────────────────────

const program = new Command();

program
  .name("agentgif")
  .description("AgentGIF — GIF for humans. Cast for agents.")
  .version(VERSION)
  .hook("preAction", async () => {
    await checkForUpdates();
  });

// ── login ───────────────────────────────────────

program
  .command("login")
  .description("Authenticate with AgentGIF via browser")
  .action(async () => {
    console.log("Opening browser for authentication...");
    try {
      const { apiKey, username } = await deviceLogin();
      saveCredentials(apiKey, username);
      console.log(`✓ Logged in as @${username}`);
    } catch (err) {
      handleError(err);
    }
  });

// ── logout ──────────────────────────────────────

program
  .command("logout")
  .description("Remove stored credentials")
  .action(() => {
    clearCredentials();
    console.log("✓ Logged out");
  });

// ── whoami ──────────────────────────────────────

program
  .command("whoami")
  .description("Show current user info")
  .action(async () => {
    requireAuth();
    try {
      const client = new Client();
      const user = await client.whoami();
      console.log(`@${user.username} — ${user.display_name ?? ""}`);
      console.log(`GIFs: ${user.upload_count ?? 0}`);
    } catch (err) {
      handleError(err);
    }
  });

// ── upload ──────────────────────────────────────

program
  .command("upload <gif>")
  .description("Upload a GIF to AgentGIF")
  .option("-t, --title <title>", "GIF title")
  .option("-d, --description <desc>", "Description")
  .option("-c, --command <cmd>", "Command demonstrated")
  .option("--tags <tags>", "Comma-separated tags")
  .option("--cast <path>", "Cast file path")
  .option("--theme <theme>", "Terminal theme slug")
  .option("--unlisted", "Upload as unlisted")
  .option("--no-repo", "Don't auto-detect repo")
  .action(async (gifPath: string, opts) => {
    requireAuth();
    const repoSlug = opts.repo === false ? "" : detectRepo();
    const visibility = opts.unlisted ? "unlisted" : "public";

    console.log(`Uploading ${gifPath}...`);
    try {
      const client = new Client();
      const result = await client.upload(gifPath, {
        title: opts.title,
        description: opts.description,
        command: opts.command,
        tags: opts.tags,
        castPath: opts.cast,
        theme: opts.theme,
        visibility,
        repoSlug,
      });
      console.log(`✓ Uploaded: ${result.url}`);
      const embed = result.embed as Record<string, string> | undefined;
      if (embed?.markdown) {
        console.log(`  Embed: ${embed.markdown}`);
      }
    } catch (err) {
      handleError(err);
    }
  });

// ── search ──────────────────────────────────────

program
  .command("search <query>")
  .description("Search public GIFs")
  .action(async (query: string) => {
    try {
      const client = new Client();
      const data = await client.search(query);
      if (!data.results.length) {
        console.log("No results found.");
        return;
      }
      console.log(`Search: ${query} (${data.count} results)\n`);
      const idW = 10;
      const titleW = 30;
      console.log(`${"ID".padEnd(idW)}  ${"Title".padEnd(titleW)}  Command`);
      console.log(`${"─".repeat(idW)}  ${"─".repeat(titleW)}  ${"─".repeat(20)}`);
      for (const gif of data.results) {
        const id = String(gif.id ?? "").padEnd(idW);
        const title = String(gif.title ?? "").slice(0, titleW).padEnd(titleW);
        const cmd = String(gif.command ?? "");
        console.log(`${id}  ${title}  ${cmd}`);
      }
    } catch (err) {
      handleError(err);
    }
  });

// ── list ────────────────────────────────────────

program
  .command("list")
  .description("List your GIFs")
  .option("--repo <repo>", "Filter by repo slug")
  .action(async (opts) => {
    requireAuth();
    try {
      const client = new Client();
      const data = await client.listGifs(opts.repo ? { repo: opts.repo } : undefined);
      if (!data.results.length) {
        console.log("No GIFs found.");
        return;
      }
      console.log(`My GIFs (${data.count})\n`);
      const idW = 10;
      const titleW = 30;
      console.log(`${"ID".padEnd(idW)}  ${"Title".padEnd(titleW)}  ${"Views".padStart(6)}`);
      console.log(`${"─".repeat(idW)}  ${"─".repeat(titleW)}  ${"─".repeat(6)}`);
      for (const gif of data.results) {
        const id = String(gif.id ?? "").padEnd(idW);
        const title = String(gif.title ?? "").slice(0, titleW).padEnd(titleW);
        const views = String(gif.view_count ?? 0).padStart(6);
        console.log(`${id}  ${title}  ${views}`);
      }
    } catch (err) {
      handleError(err);
    }
  });

// ── info ────────────────────────────────────────

program
  .command("info <gifId>")
  .description("Show GIF details (JSON)")
  .action(async (gifId: string) => {
    try {
      const client = new Client();
      const data = await client.getGif(gifId);
      console.log(JSON.stringify(data, null, 2));
    } catch (err) {
      handleError(err);
    }
  });

// ── embed ───────────────────────────────────────

program
  .command("embed <gifId>")
  .description("Show embed codes for a GIF")
  .option("-f, --format <fmt>", "Format: md, html, iframe, script, all", "all")
  .action(async (gifId: string, opts) => {
    try {
      const client = new Client();
      const codes = await client.embedCodes(gifId);
      const fmt = opts.format;
      if (fmt === "all") {
        for (const [name, code] of Object.entries(codes)) {
          console.log(`${name}:`);
          console.log(code);
          console.log();
        }
      } else {
        const keyMap: Record<string, string> = { md: "markdown", html: "html", iframe: "iframe", script: "script" };
        const key = keyMap[fmt] ?? fmt;
        console.log(codes[key] ?? "");
      }
    } catch (err) {
      handleError(err);
    }
  });

// ── update ──────────────────────────────────────

program
  .command("update <gifId>")
  .description("Update a GIF's metadata")
  .option("-t, --title <title>", "New title")
  .option("-d, --description <desc>", "New description")
  .option("-c, --command <cmd>", "New command")
  .option("--tags <tags>", "New comma-separated tags")
  .action(async (gifId: string, opts) => {
    requireAuth();
    const fields: Record<string, string> = {};
    if (opts.title !== undefined) fields.title = opts.title;
    if (opts.description !== undefined) fields.description = opts.description;
    if (opts.command !== undefined) fields.command = opts.command;
    if (opts.tags !== undefined) fields.tags = opts.tags;

    if (Object.keys(fields).length === 0) {
      console.error("No fields to update. Use --title, --description, --command, or --tags.");
      process.exit(1);
    }

    try {
      const client = new Client();
      const result = await client.updateGif(gifId, fields);
      console.log(`✓ Updated ${gifId}: ${result.title}`);
    } catch (err) {
      handleError(err);
    }
  });

// ── delete ──────────────────────────────────────

program
  .command("delete <gifId>")
  .description("Delete a GIF")
  .option("-y, --yes", "Skip confirmation")
  .action(async (gifId: string, opts) => {
    requireAuth();

    if (!opts.yes) {
      // Simple stdin confirmation
      const readline = await import("readline");
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise<string>((resolve) => {
        rl.question(`Delete ${gifId}? [y/N] `, resolve);
      });
      rl.close();
      if (answer.toLowerCase() !== "y") {
        console.log("Cancelled.");
        return;
      }
    }

    try {
      const client = new Client();
      await client.deleteGif(gifId);
      console.log(`✓ Deleted ${gifId}`);
    } catch (err) {
      handleError(err);
    }
  });

// ── generate ───────────────────────────────────

function detectSourceType(url: string): string {
  if (url.includes("github.com")) return "github";
  if (url.includes("pypi.org")) return "pypi";
  if (url.includes("npmjs.com")) return "npm";
  return "";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

program
  .command("generate <url>")
  .description("Generate demo GIFs from a README or package docs")
  .option("--max-gifs <n>", "Maximum GIFs to generate", "5")
  .option("--source-type <type>", "Source type: github, pypi, npm (auto-detected from URL)")
  .option("--no-wait", "Return job ID immediately without polling")
  .action(async (url: string, opts) => {
    requireAuth();
    const sourceType = opts.sourceType ?? detectSourceType(url);
    const maxGifs = parseInt(opts.maxGifs, 10) || 5;

    try {
      const client = new Client();
      const job = await client.generateTape({
        source_url: url,
        source_type: sourceType,
        max_gifs: maxGifs,
      });

      const jobId = String(job.job_id ?? "");

      if (opts.wait === false) {
        console.log(`Job created: ${jobId}`);
        console.log(`  Status URL: ${job.status_url ?? ""}`);
        console.log(`  Check: agentgif generate-status ${jobId}`);
        return;
      }

      console.log(`Generating GIFs (job ${jobId})...`);
      const start = Date.now();
      const timeout = 5 * 60 * 1000; // 5 minutes
      let prevStatus = "";

      while (Date.now() - start < timeout) {
        let data: Record<string, unknown>;
        try {
          data = await client.generateStatus(jobId);
        } catch (err) {
          if (err instanceof AgentGIFError && err.status < 500) {
            throw err;
          }
          await sleep(2000);
          continue;
        }

        const current = String(data.status ?? "");
        if (current !== prevStatus) {
          console.log(`  Status: ${current}`);
          prevStatus = current;
        }

        if (current === "completed") {
          const gifs = (data.gifs ?? []) as Record<string, unknown>[];
          const count = data.gifs_created ?? gifs.length;
          console.log(`\nDone! ${count} GIFs generated.`);
          if (gifs.length) {
            const idW = 10;
            const titleW = 30;
            console.log(`\n${"ID".padEnd(idW)}  ${"Title".padEnd(titleW)}  URL`);
            console.log(`${"─".repeat(idW)}  ${"─".repeat(titleW)}  ${"─".repeat(40)}`);
            for (const gif of gifs) {
              const id = String(gif.id ?? "").padEnd(idW);
              const title = String(gif.title ?? "").slice(0, titleW).padEnd(titleW);
              const gifUrl = String(gif.url ?? "");
              console.log(`${id}  ${title}  ${gifUrl}`);
            }
          }
          return;
        }

        if (current === "failed") {
          console.error(`Generation failed: ${data.error_message ?? "Unknown error"}`);
          process.exit(1);
        }

        await sleep(2000);
      }

      console.error("Timed out after 5 minutes. Check status:");
      console.error(`  agentgif generate-status ${jobId}`);
      process.exit(1);
    } catch (err) {
      handleError(err);
    }
  });

// ── generate-status ────────────────────────────

program
  .command("generate-status <jobId>")
  .description("Check status of a generate job")
  .option("--poll", "Poll until completed or failed")
  .action(async (jobId: string, opts) => {
    requireAuth();
    try {
      const client = new Client();

      if (!opts.poll) {
        const data = await client.generateStatus(jobId);
        console.log(JSON.stringify(data, null, 2));
        return;
      }

      // Poll mode
      const start = Date.now();
      const timeout = 5 * 60 * 1000;
      let prevStatus = "";

      while (Date.now() - start < timeout) {
        let data: Record<string, unknown>;
        try {
          data = await client.generateStatus(jobId);
        } catch (err) {
          if (err instanceof AgentGIFError && err.status < 500) {
            throw err;
          }
          await sleep(2000);
          continue;
        }

        const current = String(data.status ?? "");
        if (current !== prevStatus) {
          console.log(`Status: ${current}`);
          prevStatus = current;
        }

        if (current === "completed" || current === "failed") {
          console.log(JSON.stringify(data, null, 2));
          if (current === "failed") process.exit(1);
          return;
        }

        await sleep(2000);
      }

      console.error("Timed out after 5 minutes.");
      process.exit(1);
    } catch (err) {
      handleError(err);
    }
  });

// ── record ─────────────────────────────────────

program
  .command("record <tapeFile>")
  .description("Record a VHS tape to GIF, then upload")
  .option("-t, --title <title>", "GIF title")
  .option("-d, --description <desc>", "Description")
  .option("-c, --command <cmd>", "Command demonstrated")
  .option("--tags <tags>", "Comma-separated tags")
  .option("--theme <theme>", "Terminal theme slug")
  .option("--unlisted", "Upload as unlisted")
  .option("--no-repo", "Don't auto-detect repo")
  .action(async (tapeFile: string, opts) => {
    requireAuth();

    // 1. Check VHS is installed
    try {
      execSync("vhs --version", { stdio: ["pipe", "pipe", "pipe"] });
    } catch {
      console.error("Error: VHS not found. Install from https://github.com/charmbracelet/vhs");
      process.exit(1);
    }

    // 2. Run VHS
    console.log(`Running VHS: ${tapeFile}`);
    try {
      execSync(`vhs ${tapeFile}`, { stdio: "inherit" });
    } catch {
      console.error("VHS recording failed.");
      process.exit(1);
    }

    // 3. Parse tape file for Output path
    let gifPath = "";
    try {
      const tapeContent = readFileSync(tapeFile, "utf-8");
      for (const line of tapeContent.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("Output ")) {
          gifPath = trimmed.slice("Output ".length).trim().replace(/^["']|["']$/g, "");
          break;
        }
      }
    } catch {
      console.error(`Error: Could not read tape file: ${tapeFile}`);
      process.exit(1);
    }

    if (!gifPath) {
      // Fallback: assume same name with .gif extension
      gifPath = tapeFile.replace(/\.tape$/, ".gif");
    }

    // 4. Upload
    const repoSlug = opts.repo === false ? "" : detectRepo();
    const visibility = opts.unlisted ? "unlisted" : "public";
    const title = opts.title ?? tapeFile.replace(/\.tape$/, "").split("/").pop()?.replace(/[-_]/g, " ") ?? "";

    console.log(`Uploading ${gifPath}...`);
    try {
      const client = new Client();
      const result = await client.upload(gifPath, {
        title,
        description: opts.description,
        command: opts.command,
        tags: opts.tags,
        theme: opts.theme,
        visibility,
        repoSlug,
      });
      console.log(`✓ Uploaded: ${result.url}`);
      const embed = result.embed as Record<string, string> | undefined;
      if (embed?.markdown) {
        console.log(`  Embed: ${embed.markdown}`);
      }
    } catch (err) {
      handleError(err);
    }
  });

// ── badge (subcommand group) ────────────────────

const badge = new Command("badge").description("Terminal-themed package badges (shields.io alternative)");

badge
  .command("url")
  .description("Generate a badge URL and embed codes")
  .requiredOption("-p, --provider <provider>", "Package registry: pypi, npm, crates, github")
  .requiredOption("-k, --package <package>", "Package name (e.g. colorfyi, @scope/pkg, owner/repo)")
  .option("-m, --metric <metric>", "Badge metric", "version")
  .option("--theme <theme>", "Terminal theme slug (e.g. dracula)")
  .option("--style <style>", "Badge style (default, flat)")
  .option("-f, --format <fmt>", "Output format: url, md, html, img, all", "all")
  .action(async (opts) => {
    try {
      const client = new Client();
      const data = await client.badgeUrl(opts.provider, opts.package, {
        metric: opts.metric,
        theme: opts.theme,
        style: opts.style,
      });
      const fmt = opts.format;
      if (fmt === "all") {
        console.log(`URL:  ${data.url}`);
        console.log(`Markdown:\n${data.markdown}`);
        console.log(`HTML:\n${data.html}`);
        console.log(`Image:\n${data.img}`);
      } else if (fmt === "url") {
        console.log(data.url);
      } else if (fmt === "md") {
        console.log(data.markdown);
      } else if (fmt === "html") {
        console.log(data.html);
      } else if (fmt === "img") {
        console.log(data.img);
      }
    } catch (err) {
      handleError(err);
    }
  });

badge
  .command("themes")
  .description("List available terminal themes for badges")
  .action(async () => {
    try {
      const client = new Client();
      const data = await client.badgeThemes();
      console.log(`Badge Themes (${data.count})\n`);
      const slugW = 20;
      const nameW = 25;
      const catW = 12;
      console.log(
        `${"Slug".padEnd(slugW)}  ${"Name".padEnd(nameW)}  ${"Category".padEnd(catW)}  Preview URL`,
      );
      console.log(
        `${"─".repeat(slugW)}  ${"─".repeat(nameW)}  ${"─".repeat(catW)}  ${"─".repeat(40)}`,
      );
      for (const t of data.themes as Record<string, unknown>[]) {
        const slug = String(t.slug ?? "").padEnd(slugW);
        const name = String(t.name ?? "").slice(0, nameW).padEnd(nameW);
        const cat = String(t.category ?? "").padEnd(catW);
        const url = String(t.preview_url ?? "");
        console.log(`${slug}  ${name}  ${cat}  ${url}`);
      }
    } catch (err) {
      handleError(err);
    }
  });

program.addCommand(badge);

// ── Parse ───────────────────────────────────────

program.parseAsync();
