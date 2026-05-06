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
  IonPopover,
  IonCheckbox,
  IonTextarea,
  IonNote,
  IonProgressBar,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonActionSheet,
  IonSpinner,
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
  refreshOutline,
  settingsOutline,
  warningOutline,
  checkmarkOutline,
  timeOutline,
  documentTextOutline,
  cloudUploadOutline,
  printOutline,
  shareOutline,
  keyOutline,
  ellipsisVerticalOutline,
  sendOutline,
  archiveOutline,
  flagOutline,
  starOutline,
  heartOutline,
  chatbubbleOutline,
  notificationsOutline,
  calendarOutline,
  locationOutline,
  phonePortraitOutline,
} from "ionicons/icons";
import { User } from "../types/exam";
import { usersAPI, adminAPI } from "../services/api";
import "./AdminDashboard.css";


interface ExtendedUser extends User {
  isActive: boolean;
  department?: string;
  joinDate: string;
  lastLogin?: string;
  examsTaken: number;
  averageScore: number;
  permissions: string[];
  notes?: string;
  phoneNumber?: string;
  address?: string;
  emergencyContact?: string;
  lastExamDate?: string;
  totalLoginTime?: number;
  profileImage?: string;
}

interface UserForm extends ExtendedUser {
  password?: string;
  confirmPassword?: string;
}

interface BulkAction {
  action: string;
  userIds: string[];
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "student" | "instructor" | "admin"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBulkModal, setBulkShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [sortBy, setSortBy] = useState<
    "name" | "joinDate" | "lastLogin" | "examsTaken"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [userForm, setUserForm] = useState<UserForm>({
    id: "",
    name: "",
    email: "",
    role: "student",
    isActive: true,
    department: "",
    joinDate: new Date().toISOString().split("T")[0],
    examsTaken: 0,
    averageScore: 0,
    permissions: [],
    phoneNumber: "",
    address: "",
    emergencyContact: "",
  });

  const departments = [
    "Computer Science",
    "Software Engineering",
    "Information Technology",
    "Database Systems",
    "Cybersecurity",
    "Data Science",
    "Web Development",
    "Mobile Development",
  ];
  const availablePermissions = [
    "create_exam",
    "edit_exam",
    "delete_exam",
    "view_results",
    "manage_users",
    "export_data",
    "system_settings",
  ];

  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      if (response.success && response.data) {
        setDashboardStats(response.data.overview || response.data);
      }
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getUsers({ limit: 100 });
      if (response.success && response.data) {
        const rawData = response.data;
        const userList = Array.isArray(rawData) ? rawData : (rawData.data ?? []);
        // Map backend _id to id for consistency
        const mappedUsers: ExtendedUser[] = userList.map((u: any) => ({
          id: u._id || u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          department: u.department,
          joinDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
          lastLogin: u.lastLogin,
          examsTaken: u.examStats?.totalExams || 0,
          averageScore: u.examStats?.averageScore || 0,
          permissions: u.permissions || [],
          phoneNumber: u.phoneNumber,
          address: u.address,
          emergencyContact: u.emergencyContact,
          profileImage: u.profileImage,
          notes: u.notes,
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


  const filteredAndSortedUsers = users
    .filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.phoneNumber?.includes(searchText);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);
      const matchesDepartment =
        departmentFilter === "all" || user.department === departmentFilter;

      return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "joinDate":
          aValue = new Date(a.joinDate).getTime();
          bValue = new Date(b.joinDate).getTime();
          break;
        case "lastLogin":
          aValue = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
          bValue = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
          break;
        case "examsTaken":
          aValue = a.examsTaken;
          bValue = b.examsTaken;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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

    if (!editingUser && userForm.password && userForm.password.length < 6) {
      setToastMessage("Password must be at least 6 characters");
      setShowToast(true);
      return false;
    }

    if (!editingUser && userForm.password !== userForm.confirmPassword) {
      setToastMessage("Passwords do not match");
      setShowToast(true);
      return false;
    }

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
        // Update existing user via API
        const updateData: any = {
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          isActive: userForm.isActive,
          department: userForm.department,
          phoneNumber: userForm.phoneNumber,
          address: userForm.address,
          emergencyContact: userForm.emergencyContact,
          permissions: userForm.permissions,
          notes: userForm.notes,
        };
        const response = await usersAPI.updateUser(editingUser, updateData);
        if (response.success) {
          setToastMessage("User updated successfully");
          await loadUsers();
        } else {
          setToastMessage(response.message || "Failed to update user");
        }
      } else {
        // Create new user via API
        if (!userForm.password) {
          setToastMessage("Password is required for new users");
          setShowToast(true);
          return;
        }
        const response = await usersAPI.createUser({
          name: userForm.name,
          email: userForm.email,
          password: userForm.password,
          role: userForm.role,
          department: userForm.department,
          phoneNumber: userForm.phoneNumber,
          address: userForm.address,
          emergencyContact: userForm.emergencyContact,
          permissions: userForm.permissions,
          notes: userForm.notes,
        });
        if (response.success) {
          setToastMessage("User created successfully");
          await loadUsers();
        } else {
          setToastMessage(response.message || "Failed to create user");
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Operation failed";
      setToastMessage(message);
    }

    resetForm();
    setShowUserModal(false);
    setShowToast(true);
  };


  const editUser = (user: ExtendedUser) => {
    setUserForm({
      ...user,
      password: "",
      confirmPassword: "",
    });
    setEditingUser(user.id);
    setShowUserModal(true);
  };

  const deleteUser = async () => {
    if (selectedUser) {
      try {
        const response = await usersAPI.deleteUser(selectedUser.id);
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


  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    try {
      if (action === "export") {
        exportSelectedUsers();
        return;
      }

      if (action === "activate" || action === "deactivate" || action === "delete") {
        const apiAction = action as "activate" | "deactivate" | "delete";
        const response = await usersAPI.bulkUserAction(apiAction, selectedUsers);
        if (response.success) {
          setToastMessage(`${selectedUsers.length} users ${action}d successfully`);
          await loadUsers();
        } else {
          setToastMessage(response.message || `Failed to ${action} users`);
        }
      }
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || `Failed to perform ${action}`);
    }

    setSelectedUsers([]);
    setIsSelectionMode(false);
    setShowToast(true);
  };


  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map((user) => user.id));
    }
  };

