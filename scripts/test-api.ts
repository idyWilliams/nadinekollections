import { initializeTransaction } from "../lib/paystack";

// Mock environment variables for the script context if needed
// In a real run, ensure .env.local is loaded or variables are set
if (!process.env.PAYSTACK_SECRET_KEY) {
  console.warn("WARNING: PAYSTACK_SECRET_KEY is not set. API calls will fail.");
}

async function testPaystackInitialize() {
  console.log("Testing Paystack Initialize...");
  try {
    const response = await initializeTransaction(
      "test@example.com",
      5000,
      `TEST-${Date.now()}`,
      "http://localhost:3000/checkout/success"
    );
    console.log("✅ Initialize Success:", response.message);
    console.log("   Auth URL:", response.data.authorization_url);
  } catch (error: any) {
    console.error("❌ Initialize Failed:", error.message);
  }
}

async function runTests() {
  console.log("Starting API Tests...\n");
  await testPaystackInitialize();
  console.log("\nTests Completed.");
}

// Execute if run directly
runTests();
