export type PaymentProvider = 'paystack' | 'flutterwave' | 'monnify' | 'remita';

export interface PaymentSettings {
  provider: PaymentProvider;
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  flutterwavePublicKey?: string;
  monnifyPublicKey?: string;
  monnifyContractCode?: string;
  remitaPublicKey?: string;
  remitaMerchantId?: string;
  remitaServiceTypeId?: string;
}

export const defaultPaymentSettings: PaymentSettings = {
  provider: 'paystack',
  paystackPublicKey: '',
  paystackSecretKey: '',
  flutterwavePublicKey: '',
  monnifyPublicKey: '',
  monnifyContractCode: '',
  remitaPublicKey: '',
  remitaMerchantId: '',
  remitaServiceTypeId: '',
};
