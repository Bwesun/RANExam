import {
  IonApp,
  IonRouterOutlet,
  IonSplitPane,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Menu from "./components/Menu";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ExamList from "./pages/ExamList";
import TakeExam from "./pages/TakeExam";
import ExamResult from "./pages/ExamResult";
import CreateExam from "./pages/CreateExam";
import UserManagement from "./pages/UserManagement";
import AdminDashboard from "./pages/AdminDashboard";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import "@ionic/react/css/palettes/dark.system.css";

/* Theme variables */
import "./theme/variables.css";

setupIonicReact();

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <IonApp>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          Loading...
        </div>
      </IonApp>
    );
  }

  if (!isAuthenticated) {
    return (
      <IonApp>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route path="/login" component={Login} exact />
            <Route path="/register" component={Register} exact />
            <Route path="/" exact>
              <Redirect to="/login" />
            </Route>
            <Redirect to="/login" />
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonSplitPane contentId="main">
          <Menu />
          <IonRouterOutlet id="main">
            <Route path="/dashboard" component={Dashboard} exact />
            <Route path="/exams" component={ExamList} exact />
            <Route path="/exam/:examId" component={TakeExam} exact />
            <Route path="/result/:examId" component={ExamResult} exact />
            <Route path="/create-exam" component={CreateExam} exact />
            <Route path="/user-management" component={UserManagement} exact />
            <Route path="/admin-dashboard" component={AdminDashboard} exact />
            <Route path="/" exact>
              <Redirect to="/dashboard" />
            </Route>
            <Redirect to="/dashboard" />
          </IonRouterOutlet>
        </IonSplitPane>
      </IonReactRouter>
    </IonApp>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
