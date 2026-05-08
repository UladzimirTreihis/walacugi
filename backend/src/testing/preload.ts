import bcrypt from "bcryptjs";
import { TEST_ADMIN_PASSWORD } from "./buildApp.js";

process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? "silent";
process.env.JWT_SECRET = "test-jwt-secret-must-be-long-and-random-1234567890";
process.env.CSRF_SECRET = "test-csrf-secret-must-be-long-and-random-1234567890";
process.env.COOKIE_SECRET = "test-cookie-secret-must-be-long-and-random-1234567890";
process.env.CORS_ORIGINS = "http://localhost:3000";
process.env.AWS_ACCESS_KEY_ID = "test-key";
process.env.AWS_SECRET_ACCESS_KEY = "test-secret";
process.env.AWS_REGION = "us-east-1";
process.env.AWS_S3_BUCKET = "test-bucket";
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync(TEST_ADMIN_PASSWORD, 4);
