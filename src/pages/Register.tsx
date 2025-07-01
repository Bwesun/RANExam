import React, { useState } from "react";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar,
  IonToast,
  IonText,
  IonIcon,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { schoolOutline } from "ionicons/icons";
import "./Login.css";

const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"student" | "instructor">("student");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const history = useHistory();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setToastMessage("Please fill in all fields");
      setShowToast(true);
      return;
    }

    if (password !== confirmPassword) {
      setToastMessage("Passwords do not match");
      setShowToast(true);
      return;
    }

    if (password.length < 6) {
      setToastMessage("Password must be at least 6 characters");
      setShowToast(true);
      return;
    }

    setLoading(true);
    const success = await register(email, password, name, role);
    setLoading(false);

    if (success) {
      history.push("/dashboard");
    } else {
      setToastMessage("Registration failed");
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>RanExam - Register</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="login-content">
        <div className="login-container">
          <div className="login-header">
            <IonIcon icon={schoolOutline} className="login-icon" />
            <h1>RanExam</h1>
            <p>Create your account to get started.</p>
          </div>

          <IonCard className="login-card">
            <IonCardHeader>
              <IonCardTitle>Sign Up</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <form onSubmit={handleRegister}>
                <IonItem>
                  <IonLabel position="stacked">Full Name</IonLabel>
                  <IonInput
                    type="text"
                    value={name}
                    onIonInput={(e) => setName(e.detail.value!)}
                    placeholder="Enter your full name"
                    required
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Email</IonLabel>
                  <IonInput
                    type="email"
                    value={email}
                    onIonInput={(e) => setEmail(e.detail.value!)}
                    placeholder="Enter your email"
                    required
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Role</IonLabel>
                  <IonSelect
                    value={role}
                    onIonChange={(e) => setRole(e.detail.value)}
                    placeholder="Select your role"
                  >
                    <IonSelectOption value="student">Student</IonSelectOption>
                    <IonSelectOption value="instructor">
                      Instructor
                    </IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Password</IonLabel>
                  <IonInput
                    type="password"
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value!)}
                    placeholder="Enter your password"
                    required
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Confirm Password</IonLabel>
                  <IonInput
                    type="password"
                    value={confirmPassword}
                    onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                    placeholder="Confirm your password"
                    required
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Sign Up"}
                </IonButton>
              </form>

              <div className="login-footer">
                <IonText>
                  Already have an account? <a href="/login">Sign in here</a>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

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

export default Register;
