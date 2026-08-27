"use client";

import { useCallback, useEffect, useState } from "react";

const DEFAULT_LEARNER_EMAIL = "mohamed@example.com";

type Course = {
  id: string;
  title: string;
  level: string;
  unlockedBy?: string[];
  requirements?: string[];
  completedPrerequisites?: number;
};

type GraphData = {
  learner: string;
  completed: Course[];
  recommendations: Course[];
};

type GraphResponse = {
  success: boolean;
  message?: string;
  data?: GraphData;
};

type Learner = { email: string; name: string };
type LearnersResponse = { success: boolean; data?: Learner[] };

async function fetchLearners() {
  const response = await fetch("/api/users");
  const payload = (await response.json()) as LearnersResponse;
  if (!response.ok || !payload.success || !payload.data) {
    throw new Error("Unable to load learners.");
  }
  return payload.data;
}

function Header() {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">W</span> WEXA / PATHFINDER
      </div>
      <div className="connection">
        <span className="status-dot" /> LIVE GRAPH <span className="divider" />
        COGNODB
      </div>
    </header>
  );
}

function Intro() {
  return (
    <section className="intro">
      <div>
        <p className="eyebrow">PERSONAL LEARNING GRAPH</p>
        <h1>
          Build your next
          <br />
          <em>advantage.</em>
        </h1>
        <p className="lede">
          Follow the shortest route from what you know to what you want to
          master.
        </p>
      </div>
      <div className="intro-note">
        <span className="note-line" />
        <span>
          Recommendations are mapped from your completed courses and their
          prerequisites.
        </span>
      </div>
    </section>
  );
}

function LearnerPicker({
  learners,
  selectedEmail,
  onChange,
}: {
  learners: Learner[];
  selectedEmail: string;
  onChange: (email: string) => void;
}) {
  const selectedLearner = learners.find(
    (learner) => learner.email === selectedEmail,
  );

  return (
    <div className="learner-picker">
      <label htmlFor="learner">VIEWING PATH FOR</label>
      <select
        id="learner"
        value={selectedEmail}
        onChange={(event) => onChange(event.target.value)}
      >
        {learners.map((learner) => (
          <option key={learner.email} value={learner.email}>
            {learner.name}
          </option>
        ))}
      </select>
      <span className="profile-context">
        {selectedLearner?.email ?? selectedEmail}
      </span>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="error-state">
      <strong>Graph connection interrupted</strong>
      <span>{message}</span>
      <button onClick={onRetry}>Retry connection</button>
    </section>
  );
}

