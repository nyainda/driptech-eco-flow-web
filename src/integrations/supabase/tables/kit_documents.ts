
import { Json } from '../shared';

export type KitDocuments = {
  Row: {
    created_at: string | null;
    description: string | null;
    document_type: string;
    download_count: number | null;
    file_size: number | null;
    file_type: string | null;
    file_url: string;
    id: string;
    kit_id: string | null;
    language: string | null;
    requires_login: boolean | null;
    title: string;
    updated_at: string | null;
    version: string | null;
  };
  Insert: {
    created_at?: string | null;
    description?: string | null;
    document_type: string;
    download_count?: number | null;
    file_size?: number | null;
    file_type?: string | null;
    file_url: string;
    id?: string;
    kit_id?: string | null;
    language?: string | null;
    requires_login?: boolean | null;
    title: string;
    updated_at?: string | null;
    version?: string | null;
  };
  Update: {
    created_at?: string | null;
    description?: string | null;
    document_type?: string;
    download_count?: number | null;
    file_size?: number | null;
    file_type?: string | null;
    file_url?: string;
    id?: string;
    kit_id?: string | null;
    language?: string | null;
    requires_login?: boolean | null;
    title?: string;
    updated_at?: string | null;
    version?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "kit_documents_kit_id_fkey";
      columns: ["kit_id"];
      isOneToOne: false;
      referencedRelation: "irrigation_kits";
      referencedColumns: ["id"];
    },
  ];
};
