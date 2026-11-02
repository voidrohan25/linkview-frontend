// scratch/test_interview_engine.mjs
// Comprehensive test suite for LinkView Technical Interview Engine & AI Rubric Evaluator

async function runInterviewTests() {
  const baseUrl = "http://localhost:3000";
  console.log("=== LinkView Autonomous Interview Engine Test Suite ===");
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
    }
  }

  // 1. Start a Python Technical Interview Session
  let sessionId = "";
  try {
    const res = await fetch(`${baseUrl}/api/interviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        track: "python",
        difficulty: "intermediate",
        studentName: "Aarav Sharma",
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success && data.data.id, "Create Python interview session");
    sessionId = data.data.id;
    assert(data.data.currentTurn === 1 && data.data.totalTurns === 3, "Initial turn is 1 of 3");
    assert(data.data.currentQuestion.length > 20, `Valid first question: "${data.data.currentQuestion.slice(0, 45)}..."`);
  } catch (e) {
    assert(false, `Session creation threw: ${e.message}`);
  }

  // 2. Submit Turn 1: High quality technical answer
  try {
    const highQualityAnswer =
      "CPython manages memory primarily using reference counting where each PyObject tracks ob_refcnt. To handle circular reference cycles that reference counting misses, Python uses a generational garbage collector with 3 generations. The Global Interpreter Lock or GIL prevents race conditions during reference count manipulation, ensuring thread-safe bytecode execution.";

    const res = await fetch(`${baseUrl}/api/interviews`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        answer: highQualityAnswer,
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success, "Submit Turn 1 answer");
    assert(data.data.currentTurn === 2, "Turn advances to 2 of 3");
    const turn1History = data.data.history[0];
    assert(turn1History.score >= 7, `Comprehensive answer received high score: ${turn1History.score}/10`);
    assert(turn1History.feedback.length > 20, `Constructive feedback generated: "${turn1History.feedback.slice(0, 50)}..."`);
  } catch (e) {
    assert(false, `Turn 1 submission threw: ${e.message}`);
  }

  // 3. Submit Turn 2: Shallow / partial answer
  try {
    const shallowAnswer = "Generators use yield keyword in python functions.";
    const res = await fetch(`${baseUrl}/api/interviews`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        answer: shallowAnswer,
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success, "Submit Turn 2 shallow answer");
    assert(data.data.currentTurn === 3, "Turn advances to 3 of 3");
    const turn2History = data.data.history[1];
    assert(turn2History.score <= 6, `Shallow answer appropriately scored lower: ${turn2History.score}/10`);
  } catch (e) {
    assert(false, `Turn 2 submission threw: ${e.message}`);
  }

  // 4. Submit Turn 3: Final turn to complete interview
  try {
    const finalAnswer =
      "Decorators are higher-order functions that take a function as an argument and wrap its behavior without modifying the original code. They use closures to retain execution state and wrap functions dynamically.";
    const res = await fetch(`${baseUrl}/api/interviews`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        answer: finalAnswer,
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success, "Submit final Turn 3 answer");
    assert(data.data.status === "completed", "Interview status transitions to 'completed'");
    assert(data.data.scorecard && data.data.scorecard.overallScore > 0, `Complete scorecard generated: ${data.data.scorecard?.overallScore}% overall`);
    assert(data.data.scorecard.strengths.length > 0, "Scorecard contains specific strengths");
    assert(data.data.scorecard.weaknesses.length > 0, "Scorecard contains actionable weaknesses");
  } catch (e) {
    assert(false, `Turn 3 submission threw: ${e.message}`);
  }

  // 5. Verify Scorecard Retrieval by ID
  try {
    const res = await fetch(`${baseUrl}/api/interviews?id=${sessionId}`);
    const data = await res.json();
    assert(res.status === 200 && data.success && data.data.status === "completed", "Retrieve completed interview by ID");
  } catch (e) {
    assert(false, `Retrieval threw: ${e.message}`);
  }

  console.log(`\nInterview Engine Results: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
}

runInterviewTests();
