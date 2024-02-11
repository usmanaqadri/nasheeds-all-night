import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Header from "./components/Header";
import Edit from "./pages/Edit";
function AppRouter() {
  return (
    <BrowserRouter
      {...(process.env.NODE_ENV === "development"
        ? { basename: "/nasheeds-all-night" }
        : {})}
    >
      <Header />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/:id" element={<Edit />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
