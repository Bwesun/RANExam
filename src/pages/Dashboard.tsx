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
  IonSpinner,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonToast,
} from "@ionic/react";
import {
  documentTextOutline,
  trophyOutline,
  timeOutline,
  checkmarkCircleOutline,
  addOutline,
  statsChartOutline,
  refreshOutline,
} from "ionicons/icons";
import { useAuth } from "../contexts/AuthContext";
import { useHistory } from "react-router-dom";
import { examsAPI, resultsAPI, adminAPI } from "../services/api";
import "./Dashboard.css";

interface DashboardStats {
  totalExams: number;
  completedExams: number;
  averageScore: number;
  passedExams: number;
}

interface ExamData {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  timeLimit: number;
  passingScore: number;
  totalQuestions: number;
  isActive: boolean;
  createdAt: string;
}

interface ResultData {
  _id: string;
  exam: {
    title: string;
    category: string;
  };
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [availableExams, setAvailableExams] = useState<ExamData[]>([]);
  const [recentResults, setRecentResults] = useState<ResultData[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    passedExams: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAvailableExams(),
        loadRecentResults(),
        loadDashboardStats(),
      ]);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setToastMessage("Failed to load dashboard data");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableExams = async () => {
    try {
      const response = await examsAPI.getExams({
        page: 1,
        limit: 6,
        isActive: true,
      });

      if (response.success && response.data) {
        setAvailableExams(response.data.exams || []);
      }
    } catch (error) {
      console.error("Failed to load exams:", error);
    }
  };

  const loadRecentResults = async () => {
    try {
      if (user?.role === "student") {
        const response = await resultsAPI.getUserResults({
          page: 1,
          limit: 5,
        });

        if (response.success && response.data) {
          setRecentResults(response.data.results || []);
        }
      }
    } catch (error) {
      console.error("Failed to load results:", error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      if (user?.role === "admin") {
        const response = await adminAPI.getDashboardStats();
        if (response.success && response.data) {
          setDashboardStats(response.data);
        }
      } else if (user?.role === "student") {
        // Calculate stats from results
        const response = await resultsAPI.getUserResults({
          page: 1,
          limit: 100,
        });

        if (response.success && response.data) {
          const results = response.data.results || [];
          const stats = {
            totalExams: results.length,
            completedExams: results.length,
            averageScore: results.length > 0
              ? Math.round(results.reduce((acc: number, result: any) => acc + result.percentage, 0) / results.length)
              : 0,
            passedExams: results.filter((result: any) => result.passed).length,
          };
          setDashboardStats(stats);
        }
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadDashboardData();
    event.detail.complete();
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
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