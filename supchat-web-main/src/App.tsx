// Main application entry point
import { routes } from "./constants/variables";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Login from "./pages/auth/login";
import SignUp from "./pages/auth/signup";
import ProtectedRoutes from "./component/protectedRoutes";
import DosProtection from "./component/DosProtection";

function App() {
  return (
    <Router>
      <Routes>
        {/* Protected dashboard route */}
        <Route
          element={
            <ProtectedRoutes>
              <Dashboard />
            </ProtectedRoutes>
          }
          path={routes.dashboard}
        />

        {/* Public login route with DOS protection */}
        <Route
          element={
            <DosProtection>
              <Login />
            </DosProtection>
          }
          path={routes.login}
        />
        {/* Public signup route with DOS protection */}
        <Route
          element={
            <DosProtection>
              <SignUp />
            </DosProtection>
          }
          path={routes.signup}
        />
      </Routes>
    </Router>
  );
}

export default App;
