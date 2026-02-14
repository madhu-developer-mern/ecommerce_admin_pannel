const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const certDir = path.join(__dirname, "certificates");

// Create certificates directory if it doesn't exist
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

const certFile = path.join(certDir, "server.crt");
const keyFile = path.join(certDir, "server.key");

// Check if certificates already exist
if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
  console.log("✅ SSL certificates already exist!");
  console.log(`   Certificate: ${certFile}`);
  console.log(`   Key: ${keyFile}`);
  process.exit(0);
}

console.log("🔐 Generating self-signed SSL certificates...\n");

try {
  // Generate a self-signed certificate valid for 365 days
  const command = `openssl req -x509 -newkey rsa:2048 -nodes -out "${certFile}" -keyout "${keyFile}" -days 365 -subj "/C=US/ST=State/L=City/O=Ecommerce/CN=localhost" 2>/dev/null`;

  // Check if openssl is available
  try {
    execSync("openssl version", { stdio: "ignore" });
  } catch {
    console.error("❌ Error: OpenSSL is not installed on your system.");
    console.log("\nTo install OpenSSL:");
    console.log("  • Windows: Install from https://slproweb.com/products/Win32OpenSSL.html");
    console.log("  • macOS: brew install openssl");
    console.log("  • Linux: sudo apt-get install openssl");
    process.exit(1);
  }

  execSync(command, { stdio: "inherit" });

  console.log("\n✅ SSL certificates generated successfully!");
  console.log(`   Certificate: ${certFile}`);
  console.log(`   Key: ${keyFile}`);
  console.log(
    "\n⚠️  Note: This is a self-signed certificate for development only."
  );
  console.log("   For production, use a proper certificate from a Certificate Authority.");
  console.log("\n📚 Your server will now run on https://localhost:5000");
  console.log("   You may see a browser warning about the certificate - this is normal.\n");
} catch (error) {
  console.error("❌ Error generating certificates:", error.message);
  process.exit(1);
}
