const neo4j = require("neo4j-driver");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });

const uri = process.env.DB_URL;
const user = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;

if (!uri || !user || !password) {
  console.error("Missing database connection variables.");
  process.exit(1);
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function seedDatabase() {
  const session = driver.session();
  try {
    console.log("Clearing old data...");
    await session.run("MATCH (n) DETACH DELETE n");

    console.log("Seeding expanded Learning Paths data...");

    const seedQuery = `
      CREATE (html:Course {id: 'c1', title: 'HTML & CSS Basics', level: 'Beginner'})
      CREATE (js:Course {id: 'c2', title: 'JavaScript Fundamentals', level: 'Beginner'})
      CREATE (react:Course {id: 'c3', title: 'React for Beginners', level: 'Intermediate'})
      CREATE (nextjs:Course {id: 'c4', title: 'Advanced Next.js', level: 'Advanced'})
      CREATE (node:Course {id: 'c5', title: 'Node.js Basics', level: 'Intermediate'})
      CREATE (typescript:Course {id: 'c6', title: 'TypeScript Essentials', level: 'Intermediate'})
      CREATE (tailwind:Course {id: 'c7', title: 'Tailwind UI Systems', level: 'Intermediate'})
      CREATE (testing:Course {id: 'c8', title: 'Testing React Applications', level: 'Advanced'})
      CREATE (postgres:Course {id: 'c9', title: 'PostgreSQL for Developers', level: 'Intermediate'})
      CREATE (api:Course {id: 'c10', title: 'Production API Design', level: 'Advanced'})
      CREATE (cloud:Course {id: 'c11', title: 'Cloud Deployment Foundations', level: 'Advanced'})
      CREATE (capstone:Course {id: 'c12', title: 'Full Stack Capstone', level: 'Advanced'})

      CREATE (frontend:Skill {name: 'Frontend Development'})
      CREATE (backend:Skill {name: 'Backend Development'})
      CREATE (quality:Skill {name: 'Software Quality'})
      CREATE (data:Skill {name: 'Data Engineering'})
      CREATE (delivery:Skill {name: 'Cloud Delivery'})

      CREATE (html)-[:TEACHES]->(frontend)
      CREATE (js)-[:TEACHES]->(frontend)
      CREATE (react)-[:TEACHES]->(frontend)
      CREATE (nextjs)-[:TEACHES]->(frontend)
      CREATE (typescript)-[:TEACHES]->(frontend)
      CREATE (tailwind)-[:TEACHES]->(frontend)
      CREATE (testing)-[:TEACHES]->(quality)
      CREATE (node)-[:TEACHES]->(backend)
      CREATE (api)-[:TEACHES]->(backend)
      CREATE (postgres)-[:TEACHES]->(data)
      CREATE (cloud)-[:TEACHES]->(delivery)
      CREATE (capstone)-[:TEACHES]->(frontend)
      CREATE (capstone)-[:TEACHES]->(backend)

      CREATE (react)-[:REQUIRES]->(js)
      CREATE (react)-[:REQUIRES]->(html)
      CREATE (nextjs)-[:REQUIRES]->(react)
      CREATE (node)-[:REQUIRES]->(js)
      CREATE (typescript)-[:REQUIRES]->(js)
      CREATE (tailwind)-[:REQUIRES]->(html)
      CREATE (testing)-[:REQUIRES]->(react)
      CREATE (postgres)-[:REQUIRES]->(js)
      CREATE (api)-[:REQUIRES]->(node)
      CREATE (cloud)-[:REQUIRES]->(node)
      CREATE (capstone)-[:REQUIRES]->(nextjs)
      CREATE (capstone)-[:REQUIRES]->(api)

      CREATE (user:User {email: 'mohamed@example.com', name: 'Mohamed'})
      CREATE (user)-[:ENROLLED_IN {status: 'completed'}]->(html)
      CREATE (user)-[:ENROLLED_IN {status: 'completed'}]->(js)

      CREATE (sara:User {email: 'sara@example.com', name: 'Sara'})
      CREATE (sara)-[:ENROLLED_IN {status: 'completed'}]->(html)
      CREATE (sara)-[:ENROLLED_IN {status: 'completed'}]->(js)
      CREATE (sara)-[:ENROLLED_IN {status: 'completed'}]->(react)

      CREATE (omar:User {email: 'omar@example.com', name: 'Omar'})
      CREATE (omar)-[:ENROLLED_IN {status: 'completed'}]->(js)
      CREATE (omar)-[:ENROLLED_IN {status: 'completed'}]->(node)
    `;

    await session.run(seedQuery);
    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exitCode = 1;
  } finally {
    await session.close();
    await driver.close();
  }
}

seedDatabase();
