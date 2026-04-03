// src/components/admin/AdminMainContent.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import './AdminSidebar.css';

export default function AdminMainContent() {
  const { isCollapsed } = useSidebar();
  
  return (
    <main className={`admin-main-content ${isCollapsed ? 'expanded' : ''}`}>
      <div className="admin-main-content-wrapper">
        <Outlet />
      </div>
    </main>
  );
}
