import React from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// import { app, auth } from "./firebase/firebase";
import { AuthProvider } from "./context/AuthContext"; // Import the AuthProvider
import { UIProvider } from "./context/UIContext";
import { GlobalUI } from "./Components/GlobalUI";
import NavBar from "./Components/NavBar";
import Footer from "./Components/Footer";
import Calendar from "./pages/Calendar";
import ApplyForm from "./pages/ApplyForm";
import Rule from "./pages/Rule";
import Test from "./pages/Test";
import "./App.css";

const App: React.FC = () => {
  return (
    <div className="bg-[#F3F3F3] min-h-screen flex flex-col relative">
      <AuthProvider>
        <UIProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Router>
              <GlobalUI />
              <NavBar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Calendar />} />
                  <Route path="/apply" element={<ApplyForm />} />
                  <Route path="/rule" element={<Rule />} />
                  <Route path="/test" element={<Test />} />
                </Routes>
              </main>
              <Footer />
            </Router>
          </LocalizationProvider>
        </UIProvider>
      </AuthProvider>
    </div>
  );
};

export default App;

