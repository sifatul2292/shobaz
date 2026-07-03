export interface CourierApiConfig {
  providerName: string;
  apiKey: string;
  secretKey: string;
  username?: string;
  password?: string;
  merchantCode?: string;
  pickMerchantThana: any,
  pickMerchantDistrict: any,
  pickMerchantAddress: any,
  pickMerchantName: any,
  pickupMerchantPhone: any,
  specialInstruction?: any;
  storeId?: any;
}

export interface SteadfastCourierPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
  item_description?: string;
  recipient_email?: string;
}

export interface MetroWingsCourierPayload {
  product_type: number;
  store_id: number;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  city_id: number;
  zone_id: number;
  weight: number;
  amount_collect: number;
  delivery_type: number;
  area_id?: number;
  quantity?: number;
  merchant_order_id?: string;
  special_instruction?: string;
  item_desc?: string;
}
