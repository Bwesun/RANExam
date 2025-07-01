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
import { schoolOutline, eyeOutline, eyeOffOutline } from "ionicons/icons";
import "./Login.css";

const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<"student" | "instructor">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"danger" | "success">("danger");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const history = useHistory();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setToastMessage("Please fill in all required fields");
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

    if (password !== confirmPassword) {
      setToastMessage("Passwords do not match");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    if (password.length < 6) {
      setToastMessage("Password must be at least 6 characters");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    if (name.length < 2) {
      setToastMessage("Name must be at least 2 characters");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    setLoading(true);
    const result = await register(
      email,
      password,
      name,
      role,
      department,
      phoneNumber,
    );
    setLoading(false);

    if (result.success) {
      setToastMessage(
        "Registration successful! Please check your email for verification.",
      );
      setToastColor("success");
      setShowToast(true);
      setTimeout(() => {
        history.push("/dashboard");
      }, 1500);
    } else {
      setToastMessage(result.message || "Registration failed");
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
                  <IonLabel position="stacked">Full Name *</IonLabel>
                  <IonInput
                    type="text"
                    value={name}
                    onIonInput={(e) => setName(e.detail.value!)}
                    placeholder="Enter your full name"
                    required
                    clearInput
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Email *</IonLabel>
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
                  <IonLabel position="stacked">Role *</IonLabel>
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
                  <IonLabel position="stacked">Department</IonLabel>
                  <IonInput
                    type="text"
                    value={department}
                    onIonInput={(e) => setDepartment(e.detail.value!)}
                    placeholder="Enter your department (optional)"
                    clearInput
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Phone Number</IonLabel>
                  <IonInput
                    type="tel"
                    value={phoneNumber}
                    onIonInput={(e) => setPhoneNumber(e.detail.value!)}
                    placeholder="Enter your phone number (optional)"
                    clearInput
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Password *</IonLabel>
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

                <IonItem>
                  <IonLabel position="stacked">Confirm Password *</IonLabel>
                  <IonInput
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                    placeholder="Confirm your password"
                    required
                  />
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <IonIcon
                      icon={showConfirmPassword ? eyeOffOutline : eyeOutline}
                    />
                  </IonButton>
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
