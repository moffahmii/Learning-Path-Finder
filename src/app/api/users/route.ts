import { NextResponse } from "next/server";
import { getDriver } from "../../../../lib/neo4j";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = (await getDriver()).session();

  try {
    const result = await session.run(
      `MATCH (user:User)
       RETURN user.email AS email, user.name AS name
       ORDER BY user.name`,
    );

    return NextResponse.json({
      success: true,
      data: result.records.map((record) => ({
        email: record.get("email") as string,
        name: record.get("name") as string,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "The learner list is unavailable right now." },
      { status: 503 },
    );
  } finally {
    await session.close();
  }
}
