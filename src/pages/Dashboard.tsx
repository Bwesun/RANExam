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
  IonChip,
} from "@ionic/react";
import {
  documentTextOutline,
  trophyOutline,
  timeOutline,
  checkmarkCircleOutline,
  addOutline,
  statsChartOutline,
  refreshOutline,
  schoolOutline,
  bookOutline,
  ribbonOutline,
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
        const response = await resultsAPI.getUserResults({
          page: 1,
          limit: 100,
        });

        if (response.success && response.data) {
          const results = response.data.results || [];
          const stats = {
            totalExams: results.length,
            completedExams: results.length,
            averageScore:
              results.length > 0
                ? Math.round(
                    results.reduce(
                      (acc: number, result: any) => acc + result.percentage,
                      0,
                    ) / results.length,
                  )
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
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "success";
      case "intermediate":
        return "warning";
      case "advanced":
        return "danger";
      case "expert":
        return "dark";
      default:
        return "medium";
    }
  };

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return "success";
    if (percentage >= 80) return "primary";
    if (percentage >= 70) return "warning";
    if (percentage >= 60) return "tertiary";
    return "danger";
  };

  if (loading) {
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
        <IonContent className="dashboard-content">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>Loading dashboard...</IonText>
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
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={() => loadDashboardData()}>
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="dashboard-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="dashboard-header">
          <h1>Welcome back, {user?.name}!</h1>
          <p>Ready to continue your learning journey?</p>
        </div>

        {/* Stats Cards */}
        <IonGrid className="stats-grid">
          <IonRow>
            <IonCol size="6" sizeMd="3">
              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-content">
                    <IonIcon icon={documentTextOutline} className="stat-icon" />
                    <div className="stat-info">
                      <h3>{dashboardStats.totalExams}</h3>
                      <p>Total Exams</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="6" sizeMd="3">
              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-content">
                    <IonIcon
                      icon={checkmarkCircleOutline}
                      className="stat-icon completed"
                    />
                    <div className="stat-info">
                      <h3>{dashboardStats.completedExams}</h3>
                      <p>Completed</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="6" sizeMd="3">
              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-content">
                    <IonIcon
                      icon={trophyOutline}
                      className="stat-icon trophy"
                    />
                    <div className="stat-info">
                      <h3>{dashboardStats.averageScore}%</h3>
                      <p>Avg Score</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="6" sizeMd="3">
              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-content">
                    <IonIcon
                      icon={ribbonOutline}
                      className="stat-icon passed"
                    />
                    <div className="stat-info">
                      <h3>{dashboardStats.passedExams}</h3>
                      <p>Passed</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Available Exams */}
        <IonCard className="section-card">
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={bookOutline} className="section-icon" />
              Available Exams
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {availableExams.length === 0 ? (
              <div className="empty-state">
                <IonIcon icon={schoolOutline} />
                <p>No exams available at the moment</p>
                {user?.role === "instructor" && (
                  <IonButton
                    fill="outline"
                    onClick={() => history.push("/create-exam")}
                  >
                    <IonIcon icon={addOutline} slot="start" />
                    Create Exam
                  </IonButton>
                )}
              </div>
            ) : (
              <IonList>
                {availableExams.slice(0, 4).map((exam) => (
                  <IonItem
                    key={exam._id}
                    button
                    onClick={() => history.push(`/exam/${exam._id}`)}
                  >
                    <div className="exam-item-content">
                      <div className="exam-header">
                        <h3>{exam.title}</h3>
                        <IonChip
                          color={getDifficultyColor(exam.difficulty)}
                          size="small"
                        >
                          {exam.difficulty}
                        </IonChip>
                      </div>
                      <p className="exam-description">{exam.description}</p>
                      <div className="exam-meta">
                        <span className="category">{exam.category}</span>
                        <span className="duration">
                          <IonIcon icon={timeOutline} />
                          {formatDuration(exam.timeLimit)}
                        </span>
                        <span className="questions">
                          {exam.totalQuestions} questions
                        </span>
                      </div>
                    </div>
                  </IonItem>
                ))}
              </IonList>
            )}
            {availableExams.length > 4 && (
              <div className="view-all">
                <IonButton
                  fill="clear"
                  expand="block"
                  onClick={() => history.push("/exams")}
                >
                  View All Exams
                </IonButton>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Recent Results - Only for students */}
        {user?.role === "student" && (
          <IonCard className="section-card">
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={statsChartOutline} className="section-icon" />
                Recent Results
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {recentResults.length === 0 ? (
                <div className="empty-state">
                  <IonIcon icon={documentTextOutline} />
                  <p>No exam results yet</p>
                  <IonButton
                    fill="outline"
                    onClick={() => history.push("/exams")}
                  >
                    Take Your First Exam
                  </IonButton>
                </div>
              ) : (
                <IonList>
                  {recentResults.map((result) => (
                    <IonItem key={result._id}>
                      <div className="result-item-content">
                        <div className="result-header">
                          <h4>{result.exam.title}</h4>
                          <IonBadge color={getGradeColor(result.percentage)}>
                            {result.percentage}%
                          </IonBadge>
                        </div>
                        <div className="result-meta">
                          <span className="category">
                            {result.exam.category}
                          </span>
                          <span className="score">
                            {result.score}/{result.totalQuestions} correct
                          </span>
                          <span className="date">
                            {formatDate(result.completedAt)}
                          </span>
                        </div>
                        <div className="result-status">
                          <IonIcon
                            icon={
                              result.passed
                                ? checkmarkCircleOutline
                                : timeOutline
                            }
                            color={result.passed ? "success" : "danger"}
                          />
                          <span className={result.passed ? "passed" : "failed"}>
                            {result.passed ? "Passed" : "Failed"}
                          </span>
                        </div>
                      </div>
                    </IonItem>
                  ))}
                </IonList>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Quick Actions */}
        <IonCard className="section-card">
          <IonCardHeader>
            <IonCardTitle>Quick Actions</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonGrid>
              <IonRow>
                <IonCol size="6" sizeMd="3">
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={() => history.push("/exams")}
                  >
                    <IonIcon icon={documentTextOutline} slot="start" />
                    Browse Exams
                  </IonButton>
                </IonCol>
                {user?.role === "instructor" && (
                  <IonCol size="6" sizeMd="3">
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={() => history.push("/create-exam")}
                    >
                      <IonIcon icon={addOutline} slot="start" />
                      Create Exam
                    </IonButton>
                  </IonCol>
                )}
                {user?.role === "admin" && (
                  <IonCol size="6" sizeMd="3">
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={() => history.push("/admin-dashboard")}
                    >
                      <IonIcon icon={statsChartOutline} slot="start" />
                      Admin Panel
                    </IonButton>
                  </IonCol>
                )}
                {(user?.role === "instructor" || user?.role === "admin") && (
                  <IonCol size="6" sizeMd="3">
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={() => history.push("/user-management")}
                    >
                      <IonIcon icon={statsChartOutline} slot="start" />
                      Manage Users
                    </IonButton>
                  </IonCol>
                )}
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

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

export default Dashboard;
