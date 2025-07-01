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
} from "@ionic/react";
import {
  timeOutline,
  documentTextOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import { Exam } from "../types/exam";
import "./ExamList.css";

const ExamList: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "completed">(
    "all",
  );

  useEffect(() => {
    // Mock exam data
    const mockExams: Exam[] = [
      {
        id: "1",
        title: "JavaScript Fundamentals",
        description:
          "Test your knowledge of JavaScript basics including variables, functions, and data types",
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
        title: "React Advanced Concepts",
        description:
          "Advanced React concepts including hooks, context, and performance optimization",
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
        title: "Database Design Principles",
        description:
          "SQL fundamentals, database normalization, and design patterns",
        duration: 60,
        questions: [],
        totalMarks: 200,
        passingMarks: 120,
        isActive: true,
        createdBy: "instructor2",
        createdAt: new Date(),
        category: "Database",
      },
      {
        id: "4",
        title: "Web Security Basics",
        description:
          "Understanding common web vulnerabilities and security best practices",
        duration: 40,
        questions: [],
        totalMarks: 120,
        passingMarks: 72,
        isActive: true,
        createdBy: "instructor3",
        createdAt: new Date(),
        category: "Security",
      },
    ];

    setExams(mockExams);
  }, []);

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchText.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchText.toLowerCase()) ||
      exam.category.toLowerCase().includes(searchText.toLowerCase());

    switch (filter) {
      case "available":
        return matchesSearch && exam.isActive;
      case "completed":
        // Mock: check if exam is completed (you would check against user's attempt history)
        return matchesSearch && false; // For demo, no exams are completed
      default:
        return matchesSearch;
    }
  });

  const formatDuration = (minutes: number) => {
    return `${minutes} min${minutes > 1 ? "s" : ""}`;
  };

  const getDifficultyColor = (totalMarks: number) => {
    if (totalMarks <= 100) return "success";
    if (totalMarks <= 150) return "warning";
    return "danger";
  };

  const getDifficultyText = (totalMarks: number) => {
    if (totalMarks <= 100) return "Easy";
    if (totalMarks <= 150) return "Medium";
    return "Hard";
  };

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
        <div className="exam-list-container">
          <div className="search-section">
            <IonSearchbar
              value={searchText}
              debounce={300}
              onIonInput={(e) => setSearchText(e.detail.value!)}
              placeholder="Search exams..."
            />

            <IonSegment
              value={filter}
              onIonChange={(e) => setFilter(e.detail.value as any)}
            >
              <IonSegmentButton value="all">
                <IonLabel>All</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="available">
                <IonLabel>Available</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="completed">
                <IonLabel>Completed</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          <div className="exams-grid">
            {filteredExams.map((exam) => (
              <IonCard key={exam.id} className="exam-card">
                <IonCardHeader>
                  <div className="exam-card-header">
                    <IonCardTitle>{exam.title}</IonCardTitle>
                    <IonBadge color={getDifficultyColor(exam.totalMarks)}>
                      {getDifficultyText(exam.totalMarks)}
                    </IonBadge>
                  </div>
                </IonCardHeader>

                <IonCardContent>
                  <p className="exam-description">{exam.description}</p>

                  <div className="exam-details">
                    <div className="detail-item">
                      <IonIcon icon={timeOutline} />
                      <span>{formatDuration(exam.duration)}</span>
                    </div>
                    <div className="detail-item">
                      <IonIcon icon={documentTextOutline} />
                      <span>{exam.totalMarks} marks</span>
                    </div>
                    <div className="detail-item">
                      <IonBadge color="primary">{exam.category}</IonBadge>
                    </div>
                  </div>

                  <div className="exam-actions">
                    <IonButton
                      expand="block"
                      routerLink={`/exam/${exam.id}`}
                      className="start-exam-btn"
                    >
                      <IonIcon icon={checkmarkCircleOutline} slot="start" />
                      Start Exam
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>

          {filteredExams.length === 0 && (
            <div className="no-exams">
              <IonIcon icon={documentTextOutline} className="no-exams-icon" />
              <h3>No exams found</h3>
              <p>There are no exams matching your current filter.</p>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ExamList;
