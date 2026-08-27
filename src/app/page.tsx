"use client";

import { useEffect, useState } from "react";

const LEARNER_EMAIL = "mohamed@example.com";
const RECOMMENDATIONS_URL = `/api/recommendations?email=${LEARNER_EMAIL}`;

type Course = {
  id: string;
  title: string;
  level: string;
  unlockedBy?: string[];
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

function TrailPanel({ completed }: { completed: Course[] }) {
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
            <span className="check">OK</span>
          </div>
        ))}
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [completingCourse, setCompletingCourse] = useState("");

  async function loadRecommendations() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(RECOMMENDATIONS_URL);
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
  }

  async function completeCourse(courseId: string) {
    setCompletingCourse(courseId);
    setError("");
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: LEARNER_EMAIL, courseId }),
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
    const loadTimer = window.setTimeout(() => void loadRecommendations(), 0);
    return () => window.clearTimeout(loadTimer);
  }, []);

  return (
    <div className="app-shell">
      <Header />
      <main className="dashboard">
        <Intro />
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
            <section className="content-grid">
              <TrailPanel completed={graph.completed} />
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
