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
  IonCheckbox,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { schoolOutline, eyeOutline, eyeOffOutline } from "ionicons/icons";
import "./Login.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"danger" | "success">("danger");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const history = useHistory();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setToastMessage("Please fill in all fields");
      setToastColor("danger");
      setShowToast(true);
      return; 
    }

    if (!isValidEmail(email)) {
      setToastMessage("Please enter a valid email address");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    setLoading(true);
    const result = await login(email, password, rememberMe);
    setLoading(false);

    if (result.success) {
      setToastMessage("Login successful!");
      setToastColor("success");
      setShowToast(true);
      setTimeout(() => {
        history.push("/dashboard");
      }, 500);
    } else {
      setToastMessage(result.message || "Login failed");
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <IonPage>
      <IonContent fullscreen className="login-content">
        <div className="login-container">
          <div className="login-header">
            <IonIcon icon={schoolOutline} className="login-icon" />
            <h1>RAN Exam</h1>
            <p>Welcome back! Please sign in to continue.</p>
          </div>

          <IonCard className="login-card">
            <IonCardHeader>
              <IonCardTitle color={"primary"} style={{
                display: 'flex',
                justifyContent: 'center'
              }}>Sign In</IonCardTitle>
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
                    clearInput
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Password</IonLabel>
                  <IonInput
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value!)}
                    placeholder="Enter your password"
                    required
                  />
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                  </IonButton>
                </IonItem>

                <IonItem lines="none">
                  <IonCheckbox
                    checked={rememberMe}
                    onIonChange={(e) => setRememberMe(e.detail.checked)}
                  />
                  <IonLabel className="ion-margin-start">Remember me</IonLabel>
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
                  <p>
                    Demo Accounts (all use password: <strong>password</strong>):
                  </p>
                  <p>👨‍🎓 Student: student@test.com</p>
                  <p>👨‍🏫 Instructor: instructor@test.com</p>
                  <p>👨‍💼 Admin: admin@ranexam.com</p>
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
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
