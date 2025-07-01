import React, { useState, useEffect } from "react";
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
import { useAuth } from "../contexts/AuthContext";
import { examsAPI } from "../services/api";
import "./TakeExam.css";

interface ExamQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

const TakeExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuth();
  const history = useHistory();

  const [exam, setExam] = useState<any>(null);
  const [questions] = useState<ExamQuestion[]>([
    {
      id: "1",
      text: "What is the correct syntax for creating a function in JavaScript?",
      options: [
        "function myFunction() {}",
        "def myFunction() {}",
        "function: myFunction() {}",
        "create function myFunction() {}",
      ],
      correctAnswer: 0,
    },
    {
      id: "2",
      text: "Which method is used to add an element to the end of an array?",
      options: ["append()", "push()", "add()", "insert()"],
      correctAnswer: 1,
    },
    {
      id: "3",
      text: 'What does "DOM" stand for?',
      options: [
        "Document Object Model",
        "Data Object Management",
        "Dynamic Object Manipulation",
        "Digital Output Method",
      ],
      correctAnswer: 0,
    },
    {
      id: "4",
      text: "Which operator is used for strict equality comparison in JavaScript?",
      options: ["==", "===", "=", "!="],
      correctAnswer: 1,
    },
    {
      id: "5",
      text: 'What is the purpose of the "var" keyword in JavaScript?',
      options: [
        "To create a variable",
        "To create a function",
        "To create an object",
        "To create a loop",
      ],
      correctAnswer: 0,
    },
  ]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [showSubmitAlert, setShowSubmitAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [examStarted, setExamStarted] = useState(false);

  useEffect(() => {
    loadExam();
  }, [examId]);

  useEffect(() => {
    if (examStarted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [examStarted, timeRemaining]);

  const loadExam = async () => {
    setLoading(true);
    try {
      const response = await examsAPI.getExam(examId!);
      if (response.success && response.data) {
        setExam(response.data);
        setTimeRemaining(response.data.timeLimit * 60); // Convert minutes to seconds
      } else {
        setToastMessage("Failed to load exam");
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage("Failed to load exam");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const startExam = () => {
    setExamStarted(true);
  };

  const handleAnswerChange = (questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
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

  const handleSubmitExam = () => {
    // Calculate score
    let correctAnswers = 0;
    questions.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const percentage = Math.round((correctAnswers / questions.length) * 100);
    const passed = percentage >= (exam?.passingScore || 70);

    // Navigate to results page with score data
    history.push({
      pathname: `/result/${examId}`,
      state: {
        examTitle: exam?.title,
        score: correctAnswers,
        totalQuestions: questions.length,
        percentage,
        passed,
        answers: answers,
        questions: questions,
      },
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = (): number => {
    return Object.keys(answers).length;
  };

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
                    <span className="value">{exam?.timeLimit} minutes</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Questions:</span>
                    <span className="value">{questions.length}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Passing Score:</span>
                    <span className="value">{exam?.passingScore}%</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Category:</span>
                    <span className="value">{exam?.category}</span>
                  </div>
                </div>

                <div className="exam-instructions">
                  <h3>Instructions:</h3>
                  <ul>
                    <li>Read each question carefully</li>
                    <li>Select the best answer for each question</li>
                    <li>You can navigate between questions</li>
                    <li>Click "Submit Exam" when you're finished</li>
                    <li>The exam will auto-submit when time expires</li>
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

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

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
                  handleAnswerChange(currentQ.id, e.detail.value)
                }
              >
                {currentQ.options.map((option, index) => (
                  <IonItem key={index} className="option-item">
                    <IonRadio slot="start" value={index} />
                    <IonLabel className="option-label">{option}</IonLabel>
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
            disabled={currentQuestion === 0}
          >
            <IonIcon icon={chevronBackOutline} slot="start" />
            Previous
          </IonButton>

          {currentQuestion === questions.length - 1 ? (
            <IonButton color="success" onClick={() => setShowSubmitAlert(true)}>
              <IonIcon icon={checkmarkOutline} slot="start" />
              Submit Exam
            </IonButton>
          ) : (
            <IonButton onClick={nextQuestion}>
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
              handler: handleSubmitExam,
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
