import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/auth/Login";
import { Signup } from "./pages/auth/Signup";
import { PatientDashboard } from "./pages/patient/Dashboard";
import { ProviderDashboard } from "./pages/provider/Dashboard";
import { AdminDashboard } from "./pages/admin/Dashboard";

import { Layout } from "./components/Layout";  // Navbar Layout

import { Goals } from "./pages/patient/Goals";
import { Appointments } from "./pages/patient/Appointments";
import { Prescriptions } from "./pages/patient/Prescriptions";
import { Assistant } from "./pages/patient/Assistant";
import { Settings } from "./pages/patient/Settings";

import { Appointments as ProviderAppointments } from "./pages/provider/Appointments";
import { Prescriptions as ProviderPrescriptions } from "./pages/provider/Prescriptions";
import { Settings as ProviderSettings } from "./pages/provider/Settings";

import { Appointments as AdminAppointments } from "./pages/admin/Appointments";
import { Prescriptions as AdminPrescriptions } from "./pages/admin/Prescriptions";
import { Settings as AdminSettings } from "./pages/admin/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Default redirect to login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Patient pages */}
          <Route element={<Layout />}>
            <Route
              path="/patient"
              element={
                <ProtectedRoute role="patient">
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Provider main - redirect to patients */}
          <Route element={<Layout />}>
            <Route
              path="/provider"
              element={
                <ProtectedRoute role="provider">
                  <Navigate to="/provider/patients" replace />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Admin pages */}
          <Route element={<Layout />}>
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Patient sub-pages */}
          <Route element={<Layout />}>
            <Route path="/patient/goals" element={
              <ProtectedRoute role="patient">
                <Goals />
              </ProtectedRoute>
            }
            />
            <Route
              path="/patient/appointments"
              element={
                <ProtectedRoute role="patient">
                  <Appointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/prescriptions"
              element={
                <ProtectedRoute role="patient">
                  <Prescriptions />
                </ProtectedRoute>
              }
            />
            <Route path="/patient/assistant" element={
              <ProtectedRoute role="patient">
                <Assistant />
              </ProtectedRoute>
            }
            />
            <Route
              path="/patient/settings"
              element={
                <ProtectedRoute role="patient">
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Provider sub-pages */}
          <Route element={<Layout />}>

            <Route
              path="/provider/patients"
              element={
                <ProtectedRoute role="provider">
                  <PatientList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/provider/appointments"
              element={
                <ProtectedRoute role="provider">
                  <ProviderAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/provider/prescriptions"
              element={
                <ProtectedRoute role="provider">
                  <ProviderPrescriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/provider/settings"
              element={
                <ProtectedRoute role="provider">
                  <ProviderSettings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Admin sub-pages */}
          <Route element={<Layout />}>
            <Route
              path="/admin/appointments"
              element={
                <ProtectedRoute role="admin">
                  <AdminAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/prescriptions"
              element={
                <ProtectedRoute role="admin">
                  <AdminPrescriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute role="admin">
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
