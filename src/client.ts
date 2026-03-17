/**
 * HTTP client for AgentGIF API.
 */
import { readFileSync } from "fs";
import { getApiKey } from "./config.js";

const BASE_URL = "https://agentgif.com";

export class AgentGIFError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AgentGIFError";
  }
}

export class Client {
  private baseUrl: string;
  private apiKey: string | undefined;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? BASE_URL;
    this.apiKey = getApiKey();
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) {
      h["Authorization"] = `Token ${this.apiKey}`;
    }
    return h;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`;
    const init: RequestInit = { method, headers: this.headers() };
    if (body) {
      init.body = JSON.stringify(body);
    }
    const res = await fetch(url, init);
    if (!res.ok) {
      const text = await res.text();
      let msg = text;
      try {
        const json = JSON.parse(text);
        msg = json.error || json.detail || text;
      } catch {
        // keep raw text
      }
      throw new AgentGIFError(msg, res.status);
    }
    return (await res.json()) as T;
  }

  private async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  private async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  private async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  private async del<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  // --- Auth ---

  async whoami(): Promise<{ username: string; display_name?: string; upload_count?: number }> {
    return this.get("/users/me/");
  }

  // --- GIFs ---

  async search(query: string): Promise<{ count: number; results: Record<string, unknown>[] }> {
    return this.get(`/search/?q=${encodeURIComponent(query)}`);
  }

  async listGifs(params?: { repo?: string }): Promise<{ count: number; results: Record<string, unknown>[] }> {
    const qs = params?.repo ? `?repo=${encodeURIComponent(params.repo)}` : "";
    return this.get(`/gifs/me/${qs}`);
  }

  async getGif(gifId: string): Promise<Record<string, unknown>> {
    return this.get(`/gifs/${gifId}/`);
  }

  async embedCodes(gifId: string): Promise<Record<string, string>> {
    const data = await this.getGif(gifId);
    return (data.embed as Record<string, string>) ?? {};
  }

  async updateGif(gifId: string, fields: Record<string, string>): Promise<Record<string, unknown>> {
    return this.patch(`/gifs/${gifId}/`, fields);
  }

  async deleteGif(gifId: string): Promise<void> {
    await this.del(`/gifs/${gifId}/`);
  }

  async upload(
    gifPath: string,
    opts: {
      title?: string;
      description?: string;
      command?: string;
      tags?: string;
      castPath?: string;
      theme?: string;
      visibility?: string;
      repoSlug?: string;
    },
  ): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}/api/v1/gifs/`;
    const formData = new FormData();
    const gifBuf = readFileSync(gifPath);
    formData.append("gif", new Blob([gifBuf]), gifPath.split("/").pop() ?? "upload.gif");

    if (opts.title) formData.append("title", opts.title);
    if (opts.description) formData.append("description", opts.description);
    if (opts.command) formData.append("command", opts.command);
    if (opts.tags) formData.append("tags", opts.tags);
    if (opts.theme) formData.append("theme", opts.theme);
    if (opts.visibility) formData.append("visibility", opts.visibility);
    if (opts.repoSlug) formData.append("repo_slug", opts.repoSlug);

    if (opts.castPath) {
      const castBuf = readFileSync(opts.castPath);
      formData.append("cast", new Blob([castBuf]), opts.castPath.split("/").pop() ?? "upload.cast");
    }

    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers["Authorization"] = `Token ${this.apiKey}`;
    }

    const res = await fetch(url, { method: "POST", headers, body: formData });
    if (!res.ok) {
      const text = await res.text();
      throw new AgentGIFError(text, res.status);
    }
    return (await res.json()) as Record<string, unknown>;
  }

  // --- Badges ---

  async badgeUrl(
    provider: string,
    pkg: string,
    opts?: { metric?: string; theme?: string; style?: string },
  ): Promise<{ url: string; markdown: string; html: string; img: string }> {
    const params = new URLSearchParams({ provider, package: pkg });
    if (opts?.metric) params.set("metric", opts.metric);
    if (opts?.theme) params.set("theme", opts.theme);
    if (opts?.style) params.set("style", opts.style);
    return this.get(`/badge-url/?${params.toString()}`);
  }

  async badgeThemes(): Promise<{ themes: Record<string, unknown>[]; count: number }> {
    return this.get("/themes/badges/");
  }

  // --- Generate ---

  async generateTape(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.post("/gifs/generate/", payload);
  }

  async generateStatus(jobId: string): Promise<Record<string, unknown>> {
    return this.get(`/gifs/generate/${jobId}/`);
  }

  async cliVersion(): Promise<{ latest: string; min_supported: string; changelog_url: string }> {
    return this.get("/cli/version/");
  }
}
