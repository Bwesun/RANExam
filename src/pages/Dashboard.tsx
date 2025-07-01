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
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonButtons,
  IonMenuButton,
  IonBadge,
} from "@ionic/react";
import {
  documentTextOutline,
  trophyOutline,
  timeOutline,
  checkmarkCircleOutline,
  addOutline,
  statsChartOutline,
} from "ionicons/icons";
import { useAuth } from "../contexts/AuthContext";
import { Exam, ExamResult } from "../types/exam";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [recentResults, setRecentResults] = useState<ExamResult[]>([]);

  useEffect(() => {
    // Mock data - replace with API calls
    const mockExams: Exam[] = [
      {
        id: "1",
        title: "JavaScript Fundamentals",
        description: "Test your knowledge of JavaScript basics",
        duration: 30,
        questions: [],
        totalMarks: 100,
        passingMarks: 60,
        isActive: true,
        createdBy: "instructor1",
        createdAt: new Date(),
        category: "Programming",
      },
      {
        id: "2",
        title: "React Concepts",
        description: "Advanced React concepts and hooks",
        duration: 45,
        questions: [],
        totalMarks: 150,
        passingMarks: 90,
        isActive: true,
        createdBy: "instructor1",
        createdAt: new Date(),
        category: "Frontend",
      },
      {
        id: "3",
        title: "Database Design",
        description: "SQL and database design principles",
        duration: 60,
        questions: [],
        totalMarks: 200,
        passingMarks: 120,
        isActive: true,
        createdBy: "instructor2",
        createdAt: new Date(),
        category: "Database",
      },
    ];

    setAvailableExams(mockExams);

    if (user?.role === "student") {
      const mockResults: ExamResult[] = [
        {
          id: "1",
          examId: "1",
          userId: user.id,
          score: 85,
          totalQuestions: 20,
          correctAnswers: 17,
          percentage: 85,
          grade: "A",
          passed: true,
          timeSpent: 1500,
          completedAt: new Date(),
          answers: [],
        },
      ];
      setRecentResults(mockResults);
    }
  }, [user]);

  const formatDuration = (minutes: number) => {
    return `${minutes} min${minutes > 1 ? "s" : ""}`;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="dashboard-content">
        <div className="dashboard-container">
          <div className="welcome-section">
            <h1>Welcome back, {user?.name}!</h1>
            <p>
              Ready to{" "}
              {user?.role === "student" ? "take an exam" : "manage your exams"}?
            </p>
          </div>

          {user?.role === "student" && (
            <>
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
                            <h3>{availableExams.length}</h3>
                            <p>Available Exams</p>
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
                            <h3>{recentResults.length}</h3>
                            <p>Completed</p>
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>
              </IonGrid>

              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Available Exams</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    {availableExams.map((exam) => (
                      <IonItem
                        key={exam.id}
                        button
                        routerLink={`/exam/${exam.id}`}
                      >
                        <div className="exam-item">
                          <div className="exam-info">
                            <h3>{exam.title}</h3>
                            <p>{exam.description}</p>
                            <div className="exam-meta">
                              <IonBadge color="primary">
                                {exam.category}
                              </IonBadge>
                              <span className="exam-duration">
                                <IonIcon icon={timeOutline} />{" "}
                                {formatDuration(exam.duration)}
                              </span>
                              <span className="exam-marks">
                                {exam.totalMarks} marks
                              </span>
                            </div>
                          </div>
                          <IonIcon
                            icon={checkmarkCircleOutline}
                            className="exam-arrow"
                          />
                        </div>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>

              {recentResults.length > 0 && (
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Recent Results</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonList>
                      {recentResults.map((result) => (
                        <IonItem
                          key={result.id}
                          button
                          routerLink={`/result/${result.id}`}
                        >
                          <div className="result-item">
                            <div className="result-info">
                              <h3>JavaScript Fundamentals</h3>
                              <p>
                                Score: {result.percentage}% ({result.grade})
                              </p>
                              <span
                                className={`result-status ${result.passed ? "passed" : "failed"}`}
                              >
                                {result.passed ? "PASSED" : "FAILED"}
                              </span>
                            </div>
                            <div className="result-score">
                              <span className="score-number">
                                {result.percentage}%
                              </span>
                            </div>
                          </div>
                        </IonItem>
                      ))}
                    </IonList>
                  </IonCardContent>
                </IonCard>
              )}
            </>
          )}

          {user?.role === "instructor" && (
            <>
              <IonGrid>
                <IonRow>
                  <IonCol size="4">
                    <IonCard className="stat-card">
                      <IonCardContent>
                        <div className="stat-content">
                          <IonIcon
                            icon={documentTextOutline}
                            className="stat-icon"
                          />
                          <div>
                            <h3>{availableExams.length}</h3>
                            <p>My Exams</p>
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                  <IonCol size="4">
                    <IonCard className="stat-card">
                      <IonCardContent>
                        <div className="stat-content">
                          <IonIcon
                            icon={statsChartOutline}
                            className="stat-icon"
                          />
                          <div>
                            <h3>156</h3>
                            <p>Total Attempts</p>
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                  <IonCol size="4">
                    <IonCard className="stat-card">
                      <IonCardContent>
                        <div className="stat-content">
                          <IonIcon icon={trophyOutline} className="stat-icon" />
                          <div>
                            <h3>78%</h3>
                            <p>Avg Score</p>
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>
              </IonGrid>

              <div className="action-buttons">
                <IonButton
                  routerLink="/create-exam"
                  expand="block"
                  className="create-exam-btn"
                >
                  <IonIcon icon={addOutline} slot="start" />
                  Create New Exam
                </IonButton>
              </div>

              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>My Exams</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    {availableExams.map((exam) => (
                      <IonItem
                        key={exam.id}
                        button
                        routerLink={`/manage-exam/${exam.id}`}
                      >
                        <div className="exam-item">
                          <div className="exam-info">
                            <h3>{exam.title}</h3>
                            <p>{exam.description}</p>
                            <div className="exam-meta">
                              <IonBadge color="primary">
                                {exam.category}
                              </IonBadge>
                              <span className="exam-duration">
                                <IonIcon icon={timeOutline} />{" "}
                                {formatDuration(exam.duration)}
                              </span>
                              <IonBadge
                                color={exam.isActive ? "success" : "medium"}
                              >
                                {exam.isActive ? "Active" : "Inactive"}
                              </IonBadge>
                            </div>
                          </div>
                        </div>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
