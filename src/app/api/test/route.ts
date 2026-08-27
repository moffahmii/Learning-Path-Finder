import { NextResponse } from "next/server";
import { getDriver } from "../../../../lib/neo4j";

export async function GET() {
  try {
    const driver = await getDriver();
    const session = driver.session();

    const result = await session.run(
      'RETURN "Connection is working 100%!" AS message',
    );
    const message = result.records[0].get("message");

    await session.close();

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Database query failed:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Database is currently unreachable. Check your connection details.",
      },
      { status: 503 },
    );
  }
}
