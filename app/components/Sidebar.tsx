"use client";

import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { label: "Dashboard", path: "/" },
    { label: "Profile", path: "/profile" },
  ];

  return (
    <aside className="sidebar">
      <h3 className="sidebarTitle">Finance App</h3>

      <nav className="sidebarMenu">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;

          return (
            <button
              key={item.path}
              className={`sidebarItem ${isActive ? "activeItem" : ""}`}
              onClick={() => router.push(item.path)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}