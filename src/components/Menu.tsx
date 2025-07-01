import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
  IonButton,
  IonAvatar,
} from "@ionic/react";

import { useLocation } from "react-router-dom";
import {
  homeOutline,
  homeSharp,
  documentTextOutline,
  documentTextSharp,
  trophyOutline,
  trophySharp,
  personOutline,
  personSharp,
  statsChartOutline,
  statsChartSharp,
  addOutline,
  addSharp,
  logOutOutline,
  schoolOutline,
  peopleOutline,
  peopleSharp,
} from "ionicons/icons";
import { useAuth } from "../contexts/AuthContext";
import "./Menu.css";

interface AppPage {
  url: string;
  iosIcon: string;
  mdIcon: string;
  title: string;
  role?: string[];
}

const Menu: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const appPages: AppPage[] = [
    {
      title: "Dashboard",
      url: "/dashboard",
      iosIcon: homeOutline,
      mdIcon: homeSharp,
    },
    {
      title: "Take Exams",
      url: "/exams",
      iosIcon: documentTextOutline,
      mdIcon: documentTextSharp,
      role: ["student"],
    },
    {
      title: "My Results",
      url: "/results",
      iosIcon: trophyOutline,
      mdIcon: trophySharp,
      role: ["student"],
    },
    {
      title: "Create Exam",
      url: "/create-exam",
      iosIcon: addOutline,
      mdIcon: addSharp,
      role: ["instructor", "admin"],
    },
    {
      title: "Manage Exams",
      url: "/manage-exams",
      iosIcon: documentTextOutline,
      mdIcon: documentTextSharp,
      role: ["instructor", "admin"],
    },
    {
      title: "Analytics",
      url: "/analytics",
      iosIcon: statsChartOutline,
      mdIcon: statsChartSharp,
      role: ["instructor", "admin"],
    },
    {
      title: "User Management",
      url: "/user-management",
      iosIcon: peopleOutline,
      mdIcon: peopleSharp,
      role: ["admin"],
    },
    {
      title: "Profile",
      url: "/profile",
      iosIcon: personOutline,
      mdIcon: personSharp,
    },
  ];

  const filteredPages = appPages.filter(
    (page) => !page.role || page.role.includes(user?.role || ""),
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <IonMenu contentId="main" type="overlay">
      <IonContent>
        <IonList id="main-list">
          <IonListHeader>
            <div className="menu-header">
              <IonIcon icon={schoolOutline} className="app-icon" />
              <span className="app-title">RanExam</span>
            </div>
          </IonListHeader>
          <div className="user-info">
            <IonAvatar className="user-avatar">
              <div className="avatar-placeholder">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </IonAvatar>
            <div className="user-details">
              <IonNote className="user-name">{user?.name}</IonNote>
              <IonNote className="user-role">
                {user?.role?.toUpperCase()}
              </IonNote>
            </div>
          </div>

          {filteredPages.map((appPage, index) => {
            return (
              <IonMenuToggle key={index} autoHide={false}>
                <IonItem
                  className={
                    location.pathname === appPage.url ? "selected" : ""
                  }
                  routerLink={appPage.url}
                  routerDirection="none"
                  lines="none"
                  detail={false}
                >
                  <IonIcon
                    aria-hidden="true"
                    slot="start"
                    ios={appPage.iosIcon}
                    md={appPage.mdIcon}
                  />
                  <IonLabel>{appPage.title}</IonLabel>
                </IonItem>
              </IonMenuToggle>
            );
          })}
        </IonList>

        <div className="menu-footer">
          <IonButton
            expand="block"
            fill="clear"
            onClick={handleLogout}
            className="logout-button"
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Logout
          </IonButton>
        </div>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;
