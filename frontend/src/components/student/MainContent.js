// src/components/student/MainContent.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import './StudentSidebar.css';

export default function MainContent() {
  const { isCollapsed } = useSidebar();
  
  return (
    <main className={`student-main-content ${isCollapsed ? 'expanded' : ''}`}>
      <div className="main-content-wrapper">
        <Outlet />
      </div>
    </main>
  );
}
