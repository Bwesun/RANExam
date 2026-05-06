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
  IonInput,
  IonSelect,
  IonSelectOption,
  IonList,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonModal,
  IonToast,
  IonAlert,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonAvatar,
  IonFab,
  IonFabButton,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonBadge,
  IonToggle,
  IonDatetime,
} from "@ionic/react";
import {
  addOutline,
  personOutline,
  pencilOutline,
  trashOutline,
  closeOutline,
  saveOutline,
  eyeOutline,
  lockClosedOutline,
  lockOpenOutline,
  mailOutline,
  schoolOutline,
  shieldCheckmarkOutline,
  statsChartOutline,
  downloadOutline,
  funnelOutline,
} from "ionicons/icons";
import { User } from "../types/exam";
import { usersAPI } from "../services/api";
import "./UserManagement.css";


interface UserForm {
  name: string;
  email: string;
  role: "student" | "instructor" | "admin";
  isActive: boolean;
  department?: string;
  joinDate: string;
  lastLogin?: string;
  permissions: string[];
}

interface UserStats {
  totalExams: number;
  averageScore: number;
  lastActivity: string;
  examsPassed: number;
  examsFailed: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<
    (User & {
      isActive: boolean;
      department?: string;
      joinDate: string;
      lastLogin?: string;
    })[]
  >([]);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "student" | "instructor" | "admin"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  const [loading, setLoading] = useState(false);

  const [userForm, setUserForm] = useState<UserForm>({
    name: "",
    email: "",
    role: "student",
    isActive: true,
    department: "",
    joinDate: new Date().toISOString(),
    permissions: [],
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getUsers({ limit: 100 });
      if (response.success && response.data) {
        const rawData = response.data;
        const userList = Array.isArray(rawData) ? rawData : (rawData.data ?? []);
        const mappedUsers = userList.map((u: any) => ({
          id: u._id || u.id,
          name: u.name,
          email: u.email,
          role: u.role as "student" | "instructor" | "admin",
          isActive: u.isActive,
          department: u.department,
          joinDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
          lastLogin: u.lastLogin,
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      setToastMessage("Failed to load users");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };


  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchText.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserFormChange = (field: keyof UserForm, value: any) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateUser = (): boolean => {
    if (!userForm.name.trim()) {
      setToastMessage("Name is required");
      setShowToast(true);
      return false;
    }

    if (!userForm.email.trim()) {
      setToastMessage("Email is required");
      setShowToast(true);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      setToastMessage("Please enter a valid email address");
      setShowToast(true);
      return false;
    }

    // Check for duplicate email (excluding current user if editing)
    const duplicateUser = users.find(
      (user) =>
        user.email.toLowerCase() === userForm.email.toLowerCase() &&
        user.id !== editingUser,
    );

    if (duplicateUser) {
      setToastMessage("Email already exists");
      setShowToast(true);
      return false;
    }

    return true;
  };

  const saveUser = async () => {
    if (!validateUser()) return;

    try {
      if (editingUser) {
        const response = await usersAPI.updateUser(editingUser, {
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          isActive: userForm.isActive,
          department: userForm.department,
        });
        if (response.success) {
          setToastMessage("User updated successfully");
          await loadUsers();
        } else {
          setToastMessage(response.message || "Failed to update user");
        }
      } else {
        // For new user creation, a password is required
        const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
        const response = await usersAPI.createUser({
          name: userForm.name,
          email: userForm.email,
          password: tempPassword,
          role: userForm.role,
          department: userForm.department,
        });
        if (response.success) {
          setToastMessage("User created successfully (temp password sent via email)");
          await loadUsers();
        } else {
          setToastMessage(response.message || "Failed to create user");
        }
      }
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || error.message || "Operation failed");
    }

    resetForm();
    setShowUserModal(false);
    setShowToast(true);
  };


  const editUser = (user: any) => {
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      department: user.department || "",
      joinDate: user.joinDate,
      permissions: [],
    });
    setEditingUser(user.id);
    setShowUserModal(true);
  };

  const deleteUser = async () => {
    if (selectedUser) {
      try {
        const response = await usersAPI.deleteUser(selectedUser);
        if (response.success) {
          setToastMessage("User deleted successfully");
          await loadUsers();
        } else {
          setToastMessage(response.message || "Failed to delete user");
        }
      } catch (error: any) {
        setToastMessage(error.response?.data?.message || "Failed to delete user");
      }
      setShowToast(true);
      setSelectedUser(null);
      setShowDeleteAlert(false);
    }
  };


  const toggleUserStatus = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    try {
      const response = await usersAPI.updateUser(userId, { isActive: !user.isActive });
      if (response.success) {
        await loadUsers();
        setToastMessage("User status updated");
      } else {
        setToastMessage(response.message || "Failed to update status");
      }
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || "Failed to update status");
    }
    setShowToast(true);
  };


