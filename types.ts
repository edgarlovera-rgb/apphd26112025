export enum LineType {
  NUEVA = 'NUEVA',
  PORTADA = 'PORTADA',
}

export enum CustomerType {
  RESIDENCIAL = 'RESIDENCIAL',
  NEGOCIO = 'NEGOCIO',
}

export enum ServiceType {
  DOBLE_PLAY = 'DOBLE_PLAY',
  INFINITUM_PURO = 'INFINITUM_PURO',
  WINBACK = 'WINBACK',
}

export enum IdType {
  INE = 'INE',
  CURP = 'CURP',
}

export enum FolioStatus {
  NO_ELABORADA = 'NO ELABORADA',
  PROCESO_INSTALACION = 'PROCESO DE INSTALACION',
  ABIERTA = 'ABIERTA',
  CANCELADA = 'CANCELADA',
  POSTEADA = 'POSTEADA',
}

export interface PackageOption {
  id: string;
  name: string;
  price: number;
  type: ServiceType;
  customerType: CustomerType;
}

export interface SalesFormState {
  promoterName: string;
  date: string;
  
  // Extracted Data
  folioSiac: string;
  customerName: string;
  email: string;
  clientNumber: string;

  // Selection
  lineType: LineType;
  customerType: CustomerType;
  serviceType: ServiceType;
  selectedPackageId: string;
  portNumber: string; // Only for Portada

  // Documents
  siacImage: File | null; // The captured image from SmartScanner
  idType: IdType;
  idDocFront: File | null; 
  idDocBack: File | null; // Only for INE
  
  winbackDoc: File | null; // Estado de cuenta Megacable (Winback only)
  addressDoc: File | null; // Standard address proof (if not Winback)
  
  portabilityDocFront: File | null;
  portabilityDocBack: File | null;

  constitutiveActDoc: File | null; // Acta Constitutiva (Optional, only for Negocio)
}

export interface ExtractedData {
  folioSiac?: string;
  fullName?: string;
  email?: string;
  clientNumber?: string;
}

export interface FolioRecord {
  id: string; // Folio SIAC
  date: string; // Format YYYY-MM-DD for easier sorting
  customerName: string;
  email: string;
  cellNumber: string;
  promoterName: string;
  lineType: LineType;
  customerType: CustomerType; // Needed for internal logic but not explicitly asked for export, but good to have
  serviceType: ServiceType;
  packageName: string;
  status: FolioStatus;
}

// Social / Profile Types
export interface UserProfile {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  followers: number;
  following: number;
  likes: number; // Total likes received
}

export interface Post {
  id: string;
  authorName: string;
  authorRole: string; // e.g., 'Gerente Regional'
  content: string;
  date: string;
  likes: number;
  isManagerPost: boolean;
}

// Chat Types
export interface ChatContact {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isOnline: boolean;
  lastMessage?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'me' or contactId
  receiverId: string;
  text: string;
  timestamp: string;
}