  const exportSelectedUsers = async () => {
    try {
      const blob = await adminAPI.exportData("users");
      // Trigger download
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


  const resetForm = () => {
    setUserForm({
      id: "",
      name: "",
      email: "",
      role: "student",
      isActive: true,
      department: "",
      joinDate: new Date().toISOString().split("T")[0],
      examsTaken: 0,
      averageScore: 0,
      permissions: [],
      phoneNumber: "",
      address: "",
      emergencyContact: "",
      password: "",
      confirmPassword: "",
    });
    setEditingUser(null);
  };

  const resetPassword = async (userId: string) => {
    try {
      const response = await usersAPI.resetUserPassword(userId);
      setToastMessage(response.success ? "Password reset email sent" : (response.message || "Failed to reset password"));
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || "Failed to reset password");
    }
    setShowToast(true);
  };


  const sendNotification = (userId: string) => {
    // Mock notification functionality
    setToastMessage("Notification sent to user");
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

  const getTotalPages = () => {
    return Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Admin Dashboard - User Management</IonTitle>
          <IonButtons slot="end">
            {isSelectionMode && (
              <IonButton onClick={() => setShowActionSheet(true)}>
                <IonIcon icon={ellipsisVerticalOutline} />
              </IonButton>
            )}
            <IonButton onClick={() => setShowImportModal(true)}>
              <IonIcon icon={cloudUploadOutline} />
            </IonButton>
            <IonButton
              onClick={() => {
                resetForm();
                setShowUserModal(true);
              }}
            >
              <IonIcon icon={addOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="admin-dashboard-content">
        <IonRefresher
          slot="fixed"
          onIonRefresh={(e) => {
            loadUsers();
            e.detail.complete();
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        <div className="admin-dashboard-container">
          {/* Enhanced Summary Cards */}
          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="3">
                <IonCard className="summary-card total-users">
                  <IonCardContent>
                    <div className="summary-content">
                      <IonIcon icon={personOutline} className="summary-icon" />
                      <div className="summary-text">
                        <h3>{dashboardStats?.totalUsers ?? users.length}</h3>
                        <p>Total Users</p>
                        <IonNote color="medium">{dashboardStats?.totalExams ?? 0} exams total</IonNote>

                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" sizeMd="3">
                <IonCard className="summary-card active-users">
                  <IonCardContent>
                    <div className="summary-content">
                      <IonIcon
                        icon={checkmarkOutline}
                        className="summary-icon"
                      />
                      <div className="summary-text">
                        <h3>{dashboardStats?.activeUsers ?? users.filter((u) => u.isActive).length}</h3>
                        <p>Active Users</p>
                        <IonNote color="success">{dashboardStats?.completedAttempts ?? 0} attempts done</IonNote>

                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" sizeMd="3">
                <IonCard className="summary-card students">
                  <IonCardContent>
                    <div className="summary-content">
                      <IonIcon icon={schoolOutline} className="summary-icon" />
                      <div className="summary-text">
                        <h3>
                          {dashboardStats?.totalStudents ?? users.filter((u) => u.role === "student").length}
                        </h3>
                        <p>Students</p>
                        <IonNote color="primary">{dashboardStats?.passRate ? `${dashboardStats.passRate}% pass rate` : '—'}</IonNote>

                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" sizeMd="3">
                <IonCard className="summary-card instructors">
                  <IonCardContent>
                    <div className="summary-content">
                      <IonIcon
                        icon={shieldCheckmarkOutline}
                        className="summary-icon"
                      />
                      <div className="summary-text">
                        <h3>
                          {dashboardStats?.totalInstructors ?? users.filter((u) => u.role === "instructor").length}
                        </h3>
                        <p>Instructors</p>
                        <IonNote color="warning">{dashboardStats?.totalAdmins ?? users.filter((u) => u.role === "admin").length} admins</IonNote>

                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Advanced Filters and Controls */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <div className="filters-header">
                  User Management Controls
                  <div className="control-buttons">
                    <IonButton
                      size="small"
                      fill="outline"
                      onClick={() => setIsSelectionMode(!isSelectionMode)}
                    >
                      {isSelectionMode ? "Cancel Selection" : "Select Multiple"}
                    </IonButton>
                    {isSelectionMode && selectedUsers.length > 0 && (
                      <IonBadge color="primary">
                        {selectedUsers.length} selected
                      </IonBadge>
                    )}
                  </div>
                </div>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="advanced-filters">
                <IonSearchbar
                  value={searchText}
                  debounce={300}
                  onIonInput={(e) => setSearchText(e.detail.value!)}
                  placeholder="Search by name, email, phone, or department..."
                />

                <IonGrid>
                  <IonRow>
                    <IonCol size="12" sizeMd="3">
                      <IonItem>
                        <IonLabel position="stacked">Role Filter</IonLabel>
                        <IonSelect
                          value={roleFilter}
                          onIonChange={(e) => setRoleFilter(e.detail.value)}
                        >
                          <IonSelectOption value="all">
                            All Roles
                          </IonSelectOption>
                          <IonSelectOption value="student">
                            Students
                          </IonSelectOption>
                          <IonSelectOption value="instructor">
                            Instructors
                          </IonSelectOption>
                          <IonSelectOption value="admin">
                            Admins
                          </IonSelectOption>
                        </IonSelect>
                      </IonItem>
                    </IonCol>
                    <IonCol size="12" sizeMd="3">
                      <IonItem>
                        <IonLabel position="stacked">Status Filter</IonLabel>
                        <IonSelect
                          value={statusFilter}
                          onIonChange={(e) => setStatusFilter(e.detail.value)}
                        >
                          <IonSelectOption value="all">
                            All Status
                          </IonSelectOption>
                          <IonSelectOption value="active">
                            Active
                          </IonSelectOption>
                          <IonSelectOption value="inactive">
                            Inactive
                          </IonSelectOption>
                        </IonSelect>
                      </IonItem>
                    </IonCol>
                    <IonCol size="12" sizeMd="3">
                      <IonItem>
                        <IonLabel position="stacked">Department</IonLabel>
                        <IonSelect
                          value={departmentFilter}
                          onIonChange={(e) =>
                            setDepartmentFilter(e.detail.value)
                          }
                        >
                          <IonSelectOption value="all">
                            All Departments
                          </IonSelectOption>
                          {departments.map((dept) => (
                            <IonSelectOption key={dept} value={dept}>
                              {dept}
                            </IonSelectOption>
                          ))}
                        </IonSelect>
                      </IonItem>
                    </IonCol>
                    <IonCol size="12" sizeMd="3">
                      <IonItem>
                        <IonLabel position="stacked">Sort By</IonLabel>
                        <IonSelect
                          value={sortBy}
                          onIonChange={(e) => setSortBy(e.detail.value)}
                        >
                          <IonSelectOption value="name">Name</IonSelectOption>
                          <IonSelectOption value="joinDate">
                            Join Date
                          </IonSelectOption>
                          <IonSelectOption value="lastLogin">
                            Last Login
                          </IonSelectOption>
                          <IonSelectOption value="examsTaken">
                            Exams Taken
                          </IonSelectOption>
                        </IonSelect>
                      </IonItem>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Enhanced Users List */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <div className="users-list-header">
                  Users ({filteredAndSortedUsers.length})
                  {isSelectionMode && (
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={selectAllUsers}
                    >
                      {selectedUsers.length === paginatedUsers.length
                        ? "Deselect All"
                        : "Select All"}
                    </IonButton>
                  )}
                </div>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                {paginatedUsers.map((user) => (
                  <IonItemSliding key={user.id}>
                    <IonItem className="enhanced-user-item">
                      {isSelectionMode && (
                        <IonCheckbox
                          slot="start"
                          checked={selectedUsers.includes(user.id)}
                          onIonChange={() => toggleUserSelection(user.id)}
                        />
                      )}

                      <IonAvatar slot="start" className="user-avatar">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={user.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {getUserInitials(user.name)}
                          </div>
                        )}
                      </IonAvatar>

                      <IonLabel>
                        <div className="enhanced-user-info">
                          <div className="user-main-info">
                            <div className="user-name-section">
                              <h3>{user.name}</h3>
                              <div className="user-badges">
                                <IonChip
                                  color={getRoleColor(user.role)}
                                  outline
                                >
                                  <IonIcon icon={getRoleIcon(user.role)} />
                                  <IonLabel>{user.role}</IonLabel>
                                </IonChip>
                                <IonBadge
                                  color={user.isActive ? "success" : "danger"}
                                >
                                  {user.isActive ? "Active" : "Inactive"}
                                </IonBadge>
                                {user.permissions.length > 0 && (
                                  <IonBadge color="tertiary">
                                    {user.permissions.length} permissions
                                  </IonBadge>
                                )}
                              </div>
                            </div>

                            <div className="user-contact-info">
                              <div className="contact-item">
                                <IonIcon icon={mailOutline} />
                                <span>{user.email}</span>
                              </div>
                              {user.phoneNumber && (
                                <div className="contact-item">
                                  <IonIcon icon={phonePortraitOutline} />
                                  <span>{user.phoneNumber}</span>
                                </div>
                              )}
                              {user.department && (
                                <div className="contact-item">
                                  <IonIcon icon={schoolOutline} />
                                  <span>{user.department}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="user-stats-section">
                            <div className="stat-item">
                              <span className="stat-label">Joined:</span>
                              <span className="stat-value">
                                {formatDate(user.joinDate)}
                              </span>
                            </div>
                            {user.lastLogin && (
                              <div className="stat-item">
                                <span className="stat-label">Last Login:</span>
                                <span className="stat-value">
                                  {formatDateTime(user.lastLogin)}
                                </span>
                              </div>
                            )}
                            {user.role === "student" && (
                              <>
                                <div className="stat-item">
                                  <span className="stat-label">
                                    Exams Taken:
                                  </span>
                                  <span className="stat-value">
                                    {user.examsTaken}
                                  </span>
                                </div>
                                <div className="stat-item">
                                  <span className="stat-label">Avg Score:</span>
                                  <span className="stat-value">
                                    {user.averageScore}%
                                  </span>
                                </div>
                              </>
                            )}
                            {user.notes && (
                              <div className="user-notes">
                                <IonNote color="medium">{user.notes}</IonNote>
                              </div>
                            )}
                          </div>
                        </div>
                      </IonLabel>

                      <div className="user-quick-actions">
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => sendNotification(user.id)}
                        >
                          <IonIcon icon={sendOutline} />
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => resetPassword(user.id)}
                        >
                          <IonIcon icon={keyOutline} />
                        </IonButton>
                        <IonToggle
                          checked={user.isActive}
                          onIonChange={() => toggleUserStatus(user.id)}
                        />
                      </div>
                    </IonItem>

                    <IonItemOptions slot="end">
                      <IonItemOption
                        color="tertiary"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPermissionsModal(true);
                        }}
                      >
                        <IonIcon icon={settingsOutline} />
                      </IonItemOption>
                      <IonItemOption
                        color="primary"
                        onClick={() => editUser(user)}
                      >
                        <IonIcon icon={pencilOutline} />
                      </IonItemOption>
                      <IonItemOption
                        color="danger"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteAlert(true);
                        }}
                      >
                        <IonIcon icon={trashOutline} />
                      </IonItemOption>
                    </IonItemOptions>
                  </IonItemSliding>
                ))}
              </IonList>

              {/* Pagination */}
              {getTotalPages() > 1 && (
                <div className="pagination-container">
                  <IonButton
                    fill="clear"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </IonButton>

                  <span className="pagination-info">
                    Page {currentPage} of {getTotalPages()}
                  </span>

                  <IonButton
                    fill="clear"
                    disabled={currentPage === getTotalPages()}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </IonButton>
                </div>
              )}

              {filteredAndSortedUsers.length === 0 && (
                <div className="no-users">
                  <IonIcon icon={personOutline} className="no-users-icon" />
                  <h3>No users found</h3>
                  <p>Try adjusting your search or filters.</p>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>

        {/* Enhanced User Modal with all fields */}
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
            <div className="enhanced-user-form">
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

                {!editingUser && (
                  <>
                    <IonItem>
                      <IonLabel position="stacked">Password *</IonLabel>
                      <IonInput
                        type="password"
                        value={userForm.password}
                        onIonInput={(e) =>
                          handleUserFormChange("password", e.detail.value!)
                        }
                        placeholder="Enter password"
                      />
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">Confirm Password *</IonLabel>
                      <IonInput
                        type="password"
                        value={userForm.confirmPassword}
                        onIonInput={(e) =>
                          handleUserFormChange(
                            "confirmPassword",
                            e.detail.value!,
                          )
                        }
                        placeholder="Confirm password"
                      />
                    </IonItem>
                  </>
                )}

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
                  <IonSelect
                    value={userForm.department}
                    onIonChange={(e) =>
                      handleUserFormChange("department", e.detail.value)
                    }
                  >
                    {departments.map((dept) => (
                      <IonSelectOption key={dept} value={dept}>
                        {dept}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Phone Number</IonLabel>
                  <IonInput
                    value={userForm.phoneNumber}
                    onIonInput={(e) =>
                      handleUserFormChange("phoneNumber", e.detail.value!)
                    }
                    placeholder="Enter phone number"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Address</IonLabel>
                  <IonTextarea
                    value={userForm.address}
                    onIonInput={(e) =>
                      handleUserFormChange("address", e.detail.value!)
                    }
                    placeholder="Enter address"
                    rows={2}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Emergency Contact</IonLabel>
                  <IonInput
                    value={userForm.emergencyContact}
                    onIonInput={(e) =>
                      handleUserFormChange("emergencyContact", e.detail.value!)
                    }
                    placeholder="Name - Phone Number"
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Notes</IonLabel>
                  <IonTextarea
                    value={userForm.notes}
                    onIonInput={(e) =>
                      handleUserFormChange("notes", e.detail.value!)
                    }
                    placeholder="Additional notes about the user"
                    rows={3}
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

        {/* Permissions Modal */}
        <IonModal
          isOpen={showPermissionsModal}
          onDidDismiss={() => setShowPermissionsModal(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>User Permissions</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowPermissionsModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedUser && (
              <div className="permissions-content">
                <div className="user-summary">
                  <h3>{selectedUser.name}</h3>
                  <p>
                    {selectedUser.email} - {selectedUser.role}
                  </p>
                </div>

                <IonList>
                  {availablePermissions.map((permission) => (
                    <IonItem key={permission}>
                      <IonLabel>
                        <h3>{permission.replace("_", " ").toUpperCase()}</h3>
                        <p>Allow user to {permission.replace("_", " ")}</p>
                      </IonLabel>
                      <IonCheckbox
                        checked={selectedUser.permissions.includes(permission)}
                        onIonChange={(e) => {
                          const updatedPermissions = e.detail.checked
                            ? [...selectedUser.permissions, permission]
                            : selectedUser.permissions.filter(
                                (p) => p !== permission,
                              );

                          setUsers((prev) =>
                            prev.map((user) =>
                              user.id === selectedUser.id
                                ? { ...user, permissions: updatedPermissions }
                                : user,
                            ),
                          );

                          setSelectedUser((prev) =>
                            prev
                              ? { ...prev, permissions: updatedPermissions }
                              : null,
                          );
                        }}
                      />
                    </IonItem>
                  ))}
                </IonList>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Action Sheet for Bulk Actions */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header="Bulk Actions"
          buttons={[
            {
              text: "Activate Selected",
              icon: checkmarkOutline,
              handler: () => handleBulkAction("activate"),
            },
            {
              text: "Deactivate Selected",
              icon: lockClosedOutline,
              handler: () => handleBulkAction("deactivate"),
            },
            {
              text: "Export Selected",
              icon: downloadOutline,
              handler: () => handleBulkAction("export"),
            },
            {
              text: "Delete Selected",
              icon: trashOutline,
              role: "destructive",
              handler: () => handleBulkAction("delete"),
            },
            {
              text: "Cancel",
              role: "cancel",
            },
          ]}
        />

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
          message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
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

export default AdminDashboard;
