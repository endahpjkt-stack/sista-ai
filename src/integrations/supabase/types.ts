export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          aksi: string
          detail: Json
          id: string
          letter_id: string | null
          pengguna: string
          waktu: string
        }
        Insert: {
          aksi: string
          detail?: Json
          id?: string
          letter_id?: string | null
          pengguna?: string
          waktu?: string
        }
        Update: {
          aksi?: string
          detail?: Json
          id?: string
          letter_id?: string | null
          pengguna?: string
          waktu?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
      drafts: {
        Row: {
          data_disetujui: Json
          disetujui_oleh: string
          disetujui_pada: string
          file_draf: string | null
          id: string
          letter_id: string
          template: string
        }
        Insert: {
          data_disetujui: Json
          disetujui_oleh?: string
          disetujui_pada?: string
          file_draf?: string | null
          id?: string
          letter_id: string
          template: string
        }
        Update: {
          data_disetujui?: Json
          disetujui_oleh?: string
          disetujui_pada?: string
          file_draf?: string | null
          id?: string
          letter_id?: string
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "drafts_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
      extractions: {
        Row: {
          dibuat_pada: string
          id: string
          json_hasil: Json
          letter_id: string
          model: string
          versi_prompt: string
        }
        Insert: {
          dibuat_pada?: string
          id?: string
          json_hasil: Json
          letter_id: string
          model: string
          versi_prompt: string
        }
        Update: {
          dibuat_pada?: string
          id?: string
          json_hasil?: Json
          letter_id?: string
          model?: string
          versi_prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "extractions_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
      finals: {
        Row: {
          dicatat_oleh: string | null
          dicatat_pada: string
          dikonfirmasi: boolean
          drive_url: string | null
          file_pdf_final: string
          id: string
          letter_id: string
          nomor_surat: string | null
          sheet_row: number | null
          tanggal_surat: string | null
        }
        Insert: {
          dicatat_oleh?: string | null
          dicatat_pada?: string
          dikonfirmasi?: boolean
          drive_url?: string | null
          file_pdf_final: string
          id?: string
          letter_id: string
          nomor_surat?: string | null
          sheet_row?: number | null
          tanggal_surat?: string | null
        }
        Update: {
          dicatat_oleh?: string | null
          dicatat_pada?: string
          dikonfirmasi?: boolean
          drive_url?: string | null
          file_pdf_final?: string
          id?: string
          letter_id?: string
          nomor_surat?: string | null
          sheet_row?: number | null
          tanggal_surat?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finals_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: true
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
      letter_access: {
        Row: {
          diberikan_oleh: string
          diberikan_pada: string
          id: string
          letter_id: string
          user_id: string
        }
        Insert: {
          diberikan_oleh?: string
          diberikan_pada?: string
          id?: string
          letter_id: string
          user_id: string
        }
        Update: {
          diberikan_oleh?: string
          diberikan_pada?: string
          id?: string
          letter_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "letter_access_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
      letters: {
        Row: {
          alasan_pengecualian: string | null
          checklist_cocok: boolean
          dibuat_oleh: string
          dibuat_pada: string
          diperbarui_pada: string
          file_disposisi: string | null
          file_surat: string
          id: string
          judul: string
          jumlah_pegawai: number | null
          kategori_pengecualian: string | null
          pengecualian: boolean
          status: Database["public"]["Enums"]["letter_status"]
          template_dipilih: string | null
          template_rekomendasi: string | null
        }
        Insert: {
          alasan_pengecualian?: string | null
          checklist_cocok?: boolean
          dibuat_oleh?: string
          dibuat_pada?: string
          diperbarui_pada?: string
          file_disposisi?: string | null
          file_surat: string
          id?: string
          judul?: string
          jumlah_pegawai?: number | null
          kategori_pengecualian?: string | null
          pengecualian?: boolean
          status?: Database["public"]["Enums"]["letter_status"]
          template_dipilih?: string | null
          template_rekomendasi?: string | null
        }
        Update: {
          alasan_pengecualian?: string | null
          checklist_cocok?: boolean
          dibuat_oleh?: string
          dibuat_pada?: string
          diperbarui_pada?: string
          file_disposisi?: string | null
          file_surat?: string
          id?: string
          judul?: string
          jumlah_pegawai?: number | null
          kategori_pengecualian?: string | null
          pengecualian?: boolean
          status?: Database["public"]["Enums"]["letter_status"]
          template_dipilih?: string | null
          template_rekomendasi?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nama: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nama?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nama?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_letter: { Args: { _letter_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_letter_owner: { Args: { _letter_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "pegawai"
      letter_status:
        | "diunggah"
        | "diekstrak"
        | "ditinjau"
        | "draf_siap"
        | "menunggu_tte"
        | "selesai"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "pegawai"],
      letter_status: [
        "diunggah",
        "diekstrak",
        "ditinjau",
        "draf_siap",
        "menunggu_tte",
        "selesai",
      ],
    },
  },
} as const
