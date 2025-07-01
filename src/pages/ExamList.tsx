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
  IonItem,
  IonLabel,
  IonList,
  IonButtons,
  IonMenuButton,
  IonBadge,
  IonIcon,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonChip,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import {
  timeOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  playOutline,
  filterOutline,
  schoolOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { examsAPI } from "../services/api";
import "./ExamList.css";

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
  createdBy?: {
    name: string;
  };
}

const ExamList: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [exams, setExams] = useState<ExamData[]>([]);
  const [filteredExams, setFilteredExams] = useState<ExamData[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    filterExams();
  }, [exams, searchText, selectedCategory, selectedDifficulty]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const response = await examsAPI.getExams({
        page: 1,
        limit: 100,
        isActive: true,
      });

      if (response.success && response.data) {
        const examData = response.data.exams || [];
        setExams(examData);

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(examData.map((exam: ExamData) => exam.category)),
        ].filter(Boolean) as string[];
        setCategories(uniqueCategories);
      } else {
        setToastMessage("Failed to load exams");
        setShowToast(true);
      }
    } catch (error) {
      console.error("Failed to load exams:", error);
      setToastMessage("Failed to load exams");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const filterExams = () => {
    let filtered = [...exams];

    // Filter by search text
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (exam) =>
          exam.title.toLowerCase().includes(searchLower) ||
          exam.description.toLowerCase().includes(searchLower) ||
          exam.category.toLowerCase().includes(searchLower),
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((exam) => exam.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(
        (exam) => exam.difficulty === selectedDifficulty,
      );
    }

    setFilteredExams(filtered);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadExams();
    event.detail.complete();
  };

  const handleTakeExam = (examId: string) => {
    history.push(`/exam/${examId}`);
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
      year: "numeric",
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

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Available Exams</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>Loading exams...</IonText>
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
          <IonTitle>Available Exams</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="exam-list-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Search and Filters */}
        <div className="search-filter-section">
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search exams..."
            debounce={300}
          />

          <IonGrid className="filter-grid">
            <IonRow>
              <IonCol size="6">
                <IonItem>
                  <IonLabel>Category</IonLabel>
                  <IonSelect
                    value={selectedCategory}
                    onIonChange={(e) => setSelectedCategory(e.detail.value)}
                    interface="popover"
                  >
                    <IonSelectOption value="all">
                      All Categories
                    </IonSelectOption>
                    {categories.map((category) => (
                      <IonSelectOption key={category} value={category}>
                        {category}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonCol>

              <IonCol size="6">
                <IonItem>
                  <IonLabel>Difficulty</IonLabel>
                  <IonSelect
                    value={selectedDifficulty}
                    onIonChange={(e) => setSelectedDifficulty(e.detail.value)}
                    interface="popover"
                  >
                    <IonSelectOption value="all">All Levels</IonSelectOption>
                    <IonSelectOption value="beginner">Beginner</IonSelectOption>
                    <IonSelectOption value="intermediate">
                      Intermediate
                    </IonSelectOption>
                    <IonSelectOption value="advanced">Advanced</IonSelectOption>
                    <IonSelectOption value="expert">Expert</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <IonText color="medium">
            Showing {filteredExams.length} of {exams.length} exams
          </IonText>
        </div>

        {/* Exam List */}
        {filteredExams.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={schoolOutline} />
            <h3>No exams found</h3>
            <p>
              {searchText ||
              selectedCategory !== "all" ||
              selectedDifficulty !== "all"
                ? "Try adjusting your search or filters"
                : "No exams are currently available"}
            </p>
          </div>
        ) : (
          <div className="exam-cards-container">
            {filteredExams.map((exam) => (
              <IonCard key={exam._id} className="exam-card">
                <IonCardHeader>
                  <div className="exam-card-header">
                    <IonCardTitle className="exam-title">
                      {exam.title}
                    </IonCardTitle>
                    <div className="exam-badges">
                      <IonChip color={getDifficultyColor(exam.difficulty)}>
                        {exam.difficulty}
                      </IonChip>
                    </div>
                  </div>
                </IonCardHeader>

                <IonCardContent>
                  <p className="exam-description">{exam.description}</p>

                  <div className="exam-details">
                    <div className="detail-item">
                      <IonIcon icon={documentTextOutline} />
                      <span>{exam.category}</span>
                    </div>

                    <div className="detail-item">
                      <IonIcon icon={timeOutline} />
                      <span>{formatDuration(exam.timeLimit)}</span>
                    </div>

                    <div className="detail-item">
                      <IonIcon icon={checkmarkCircleOutline} />
                      <span>{exam.totalQuestions} questions</span>
                    </div>
                  </div>

                  <div className="exam-meta">
                    <span className="passing-score">
                      Passing Score: {exam.passingScore}%
                    </span>
                    <span className="created-date">
                      Created: {formatDate(exam.createdAt)}
                    </span>
                    {exam.createdBy && (
                      <span className="instructor">
                        by {exam.createdBy.name}
                      </span>
                    )}
                  </div>

                  <div className="exam-actions">
                    <IonButton
                      expand="block"
                      onClick={() => handleTakeExam(exam._id)}
                      className="take-exam-button"
                    >
                      <IonIcon icon={playOutline} slot="start" />
                      Start Exam
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}

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

export default ExamList;
