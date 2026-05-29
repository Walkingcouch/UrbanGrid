// UrbanGrid Solar — Supabase v2 compatible Database type
// Each table needs: Row, Insert, Update, Relationships (supabase-js v2 requirement)

export type UserRole = 'admin' | 'landlord' | 'tenant' | 'contractor' | 'buyer'
export type ContractStatus = 'draft' | 'pending_signature' | 'active' | 'terminated' | 'expired'
export type JobStatus = 'open' | 'bidding' | 'awarded' | 'in_progress' | 'completed' | 'cancelled'
export type ListingStatus = 'active' | 'sold' | 'reserved' | 'delisted'
export type TransactionStatus = 'pending' | 'in_escrow' | 'disbursed' | 'refunded' | 'disputed'
export type AssetCondition = 'new' | 'excellent' | 'good' | 'fair' | 'poor'
export type AssetType = 'panel' | 'inverter' | 'battery' | 'meter' | 'ev_charger' | 'other'
export type ContractType = 'ppa' | 'roof_lease' | 'combined'
export type JobType = 'installation' | 'maintenance' | 'inspection' | 'removal' | 'repair'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: UserRole
          full_name: string | null
          company_name: string | null
          phone: string | null
          abn: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: UserRole
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          abn?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: UserRole
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          abn?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          id: string
          landlord_id: string
          address_line1: string
          address_line2: string | null
          suburb: string
          state: string
          postcode: string
          building_type: string
          roof_size_sqm: number
          roof_material: string | null
          roof_orientation: string | null
          roof_pitch_degrees: number | null
          strata_status: boolean
          strata_plan_number: string | null
          grid_connection_type: string | null
          dnsp: string | null
          nmi: string | null
          annual_electricity_kwh: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          landlord_id: string
          address_line1: string
          suburb: string
          state: string
          postcode: string
          building_type: string
          roof_size_sqm: number
          address_line2?: string | null
          roof_material?: string | null
          roof_orientation?: string | null
          roof_pitch_degrees?: number | null
          strata_status?: boolean
          strata_plan_number?: string | null
          grid_connection_type?: string | null
          dnsp?: string | null
          nmi?: string | null
          annual_electricity_kwh?: number | null
          notes?: string | null
        }
        Update: {
          landlord_id?: string
          address_line1?: string
          address_line2?: string | null
          suburb?: string
          state?: string
          postcode?: string
          building_type?: string
          roof_size_sqm?: number
          roof_material?: string | null
          roof_orientation?: string | null
          roof_pitch_degrees?: number | null
          strata_status?: boolean
          strata_plan_number?: string | null
          grid_connection_type?: string | null
          dnsp?: string | null
          nmi?: string | null
          annual_electricity_kwh?: number | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'properties_landlord_id_fkey'
            columns: ['landlord_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      solar_assets: {
        Row: {
          id: string
          property_id: string
          serial_number: string | null
          manufacturer: string
          model: string
          asset_type: AssetType
          capacity_kw: number
          install_date: string
          warranty_expiry: string | null
          condition: AssetCondition
          output_kwh_last30: number | null
          output_kwh_lifetime: number | null
          last_service_date: string | null
          next_service_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          property_id: string
          manufacturer: string
          model: string
          asset_type: AssetType
          capacity_kw: number
          install_date: string
          serial_number?: string | null
          warranty_expiry?: string | null
          condition?: AssetCondition
          output_kwh_last30?: number | null
          output_kwh_lifetime?: number | null
          last_service_date?: string | null
          next_service_date?: string | null
          is_active?: boolean
        }
        Update: {
          property_id?: string
          manufacturer?: string
          model?: string
          asset_type?: AssetType
          capacity_kw?: number
          install_date?: string
          serial_number?: string | null
          warranty_expiry?: string | null
          condition?: AssetCondition
          output_kwh_last30?: number | null
          output_kwh_lifetime?: number | null
          last_service_date?: string | null
          next_service_date?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'solar_assets_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          }
        ]
      }
      contracts: {
        Row: {
          id: string
          property_id: string
          landlord_id: string
          tenant_id: string | null
          contract_type: ContractType
          status: ContractStatus
          term_years: number
          start_date: string | null
          end_date: string | null
          monthly_rent_rate: number
          ppa_rate_per_kwh: number | null
          annual_escalation_pct: number
          make_good_penalty_amount: number
          early_termination_fee: number | null
          pdf_url: string | null
          signed_landlord_at: string | null
          signed_tenant_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          property_id: string
          landlord_id: string
          monthly_rent_rate: number
          tenant_id?: string | null
          contract_type?: ContractType
          status?: ContractStatus
          term_years?: number
          start_date?: string | null
          ppa_rate_per_kwh?: number | null
          annual_escalation_pct?: number
          make_good_penalty_amount?: number
          early_termination_fee?: number | null
          pdf_url?: string | null
          signed_landlord_at?: string | null
          signed_tenant_at?: string | null
        }
        Update: {
          property_id?: string
          landlord_id?: string
          tenant_id?: string | null
          contract_type?: ContractType
          status?: ContractStatus
          term_years?: number
          start_date?: string | null
          monthly_rent_rate?: number
          ppa_rate_per_kwh?: number | null
          annual_escalation_pct?: number
          make_good_penalty_amount?: number
          early_termination_fee?: number | null
          pdf_url?: string | null
          signed_landlord_at?: string | null
          signed_tenant_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'contracts_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contracts_landlord_id_fkey'
            columns: ['landlord_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      jobs: {
        Row: {
          id: string
          property_id: string | null
          asset_id: string | null
          posted_by: string
          awarded_to: string | null
          title: string
          description: string
          job_type: JobType
          status: JobStatus
          budget_min: number | null
          budget_max: number | null
          awarded_amount: number | null
          scheduled_date: string | null
          completed_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          posted_by: string
          title: string
          description: string
          job_type: JobType
          property_id?: string | null
          asset_id?: string | null
          awarded_to?: string | null
          status?: JobStatus
          budget_min?: number | null
          budget_max?: number | null
          awarded_amount?: number | null
          scheduled_date?: string | null
          completed_date?: string | null
        }
        Update: {
          posted_by?: string
          title?: string
          description?: string
          job_type?: JobType
          property_id?: string | null
          asset_id?: string | null
          awarded_to?: string | null
          status?: JobStatus
          budget_min?: number | null
          budget_max?: number | null
          awarded_amount?: number | null
          scheduled_date?: string | null
          completed_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'jobs_posted_by_fkey'
            columns: ['posted_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      job_bids: {
        Row: {
          id: string
          job_id: string
          contractor_id: string
          bid_amount: number
          cover_note: string | null
          estimated_days: number | null
          is_awarded: boolean
          created_at: string
        }
        Insert: {
          job_id: string
          contractor_id: string
          bid_amount: number
          cover_note?: string | null
          estimated_days?: number | null
          is_awarded?: boolean
        }
        Update: {
          bid_amount?: number
          cover_note?: string | null
          estimated_days?: number | null
          is_awarded?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'job_bids_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          }
        ]
      }
      equipment_marketplace: {
        Row: {
          id: string
          seller_id: string
          asset_id: string | null
          title: string
          description: string
          manufacturer: string
          model: string
          asset_type: AssetType
          condition: AssetCondition
          capacity_kw: number | null
          age_years: number | null
          asking_price: number
          location_suburb: string
          location_state: string
          images: string[]
          status: ListingStatus
          buyer_id: string | null
          sold_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          seller_id: string
          title: string
          description: string
          manufacturer: string
          model: string
          asset_type: AssetType
          condition: AssetCondition
          asking_price: number
          location_suburb: string
          location_state: string
          asset_id?: string | null
          capacity_kw?: number | null
          age_years?: number | null
          images?: string[]
          status?: ListingStatus
          buyer_id?: string | null
          sold_at?: string | null
        }
        Update: {
          title?: string
          description?: string
          manufacturer?: string
          model?: string
          asset_type?: AssetType
          condition?: AssetCondition
          asking_price?: number
          location_suburb?: string
          location_state?: string
          asset_id?: string | null
          capacity_kw?: number | null
          age_years?: number | null
          images?: string[]
          status?: ListingStatus
          buyer_id?: string | null
          sold_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'equipment_marketplace_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          contract_id: string | null
          listing_id: string | null
          job_id: string | null
          payer_id: string
          status: TransactionStatus
          gross_amount: number
          landlord_share: number
          admin_share: number
          contractor_share: number
          zai_payment_id: string | null
          zai_escrow_id: string | null
          disbursed_at: string | null
          period_start: string | null
          period_end: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          payer_id: string
          gross_amount: number
          contract_id?: string | null
          listing_id?: string | null
          job_id?: string | null
          status?: TransactionStatus
          landlord_share?: number
          admin_share?: number
          contractor_share?: number
          zai_payment_id?: string | null
          zai_escrow_id?: string | null
          disbursed_at?: string | null
          period_start?: string | null
          period_end?: string | null
          notes?: string | null
        }
        Update: {
          status?: TransactionStatus
          landlord_share?: number
          admin_share?: number
          contractor_share?: number
          zai_payment_id?: string | null
          zai_escrow_id?: string | null
          disbursed_at?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_payer_id_fkey'
            columns: ['payer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      affiliates: {
        Row: {
          id: string
          user_id: string
          company_name: string
          brand: string
          referral_code: string
          commission_pct: number
          total_leads: number
          total_conversions: number
          total_earnings: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          company_name: string
          brand: string
          referral_code?: string
          commission_pct?: number
          total_leads?: number
          total_conversions?: number
          total_earnings?: number
          is_active?: boolean
        }
        Update: {
          company_name?: string
          brand?: string
          commission_pct?: number
          total_leads?: number
          total_conversions?: number
          total_earnings?: number
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'affiliates_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      affiliate_leads: {
        Row: {
          id: string
          affiliate_id: string
          referred_user_id: string | null
          referral_code: string
          email: string | null
          converted: boolean
          converted_at: string | null
          commission_earned: number
          created_at: string
        }
        Insert: {
          affiliate_id: string
          referral_code: string
          referred_user_id?: string | null
          email?: string | null
          converted?: boolean
          converted_at?: string | null
          commission_earned?: number
        }
        Update: {
          referred_user_id?: string | null
          converted?: boolean
          converted_at?: string | null
          commission_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: 'affiliate_leads_affiliate_id_fkey'
            columns: ['affiliate_id']
            isOneToOne: false
            referencedRelation: 'affiliates'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_role: {
        Args: Record<PropertyKey, never>
        Returns: UserRole
      }
      increment_affiliate_leads: {
        Args: { affiliate_id: string }
        Returns: undefined
      }
      convert_affiliate_lead: {
        Args: { lead_id: string; commission: number }
        Returns: undefined
      }
    }
    Enums: {
      user_role: UserRole
      contract_status: ContractStatus
      job_status: JobStatus
      listing_status: ListingStatus
      transaction_status: TransactionStatus
      asset_condition: AssetCondition
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
