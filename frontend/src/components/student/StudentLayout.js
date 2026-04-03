// src/components/student/StudentLayout.js
import React from 'react';
import StudentSidebar from './StudentSidebar';
import MainContent from './MainContent';
import { SidebarProvider } from '../../context/SidebarContext';
import './StudentSidebar.css';

export default function StudentLayout() {
  return (
    <SidebarProvider>
      <div className="student-layout">
        <StudentSidebar />
        <MainContent />
      </div>
    </SidebarProvider>
  );
}
