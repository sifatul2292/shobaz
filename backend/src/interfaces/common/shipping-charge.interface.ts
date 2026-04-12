export interface WeightRule {
  fromGram: number;
  toGram: number;
  cost: number;
}

export interface ShippingCharge {
  _id?: string;
  deliveryInDhaka?: number;
  deliveryOutsideDhaka?: number;
  deliveryOutsideBD?: number;
  insideDhakaRules?: WeightRule[];
  outsideDhakaRules?: WeightRule[];
  createdAt?: Date;
  updatedAt?: Date;
}
