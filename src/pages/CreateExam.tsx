import React, { useState } from "react";
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
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonList,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonToggle,
  IonDatetime,
  IonModal,
  IonToast,
  IonAlert,
  IonGrid,
  IonRow,
  IonCol,
  IonRadio,
  IonRadioGroup,
  IonReorder,
  IonReorderGroup,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from "@ionic/react";
import {
  addOutline,
  saveOutline,
  trashOutline,
  pencilOutline,
  reorderThreeOutline,
  copyOutline,
  eyeOutline,
  closeOutline,
  checkmarkOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { Exam, Question } from "../types/exam";
import "./CreateExam.css";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { examsAPI, CreateExamRequest } from "../services/api";

interface ExamForm {
  title: string;
  description: string;
  category: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  instructions: string;
  randomizeQuestions: boolean;
  showResults: boolean;
  maxAttempts: number;
  scheduledStart?: string;
  scheduledEnd?: string;
}

interface QuestionForm {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  category: string;
}

const CreateExam: React.FC = () => {
  const history = useHistory();
  const {user} = useAuth();
  const [currentStep, setCurrentStep] = useState<
    "basic" | "questions" | "settings" | "preview"
  >("basic");
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<
    number | null
  >(null);

  const [examForm, setExamForm] = useState<ExamForm>({
    title: "",
    description: "",
    category: "Programming",
    duration: 60,
    totalMarks: 100,
    passingMarks: 60,
    instructions:
      "Read all questions carefully. Select the best answer for each question. You cannot go back once you submit.",
    randomizeQuestions: false,
    showResults: true,
    maxAttempts: 1,
  });

  const [questions, setQuestions] = useState<Question[]>([]);

  const [questionForm, setQuestionForm] = useState<QuestionForm>({
    text: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    difficulty: "medium",
    marks: 4,
    category: "General",
  });

  const categories = [
    "RAN Exam",
    "Programming",
    "Frontend",
    "Backend",
    "Database",
    "Security",
    "DevOps",
    "Mobile",
    "AI/ML",
    "Other",
  ];
  const difficulties = ["easy", "medium", "hard"] as const;

  const handleExamFormChange = (field: keyof ExamForm, value: any) => {
    setExamForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuestionFormChange = (field: keyof QuestionForm, value: any) => {
    setQuestionForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm((prev) => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    if (questionForm.options.length < 5) {
      setQuestionForm((prev) => ({
        ...prev,
        options: [...prev.options, ""],
      }));
    }
  };

  const removeOption = (index: number) => {
    if (questionForm.options.length > 2) {
      const newOptions = questionForm.options.filter((_, i) => i !== index);
      setQuestionForm((prev) => ({
        ...prev,
        options: newOptions,
        correctAnswer:
          prev.correctAnswer >= newOptions.length ? 0 : prev.correctAnswer,
      }));
    }
  };

  const validateQuestion = (): boolean => {
    if (!questionForm.text.trim()) {
      setToastMessage("Question text is required");
      setShowToast(true);
      return false;
    }

    const validOptions = questionForm.options.filter(
      (opt) => opt.trim() !== "",
    );
    if (validOptions.length < 2) {
      setToastMessage("At least 2 options are required");
      setShowToast(true);
      return false;
    }

    if (!questionForm.options[questionForm.correctAnswer]?.trim()) {
      setToastMessage("Please select a valid correct answer");
      setShowToast(true);
      return false;
    }

    return true;
  };

  const saveQuestion = () => {
    if (!validateQuestion()) return;

    const newQuestion: Question = {
      id:
        editingQuestionIndex !== null
          ? questions[editingQuestionIndex].id
          : Date.now().toString(),
      text: questionForm.text,
      options: questionForm.options.filter((opt) => opt.trim() !== ""),
      correctAnswer: questionForm.correctAnswer,
      explanation: questionForm.explanation,
      difficulty: questionForm.difficulty,
      category: questionForm.category,
    };

    if (editingQuestionIndex !== null) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = newQuestion;
      setQuestions(updatedQuestions);
      setEditingQuestionIndex(null);
    } else {
      setQuestions((prev) => [...prev, newQuestion]);
    }

    // Reset form
    setQuestionForm({
      text: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
      difficulty: "medium",
      marks: 4,
      category: "General",
    });

    setShowQuestionModal(false);
    setToastMessage("Question saved successfully");
    setShowToast(true);
  };

  const editQuestion = (index: number) => {
    const question = questions[index];
    setQuestionForm({
      text: question.text,
      options: [
        ...question.options,
        ...Array(Math.max(0, 4 - question.options.length)).fill(""),
      ],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || "",
      difficulty: question.difficulty,
      marks: 4,
      category: question.category || "General",
    });
    setEditingQuestionIndex(index);
    setShowQuestionModal(true);
  };

  const deleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setToastMessage("Question deleted");
    setShowToast(true);
  };

  const duplicateQuestion = (index: number) => {
    const question = questions[index];
    const duplicated: Question = {
      ...question,
      id: Date.now().toString(),
      text: `${question.text} (Copy)`,
    };
    setQuestions((prev) => [...prev, duplicated]);
    setToastMessage("Question duplicated");
    setShowToast(true);
  };

  const reorderQuestions = (event: CustomEvent) => {
    const newQuestions = event.detail.complete(questions);
    setQuestions(newQuestions);
  };

  const validateExam = (): boolean => {
    if (!examForm.title.trim()) {
      setToastMessage("Exam title is required");
      setShowToast(true);
      return false;
    }

    if (questions.length === 0) {
      setToastMessage("At least one question is required");
      setShowToast(true);
      return false;
    }

    if (examForm.passingMarks > examForm.totalMarks) {
      setToastMessage("Passing marks cannot exceed total marks");
      setShowToast(true);
      return false;
    }

    return true;
  };

  const saveExam = async () => {
  if (!validateExam()) return;

  const newExam: Exam = {
    id: Date.now().toString(),
    title: examForm.title,
    description: examForm.description,
    category: examForm.category,
    duration: examForm.duration,
    questions: questions,
    totalMarks: examForm.totalMarks,
    passingMarks: examForm.passingMarks,
    isActive: true,
    createdBy: user?.id || "",
    createdAt: new Date(),
  };

  // Map UI model (Exam) -> API model (CreateExamRequest)
  const createReq: CreateExamRequest = {
    ...newExam,
    title: newExam.title,
    description: newExam.description,
    category: newExam.category,
    difficulty: "intermediate",
    timeLimit: newExam.duration ?? 60,
    passingScore: newExam.passingMarks ?? Math.round(newExam.totalMarks * 0.5),
    instructions: examForm.instructions,
    isActive: newExam.isActive,
    // tags: examForm.tags,
    // settings: examForm.settings,
  };

  try {
    const response = await examsAPI.createExam(createReq);
    console.log("Exam created:", response);
    setToastMessage("Exam created successfully!");
    setShowToast(true);
    setTimeout(() => history.push("/dashboard"), 2000);
  } catch (error) {
    console.error("Error creating exam:", error);
    setToastMessage("Error creating exam.");
    setShowToast(true);
  }
};

  const renderBasicInfo = () => (
    <div className="step-content">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Basic Information</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            <IonItem>
              <IonLabel position="stacked">Exam Title *</IonLabel>
              <IonInput
                value={examForm.title}
                onIonInput={(e) =>
                  handleExamFormChange("title", e.detail.value!)
                }
                placeholder="Enter exam title"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Description</IonLabel>
              <IonTextarea
                value={examForm.description}
                onIonInput={(e) =>
                  handleExamFormChange("description", e.detail.value!)
                }
                placeholder="Brief description of the exam"
                rows={3}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Category</IonLabel>
              <IonSelect
                value={examForm.category}
                onIonChange={(e) =>
                  handleExamFormChange("category", e.detail.value)
                }
              >
                {categories.map((cat) => (
                  <IonSelectOption key={cat} value={cat}>
                    {cat}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel position="stacked">Duration (minutes)</IonLabel>
                    <IonInput
                      type="number"
                      value={examForm.duration}
                      onIonInput={(e) =>
                        handleExamFormChange(
                          "duration",
                          parseInt(e.detail.value!),
                        )
                      }
                      min="1"
                      max="300"
                    />
                  </IonItem>
                </IonCol>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel position="stacked">Total Marks</IonLabel>
                    <IonInput
                      type="number"
                      value={examForm.totalMarks}
                      onIonInput={(e) =>
                        handleExamFormChange(
                          "totalMarks",
                          parseInt(e.detail.value!),
                        )
                      }
                      min="1"
                    />
                  </IonItem>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel position="stacked">Passing Marks</IonLabel>
                    <IonInput
                      type="number"
                      value={examForm.passingMarks}
                      onIonInput={(e) =>
                        handleExamFormChange(
                          "passingMarks",
                          parseInt(e.detail.value!),
                        )
                      }
                      min="1"
                      max={examForm.totalMarks}
                    />
                  </IonItem>
                </IonCol>
                <IonCol size="6">
                  <IonItem>
                    <IonLabel position="stacked">Max Attempts</IonLabel>
                    <IonInput
                      type="number"
                      value={examForm.maxAttempts}
                      onIonInput={(e) =>
                        handleExamFormChange(
                          "maxAttempts",
                          parseInt(e.detail.value!),
                        )
                      }
                      min="1"
                      max="10"
                    />
                  </IonItem>
                </IonCol>
              </IonRow>
            </IonGrid>

            <IonItem>
              <IonLabel position="stacked">Instructions</IonLabel>
              <IonTextarea
                value={examForm.instructions}
                onIonInput={(e) =>
                  handleExamFormChange("instructions", e.detail.value!)
                }
                placeholder="Instructions for students"
                rows={4}
              />
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>
    </div>
  );

  const renderQuestions = () => (
    <div className="step-content">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>
            <div className="questions-header">
              Questions ({questions.length})
              <IonButton
                size="small"
                onClick={() => setShowQuestionModal(true)}
              >
                <IonIcon icon={addOutline} slot="start" />
                Add Question
              </IonButton>
            </div>
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {questions.length > 0 ? (
            <IonReorderGroup
              disabled={false}
              onIonItemReorder={reorderQuestions}
            >
              {questions.map((question, index) => (
                <IonItemSliding key={question.id}>
                  <IonItem className="question-item">
                    <div className="question-content">
                      <div className="question-header">
                        <span className="question-number">Q{index + 1}</span>
                        <span className={`difficulty ${question.difficulty}`}>
                          {question.difficulty.toUpperCase()}
                        </span>
                      </div>
                      <div className="question-text">{question.text}</div>
                      <div className="question-options">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`option ${optIndex === question.correctAnswer ? "correct" : ""}`}
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                            {optIndex === question.correctAnswer && (
                              <IonIcon
                                icon={checkmarkOutline}
                                className="correct-icon"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <IonReorder slot="end">
                      <IonIcon icon={reorderThreeOutline} />
                    </IonReorder>
                  </IonItem>

                  <IonItemOptions slot="end">
                    <IonItemOption
                      color="primary"
                      onClick={() => editQuestion(index)}
                    >
                      <IonIcon icon={pencilOutline} />
                    </IonItemOption>
                    <IonItemOption
                      color="secondary"
                      onClick={() => duplicateQuestion(index)}
                    >
                      <IonIcon icon={copyOutline} />
                    </IonItemOption>
                    <IonItemOption
                      color="danger"
                      onClick={() => deleteQuestion(index)}
                    >
                      <IonIcon icon={trashOutline} />
                    </IonItemOption>
                  </IonItemOptions>
                </IonItemSliding>
              ))}
            </IonReorderGroup>
          ) : (
            <div className="no-questions">
              <IonIcon icon={addOutline} className="no-questions-icon" />
              <h3>No questions added yet</h3>
              <p>Click "Add Question" to create your first question.</p>
            </div>
          )}
        </IonCardContent>
      </IonCard>
    </div>
  );

  const renderSettings = () => (
    <div className="step-content">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Exam Settings</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            <IonItem>
              <IonLabel>Randomize Questions</IonLabel>
              <IonToggle
                checked={examForm.randomizeQuestions}
                onIonChange={(e) =>
                  handleExamFormChange("randomizeQuestions", e.detail.checked)
                }
              />
            </IonItem>

            <IonItem>
              <IonLabel>Show Results to Students</IonLabel>
              <IonToggle
                checked={examForm.showResults}
                onIonChange={(e) =>
                  handleExamFormChange("showResults", e.detail.checked)
                }
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Scheduled Start (Optional)</IonLabel>
              <IonDatetime
                value={examForm.scheduledStart}
                onIonChange={(e) =>
                  handleExamFormChange("scheduledStart", e.detail.value)
                }
                presentation="date-time"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Scheduled End (Optional)</IonLabel>
              <IonDatetime
                value={examForm.scheduledEnd}
                onIonChange={(e) =>
                  handleExamFormChange("scheduledEnd", e.detail.value)
                }
                presentation="date-time"
              />
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>
    </div>
  );

  const renderPreview = () => (
    <div className="step-content">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Exam Preview</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="exam-summary">
            <h2>{examForm.title}</h2>
            <p>{examForm.description}</p>

            <div className="exam-stats">
              <div className="stat">
                <span className="label">Duration:</span>
                <span className="value">{examForm.duration} minutes</span>
              </div>
              <div className="stat">
                <span className="label">Questions:</span>
                <span className="value">{questions.length}</span>
              </div>
              <div className="stat">
                <span className="label">Total Marks:</span>
                <span className="value">{examForm.totalMarks}</span>
              </div>
              <div className="stat">
                <span className="label">Passing Marks:</span>
                <span className="value">{examForm.passingMarks}</span>
              </div>
            </div>

            <div className="instructions">
              <h4>Instructions:</h4>
              <p>{examForm.instructions}</p>
            </div>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Create New Exam</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => setShowSaveAlert(true)}
              disabled={questions.length === 0}
            >
              <IonIcon icon={saveOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="create-exam-content">
        <div className="create-exam-container">
          {/* Step Navigation */}
          <div className="step-navigation">
            <div
              className={`step ${currentStep === "basic" ? "active" : ""}`}
              onClick={() => setCurrentStep("basic")}
            >
              <span className="step-number">1</span>
              <span className="step-label">Basic Info</span>
            </div>
            <div
              className={`step ${currentStep === "questions" ? "active" : ""}`}
              onClick={() => setCurrentStep("questions")}
            >
              <span className="step-number">2</span>
              <span className="step-label">Questions</span>
            </div>
            <div
              className={`step ${currentStep === "settings" ? "active" : ""}`}
              onClick={() => setCurrentStep("settings")}
            >
              <span className="step-number">3</span>
              <span className="step-label">Settings</span>
            </div>
            <div
              className={`step ${currentStep === "preview" ? "active" : ""}`}
              onClick={() => setCurrentStep("preview")}
            >
              <span className="step-number">4</span>
              <span className="step-label">Preview</span>
            </div>
          </div>

          {/* Step Content */}
          {currentStep === "basic" && renderBasicInfo()}
          {currentStep === "questions" && renderQuestions()}
          {currentStep === "settings" && renderSettings()}
          {currentStep === "preview" && renderPreview()}

          {/* Navigation Buttons */}
          <div className="step-buttons">
            <IonButton
              fill="outline"
              onClick={() => {
                const steps = ["basic", "questions", "settings", "preview"];
                const currentIndex = steps.indexOf(currentStep);
                if (currentIndex > 0)
                  setCurrentStep(steps[currentIndex - 1] as any);
              }}
              disabled={currentStep === "basic"}
            >
              Previous
            </IonButton>

            <IonButton
              onClick={() => {
                const steps = ["basic", "questions", "settings", "preview"];
                const currentIndex = steps.indexOf(currentStep);
                if (currentIndex < steps.length - 1) {
                  setCurrentStep(steps[currentIndex + 1] as any);
                } else {
                  setShowSaveAlert(true);
                }
              }}
            >
              {currentStep === "preview" ? "Create Exam" : "Next"}
            </IonButton>
          </div>
        </div>

        {/* Question Modal */}
        <IonModal
          isOpen={showQuestionModal}
          onDidDismiss={() => setShowQuestionModal(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                {editingQuestionIndex !== null
                  ? "Edit Question"
                  : "Add Question"}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowQuestionModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="question-modal-content">
            <div className="question-form">
              <IonItem>
                <IonLabel position="stacked">Question Text *</IonLabel>
                <IonTextarea
                  value={questionForm.text}
                  onIonInput={(e) =>
                    handleQuestionFormChange("text", e.detail.value!)
                  }
                  placeholder="Enter your question"
                  rows={3}
                />
              </IonItem>

              <div className="options-section">
                <IonLabel>Answer Options *</IonLabel>
                {questionForm.options.map((option, index) => (
                  <div key={index} className="option-input">
                    <IonRadioGroup
                      value={questionForm.correctAnswer}
                      onIonChange={(e) =>
                        handleQuestionFormChange(
                          "correctAnswer",
                          e.detail.value,
                        )
                      }
                    >
                      <IonItem>
                        <IonRadio slot="start" value={index} />
                        <IonInput
                          value={option}
                          onIonInput={(e) =>
                            handleOptionChange(index, e.detail.value!)
                          }
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        />
                        {questionForm.options.length > 2 && (
                          <IonButton
                            fill="clear"
                            color="danger"
                            onClick={() => removeOption(index)}
                          >
                            <IonIcon icon={trashOutline} />
                          </IonButton>
                        )}
                      </IonItem>
                    </IonRadioGroup>
                  </div>
                ))}

                {questionForm.options.length < 5 && (
                  <IonButton fill="outline" onClick={addOption}>
                    <IonIcon icon={addOutline} slot="start" />
                    Add Option
                  </IonButton>
                )}
              </div>

              <IonGrid>
                <IonRow>
                  <IonCol size="6">
                    <IonItem>
                      <IonLabel position="stacked">Difficulty</IonLabel>
                      <IonSelect
                        value={questionForm.difficulty}
                        onIonChange={(e) =>
                          handleQuestionFormChange("difficulty", e.detail.value)
                        }
                      >
                        {difficulties.map((diff) => (
                          <IonSelectOption key={diff} value={diff}>
                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                  <IonCol size="6">
                    <IonItem>
                      <IonLabel position="stacked">Category</IonLabel>
                      <IonInput
                        value={questionForm.category}
                        onIonInput={(e) =>
                          handleQuestionFormChange("category", e.detail.value!)
                        }
                        placeholder="Question category"
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
              </IonGrid>

              <IonItem>
                <IonLabel position="stacked">Explanation (Optional)</IonLabel>
                <IonTextarea
                  value={questionForm.explanation}
                  onIonInput={(e) =>
                    handleQuestionFormChange("explanation", e.detail.value!)
                  }
                  placeholder="Explain the correct answer"
                  rows={3}
                />
              </IonItem>

              <div className="question-modal-buttons">
                <IonButton
                  expand="block"
                  onClick={saveQuestion}
                  className="save-question-btn"
                >
                  <IonIcon icon={saveOutline} slot="start" />
                  {editingQuestionIndex !== null
                    ? "Update Question"
                    : "Save Question"}
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />

        <IonAlert
          isOpen={showSaveAlert}
          onDidDismiss={() => setShowSaveAlert(false)}
          header="Create Exam"
          message={`Are you sure you want to create this exam with ${questions.length} questions?`}
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
            },
            {
              text: "Create",
              handler: saveExam,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default CreateExam;
