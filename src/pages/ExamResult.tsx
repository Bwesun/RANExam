import React, { useEffect, useState } from "react";
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
  IonList,
  IonButtons,
  IonBackButton,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonSpinner,
} from "@ionic/react";
import { useParams, useLocation, useHistory } from "react-router-dom";
import {
  trophyOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  refreshOutline,
  homeOutline,
  documentTextOutline,
  ribbonOutline,
  eyeOutline,
} from "ionicons/icons";
import { attemptsAPI } from "../services/api";
import "./ExamResult.css";

interface QuestionResult {
  id: string;
  text: string;
  options: string[];
  correctAnswer?: number;
  selectedAnswer?: number;
  isCorrect: boolean;
}

interface ResultRouteState {
  examId?: string;
  examTitle?: string;
  score?: number;
  totalQuestions?: number;
  percentage?: number;
  passed?: boolean;
}

const ExamResult: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const location = useLocation<ResultRouteState>();
  const history = useHistory();

  const [examId, setExamId] = useState<string | null>(location.state?.examId || null);
  const [examTitle, setExamTitle] = useState(location.state?.examTitle || "Exam");
  const [score, setScore] = useState(location.state?.score || 0);
  const [totalQuestions, setTotalQuestions] = useState(location.state?.totalQuestions || 0);
  const [percentage, setPercentage] = useState(location.state?.percentage || 0);
  const [passed, setPassed] = useState(location.state?.passed || false);
  const [questions, setQuestions] = useState<QuestionResult[]>([]);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const loadResult = async () => {
      setLoading(true);
      try {
        const response = await attemptsAPI.getAttemptResult(attemptId);
        const attempt = response.data?.data ?? response.data;

        if (!response.success || !attempt) {
          setLoadError("No exam result found");
          return;
        }

        const answerList = attempt.answers || [];
        const correctAnswers = answerList.filter((answer: any) => answer.isCorrect).length;
        const total = answerList.length;
        const resultPercentage =
          attempt.score?.percentage ?? (total > 0 ? Math.round((correctAnswers / total) * 100) : 0);

        setExamId(attempt.exam?._id || null);
        setExamTitle(attempt.exam?.title || location.state?.examTitle || "Exam");
        setScore(correctAnswers);
        setTotalQuestions(total);
        setPercentage(resultPercentage);
        setPassed(Boolean(attempt.result?.passed));

        const mappedQuestions: QuestionResult[] = answerList.map((answer: any, index: number) => {
          const question = answer.question || {};
          return {
            id: question._id || String(index),
            text: question.text || "Question",
            options: (question.options || []).map((option: any) =>
              typeof option === "string" ? option : option.text,
            ),
            correctAnswer:
              typeof question.correctAnswer === "number" ? question.correctAnswer : undefined,
            selectedAnswer:
              typeof answer.selectedOption === "number" ? answer.selectedOption : undefined,
            isCorrect: Boolean(answer.isCorrect),
          };
        });

        setQuestions(mappedQuestions);
      } catch (error: any) {
        const message =
          error.response?.data?.message ||
          error.message ||
          "Failed to load exam result";
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadResult();
  }, [attemptId, location.state]);

  const getGradeColor = (examPercentage: number): string => {
    if (examPercentage >= 90) return "success";
    if (examPercentage >= 80) return "primary";
    if (examPercentage >= 70) return "warning";
    if (examPercentage >= 60) return "tertiary";
    return "danger";
  };

  const getGradeLetter = (examPercentage: number): string => {
    if (examPercentage >= 90) return "A";
    if (examPercentage >= 80) return "B";
    if (examPercentage >= 70) return "C";
    if (examPercentage >= 60) return "D";
    return "F";
  };

  const getMotivationalMessage = (
    examPercentage: number,
    examPassed: boolean,
  ): string => {
    if (examPassed) {
      if (examPercentage >= 95) return "Outstanding performance!";
      if (examPercentage >= 85) return "Excellent work!";
      if (examPercentage >= 75) return "Great job!";
      return "Well done!";
    }
    return "Keep practicing and you'll improve!";
  };

  const goHome = () => {
    history.push("/dashboard");
  };

  const retakeExam = () => {
    if (examId) {
      history.push(`/exam/${examId}`);
      return;
    }

    history.push("/exams");
  };

  const viewAllExams = () => {
    history.push("/exams");
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/dashboard" />
            </IonButtons>
            <IonTitle>Exam Result</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (loadError) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/dashboard" />
            </IonButtons>
            <IonTitle>Exam Result</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="empty-result">
            <IonIcon icon={documentTextOutline} />
            <h2>No exam result found</h2>
            <p>{loadError}</p>
            <IonButton fill="outline" onClick={viewAllExams}>
              Browse Exams
            </IonButton>
          </div>
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
          <IonTitle>Exam Result</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="result-content">
        {/* Result Header */}
        <div className={`result-header ${passed ? "passed" : "failed"}`}>
          <div className="result-icon">
            <IonIcon
              icon={passed ? trophyOutline : closeCircleOutline}
              className={`main-icon ${passed ? "success" : "error"}`}
            />
          </div>

          <h1 className="result-title">
            {passed ? "Congratulations!" : "Not Quite There"}
          </h1>

          <p className="result-subtitle">
            {getMotivationalMessage(percentage, passed)}
          </p>
        </div>

        {/* Score Card */}
        <IonCard className="score-card">
          <IonCardContent>
            <div className="score-display">
              <div className="main-score">
                <span
                  className="percentage"
                  style={{
                    color: `var(--ion-color-${getGradeColor(percentage)})`,
                  }}
                >
                  {percentage}%
                </span>
                <IonBadge
                  color={getGradeColor(percentage)}
                  className="grade-badge"
                >
                  {getGradeLetter(percentage)}
                </IonBadge>
              </div>

              <div className="score-details">
                <div className="score-item">
                  <IonIcon icon={checkmarkCircleOutline} color="success" />
                  <span>
                    {score} / {totalQuestions} Correct
                  </span>
                </div>

                <div className="score-item">
                  <IonIcon
                    icon={ribbonOutline}
                    color={passed ? "success" : "danger"}
                  />
                  <span>{passed ? "Passed" : "Failed"}</span>
                </div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Exam Info */}
        <IonCard className="exam-info-card">
          <IonCardHeader>
            <IonCardTitle>{examTitle}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <div className="info-item">
                    <IonIcon icon={documentTextOutline} />
                    <div>
                      <div className="info-label">Questions</div>
                      <div className="info-value">{totalQuestions}</div>
                    </div>
                  </div>
                </IonCol>

                <IonCol size="6">
                  <div className="info-item">
                    <IonIcon icon={checkmarkCircleOutline} />
                    <div>
                      <div className="info-label">Correct</div>
                      <div className="info-value">{score}</div>
                    </div>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Question Review */}
        {questions.length > 0 && (
          <IonCard className="review-card">
            <IonCardHeader>
              <IonCardTitle>
                <div className="review-header">
                  <span>Question Review</span>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => setShowDetailedResults(!showDetailedResults)}
                  >
                    <IonIcon icon={eyeOutline} slot="start" />
                    {showDetailedResults ? "Hide" : "Show"} Details
                  </IonButton>
                </div>
              </IonCardTitle>
            </IonCardHeader>

            {showDetailedResults && (
              <IonCardContent>
                <IonList>
                  {questions.map((question, index) => (
                    <IonItem key={question.id} className="question-review-item">
                      <div className="question-review-content">
                        <div className="question-header">
                          <span className="question-number">Q{index + 1}</span>
                          <IonChip
                            color={question.isCorrect ? "success" : "danger"}
                            className="answer-status"
                          >
                            <IonIcon
                              icon={
                                question.isCorrect
                                  ? checkmarkCircleOutline
                                  : closeCircleOutline
                              }
                            />
                            {question.isCorrect ? "Correct" : "Incorrect"}
                          </IonChip>
                        </div>

                        <div className="question-text">{question.text}</div>

                        <div className="answer-details">
                          {question.selectedAnswer !== undefined && (
                            <div
                              className={`answer-option ${question.isCorrect ? "correct" : "incorrect"}`}
                            >
                              <strong>Your answer:</strong>{" "}
                              {question.options[question.selectedAnswer]}
                            </div>
                          )}

                          {!question.isCorrect &&
                            question.correctAnswer !== undefined && (
                              <div className="answer-option correct">
                                <strong>Correct answer:</strong>{" "}
                                {question.options[question.correctAnswer]}
                              </div>
                            )}
                        </div>
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              </IonCardContent>
            )}
          </IonCard>
        )}

        {/* Action Buttons */}
        <div className="result-actions">
          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="4">
                <IonButton expand="block" fill="outline" onClick={goHome}>
                  <IonIcon icon={homeOutline} slot="start" />
                  Dashboard
                </IonButton>
              </IonCol>

              <IonCol size="12" sizeMd="4">
                <IonButton expand="block" fill="outline" onClick={retakeExam}>
                  <IonIcon icon={refreshOutline} slot="start" />
                  Retake Exam
                </IonButton>
              </IonCol>

              <IonCol size="12" sizeMd="4">
                <IonButton expand="block" onClick={viewAllExams}>
                  <IonIcon icon={documentTextOutline} slot="start" />
                  More Exams
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ExamResult;
