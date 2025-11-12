import React from "react";
import Sidebar from "../../../app/admin/components/Sidebar";
import Dashboard from "../../../app/admin/components/Dashboard";
import Header from "../../../app/admin/components/Header";

const DashboardPage = () => {
  return (
    <>
      <Sidebar />
      <Header />
      <Dashboard />
    </>
  );
};

export default DashboardPage;
