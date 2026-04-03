// src/components/admin/AdminLayout.js
import React from 'react';
import AdminSidebar from './AdminSidebar';
import AdminMainContent from './AdminMainContent';
import { SidebarProvider } from '../../context/SidebarContext';
import './AdminSidebar.css';

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="admin-layout">
        <AdminSidebar />
        <AdminMainContent />
      </div>
    </SidebarProvider>
  );
}
