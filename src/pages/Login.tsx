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
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { schoolOutline } from "ionicons/icons";
import "./Login.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const history = useHistory();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setToastMessage("Please fill in all fields");
      setShowToast(true);
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (success) {
      history.push("/dashboard");
    } else {
      setToastMessage("Invalid credentials");
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>RanExam - Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="login-content">
        <div className="login-container">
          <div className="login-header">
            <IonIcon icon={schoolOutline} className="login-icon" />
            <h1>RanExam</h1>
            <p>Welcome back! Please sign in to continue.</p>
          </div>

          <IonCard className="login-card">
            <IonCardHeader>
              <IonCardTitle>Sign In</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <form onSubmit={handleLogin}>
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
                  <IonLabel position="stacked">Password</IonLabel>
                  <IonInput
                    type="password"
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value!)}
                    placeholder="Enter your password"
                    required
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </IonButton>
              </form>

              <div className="login-footer">
                <IonText>
                  Don't have an account? <a href="/register">Sign up here</a>
                </IonText>
              </div>

              <div className="demo-accounts">
                <IonText color="medium">
                  <p>Demo Accounts:</p>
                  <p>Student: student@test.com / password</p>
                  <p>Instructor: instructor@test.com / password</p>
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

export default Login;
