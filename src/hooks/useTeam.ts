"use client";

import { useState, useEffect, useCallback } from "react";
import type { Team, TeamMember } from "@/lib/types";

interface TeamApiResponse {
  id: string;
  handle: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  city: string | null;
  founded_year: number | null;
  invite_code: string;
  created_by: string | null;
  created_at: string;
  memberCount: number;
  myRole: "admin" | "member" | "alumni" | null;
}

function toTeam(data: TeamApiResponse): Team {
  return {
    id: data.id,
    handle: data.handle,
    name: data.name,
    logoUrl: data.logo_url ?? undefined,
    description: data.description ?? undefined,
    city: data.city ?? undefined,
    foundedYear: data.founded_year ?? undefined,
    memberCount: data.memberCount,
    inviteCode: data.invite_code,
    createdBy: data.created_by ?? "",
    createdAt: data.created_at,
    myRole: data.myRole,
  };
}

export function useMyTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teams");
      if (!res.ok) {
        if (res.status === 401) { setError("not_authenticated"); return; }
        throw new Error("Failed to fetch teams");
      }
      const data: TeamApiResponse[] = await res.json();
      setTeams(data.map(toTeam));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  return { teams, loading, error, refetch: fetchTeams };
}

export function useTeamDetail(teamId: string | null) {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;
    try {
      setLoading(true);
      const [teamRes, membersRes] = await Promise.all([
        fetch(`/api/teams/${teamId}`),
        fetch(`/api/teams/${teamId}/members`),
      ]);

      if (!teamRes.ok) throw new Error("Failed to fetch team");

      const teamData: TeamApiResponse = await teamRes.json();
      setTeam(toTeam(teamData));

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(
          membersData.map((m: Record<string, unknown>) => ({
            id: m.id,
            teamId: m.team_id,
            profileId: m.profile_id,
            role: m.role,
            joinedAt: m.joined_at,
            profile: m.profiles,
          }))
        );
      }

      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  return { team, members, loading, error, refetch: fetchTeam };
}

export function useTeamActions() {
  const createTeam = useCallback(
    async (data: { name: string; handle: string; description?: string; city?: string; founded_year?: number }) => {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to create team");
      }
      return res.json();
    },
    []
  );

  const joinTeam = useCallback(async (invite_code: string) => {
    const res = await fetch("/api/teams/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invite_code }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Failed to join team");
    }
    return res.json();
  }, []);

  const leaveTeam = useCallback(async (teamId: string) => {
    const res = await fetch(`/api/teams/${teamId}/members`, { method: "DELETE" });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Failed to leave team");
    }
  }, []);

  const updateTeam = useCallback(
    async (teamId: string, data: Record<string, unknown>) => {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to update team");
      }
      return res.json();
    },
    []
  );

  const removeMember = useCallback(async (teamId: string, profileId: string) => {
    const res = await fetch(`/api/teams/${teamId}/members?profileId=${profileId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Failed to remove member");
    }
  }, []);

  const checkHandle = useCallback(async (handle: string): Promise<boolean> => {
    const res = await fetch(`/api/teams/handle-check?handle=${encodeURIComponent(handle)}`);
    const { available } = await res.json();
    return available;
  }, []);

  return { createTeam, joinTeam, leaveTeam, updateTeam, removeMember, checkHandle };
}
