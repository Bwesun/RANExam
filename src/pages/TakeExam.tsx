import React, { useState, useEffect, useCallback } from "react";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonLabel,
  IonProgressBar,
  IonIcon,
  IonAlert,
  IonToast,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonText,
  IonBadge,
} from "@ionic/react";
import { useParams, useHistory } from "react-router-dom";
import {
  timeOutline,
  checkmarkOutline,
  chevronBackOutline,
  chevronForwardOutline,
  documentTextOutline,
} from "ionicons/icons";
import { attemptsAPI, examsAPI } from "../services/api";
import "./TakeExam.css";

interface ExamOption {
  _id?: string;
  text: string;
}

interface ExamQuestion {
  id: string;
  text: string;
  options: ExamOption[];
}

interface ExamInfo {
  _id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  instructions?: string;
}

const TakeExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const history = useHistory();

  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(30 * 60);
  const [showSubmitAlert, setShowSubmitAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [examStarted, setExamStarted] = useState(false);

  useEffect(() => {
    loadExam();
  }, [examId]);

  useEffect(() => {
    if (!examStarted || timeRemaining <= 0 || submitting) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          void handleSubmitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeRemaining, submitting]);

  const getPassingPercentage = useCallback((examData: ExamInfo | null) => {
    if (!examData || !examData.totalMarks) {
      return 70;
    }

    return Math.round((examData.passingMarks / examData.totalMarks) * 100);
  }, []);

  const loadExam = async () => {
    setLoading(true);
    try {
      const response = await examsAPI.getExam(examId);
      const examData = response.data?.data ?? response.data;

      if (response.success && examData) {
        const normalizedExam: ExamInfo = {
          _id: examData._id,
          title: examData.title,
          description: examData.description,
          category: examData.category,
          duration: examData.duration,
          totalMarks: examData.totalMarks,
          passingMarks: examData.passingMarks,
          instructions: examData.instructions,
        };

        setExam(normalizedExam);
        setTimeRemaining((normalizedExam.duration || 30) * 60);
      } else {
        setToastMessage("Failed to load exam");
        setShowToast(true);
      }
    } catch {
      setToastMessage("Failed to load exam");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const startExam = async () => {
    try {
      const response = await attemptsAPI.startAttempt(examId);
      const attemptData = response.data?.data ?? response.data;

      if (!response.success || !attemptData) {
        setToastMessage("Unable to start exam attempt");
        setShowToast(true);
        return;
      }

      const resolvedExam = attemptData.exam || exam;
      if (resolvedExam) {
        setExam((prev) => ({
          _id: resolvedExam._id || prev?._id || examId,
          title: resolvedExam.title || prev?.title || "Exam",
          description: resolvedExam.description || prev?.description || "",
          category: resolvedExam.category || prev?.category || "General",
          duration: resolvedExam.duration || prev?.duration || 30,
          totalMarks: resolvedExam.totalMarks || prev?.totalMarks || 0,
          passingMarks: resolvedExam.passingMarks || prev?.passingMarks || 0,
          instructions: resolvedExam.instructions || prev?.instructions,
        }));
      }

      const mappedQuestions: ExamQuestion[] = (attemptData.answers || [])
        .map((answer: any) => {
          const q = answer.question;
          if (!q) return null;

          return {
            id: q._id || q.id,
            text: q.text,
            options: (q.options || []).map((option: any) =>
              typeof option === "string"
                ? { text: option }
                : { _id: option._id, text: option.text },
            ),
          };
        })
        .filter(Boolean);

      const initialAnswers: Record<string, number> = {};
      (attemptData.answers || []).forEach((answer: any) => {
        const questionId = answer.question?._id || answer.question?.id;
        if (questionId && typeof answer.selectedOption === "number") {
          initialAnswers[questionId] = answer.selectedOption;
        }
      });

      setAttemptId(attemptData._id || attemptData.id);
      setQuestions(mappedQuestions);
      setAnswers(initialAnswers);
      setTimeRemaining(
        attemptData.timeRemaining ||
          (resolvedExam?.duration || exam?.duration || 30) * 60,
      );
      setCurrentQuestion(0);
      setExamStarted(true);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to start exam";
      setToastMessage(message);
      setShowToast(true);
    }
  };

  const handleAnswerChange = async (
    questionId: string,
    answerIndex: number,
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));

    if (!attemptId) {
      return;
    }

    try {
      await attemptsAPI.saveAnswer(attemptId, questionId, {
        selectedOption: answerIndex,
      });
    } catch {
      setToastMessage("Answer was saved locally but sync failed");
      setShowToast(true);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmitExam = async (isAutoSubmit = false) => {
    if (!attemptId || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await Promise.all(
        Object.entries(answers).map(([questionId, selectedOption]) =>
          attemptsAPI.saveAnswer(attemptId, questionId, { selectedOption }),
        ),
      );

      const submitResponse = await attemptsAPI.submitAttempt(attemptId);
      const submitData = submitResponse.data?.data ?? submitResponse.data;
      const scoreData = submitData?.score || {};
      const resultData = submitData?.result || {};

      history.replace({
        pathname: `/result/${attemptId}`,
        state: {
          examId,
          examTitle: submitData?.examTitle || exam?.title || "Exam",
          score: scoreData.obtained || 0,
          totalQuestions: questions.length,
          percentage: scoreData.percentage || 0,
          passed: !!resultData.passed,
          autoSubmitted: isAutoSubmit,
        },
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit exam";
      setToastMessage(message);
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = (): number => {
    return Object.keys(answers).length;
  };

  const currentQ = questions[currentQuestion];
  const progress =
    questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/exams" />
            </IonButtons>
            <IonTitle>Loading Exam...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>Loading exam...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!examStarted) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/exams" />
            </IonButtons>
            <IonTitle>{exam?.title}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="exam-content">
          <IonCard className="exam-intro-card">
            <IonCardContent>
              <div className="exam-intro">
                <IonIcon
                  icon={documentTextOutline}
                  className="exam-intro-icon"
                />
                <h1>{exam?.title}</h1>
                <p className="exam-description">{exam?.description}</p>

                <div className="exam-details">
                  <div className="detail-row">
                    <span className="label">Duration:</span>
                    <span className="value">{exam?.duration} minutes</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Questions:</span>
                    <span className="value">{questions.length || "Will load on start"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Passing Score:</span>
                    <span className="value">{getPassingPercentage(exam)}%</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Category:</span>
                    <span className="value">{exam?.category}</span>
                  </div>
                </div>

                <div className="exam-instructions">
                  <h3>Instructions:</h3>
                  <ul>
                    {exam?.instructions ? (
                      <li>{exam.instructions}</li>
                    ) : (
                      <>
                        <li>Read each question carefully</li>
                        <li>Select the best answer for each question</li>
                        <li>You can navigate between questions</li>
                        <li>Click "Submit Exam" when you&apos;re finished</li>
                        <li>The exam will auto-submit when time expires</li>
                      </>
                    )}
                  </ul>
                </div>

                <IonButton
                  expand="block"
                  size="large"
                  onClick={startExam}
                  className="start-exam-button"
                >
                  Start Exam
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonPage>
    );
  }

  if (!currentQ) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/exams" />
            </IonButtons>
            <IonTitle>{exam?.title}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <IonText>No questions were found for this attempt.</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{exam?.title}</IonTitle>
          <IonButtons slot="end">
            <IonBadge color="primary">
              <IonIcon icon={timeOutline} />
              {formatTime(timeRemaining)}
            </IonBadge>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="exam-content">
        {/* Progress Bar */}
        <div className="exam-progress">
          <div className="progress-info">
            <span>
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span>{getAnsweredCount()} answered</span>
          </div>
          <IonProgressBar value={progress / 100} />
        </div>

        {/* Question Card */}
        <IonCard className="question-card">
          <IonCardContent>
            <div className="question-header">
              <h2>Question {currentQuestion + 1}</h2>
            </div>

            <div className="question-text">
              <p>{currentQ.text}</p>
            </div>

            <div className="question-options">
              <IonRadioGroup
                value={answers[currentQ.id]}
                onIonChange={(e) =>
                  void handleAnswerChange(currentQ.id, e.detail.value)
                }
              >
                {currentQ.options.map((option, index) => (
                  <IonItem key={option._id || index} className="option-item">
                    <IonRadio slot="start" value={index} />
                    <IonLabel className="option-label">{option.text}</IonLabel>
                  </IonItem>
                ))}
              </IonRadioGroup>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Navigation */}
        <div className="exam-navigation">
          <IonButton
            fill="outline"
            onClick={previousQuestion}
            disabled={currentQuestion === 0 || submitting}
          >
            <IonIcon icon={chevronBackOutline} slot="start" />
            Previous
          </IonButton>

          {currentQuestion === questions.length - 1 ? (
            <IonButton
              color="success"
              onClick={() => setShowSubmitAlert(true)}
              disabled={submitting}
            >
              <IonIcon icon={checkmarkOutline} slot="start" />
              {submitting ? "Submitting..." : "Submit Exam"}
            </IonButton>
          ) : (
            <IonButton onClick={nextQuestion} disabled={submitting}>
              Next
              <IonIcon icon={chevronForwardOutline} slot="end" />
            </IonButton>
          )}
        </div>

        {/* Submit Confirmation */}
        <IonAlert
          isOpen={showSubmitAlert}
          onDidDismiss={() => setShowSubmitAlert(false)}
          header="Submit Exam"
          message={`Are you sure you want to submit your exam? You have answered ${getAnsweredCount()} out of ${questions.length} questions.`}
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
            },
            {
              text: "Submit",
              handler: () => {
                void handleSubmitExam(false);
              },
            },
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default TakeExam;
