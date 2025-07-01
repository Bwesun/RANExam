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
  IonText,
  IonChip,
} from "@ionic/react";
import { useParams, useLocation, useHistory } from "react-router-dom";
import {
  trophyOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
  refreshOutline,
  homeOutline,
  documentTextOutline,
  ribbonOutline,
  eyeOutline,
} from "ionicons/icons";
import { useAuth } from "../contexts/AuthContext";
import "./ExamResult.css";

interface QuestionResult {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  selectedAnswer?: number;
  isCorrect: boolean;
}

const ExamResult: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const location = useLocation<any>();
  const history = useHistory();
  const { user } = useAuth();

  const [examTitle, setExamTitle] = useState("");
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [passed, setPassed] = useState(false);
  const [questions, setQuestions] = useState<QuestionResult[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  useEffect(() => {
    if (location.state) {
      const {
        examTitle: title,
        score: examScore,
        totalQuestions: total,
        percentage: examPercentage,
        passed: examPassed,
        answers,
        questions: examQuestions,
      } = location.state;

      setExamTitle(title || "Exam");
      setScore(examScore || 0);
      setTotalQuestions(total || 0);
      setPercentage(examPercentage || 0);
      setPassed(examPassed || false);
      setUserAnswers(answers || {});

      // Process questions with results
      if (examQuestions && answers) {
        const processedQuestions = examQuestions.map((q: any) => ({
          id: q.id,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          selectedAnswer: answers[q.id],
          isCorrect: answers[q.id] === q.correctAnswer,
        }));
        setQuestions(processedQuestions);
      }
    }
  }, [location.state]);

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return "success";
    if (percentage >= 80) return "primary";
    if (percentage >= 70) return "warning";
    if (percentage >= 60) return "tertiary";
    return "danger";
  };

  const getGradeLetter = (percentage: number): string => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  const getMotivationalMessage = (
    percentage: number,
    passed: boolean,
  ): string => {
    if (passed) {
      if (percentage >= 95) return "Outstanding performance! 🏆";
      if (percentage >= 85) return "Excellent work! 🌟";
      if (percentage >= 75) return "Great job! 👍";
      return "Well done! ✅";
    } else {
      return "Keep practicing and you'll improve! 💪";
    }
  };

  const goHome = () => {
    history.push("/dashboard");
  };

  const retakeExam = () => {
    history.push(`/exam/${examId}`);
  };

  const viewAllExams = () => {
    history.push("/exams");
  };

  if (!location.state) {
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
            <p>Please take an exam to see your results here.</p>
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

                          {!question.isCorrect && (
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
