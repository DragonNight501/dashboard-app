"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "../lib/auth";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        setIsChecking(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.replace("/login");
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Checking authentication...
      </div>
    );
  }

  return <>{children}</>;
}