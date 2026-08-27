import { NextResponse } from "next/server";
import type { Session } from "neo4j-driver";
import { getDriver } from "../../../../lib/neo4j";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_EMAIL = "mohamed@example.com";

const recommendationsQuery = `
  MATCH (u:User {email: $email})-[enrollment:ENROLLED_IN]->(completed:Course)
  WITH u, collect(CASE WHEN enrollment.status = 'completed' THEN completed END) AS completedCourses
  OPTIONAL MATCH (u)-[:ENROLLED_IN]->(enrolled:Course)
  WITH u, completedCourses, collect(enrolled.id) AS enrolledIds
  UNWIND completedCourses AS completed
  MATCH (nextCourse:Course)-[:REQUIRES]->(completed)
  WHERE NOT nextCourse.id IN enrolledIds
  OPTIONAL MATCH (nextCourse)-[:REQUIRES]->(prerequisite:Course)
  WHERE prerequisite IN completedCourses
  RETURN DISTINCT nextCourse.id AS id,
    nextCourse.title AS title,
    nextCourse.level AS level,
    collect(DISTINCT completed.title) AS unlockedBy,
    count(DISTINCT prerequisite) AS completedPrerequisites
`;

const completedCoursesQuery = `
  MATCH (u:User {email: $email})-[enrollment:ENROLLED_IN {status: 'completed'}]->(course:Course)
  RETURN course.id AS id, course.title AS title, course.level AS level
  ORDER BY course.title
`;

function getEmail(request: Request) {
  return new URL(request.url).searchParams.get("email") ?? DEFAULT_EMAIL;
}

function toCourse(record: { get: (key: string) => unknown }) {
  return {
    id: record.get("id") as string,
    title: record.get("title") as string,
    level: record.get("level") as string,
  };
}

export async function GET(request: Request) {
  const email = getEmail(request);
  const session = (await getDriver()).session();

  try {
    const recommendationResult = await session.run(recommendationsQuery, {
      email,
    });
    const completedResult = await session.run(completedCoursesQuery, { email });

    const recommendations = recommendationResult.records.map((record) => ({
      ...toCourse(record),
      unlockedBy: record.get("unlockedBy") as string[],
      completedPrerequisites: record.get("completedPrerequisites").toNumber(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        learner: email,
        completed: completedResult.records.map(toCourse),
        recommendations,
      },
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "The learning graph is unavailable right now. Please try again.",
      },
      { status: 503 },
    );
  } finally {
    await session.close();
  }
}

export async function POST(request: Request) {
  let session: Session | undefined;

  try {
    let body: { email?: string; courseId?: string };
    try {
      body = (await request.json()) as { email?: string; courseId?: string };
    } catch {
      return NextResponse.json(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }
    const email = body.email ?? DEFAULT_EMAIL;

    if (!body.courseId) {
      return NextResponse.json(
        { success: false, message: "A course id is required." },
        { status: 400 },
      );
    }

    session = (await getDriver()).session();
    const result = await session.run(
      `MATCH (u:User {email: $email}), (course:Course {id: $courseId})
       MERGE (u)-[enrollment:ENROLLED_IN]->(course)
       SET enrollment.status = 'completed'
       RETURN course.title AS title`,
      { email, courseId: body.courseId },
    );

    if (!result.records.length) {
      return NextResponse.json(
        { success: false, message: "That course is not available." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `${result.records[0].get("title")} marked complete.`,
    });
  } catch (error) {
    console.error("Error updating enrollment:", error);
    return NextResponse.json(
      { success: false, message: "Could not update your learning trail." },
      { status: 503 },
    );
  } finally {
    if (session) await session.close();
  }
}
