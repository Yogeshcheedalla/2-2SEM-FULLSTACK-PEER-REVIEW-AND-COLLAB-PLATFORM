import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./Landing";
import Login from "./Login";
import Signup from "./Signup";
import Teacher from "./Teacher";
import Student from "./Student";
import Admin from "./Admin";
import "./App.css";
import PeerReview from './PeerReview';
import ProjectGallery from './ProjectGallery';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/student" element={<Student />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/peer-review/:assignmentId" element={<PeerReview />} />
        <Route path="/project-gallery" element={<ProjectGallery />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;