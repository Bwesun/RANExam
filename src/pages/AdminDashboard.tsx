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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    // Enhanced mock user data with comprehensive information
    const mockUsers: ExtendedUser[] = [
      {
        id: "1",
        name: "John Doe",
        email: "john.doe@example.com",
        role: "student",
        isActive: true,
        department: "Computer Science",
        joinDate: "2023-09-15",
        lastLogin: "2024-01-15T10:30:00Z",
        examsTaken: 8,
        averageScore: 85.5,
        permissions: [],
        phoneNumber: "+1234567890",
        address: "123 Main St, City, State",
        emergencyContact: "Jane Doe - +1234567891",
        lastExamDate: "2024-01-10",
        totalLoginTime: 2400,
        notes: "Excellent performance in programming courses",
      },
      {
        id: "2",
        name: "Jane Smith",
        email: "jane.smith@example.com",
        role: "instructor",
        isActive: true,
        department: "Software Engineering",
        joinDate: "2022-08-20",
        lastLogin: "2024-01-14T15:45:00Z",
        examsTaken: 0,
        averageScore: 0,
        permissions: ["create_exam", "edit_exam", "view_results"],
        phoneNumber: "+1234567892",
        address: "456 Oak Ave, City, State",
        emergencyContact: "John Smith - +1234567893",
        totalLoginTime: 15600,
        notes: "Senior instructor with 5+ years experience",
      },
      {
        id: "3",
        name: "Mike Johnson",
        email: "mike.johnson@example.com",
        role: "student",
        isActive: false,
        department: "Information Technology",
        joinDate: "2023-10-05",
        lastLogin: "2023-12-20T09:15:00Z",
        examsTaken: 3,
        averageScore: 72.3,
        permissions: [],
        phoneNumber: "+1234567894",
        address: "789 Pine St, City, State",
        emergencyContact: "Sarah Johnson - +1234567895",
        lastExamDate: "2023-12-15",
        totalLoginTime: 800,
        notes: "Account suspended due to policy violation",
      },
      {
        id: "4",
        name: "Sarah Wilson",
        email: "sarah.wilson@example.com",
        role: "admin",
        isActive: true,
        department: "Administration",
        joinDate: "2021-03-10",
        lastLogin: "2024-01-15T08:20:00Z",
        examsTaken: 0,
        averageScore: 0,
        permissions: [
          "manage_users",
          "system_settings",
          "export_data",
          "create_exam",
          "edit_exam",
          "delete_exam",
          "view_results",
        ],
        phoneNumber: "+1234567896",
        address: "321 Elm Dr, City, State",
        emergencyContact: "Robert Wilson - +1234567897",
        totalLoginTime: 28800,
        notes: "System administrator and platform manager",
      },
      {
        id: "5",
        name: "David Brown",
        email: "david.brown@example.com",
        role: "instructor",
        isActive: true,
        department: "Database Systems",
        joinDate: "2022-01-15",
        lastLogin: "2024-01-13T14:10:00Z",
        examsTaken: 0,
        averageScore: 0,
        permissions: ["create_exam", "edit_exam", "view_results"],
        phoneNumber: "+1234567898",
        address: "654 Maple Ln, City, State",
        emergencyContact: "Lisa Brown - +1234567899",
        totalLoginTime: 12000,
        notes: "Database specialist and course coordinator",
      },
    ];

    setUsers(mockUsers);
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

  const saveUser = () => {
    if (!validateUser()) return;

    if (editingUser) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUser
            ? {
                ...user,
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
              }
            : user,
        ),
      );
      setToastMessage("User updated successfully");
    } else {
      const newUser: ExtendedUser = {
        ...userForm,
        id: Date.now().toString(),
        joinDate: new Date().toISOString().split("T")[0],
        examsTaken: 0,
        averageScore: 0,
        totalLoginTime: 0,
      };
      setUsers((prev) => [...prev, newUser]);
      setToastMessage("User created successfully");
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

  const deleteUser = () => {
    if (selectedUser) {
      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));
      setToastMessage("User deleted successfully");
      setShowToast(true);
      setSelectedUser(null);
      setShowDeleteAlert(false);
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isActive: !user.isActive } : user,
      ),
    );
    setToastMessage("User status updated");
    setShowToast(true);
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case "activate":
        setUsers((prev) =>
          prev.map((user) =>
            selectedUsers.includes(user.id)
              ? { ...user, isActive: true }
              : user,
          ),
        );
        setToastMessage(`${selectedUsers.length} users activated`);
        break;
      case "deactivate":
        setUsers((prev) =>
          prev.map((user) =>
            selectedUsers.includes(user.id)
              ? { ...user, isActive: false }
              : user,
          ),
        );
        setToastMessage(`${selectedUsers.length} users deactivated`);
        break;
      case "delete":
        setUsers((prev) =>
          prev.filter((user) => !selectedUsers.includes(user.id)),
        );
        setToastMessage(`${selectedUsers.length} users deleted`);
        break;
      case "export":
        exportSelectedUsers();
        break;
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

  const exportSelectedUsers = () => {
    const selectedUserData = users.filter((user) =>
      selectedUsers.includes(user.id),
    );
    // Mock export functionality
    console.log("Exporting users:", selectedUserData);
    setToastMessage("Users exported successfully");
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

  const resetPassword = (userId: string) => {
    // Mock reset password functionality
    setToastMessage("Password reset email sent");
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
                        <h3>{users.length}</h3>
                        <p>Total Users</p>
                        <IonNote color="medium">+12 this month</IonNote>
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
                        <h3>{users.filter((u) => u.isActive).length}</h3>
                        <p>Active Users</p>
                        <IonNote color="success">98% active rate</IonNote>
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
                          {users.filter((u) => u.role === "student").length}
                        </h3>
                        <p>Students</p>
                        <IonNote color="primary">85% pass rate</IonNote>
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
                          {users.filter((u) => u.role === "instructor").length}
                        </h3>
                        <p>Instructors</p>
                        <IonNote color="warning">4.8 avg rating</IonNote>
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
