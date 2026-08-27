import neo4j, { Driver } from "neo4j-driver";

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

let driver: Driver | null = null;

export const getDriver = async () => {
  if (!driver) {
    const url = getRequiredEnv("DB_URL");
    const user = getRequiredEnv("DB_USERNAME");
    const password = getRequiredEnv("DB_PASSWORD");
    driver = neo4j.driver(url, neo4j.auth.basic(user, password));
    try {
      await driver.verifyConnectivity();
      console.log("Connected to CognoDB successfully.");
    } catch (error) {
      console.error("Failed to connect to CognoDB:", error);
      driver = null;
      throw error;
    }
  }
  return driver;
};
