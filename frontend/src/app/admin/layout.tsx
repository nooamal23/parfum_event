import AdminSidebar from '@/components/admin/Adminsidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 md:ml-64">{children}</main>
    </div>
  );
}