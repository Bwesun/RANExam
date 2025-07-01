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
} from "@ionic/react";
import { useParams, useHistory } from "react-router-dom";
import {
  timeOutline,
  checkmarkOutline,
  chevronBackOutline,
  chevronForwardOutline,
} from "ionicons/icons";
import { useAuth } from "../contexts/AuthContext";
import { Exam, Question, ExamState } from "../types/exam";
import "./TakeExam.css";

const TakeExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuth();
  const history = useHistory();

  const [exam, setExam] = useState<Exam | null>(null);
  const [examState, setExamState] = useState<ExamState>({
    currentExam: null,
    currentAttempt: null,
    timeRemaining: 0,
    currentQuestion: 0,
    answers: {},
  });
  const [showSubmitAlert, setShowSubmitAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    // Mock exam data with questions
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

    const mockExam: Exam = {
      id: examId,
      title: "JavaScript Fundamentals",
      description: "Test your knowledge of JavaScript basics",
      duration: 30,
      questions: mockQuestions,
      totalMarks: 100,
      passingMarks: 60,
      isActive: true,
      createdBy: "instructor1",
      createdAt: new Date(),
      category: "Programming",
    };

    setExam(mockExam);
    setExamState((prev) => ({
      ...prev,
      currentExam: mockExam,
      timeRemaining: mockExam.duration * 60, // Convert to seconds
      currentQuestion: 0,
    }));
  }, [examId]);

  useEffect(() => {
    if (examState.timeRemaining > 0) {
      const timer = setTimeout(() => {
        setExamState((prev) => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (examState.timeRemaining === 0 && exam) {
      handleSubmitExam();
    }
  }, [examState.timeRemaining, exam]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (questionId: string, selectedOption: number) => {
    setExamState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: selectedOption,
      },
    }));
  };

  const goToNextQuestion = () => {
    if (exam && examState.currentQuestion < exam.questions.length - 1) {
      setExamState((prev) => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
      }));
    }
  };

  const goToPreviousQuestion = () => {
    if (examState.currentQuestion > 0) {
      setExamState((prev) => ({
        ...prev,
        currentQuestion: prev.currentQuestion - 1,
      }));
    }
  };

  const handleSubmitExam = () => {
    if (!exam || !user) return;

    // Calculate score
    let correctAnswers = 0;
    exam.questions.forEach((question) => {
      if (examState.answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const percentage = Math.round(
      (correctAnswers / exam.questions.length) * 100,
    );
    const passed = percentage >= (exam.passingMarks / exam.totalMarks) * 100;

    // Save result (mock - replace with API call)
    const result = {
      examId: exam.id,
      userId: user.id,
      score: correctAnswers,
      totalQuestions: exam.questions.length,
      percentage,
      passed,
      timeSpent: exam.duration * 60 - examState.timeRemaining,
    };

    localStorage.setItem(
      `result_${exam.id}_${user.id}`,
      JSON.stringify(result),
    );

    history.push(`/result/${exam.id}`, { result });
  };

  const confirmSubmit = () => {
    setShowSubmitAlert(true);
  };

  if (!exam) {
    return (
      <IonPage>
        <IonContent>
          <div className="loading-container">Loading exam...</div>
        </IonContent>
      </IonPage>
    );
  }

  const currentQuestion = exam.questions[examState.currentQuestion];
  const progress = (examState.currentQuestion + 1) / exam.questions.length;
  const timeWarning = examState.timeRemaining <= 300; // 5 minutes warning

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" />
          </IonButtons>
          <IonTitle>{exam.title}</IonTitle>
          <div slot="end" className={`timer ${timeWarning ? "warning" : ""}`}>
            <IonIcon icon={timeOutline} />
            {formatTime(examState.timeRemaining)}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="exam-content">
        <div className="exam-container">
          <div className="exam-progress">
            <div className="progress-info">
              <span>
                Question {examState.currentQuestion + 1} of{" "}
                {exam.questions.length}
              </span>
              <span>{Object.keys(examState.answers).length} answered</span>
            </div>
            <IonProgressBar value={progress} />
          </div>

          <IonCard className="question-card">
            <IonCardContent>
              <div className="question-header">
                <h2>Question {examState.currentQuestion + 1}</h2>
                <span className={`difficulty ${currentQuestion.difficulty}`}>
                  {currentQuestion.difficulty.toUpperCase()}
                </span>
              </div>

              <div className="question-text">{currentQuestion.text}</div>

              <IonRadioGroup
                value={examState.answers[currentQuestion.id]}
                onIonChange={(e) =>
                  handleAnswerSelect(currentQuestion.id, e.detail.value)
                }
              >
                {currentQuestion.options.map((option, index) => (
                  <IonItem key={index} className="option-item">
                    <IonLabel className="option-label">{option}</IonLabel>
                    <IonRadio slot="start" value={index} />
                  </IonItem>
                ))}
              </IonRadioGroup>
            </IonCardContent>
          </IonCard>

          <div className="navigation-buttons">
            <IonButton
              fill="outline"
              onClick={goToPreviousQuestion}
              disabled={examState.currentQuestion === 0}
            >
              <IonIcon icon={chevronBackOutline} slot="start" />
              Previous
            </IonButton>

            <div className="nav-spacer"></div>

            {examState.currentQuestion === exam.questions.length - 1 ? (
              <IonButton color="success" onClick={confirmSubmit}>
                <IonIcon icon={checkmarkOutline} slot="start" />
                Submit Exam
              </IonButton>
            ) : (
              <IonButton onClick={goToNextQuestion}>
                Next
                <IonIcon icon={chevronForwardOutline} slot="end" />
              </IonButton>
            )}
          </div>

          <div className="answer-grid">
            <h3>Answer Overview</h3>
            <div className="answer-circles">
              {exam.questions.map((_, index) => (
                <button
                  key={index}
                  className={`answer-circle ${
                    index === examState.currentQuestion ? "current" : ""
                  } ${
                    examState.answers[exam.questions[index].id] !== undefined
                      ? "answered"
                      : ""
                  }`}
                  onClick={() =>
                    setExamState((prev) => ({
                      ...prev,
                      currentQuestion: index,
                    }))
                  }
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        <IonAlert
          isOpen={showSubmitAlert}
          onDidDismiss={() => setShowSubmitAlert(false)}
          header="Submit Exam"
          message={`Are you sure you want to submit? You have answered ${Object.keys(examState.answers).length} out of ${exam.questions.length} questions.`}
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
        />
      </IonContent>
    </IonPage>
  );
};

export default TakeExam;
