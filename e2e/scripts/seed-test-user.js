#!/usr/bin/env node
/**
 * Seed script to create a test user for E2E testing
 * Usage: node scripts/seed-test-user.js
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env" });

const SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "test@example.com";
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "TestPassword123!";

async function seedTestUser() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error("Error: SUPABASE_SERVICE_KEY not set in .env");
    console.error("Get it from: supabase status");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`Creating test user: ${TEST_USER_EMAIL}`);

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from("auth.users")
    .select("id")
    .eq("email", TEST_USER_EMAIL)
    .single();

  if (existingUser) {
    console.log("Test user already exists");
    return;
  }

  // Create the user
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    email_confirm: true,
  });

  if (error) {
    console.error("Failed to create test user:", error.message);
    process.exit(1);
  }

  console.log("✓ Test user created successfully");
  console.log(`  Email: ${TEST_USER_EMAIL}`);
  console.log(`  Password: ${TEST_USER_PASSWORD}`);
}

seedTestUser();
