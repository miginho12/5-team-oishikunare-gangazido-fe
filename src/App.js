import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfilePage from "./pages/ProfilePage";
import ProfileEdit from "./pages/ProfileEdit";
import PasswordChange from "./pages/PasswordChange";
import MapPage from "./pages/MapPage";
import ChatPage from "./pages/ChatPage";
import PetInfo from "./pages/PetInfo";
import PetEdit from "./pages/PetEdit";
import PetRegister from "./pages/PetRegister";



function App() {
  return (
    <div className="app-container">
      <Router>
        <div className="App">
          <div className="mobile-container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/profile/password" element={<PasswordChange />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/pets" element={<PetInfo />} />
              <Route path="/pets/edit" element={<PetEdit />} />
              <Route path="/pets/register" element={<PetRegister />} />
              <Route path="/" element={<Navigate to="/map" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </div>
  );
}

export default App;
