// src/integrations/supabase/tables/user_roles.ts

export type UserRoles = {
  Row: {
    id: string;
    user_id: string;
    role: "admin" | "super_admin" | "editor";
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: string;
    user_id: string;
    role: "admin" | "super_admin" | "editor";
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: string;
    user_id?: string;
    role?: "admin" | "super_admin" | "editor";
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "user_roles_user_id_fkey";
      columns: ["user_id"];
      isOneToOne: false;
      referencedRelation: "users";
      referencedColumns: ["id"];
    },
  ];
};
