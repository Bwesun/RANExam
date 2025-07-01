import React, { useState, useEffect } from "react";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonButtons,
  IonBackButton,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import { useParams, useLocation } from "react-router-dom";
import {
  trophyOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
  refreshOutline,
  homeOutline,
  documentTextOutline,
} from "ionicons/icons";
import { useAuth } from "../contexts/AuthContext";
import { ExamResult as ExamResultType, Question } from "../types/exam";
import "./ExamResult.css";

const ExamResult: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const location = useLocation<{ result?: any }>();
  const { user } = useAuth();
  const [result, setResult] = useState<ExamResultType | null>(null);
  const [examTitle, setExamTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  useEffect(() => {
    if (location.state?.result) {
      // Result passed from exam completion
      const resultData = location.state.result;
      setResult({
        id: Date.now().toString(),
        examId: examId,
        userId: user?.id || "",
        score: resultData.score,
        totalQuestions: resultData.totalQuestions,
        correctAnswers: resultData.score,
        percentage: resultData.percentage,
        grade: getGrade(resultData.percentage),
        passed: resultData.passed,
        timeSpent: resultData.timeSpent,
        completedAt: new Date(),
        answers: [],
      });
      setExamTitle("JavaScript Fundamentals");
    } else {
      // Load stored result
      const stored = localStorage.getItem(`result_${examId}_${user?.id}`);
      if (stored) {
        const parsedResult = JSON.parse(stored);
        setResult({
          ...parsedResult,
          id: Date.now().toString(),
          grade: getGrade(parsedResult.percentage),
          completedAt: new Date(),
          answers: [],
        });
        setExamTitle("JavaScript Fundamentals");
      }
    }

    // Load questions for detailed view
    const mockQuestions: Question[] = [
      {
        id: "1",
        text: "What is the correct way to declare a variable in JavaScript?",
        options: [
          "var x = 5;",
          "variable x = 5;",
          "v x = 5;",
          "declare x = 5;",
        ],
        correctAnswer: 0,
        difficulty: "easy",
        category: "JavaScript",
        explanation:
          "The var keyword is used to declare variables in JavaScript.",
      },
      {
        id: "2",
        text: "Which of the following is NOT a JavaScript data type?",
        options: ["Number", "String", "Boolean", "Float"],
        correctAnswer: 3,
        difficulty: "medium",
        category: "JavaScript",
        explanation:
          "JavaScript has Number type, but not a separate Float type.",
      },
      {
        id: "3",
        text: 'What does the "this" keyword refer to in JavaScript?',
        options: [
          "The current function",
          "The current object",
          "The global window",
          "The parent element",
        ],
        correctAnswer: 1,
        difficulty: "medium",
        category: "JavaScript",
        explanation:
          'The "this" keyword refers to the object that is executing the current function.',
      },
      {
        id: "4",
        text: "How do you create a function in JavaScript?",
        options: [
          "function myFunction() {}",
          "create myFunction() {}",
          "def myFunction() {}",
          "function = myFunction() {}",
        ],
        correctAnswer: 0,
        difficulty: "easy",
        category: "JavaScript",
      },
      {
        id: "5",
        text: 'What is the result of 3 + "3" in JavaScript?',
        options: ["6", "33", "Error", "undefined"],
        correctAnswer: 1,
        difficulty: "medium",
        category: "JavaScript",
        explanation:
          "JavaScript performs string concatenation when adding a number and string.",
      },
    ];
    setQuestions(mockQuestions);
  }, [examId, user?.id, location.state]);

  const getGrade = (percentage: number): string => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getResultColor = (passed: boolean): string => {
    return passed ? "success" : "danger";
  };

  const getResultIcon = (passed: boolean) => {
    return passed ? checkmarkCircleOutline : closeCircleOutline;
  };

  if (!result) {
    return (
      <IonPage>
        <IonContent>
          <div className="loading-container">Loading results...</div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" />
          </IonButtons>
          <IonTitle>Exam Results</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="result-content">
        <div className="result-container">
          {/* Result Header */}
          <div
            className={`result-header ${result.passed ? "passed" : "failed"}`}
          >
            <IonIcon
              icon={getResultIcon(result.passed)}
              className="result-icon"
            />
            <h1>{result.passed ? "Congratulations!" : "Keep Trying!"}</h1>
            <p>
              {result.passed
                ? "You have successfully passed the exam."
                : "You need to improve your score to pass."}
            </p>
          </div>

          {/* Score Card */}
          <IonCard className="score-card">
            <IonCardContent>
              <div className="score-display">
                <div className="score-circle">
                  <span className="score-percentage">{result.percentage}%</span>
                  <span className="score-grade">Grade {result.grade}</span>
                </div>
                <div className="score-details">
                  <div className="score-item">
                    <IonIcon icon={checkmarkCircleOutline} color="success" />
                    <span>Correct: {result.correctAnswers}</span>
                  </div>
                  <div className="score-item">
                    <IonIcon icon={closeCircleOutline} color="danger" />
                    <span>
                      Incorrect: {result.totalQuestions - result.correctAnswers}
                    </span>
                  </div>
                  <div className="score-item">
                    <IonIcon icon={timeOutline} color="medium" />
                    <span>Time: {formatTime(result.timeSpent)}</span>
                  </div>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Statistics */}
          <IonGrid>
            <IonRow>
              <IonCol size="6">
                <IonCard className="stat-card">
                  <IonCardContent>
                    <div className="stat-content">
                      <IonIcon
                        icon={documentTextOutline}
                        className="stat-icon"
                      />
                      <div>
                        <h3>{result.totalQuestions}</h3>
                        <p>Total Questions</p>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="6">
                <IonCard className="stat-card">
                  <IonCardContent>
                    <div className="stat-content">
                      <IonIcon icon={trophyOutline} className="stat-icon" />
                      <div>
                        <h3>{result.score}</h3>
                        <p>Your Score</p>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Detailed Results */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <div className="card-title-with-button">
                  Detailed Results
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => setShowDetailedResults(!showDetailedResults)}
                  >
                    {showDetailedResults ? "Hide" : "Show"} Details
                  </IonButton>
                </div>
              </IonCardTitle>
            </IonCardHeader>
            {showDetailedResults && (
              <IonCardContent>
                <IonList>
                  {questions.map((question, index) => {
                    const userAnswer = index; // Mock user answer
                    const isCorrect = userAnswer === question.correctAnswer;

                    return (
                      <IonItem
                        key={question.id}
                        className="question-result-item"
                      >
                        <div className="question-result">
                          <div className="question-header">
                            <span className="question-number">
                              Q{index + 1}
                            </span>
                            <IonBadge color={isCorrect ? "success" : "danger"}>
                              {isCorrect ? "Correct" : "Incorrect"}
                            </IonBadge>
                          </div>
                          <div className="question-text">{question.text}</div>
                          <div className="answer-details">
                            <div
                              className={`answer-option ${isCorrect ? "correct" : "incorrect"}`}
                            >
                              Your answer: {question.options[userAnswer]}
                            </div>
                            {!isCorrect && (
                              <div className="correct-answer">
                                Correct answer:{" "}
                                {question.options[question.correctAnswer]}
                              </div>
                            )}
                            {question.explanation && (
                              <div className="explanation">
                                <strong>Explanation:</strong>{" "}
                                {question.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      </IonItem>
                    );
                  })}
                </IonList>
              </IonCardContent>
            )}
          </IonCard>

          {/* Action Buttons */}
          <div className="action-buttons">
            <IonButton
              expand="block"
              fill="outline"
              routerLink="/dashboard"
              className="action-button"
            >
              <IonIcon icon={homeOutline} slot="start" />
              Back to Dashboard
            </IonButton>

            <IonButton
              expand="block"
              routerLink={`/exam/${examId}`}
              className="action-button"
              disabled={!result.passed}
            >
              <IonIcon icon={refreshOutline} slot="start" />
              Retake Exam
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ExamResult;
