/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  serverExternalPackages: [
    "better-sqlite3",
    "@mikro-orm/core",
    "@mikro-orm/knex",
    "@mikro-orm/postgresql",
    "@medusajs/framework",
    "@medusajs/modules-sdk",
    "@medusajs/utils"
  ],
};

export default config;
