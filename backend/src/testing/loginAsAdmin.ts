import type { Express } from "express";
import request from "supertest";
import { TEST_ADMIN_PASSWORD } from "./buildApp.js";

export interface AuthenticatedAgent {
  agent: ReturnType<typeof request.agent>;
  csrfToken: string;
}

/**
 * Log in as the test admin and return a supertest agent that carries the
 * `auth_token` and `csrf_token` cookies, plus the matching CSRF header
 * value. Mutating routes need both the cookie pair and the
 * `X-CSRF-Token` header.
 */
export async function loginAsAdmin(app: Express): Promise<AuthenticatedAgent> {
  const agent = request.agent(app);

  const loginRes = await agent
    .post("/api/admin/login")
    .send({ password: TEST_ADMIN_PASSWORD });
  if (loginRes.status !== 200) {
    throw new Error(`Test login failed with status ${loginRes.status}: ${loginRes.text}`);
  }

  const csrfRes = await agent.get("/api/admin/csrf");
  if (csrfRes.status !== 200) {
    throw new Error(`CSRF token fetch failed with status ${csrfRes.status}`);
  }
  const body = csrfRes.body as { csrfToken?: unknown };
  if (typeof body.csrfToken !== "string") {
    throw new Error("CSRF response did not include csrfToken");
  }

  return { agent, csrfToken: body.csrfToken };
}
