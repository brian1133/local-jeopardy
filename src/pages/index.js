import React, { useState, useEffect } from "react";
import categoriesData from "../data/categories.json";

export default function Home() {
  const [questions, setQuestions] = useState(categoriesData);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null);
  const [teamScores, setTeamScores] = useState({ team1: 0, team2: 0 });
  const [timer, setTimer] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [dailyDoubles, setDailyDoubles] = useState([]);
  const [wager, setWager] = useState(null);

  // Initialize two random Daily Double questions
  useEffect(() => {
    const allQuestions = [];
    questions.forEach((category, catIdx) => {
      category.questions.forEach((question, qIdx) => {
        allQuestions.push({ catIdx, qIdx });
      });
    });

    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    setDailyDoubles([shuffled[0], shuffled[1]]);
  }, []);

  // Speak the question aloud
  const speakQuestion = (clue) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(clue);
      window.speechSynthesis.speak(utterance);

      utterance.onend = () => {
        startTimer();
      };
    }
  };

  // Handle question selection
  const handleQuestionClick = (categoryIndex, questionIndex) => {
    const question = questions[categoryIndex].questions[questionIndex];
    if (!question) return;

    const isDailyDouble =
      dailyDoubles.some((dd) => dd.catIdx === categoryIndex && dd.qIdx === questionIndex);

    setCurrentQuestion({ categoryIndex, questionIndex, ...question, isDailyDouble });
    setRevealedAnswer(null);

    if (isDailyDouble) {
      alert("🎉 DAILY DOUBLE! 🎉 Enter your wager.");
    } else {
      speakQuestion(question.clue);
    }
  };

  // Start a 3-second timer
  const startTimer = () => {
    setTimer(3);
    setIsTimerRunning(true);
  };

  // Handle timer countdown
  useEffect(() => {
    if (timer === null || timer <= 0) {
      setIsTimerRunning(false);
      return;
    }

    const timerInterval = setTimeout(() => {
      setTimer(timer - 1);
    }, 1000);

    return () => clearTimeout(timerInterval);
  }, [timer]);

  // Reveal answer
  const handleShowAnswer = () => {
    if (currentQuestion) {
      setRevealedAnswer(currentQuestion.answer);
    }
  };

  // Handle score update (Add or Subtract)
  const handleScoreUpdate = (team, isAdding) => {
    if (currentQuestion) {
      const points = (currentQuestion.isDailyDouble ? wager : currentQuestion.value) * (isAdding ? 1 : -1);
      setTeamScores((prevScores) => ({
        ...prevScores,
        [team]: prevScores[team] + points,
      }));

      setQuestions((prevQuestions) => {
        const updatedQuestions = [...prevQuestions];
        updatedQuestions[currentQuestion.categoryIndex].questions[currentQuestion.questionIndex] = null;
        return updatedQuestions;
      });

      setCurrentQuestion(null);
      setRevealedAnswer(null);
      setTimer(null);
      setWager(null);
    }
  };

  return (
    <div style={styles.mainContainer}>
      <h1>Local Jeopardy Game</h1>

      {/* Jeopardy Board */}
      <div style={styles.board}>
        {questions.map((category) => (
          <div key={category.name} style={styles.categoryHeader}>
            {category.name}
          </div>
        ))}

        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {questions.map((category, categoryIndex) => {
              const question = category.questions[rowIndex];
              const isSelected =
                currentQuestion &&
                currentQuestion.categoryIndex === categoryIndex &&
                currentQuestion.questionIndex === rowIndex;

              return question ? (
                <button
                  key={`${category.name}-${rowIndex}`}
                  style={{
                    ...styles.questionButton,
                    backgroundColor: isSelected ? "#f39c12" : "#007bff",
                  }}
                  onClick={() => handleQuestionClick(categoryIndex, rowIndex)}
                >
                  {question.value}
                </button>
              ) : (
                <div key={`${category.name}-${rowIndex}`} style={styles.emptyButton} />
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Current Question Display */}
      {currentQuestion && (
        <div style={styles.currentQuestionContainer}>
          {currentQuestion.isDailyDouble && (
            <>
              <h2>🎉 DAILY DOUBLE! 🎉</h2>
              <input
                type="number"
                placeholder="Enter wager"
                value={wager || ""}
                onChange={(e) => setWager(Number(e.target.value))}
                style={styles.wagerInput}
              />
              <button onClick={() => speakQuestion(currentQuestion.clue)}>Submit Wager</button>
            </>
          )}
          {!currentQuestion.isDailyDouble && <h2>Question: {currentQuestion.clue}</h2>}

          {isTimerRunning && <h3 style={{ color: "red" }}>Time Left: {timer}s</h3>}
          <button style={styles.showAnswerButton} onClick={handleShowAnswer}>Show Answer</button>
          {revealedAnswer && <h3>Answer: {revealedAnswer}</h3>}
        </div>
      )}

      {/* Scoreboard (Always Visible) */}
      <div style={styles.scoreboard}>
        <h2>Scoreboard</h2>
        <div style={styles.scoreSection}>
          <div style={styles.team}>
            <h3 style={styles.teamHeader}>Team 1</h3>
            <p style={styles.teamScore}>{teamScores.team1} pts</p>
            <button style={{ ...styles.teamButton, backgroundColor: "#28a745" }} onClick={() => handleScoreUpdate("team1", true)}>+100</button>
            <button style={{ ...styles.teamButton, backgroundColor: "#dc3545" }} onClick={() => handleScoreUpdate("team1", false)}>-100</button>
          </div>
          <div style={styles.team}>
            <h3 style={styles.teamHeader}>Team 2</h3>
            <p style={styles.teamScore}>{teamScores.team2} pts</p>
            <button style={{ ...styles.teamButton, backgroundColor: "#28a745" }} onClick={() => handleScoreUpdate("team2", true)}>+100</button>
            <button style={{ ...styles.teamButton, backgroundColor: "#dc3545" }} onClick={() => handleScoreUpdate("team2", false)}>-100</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Styling
const styles = {
  mainContainer: { width: "900px", margin: "0 auto", textAlign: "center" },
  board: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" },
  categoryHeader: { fontWeight: "bold", backgroundColor: "#eee", padding: "10px" },
  questionButton: { height: "60px", fontSize: "18px", color: "#fff", border: "none", cursor: "pointer" },
  scoreboard: { marginTop: "20px", padding: "20px", backgroundColor: "#222", color: "#fff", borderRadius: "10px" },
  scoreSection: { display: "flex", justifyContent: "center", gap: "20px" },
  team: { textAlign: "center" },
  teamHeader: { fontSize: "22px" },
  teamScore: { fontSize: "24px", fontWeight: "bold" },
  teamButton: { padding: "15px", fontSize: "18px", fontWeight: "bold", cursor: "pointer", color: "#fff", border: "none" },
};

