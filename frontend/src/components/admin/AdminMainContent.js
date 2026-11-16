// src/components/admin/AdminMainContent.js — Ultra-Modern Emerald Content Shell
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminTopBar from './AdminTopBar';
import { useSidebar } from '../../context/SidebarContext';
import './AdminSidebar.css';

export default function AdminMainContent() {
  const { isCollapsed } = useSidebar();

  return (
    <main className={`admin-main-content ${isCollapsed ? 'expanded' : ''}`}>
      <AdminTopBar />
      <div className="admin-main-content-wrapper">
        <Outlet />
      </div>
    </main>
  );
}