  const viewUserStats = async (userId: string) => {
    try {
      const response = await usersAPI.getUserStats(userId);
      if (response.success && response.data) {
        const data = response.data;
        setUserStats({
          totalExams: data.totalExams || 0,
          averageScore: data.averageScore || 0,
          lastActivity: data.lastExamDate ? new Date(data.lastExamDate).toISOString() : new Date().toISOString(),
          examsPassed: data.examsPassed || 0,
          examsFailed: data.examsFailed || 0,
        });
      } else {
        setUserStats({ totalExams: 0, averageScore: 0, lastActivity: new Date().toISOString(), examsPassed: 0, examsFailed: 0 });
      }
    } catch {
      setUserStats({ totalExams: 0, averageScore: 0, lastActivity: new Date().toISOString(), examsPassed: 0, examsFailed: 0 });
    }
    setSelectedUser(userId);
    setShowStatsModal(true);
  };


  const resetForm = () => {
    setUserForm({
      name: "",
      email: "",
      role: "student",
      isActive: true,
      department: "",
      joinDate: new Date().toISOString(),
      permissions: [],
    });
    setEditingUser(null);
  };

  const exportUsers = async () => {
    try {
      // Export all current users as JSON download
      const data = JSON.stringify(users, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setToastMessage("Users exported successfully");
    } catch {
      setToastMessage("Export failed");
    }
    setShowToast(true);
  };


  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "danger";
      case "instructor":
        return "warning";
      case "student":
        return "primary";
      default:
        return "medium";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return shieldCheckmarkOutline;
      case "instructor":
        return schoolOutline;
      case "student":
        return personOutline;
      default:
        return personOutline;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>User Management</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={exportUsers}>
              <IonIcon icon={downloadOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="user-management-content">
        <div className="user-management-container">
          {/* Summary Cards */}
          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="3">
                <IonCard className="summary-card">
                  <IonCardContent>
                    <div className="summary-content">
                      <IonIcon icon={personOutline} className="summary-icon" />
                      <div>
                        <h3>{users.length}</h3>
                        <p>Total Users</p>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" sizeMd="3">
                <IonCard className="summary-card">
                  <IonCardContent>
                    <div className="summary-content">
                      <IonIcon icon={schoolOutline} className="summary-icon" />
                      <div>
                        <h3>
                          {users.filter((u) => u.role === "student").length}
                        </h3>
                        <p>Students</p>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" sizeMd="3">
                <IonCard className="summary-card">
                  <IonCardContent>
                    <div className="summary-content">
                      <IonIcon icon={schoolOutline} className="summary-icon" />
                      <div>
                        <h3>
                          {users.filter((u) => u.role === "instructor").length}
                        </h3>
                        <p>Instructors</p>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" sizeMd="3">
                <IonCard className="summary-card">
                  <IonCardContent>
                    <div className="summary-content">
                      <IonIcon
                        icon={shieldCheckmarkOutline}
                        className="summary-icon"
                      />
                      <div>
                        <h3>{users.filter((u) => u.isActive).length}</h3>
                        <p>Active Users</p>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Filters */}
          <IonCard>
            <IonCardContent>
              <div className="filters-section">
                <IonSearchbar
                  value={searchText}
                  debounce={300}
                  onIonInput={(e) => setSearchText(e.detail.value!)}
                  placeholder="Search users..."
                />

                <div className="filter-segments">
                  <IonSegment
                    value={roleFilter}
                    onIonChange={(e) => setRoleFilter(e.detail.value as any)}
                  >
                    <IonSegmentButton value="all">
                      <IonLabel>All Roles</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="student">
                      <IonLabel>Students</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="instructor">
                      <IonLabel>Instructors</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="admin">
                      <IonLabel>Admins</IonLabel>
                    </IonSegmentButton>
                  </IonSegment>

                  <IonSegment
                    value={statusFilter}
                    onIonChange={(e) => setStatusFilter(e.detail.value as any)}
                  >
                    <IonSegmentButton value="all">
                      <IonLabel>All Status</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="active">
                      <IonLabel>Active</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="inactive">
                      <IonLabel>Inactive</IonLabel>
                    </IonSegmentButton>
                  </IonSegment>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Users List */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Users ({filteredUsers.length})</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                {filteredUsers.map((user) => (
                  <IonItemSliding key={user.id}>
                    <IonItem className="user-item">
                      <IonAvatar slot="start" className="user-avatar">
                        <div className="avatar-placeholder">
                          {getUserInitials(user.name)}
                        </div>
                      </IonAvatar>

                      <IonLabel>
                        <div className="user-info">
                          <div className="user-main">
                            <h3>{user.name}</h3>
                            <div className="user-badges">
                              <IonChip color={getRoleColor(user.role)} outline>
                                <IonIcon icon={getRoleIcon(user.role)} />
                                <IonLabel>{user.role}</IonLabel>
                              </IonChip>
                              <IonBadge
                                color={user.isActive ? "success" : "danger"}
                              >
                                {user.isActive ? "Active" : "Inactive"}
                              </IonBadge>
                            </div>
                          </div>
                          <div className="user-details">
                            <p>
                              <IonIcon icon={mailOutline} /> {user.email}
                            </p>
                            {user.department && (
                              <p>
                                <IonIcon icon={schoolOutline} />{" "}
                                {user.department}
                              </p>
                            )}
                            <p>Joined: {formatDate(user.joinDate)}</p>
                            {user.lastLogin && (
                              <p>
                                Last login: {formatDateTime(user.lastLogin)}
                              </p>
                            )}
                          </div>
                        </div>
                      </IonLabel>

                      <div className="user-actions">
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => viewUserStats(user.id)}
                        >
                          <IonIcon icon={statsChartOutline} />
                        </IonButton>
                        <IonToggle
                          checked={user.isActive}
                          onIonChange={() => toggleUserStatus(user.id)}
                        />
                      </div>
                    </IonItem>

                    <IonItemOptions slot="end">
                      <IonItemOption
                        color="primary"
                        onClick={() => editUser(user)}
                      >
                        <IonIcon icon={pencilOutline} />
                      </IonItemOption>
                      <IonItemOption
                        color="danger"
                        onClick={() => {
                          setSelectedUser(user.id);
                          setShowDeleteAlert(true);
                        }}
                      >
                        <IonIcon icon={trashOutline} />
                      </IonItemOption>
                    </IonItemOptions>
                  </IonItemSliding>
                ))}
              </IonList>

