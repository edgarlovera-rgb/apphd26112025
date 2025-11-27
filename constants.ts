import { ChatContact, ChatMessage, CustomerType, FolioRecord, FolioStatus, LineType, PackageOption, Post, ServiceType, UserProfile } from './types';

export const PACKAGES: PackageOption[] = [
  // Doble Play Residencial
  { id: 'dpr-80', name: 'Doble Play Residencial 80 Megas', price: 389, type: ServiceType.DOBLE_PLAY, customerType: CustomerType.RESIDENCIAL },
  { id: 'dpr-100', name: 'Doble Play Residencial 100 Megas', price: 435, type: ServiceType.DOBLE_PLAY, customerType: CustomerType.RESIDENCIAL },
  { id: 'dpr-150', name: 'Doble Play Residencial 150 Megas', price: 499, type: ServiceType.DOBLE_PLAY, customerType: CustomerType.RESIDENCIAL },
  { id: 'dpr-250', name: 'Doble Play Residencial 250 Megas', price: 599, type: ServiceType.DOBLE_PLAY, customerType: CustomerType.RESIDENCIAL },
  { id: 'dpr-350', name: 'Doble Play Residencial 350 Megas', price: 649, type: ServiceType.DOBLE_PLAY, customerType: CustomerType.RESIDENCIAL },
  { id: 'dpr-500', name: 'Doble Play Residencial 500 Megas', price: 725, type: ServiceType.DOBLE_PLAY, customerType: CustomerType.RESIDENCIAL },
  { id: 'dpr-1000', name: 'Doble Play Residencial 1000 Megas', price: 1399, type: ServiceType.DOBLE_PLAY, customerType: CustomerType.RESIDENCIAL },

  // Infinitum Puro Residencial
  { id: 'ipr-80', name: 'Infinitum Puro Residencial 80 Megas', price: 349, type: ServiceType.INFINITUM_PURO, customerType: CustomerType.RESIDENCIAL },
  { id: 'ipr-100', name: 'Infinitum Puro Residencial 100 Megas', price: 399, type: ServiceType.INFINITUM_PURO, customerType: CustomerType.RESIDENCIAL },
  { id: 'ipr-150', name: 'Infinitum Puro Residencial 150 Megas', price: 449, type: ServiceType.INFINITUM_PURO, customerType: CustomerType.RESIDENCIAL },
  { id: 'ipr-250', name: 'Infinitum Puro Residencial 250 Megas', price: 499, type: ServiceType.INFINITUM_PURO, customerType: CustomerType.RESIDENCIAL },
  { id: 'ipr-350', name: 'Infinitum Puro Residencial 350 Megas', price: 549, type: ServiceType.INFINITUM_PURO, customerType: CustomerType.RESIDENCIAL },
  { id: 'ipr-500', name: 'Infinitum Puro Residencial 500 Megas', price: 649, type: ServiceType.INFINITUM_PURO, customerType: CustomerType.RESIDENCIAL },

  // Doble Play Negocio
  { id: 'dpn-80', name: 'Doble Play Negocio 80 Megas', price: 399, type: ServiceType.DOBLE_PLAY, customerType: CustomerType.NEGOCIO },
  { id: 'dpn-150', name: 'Doble Play Negocio 150 Megas', price: 549, type: ServiceType.DOBLE_PLAY, customerType: CustomerType.NEGOCIO },
  { id: 'dpn-250', name: 'Doble Play Negocio 250 Megas', price: 649, type: ServiceType.DOBLE_PLAY, customerType: CustomerType.NEGOCIO },
  { id: 'dpn-350', name: 'Doble Play Negocio 350 Megas', price: 799, type: ServiceType.DOBLE_PLAY, customerType: CustomerType.NEGOCIO },
  { id: 'dpn-500', name: 'Doble Play Negocio 500 Megas', price: 999, type: ServiceType.DOBLE_PLAY, customerType: CustomerType.NEGOCIO },
  { id: 'dpn-750', name: 'Doble Play Negocio 750 Megas', price: 1499, type: ServiceType.DOBLE_PLAY, customerType: CustomerType.NEGOCIO },
  { id: 'dpn-1000', name: 'Doble Play Negocio 1000 Megas', price: 2289, type: ServiceType.DOBLE_PLAY, customerType: CustomerType.NEGOCIO },

  // Infinitum Puro Negocio
  { id: 'ipn-80', name: 'Infinitum Puro Negocio 80 Megas', price: 349, type: ServiceType.INFINITUM_PURO, customerType: CustomerType.NEGOCIO },
  { id: 'ipn-100', name: 'Infinitum Puro Negocio 100 Megas', price: 399, type: ServiceType.INFINITUM_PURO, customerType: CustomerType.NEGOCIO },
  { id: 'ipn-150', name: 'Infinitum Puro Negocio 150 Megas', price: 449, type: ServiceType.INFINITUM_PURO, customerType: CustomerType.NEGOCIO },
  { id: 'ipn-250', name: 'Infinitum Puro Negocio 250 Megas', price: 499, type: ServiceType.INFINITUM_PURO, customerType: CustomerType.NEGOCIO },
  { id: 'ipn-350', name: 'Infinitum Puro Negocio 350 Megas', price: 549, type: ServiceType.INFINITUM_PURO, customerType: CustomerType.NEGOCIO },
  { id: 'ipn-500', name: 'Infinitum Puro Negocio 500 Megas', price: 649, type: ServiceType.INFINITUM_PURO, customerType: CustomerType.NEGOCIO },
];