function LoadingState() {
  return (
    <section className="loading-state" aria-live="polite">
      <div className="loading-copy">
        <span className="loader" />
        <div>
          <p className="eyebrow accent">GRAPH IN PROGRESS</p>
          <h2>Mapping your next move</h2>
          <p>
            Following completed courses through their prerequisite
            relationships.
          </p>
        </div>
      </div>
      <div className="loading-grid" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

function Stats({ graph }: { graph: GraphData }) {
  const stats = [
    {
      label: "COMPLETED",
      value: graph.completed.length,
      detail: "courses in your trail",
    },
    {
      label: "NEXT MOVES",
      value: graph.recommendations.length,
      detail: "paths unlocked for you",
    },
  ];

  return (
    <section className="stats-row">
      {stats.map((stat) => (
        <div key={stat.label}>
          <span className="stat-label">{stat.label}</span>
          <strong>{stat.value}</strong>
          <span>{stat.detail}</span>
        </div>
      ))}
      <div>
        <span className="stat-label">GRAPH DEPTH</span>
        <strong>
          2<span className="unit"> hops</span>
        </strong>
        <span>of relationship context</span>
      </div>
    </section>
  );
}

function TrailPanel({
  completed,
  recommendations,
}: {
  completed: Course[];
  recommendations: Course[];
}) {
  return (
    <div className="panel trail-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">01 / YOUR TRAIL</p>
          <h2>What you have in motion</h2>
        </div>
        <span className="count-chip">{completed.length} complete</span>
      </div>
      <div className="trail-list">
        {completed.map((course, index) => (
          <div className="trail-item" key={course.id}>
            <span className="trail-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <strong>{course.title}</strong>
              <span>{course.level} / completed</span>
            </div>
            <div className="trail-result">
              <span className="check">COMPLETE</span>
              <span>
                {
                  recommendations.filter((recommendation) =>
                    recommendation.unlockedBy?.includes(course.title),
                  ).length
                }{" "}
                paths unlocked
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PathMap({ graph }: { graph: GraphData }) {
  const completed = graph.completed.slice(0, 3);
  const recommendations = graph.recommendations.slice(0, 3);

  return (
    <section className="path-map" aria-label="Learning path relationship map">
      <div className="path-map-heading">
        <p className="eyebrow">03 / RELATIONSHIP MAP</p>
        <span>Completed courses unlock the next layer</span>
      </div>
      <div className="path-map-flow">
        <div className="map-column">
          <span className="map-label">YOUR FOUNDATION</span>
          {completed.map((course) => (
            <div className="map-node completed-node" key={course.id}>
              <span>{course.id.toUpperCase()}</span>
              <strong>{course.title}</strong>
            </div>
          ))}
        </div>
        <div className="map-connector" aria-hidden="true">
          <span>REQUIRES</span>
        </div>
        <div className="map-column">
          <span className="map-label">UNLOCKED NEXT</span>
          {recommendations.map((course) => (
            <div className="map-node next-node" key={course.id}>
              <span>{course.id.toUpperCase()}</span>
              <strong>{course.title}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RequirementStatus({ course }: { course: Course }) {
  const requiredCount = course.requirements?.length ?? 0;
  const completedCount = course.completedPrerequisites ?? 0;
  const completion = requiredCount ? (completedCount / requiredCount) * 100 : 0;

  return (
    <div className="requirement-status">
      <div className="requirement-header">
        <span>REQUIREMENT STATUS</span>
        <strong>
          {completedCount} of {requiredCount} ready
        </strong>
      </div>
      <div
        className="requirement-track"
        aria-label={`${completedCount} of ${requiredCount} requirements complete`}
      >
        <span style={{ width: `${completion}%` }} />
      </div>
    </div>
  );
}

function RecommendationsPanel({
  recommendations,
  selectedCourse,
  completingCourse,
  onRefresh,
  onComplete,
}: {
  recommendations: Course[];
  selectedCourse: string;
  completingCourse: string;
  onRefresh: () => void;
  onComplete: (courseId: string) => void;
}) {
  return (
    <div className="panel next-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow accent">02 / GRAPH SIGNAL</p>
          <h2>Your next best moves</h2>
        </div>
        <button
          className="refresh"
          onClick={onRefresh}
          aria-label="Refresh recommendations"
        >
          Refresh
        </button>
      </div>
      <div className="recommendation-list">
        {recommendations.length ? (
          recommendations.map((course) => (
            <article
              className={`recommendation ${selectedCourse === course.id ? "selected" : ""}`}
              key={course.id}
            >
              <div className="course-top">
                <span className="course-id">{course.id.toUpperCase()}</span>
                <span className="level">{course.level}</span>
              </div>
              <h3>{course.title}</h3>
              <p>
                Unlocked by <strong>{course.unlockedBy?.join(" + ")}</strong>
              </p>
              <p className="requirements">
                Requires <strong>{course.requirements?.join(" + ")}</strong>
              </p>
              <RequirementStatus course={course} />
              <button
                className="explore"
                onClick={() => onComplete(course.id)}
                disabled={completingCourse === course.id}
              >
                {completingCourse === course.id
                  ? "Updating..."
                  : "Mark complete"}
                <span>Go</span>
              </button>
            </article>
          ))
        ) : (
          <div className="empty-state">
            Complete a course to reveal your next move.
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [graph, setGraph] = useState<GraphData>();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedEmail, setSelectedEmail] = useState(DEFAULT_LEARNER_EMAIL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [completingCourse, setCompletingCourse] = useState("");

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/recommendations?email=${encodeURIComponent(selectedEmail)}`,
      );
      const payload = (await response.json()) as GraphResponse;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(
          payload.message ?? "Unable to load the learning graph.",
        );
      }
      setGraph(payload.data);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load the learning graph.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedEmail]);

  async function completeCourse(courseId: string) {
    setCompletingCourse(courseId);
    setError("");
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: selectedEmail, courseId }),
      });
      const payload = (await response.json()) as GraphResponse;
      if (!response.ok || !payload.success) {
        throw new Error(
          payload.message ?? "Could not update your learning trail.",
        );
      }
      setSelectedCourse(courseId);
      await loadRecommendations();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not update your learning trail.",
      );
    } finally {
      setCompletingCourse("");
    }
  }

  useEffect(() => {
    const learnerTimer = window.setTimeout(() => {
      void fetchLearners()
        .then(setLearners)
        .catch((reason: unknown) => {
          console.error("Unable to load learners", reason);
        });
    }, 0);
    return () => {
      window.clearTimeout(learnerTimer);
    };
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => void loadRecommendations(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadRecommendations]);

  return (
    <div className="app-shell">
      <Header />
      <main className="dashboard">
        <Intro />
        {learners.length > 0 && (
          <LearnerPicker
            learners={learners}
            selectedEmail={selectedEmail}
            onChange={(email) => {
              setSelectedEmail(email);
              setGraph(undefined);
            }}
          />
        )}
        {error ? (
          <ErrorState
            message={error}
            onRetry={() => void loadRecommendations()}
          />
        ) : loading ? (
          <LoadingState />
        ) : graph ? (
          <>
            <Stats graph={graph} />
            <PathMap graph={graph} />
            <section className="content-grid">
              <TrailPanel
                completed={graph.completed}
                recommendations={graph.recommendations}
              />
              <RecommendationsPanel
                recommendations={graph.recommendations}
                selectedCourse={selectedCourse}
                completingCourse={completingCourse}
                onRefresh={() => void loadRecommendations()}
                onComplete={(courseId) => void completeCourse(courseId)}
              />
            </section>
          </>
        ) : null}
      </main>
      <footer>
        <span>PATHFINDER</span>
        <span>Powered by relationships, not rows.</span>
        <span>v1.0 / 2026</span>
      </footer>
    </div>
  );
}
