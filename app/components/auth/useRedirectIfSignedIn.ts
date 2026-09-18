"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/** Sends signed-in users to the dashboard; returns true while checking. */
export function useRedirectIfSignedIn() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function check() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      if (session) router.replace("/");
      else setChecking(false);
    }

    void check();
    return () => {
      active = false;
    };
  }, [router]);

  return checking;
}
