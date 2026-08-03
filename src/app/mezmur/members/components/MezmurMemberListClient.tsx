"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Filter, Plus, Edit, Users, Music } from "lucide-react";

interface Member {
  id: string;
  fullName: string | null;
  gender: "MALE" | "FEMALE";
  age: number | null;
  mezmurEnrollments: {
    id: string;
    groupType: "BEGINNERS" | "CONTINUOUS";
    status: string;
    enrolledDate: string;
  }[];
}

interface MezmurMemberListClientProps {
  members: Member[];
}

const groupLabels: Record<string, string> = {
  REGULAR: "ወጣት (መደበኛ)",
  BEGINNERS: "ጀማሪ",
  CONTINUOUS: "ቀጣይ",
};

const genderLabels: Record<string, string> = {
  MALE: "ወንድ",
  FEMALE: "ሴት",
};

export default function MezmurMemberListClient({ members }: MezmurMemberListClientProps) {
  const [searchText, setSearchText] = useState("");
  const [groupFilter, setGroupFilter] = useState("");

  const filteredMembers = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return members.filter((member) => {
      const enrollment = member.mezmurEnrollments[0];
      const groupType = enrollment?.groupType || "REGULAR";

      const normalizedFields = [
        member.fullName ?? "",
        groupType,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalizedSearch
        ? normalizedFields.includes(normalizedSearch)
        : true;

      const matchesGroup = groupFilter
        ? groupType === groupFilter
        : true;

      return matchesSearch && matchesGroup;
    });
  }, [members, groupFilter, searchText]);

  const totals = useMemo(
    () => ({
      total: filteredMembers.length,
      regular: filteredMembers.filter((m) => m.mezmurEnrollments.length === 0).length,
      beginners: filteredMembers.filter((m) => m.mezmurEnrollments[0]?.groupType === "BEGINNERS").length,
      continuous: filteredMembers.filter((m) => m.mezmurEnrollments[0]?.groupType === "CONTINUOUS").length,
    }),
    [filteredMembers]
  );

  return (
    <div className="space-y-4">
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div
          className="px-4 py-3 space-y-3"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <div
            className="flex flex-wrap items-center gap-3 text-xs"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <div className="flex items-center gap-1.5">
              <Users size={13} />
              <span
                className="font-semibold"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {totals.total}
              </span>
              <span>የሚታዩ አባላት</span>
            </div>

            <span style={{ color: "hsl(var(--border))" }}>|</span>

            <span>
              <span className="font-semibold" style={{ color: "hsl(200 55% 55%)" }}>
                {totals.regular}
              </span>{" "}
              ወጣት
            </span>

            <span>
              <span className="font-semibold" style={{ color: "hsl(160 55% 55%)" }}>
                {totals.beginners}
              </span>{" "}
              ጀማሪ
            </span>

            <span>
              <span className="font-semibold" style={{ color: "hsl(200 55% 55%)" }}>
                {totals.continuous}
              </span>{" "}
              ቀጣይ
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                size={13}
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <input
                className="h-8 w-full rounded border pl-8 pr-3 text-xs transition-all duration-150"
                style={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="በስም ፈልግ…"
              />
            </div>

            <div className="relative w-full sm:w-44">
              <Filter
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                size={13}
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <select
                className="h-8 w-full rounded border pl-8 pr-3 text-xs appearance-none transition-all duration-150"
                style={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
                value={groupFilter}
                onChange={(event) => setGroupFilter(event.target.value)}
              >
                <option value="">ሁሉም ተመዝጋቢዎች</option>
                <option value="REGULAR">መደበኛ ወጣት</option>
                <option value="BEGINNERS">ጀማሪዎች</option>
                <option value="CONTINUOUS">ቀጣይ ተማሪዎች</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-3">
          {members.length === 0 ? (
            <div className="rounded p-12 text-center">
              <Users
                size={24}
                className="mx-auto mb-2 opacity-20"
                style={{ color: "hsl(var(--foreground))" }}
              />
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                በመዝሙር ጥናት ውስጥ የተመደቡ አባላት የሉም
              </p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="rounded p-12 text-center">
              <Search
                size={24}
                className="mx-auto mb-2 opacity-20"
                style={{ color: "hsl(var(--foreground))" }}
              />
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                ምንም አባል አልተገኘም
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredMembers.map((member) => {
                const enrollment = member.mezmurEnrollments[0];

                return (
                  <div
                    key={member.id}
                    className="group relative rounded border p-3 transition-all duration-150 flex flex-col justify-between"
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  >
                    <div className="mb-2.5">
                      <h3
                        className="text-sm font-semibold leading-tight truncate pr-5"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        {member.fullName ?? "Unnamed member"}
                      </h3>
                      <p
                        className="text-[10px] mt-0.5"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {genderLabels[member.gender] ?? member.gender} · {member.age ?? "?"} ዓመት
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] flex items-center justify-between">
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>ምድብ:</span>
                        <span className="font-medium" style={{ color: "hsl(var(--foreground))" }}>
                          {enrollment ? groupLabels[enrollment.groupType] : groupLabels["REGULAR"]}
                        </span>
                      </div>

                      <div className="pt-1.5 flex items-center justify-between border-t" style={{ borderColor: "hsl(var(--border))" }}>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${
                            enrollment?.status === "ACTIVE" || !enrollment
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                          }`}
                        >
                          {enrollment?.status ?? "ACTIVE"}
                        </span>

                        <Link
                          href={`/mezmur/members/${member.id}`}
                          className="text-[10px] font-medium transition-colors duration-150"
                          style={{ color: "hsl(var(--primary))" }}
                        >
                          ዝርዝር →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
