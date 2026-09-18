"use client";

/* ===================== */
/* Imports */
/* ===================== */

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { isDemoMode } from "../lib/demo";

/* ===================== */
/* Types */
/* ===================== */

type AuthGuardProps = {
  children: ReactNode;
  /** Let demo visitors (no account) through. Off for account pages. */
  allowDemo?: boolean;
};

/* ===================== */
/* Auth Guard */
/* Protects private pages and reacts to auth session changes.
 */
/* ===================== */

export default function AuthGuard({ children, allowDemo = false }: AuthGuardProps) {
  const router = useRouter();

  const [isChecking, setIsChecking] = useState(true);

  /* ===================== */
  /* Session Protection */
  /* Checks the current session and redirects unauthenticated users.
   */
  /* ===================== */

  useEffect(() => {
    let isMounted = true;
    const demo = isDemoMode();

    async function checkSession() {
      if (demo) {
        if (allowDemo) setIsChecking(false);
        else router.replace("/");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      setIsChecking(false);
    }

    checkSession();

    // Demo visitors have no Supabase session to watch.
    if (demo) {
      return () => {
        isMounted = false;
      };
    }

    /* ===================== */
    /* Auth State Listener */
    /* Keeps the UI synced when the user logs in, logs out, or session changes.
     */
    /* ===================== */

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.replace("/login");
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setIsChecking(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, allowDemo]);

  /* ===================== */
  /* Loading State */
  /* Prevents protected content from flashing before session check finishes.
   */
  /* ===================== */

  if (isChecking) {
    return (
      <main className="authLoadingPage">
        <div className="authLoadingCard">
          <div className="authLoadingSpinner" />
          <p>Checking your session...</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
