import test, { before, after, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { S3Client } from "@aws-sdk/client-s3";
import { buildApp } from "../testing/buildApp.js";
import { setupTestDb, clearTestDb, teardownTestDb } from "../testing/db.js";
import { loginAsAdmin } from "../testing/loginAsAdmin.js";

before(async () => {
  await setupTestDb();
});

after(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

void test("upload rejects unsupported MIME type with 400", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const { agent, csrfToken } = await loginAsAdmin(app);
  const res = await agent
    .post("/api/upload/news-image")
    .set("X-CSRF-Token", csrfToken)
    .attach("images", Buffer.from("not an image"), {
      filename: "evil.exe",
      contentType: "application/octet-stream"
    });
  assert.equal(res.status, 400);
  assert.match(String(res.body.error), /Unsupported image type/i);
});

void test("upload rejects file larger than 20MB with 413", async () => {
  const app = buildApp({ disableRateLimiting: true });
  const { agent, csrfToken } = await loginAsAdmin(app);
  const oversized = Buffer.alloc(21 * 1024 * 1024, 0x42);
  const res = await agent
    .post("/api/upload/news-image")
    .set("X-CSRF-Token", csrfToken)
    .attach("images", oversized, {
      filename: "huge.jpg",
      contentType: "image/jpeg"
    });
  assert.equal(res.status, 413);
  assert.match(String(res.body.error), /20\s*MB/i);
});

void test("upload accepts valid image and stores under sanitized S3 key", async () => {
  const sendMock = mock.method(S3Client.prototype, "send", () => Promise.resolve({}));
  try {
    const app = buildApp({ disableRateLimiting: true });
    const { agent, csrfToken } = await loginAsAdmin(app);
    const res = await agent
      .post("/api/upload/news-image")
      .set("X-CSRF-Token", csrfToken)
      .attach("images", Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
        filename: "../../../etc/passwd.png",
        contentType: "image/png"
      });
    assert.equal(res.status, 200);
    const filePaths = res.body.filePaths as unknown;
    assert.ok(Array.isArray(filePaths));
    assert.equal((filePaths as string[]).length, 1);
    const url = (filePaths as string[])[0];
    assert.equal(url.includes("../"), false, "S3 key must not contain path traversal segments");
    assert.match(url, /\/news\/\d+-[0-9a-f-]+\.png$/i);
    assert.equal(sendMock.mock.callCount(), 1);
  } finally {
    sendMock.mock.restore();
  }
});

void test("upload without auth never reaches S3", async () => {
  const sendMock = mock.method(S3Client.prototype, "send", () => Promise.resolve({}));
  try {
    const app = buildApp({ disableRateLimiting: true, disableCsrf: true });
    const res = await request(app)
      .post("/api/upload/news-image")
      .attach("images", Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
        filename: "test.png",
        contentType: "image/png"
      });
    assert.equal(res.status, 401);
    assert.equal(sendMock.mock.callCount(), 0);
  } finally {
    sendMock.mock.restore();
  }
});

void test("upload without CSRF token is blocked before auth", async () => {
  const sendMock = mock.method(S3Client.prototype, "send", () => Promise.resolve({}));
  try {
    const app = buildApp({ disableRateLimiting: true });
    const res = await request(app)
      .post("/api/upload/news-image")
      .attach("images", Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
        filename: "test.png",
        contentType: "image/png"
      });
    assert.equal(res.status, 403);
    assert.equal(sendMock.mock.callCount(), 0);
  } finally {
    sendMock.mock.restore();
  }
});