              {filteredUsers.length === 0 && (
                <div className="no-users">
                  <IonIcon icon={personOutline} className="no-users-icon" />
                  <h3>No users found</h3>
                  <p>Try adjusting your search or filters.</p>
                </div>
              )}
            </IonCardContent>
          </IonCard>

          {/* Floating Action Button */}
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton
              onClick={() => {
                resetForm();
                setShowUserModal(true);
              }}
            >
              <IonIcon icon={addOutline} />
            </IonFabButton>
          </IonFab>
        </div>

        {/* User Modal */}
        <IonModal
          isOpen={showUserModal}
          onDidDismiss={() => setShowUserModal(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingUser ? "Edit User" : "Add New User"}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowUserModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="user-modal-content">
            <div className="user-form">
              <IonList>
                <IonItem>
                  <IonLabel position="stacked">Full Name *</IonLabel>
                  <IonInput
                    value={userForm.name}
                    onIonInput={(e) =>
                      handleUserFormChange("name", e.detail.value!)
                    }
                    placeholder="Enter full name"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Email Address *</IonLabel>
                  <IonInput
                    type="email"
                    value={userForm.email}
                    onIonInput={(e) =>
                      handleUserFormChange("email", e.detail.value!)
                    }
                    placeholder="Enter email address"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Role *</IonLabel>
                  <IonSelect
                    value={userForm.role}
                    onIonChange={(e) =>
                      handleUserFormChange("role", e.detail.value)
                    }
                  >
                    <IonSelectOption value="student">Student</IonSelectOption>
                    <IonSelectOption value="instructor">
                      Instructor
                    </IonSelectOption>
                    <IonSelectOption value="admin">Admin</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Department</IonLabel>
                  <IonInput
                    value={userForm.department}
                    onIonInput={(e) =>
                      handleUserFormChange("department", e.detail.value!)
                    }
                    placeholder="Enter department"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel>Active Status</IonLabel>
                  <IonToggle
                    checked={userForm.isActive}
                    onIonChange={(e) =>
                      handleUserFormChange("isActive", e.detail.checked)
                    }
                  />
                </IonItem>
              </IonList>

              <div className="form-buttons">
                <IonButton
                  expand="block"
                  onClick={saveUser}
                  className="save-user-btn"
                >
                  <IonIcon icon={saveOutline} slot="start" />
                  {editingUser ? "Update User" : "Create User"}
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* User Stats Modal */}
        <IonModal
          isOpen={showStatsModal}
          onDidDismiss={() => setShowStatsModal(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>User Statistics</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowStatsModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {userStats && (
              <div className="stats-content">
                <IonGrid>
                  <IonRow>
                    <IonCol size="6">
                      <IonCard className="stat-card">
                        <IonCardContent>
                          <div className="stat-item">
                            <h3>{userStats.totalExams}</h3>
                            <p>Total Exams</p>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                    <IonCol size="6">
                      <IonCard className="stat-card">
                        <IonCardContent>
                          <div className="stat-item">
                            <h3>{userStats.averageScore}%</h3>
                            <p>Average Score</p>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                    <IonCol size="6">
                      <IonCard className="stat-card">
                        <IonCardContent>
                          <div className="stat-item">
                            <h3>{userStats.examsPassed}</h3>
                            <p>Exams Passed</p>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                    <IonCol size="6">
                      <IonCard className="stat-card">
                        <IonCardContent>
                          <div className="stat-item">
                            <h3>{userStats.examsFailed}</h3>
                            <p>Exams Failed</p>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  </IonRow>
                </IonGrid>

                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Activity</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p>
                      Last Activity: {formatDateTime(userStats.lastActivity)}
                    </p>
                  </IonCardContent>
                </IonCard>
              </div>
            )}
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete User"
          message="Are you sure you want to delete this user? This action cannot be undone."
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
            },
            {
              text: "Delete",
              handler: deleteUser,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default UserManagement;
