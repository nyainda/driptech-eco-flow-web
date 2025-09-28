
import { Json } from '../shared';

export type HealthChecks = {
  Row: {
    id: string;
    last_check: string;
    status: string;
  };
  Insert: {
    id?: string;
    last_check?: string;
    status?: string;
  };
  Update: {
    id?: string;
    last_check?: string;
    status?: string;
  };
  Relationships: [];
};