export const MOCK_USER = "Usuario Supervisor";

// Mock Database for Search/Consultation
export const EXISTING_FOLIOS: FolioRecord[] = [
    { 
        id: 'S-12345678', 
        date: '2025-05-20', 
        customerName: 'Juan Pérez', 
        email: 'juan@gmail.com',
        cellNumber: '5512345678',
        promoterName: MOCK_USER,
        lineType: LineType.NUEVA,
        customerType: CustomerType.RESIDENCIAL,
        serviceType: ServiceType.DOBLE_PLAY,
        packageName: 'Doble Play Residencial 100 Megas',
        status: FolioStatus.PROCESO_INSTALACION 
    },
    { 
        id: 'S-87654321', 
        date: '2025-05-22', 
        customerName: 'María García', 
        email: 'maria@outlook.com',
        cellNumber: '5587654321',
        promoterName: MOCK_USER,
        lineType: LineType.PORTADA,
        customerType: CustomerType.RESIDENCIAL,
        serviceType: ServiceType.DOBLE_PLAY,
        packageName: 'Doble Play Residencial 50 Megas',
        status: FolioStatus.ABIERTA 
    },
    { 
        id: 'S-11223344', 
        date: '2025-04-10', 
        customerName: 'Abarrotes Don Pepe', 
        email: 'contacto@donpepe.com',
        cellNumber: '5599887766',
        promoterName: MOCK_USER,
        lineType: LineType.NUEVA,
        customerType: CustomerType.NEGOCIO,
        serviceType: ServiceType.INFINITUM_PURO,
        packageName: 'Infinitum Puro Negocio 100 Megas',
        status: FolioStatus.CANCELADA 
    },
    { 
        id: 'S-55667788', 
        date: '2025-05-25', 
        customerName: 'Carlos López', 
        email: 'carlos.lopez@yahoo.com',
        cellNumber: '5566778899',
        promoterName: 'Promotor 2',
        lineType: LineType.NUEVA,
        customerType: CustomerType.RESIDENCIAL,
        serviceType: ServiceType.WINBACK,
        packageName: 'Doble Play Residencial 200 Megas',
        status: FolioStatus.POSTEADA 
    },
    { 
        id: 'S-99001122', 
        date: '2025-05-26', 
        customerName: 'Ana Torres', 
        email: 'ana.torres@gmail.com',
        cellNumber: '5511223344',
        promoterName: MOCK_USER,
        lineType: LineType.PORTADA,
        customerType: CustomerType.NEGOCIO,
        serviceType: ServiceType.DOBLE_PLAY,
        packageName: 'Doble Play Negocio 100 Megas',
        status: FolioStatus.NO_ELABORADA 
    },
];

export const MOCK_USER_PROFILE: UserProfile = {
  id: 'u-001',
  name: MOCK_USER,
  role: 'Promotor Senior',
  photoUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', // Placeholder avatar
  followers: 42,
  following: 15,
  likes: 128
};

export const MOCK_POSTS: Post[] = [
  {
    id: 'p-1',
    authorName: 'Lic. Roberto Gómez',
    authorRole: 'Gerente Regional',
    content: '¡Excelente inicio de semana equipo! Recuerden que tenemos bonos especiales para quienes superen las 10 ventas de Doble Play Negocio esta semana. ¡Vamos con todo!',
    date: 'Hace 2 horas',
    likes: 24,
    isManagerPost: true,
  },
  {
    id: 'p-2',
    authorName: 'Lic. Roberto Gómez',
    authorRole: 'Gerente Regional',
    content: 'AVISO IMPORTANTE: Se ha actualizado el proceso de validación de biométricos. Por favor revisen su correo para ver el manual actualizado.',
    date: 'Ayer',
    likes: 45,
    isManagerPost: true,
  }
];

export const MOCK_CONTACTS: ChatContact[] = [
  { id: 'c1', name: 'Lic. Roberto Gómez', role: 'Gerente Regional', isOnline: true, avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png' },
  { id: 'c2', name: 'Ana Martínez', role: 'Supervisora', isOnline: false, avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135789.png' },
  { id: 'c3', name: 'Soporte Técnico', role: 'Helpdesk', isOnline: true, avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135823.png' },
];

export const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'm1', senderId: 'c1', receiverId: 'me', text: 'Buen día, ¿cómo vas con los registros de hoy?', timestamp: '09:00 AM' },
  { id: 'm2', senderId: 'me', receiverId: 'c1', text: 'Hola Licenciado, llevo 3 folios ingresados correctamente.', timestamp: '09:05 AM' },
  { id: 'm3', senderId: 'c1', receiverId: 'me', text: 'Excelente, recuerda revisar bien la documentación de los negocios.', timestamp: '09:06 AM' },
  { id: 'm4', senderId: 'c2', receiverId: 'me', text: 'Hola, ¿me puedes pasar el dato de la instalación pendiente?', timestamp: 'Ayer' },
];