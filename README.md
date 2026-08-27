# Pathfinder

Pathfinder is a graph-powered learning companion for people building skills across a modern web stack. It reads a learner's completed courses, follows prerequisite relationships, and recommends the next courses that have been unlocked.

Built by [moffahmii](https://github.com/moffahmii) for the WEXA AI CognoDB take-home assignment.

## Why a graph database?

The useful question here is not "which courses has this user purchased?" It is "which courses become reachable after following prerequisite and skill relationships from this learner's completed work?" A graph keeps those paths explicit and makes multi-hop traversal a first-class query. In a relational schema, the same recommendation requires several joins, recursive CTEs, and careful handling of changing prerequisite depth. Graph relationships also let the product grow naturally toward skill-based paths and peer or role recommendations.

## Data model

```mermaid
graph LR
  U[User] -->|ENROLLED_IN {status}| C[Course]
  C -->|REQUIRES| P[Course]
  C -->|TEACHES| S[Skill]
```

`User.email` and `Course.id` are stable identifiers. Courses have `title` and `level`; skills have `name`. `ENROLLED_IN.status` currently records `completed` and leaves room for `in_progress` later.

## Main graph query

`src/app/api/recommendations/route.ts` uses a parameterized two-hop traversal:

```cypher
MATCH (u:User)-[:ENROLLED_IN]->(completed:Course)
MATCH (nextCourse:Course)-[:REQUIRES]->(completed)
WHERE NOT (u)-[:ENROLLED_IN]->(nextCourse)
RETURN nextCourse
```

The production query also filters on `status = 'completed'`, returns the completed course that unlocked each result, and uses `$email` as a driver parameter. This is the graph-specific part of the application: it finds reachable next moves through relationships rather than copying a fixed course list into application code. The same route accepts `POST` with `{ email, courseId }` to `MERGE` a completed `ENROLLED_IN` relationship, then the UI reloads the traversal.

## Run locally

1. Create an account at [CognoDB Cloud](https://console.cognodb.com/signup), choose **Create instance**, select the free `c0` tier and a region, then wait for provisioning to finish.
2. Copy the `bolt+s://...databases.cognodb.cloud` URI and the generated password for the `cognodb` user immediately. The password is shown once.
3. Create `.env.local` from `.env.example` and fill in the three values. Never commit `.env.local`.
4. Install dependencies and load the sample graph (12 courses, 5 skills, and 12 prerequisite relationships):

```bash
npm install
node scripts/seed.js
```

5. Start the application:

```bash
npm run dev
```

Open `http://localhost:3000`. The health check is available at `http://localhost:3000/api/test`.

## Project structure

- `src/app/page.tsx` - Pathfinder dashboard and loading/error/empty states.
- `src/app/api/recommendations/route.ts` - parameterized graph reads and enrollment writes.
- `lib/neo4j.ts` - lazy CognoDB connection and connectivity verification.
- `scripts/seed.js` - repeatable sample graph loader.

## Deployment

Deploy on Vercel or another Next.js host, then add `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` as server-side environment variables. Run the seed script once against the CognoDB instance before opening the hosted demo.

## Screenshots

The dashboard is designed for a desktop overview and collapses into a single-column trail and recommendation view on small screens. Capture the running app at `http://localhost:3000` after seeding; include the desktop and mobile captures in the final repository or submission email.

## Submission checklist

- **Repository:** [Add the final GitHub repository URL before emailing]
- **Hosted demo:** [Add the Vercel or other hosting URL]
- **Screen recording:** [Add a short recording link showing seed, recommendations, and Mark complete]
- **Email:** send the repository and demo links to `hr@wexa.ai` with subject `CognoDB Assignment 2 - Moffahmii`.

## Requirements covered

- Realistic seed data and repeatable loader in `scripts/seed.js`.
- Labeled nodes, typed relationships, properties, and a Mermaid model diagram.
- Parameterized Neo4j-driver Cypher, including multi-hop prerequisite traversal.
- Read and write application flow with loading, empty, error, and refresh states.
- Secrets loaded from environment variables and ignored by Git.
