import React, { useState, useEffect, useMemo, useRef } from 'react';
import { jsPDF } from "jspdf";
import { ChatContact, ChatMessage, CustomerType, ExtractedData, FolioStatus, IdType, LineType, Post, SalesFormState, ServiceType, UserProfile } from './types';
import { EXISTING_FOLIOS, MOCK_CONTACTS, MOCK_MESSAGES, MOCK_POSTS, MOCK_USER, MOCK_USER_PROFILE, PACKAGES } from './constants';
import { SmartScanner } from './components/SmartScanner';
import { FileUpload } from './components/FileUpload';
import { extractNameFromImage } from './services/geminiService';

// Particle Network Background Component
const ParticleNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: {x: number, y: number, vx: number, vy: number}[] = [];
    const particleCount = Math.floor((width * height) / 15000); // Density adjustment

    for(let i=0; i<particleCount; i++){
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.8, // Speed
            vy: (Math.random() - 0.5) * 0.8
        });
    }

    let animId: number;
    const animate = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off edges
            if(p.x < 0 || p.x > width) p.vx *= -1;
            if(p.y < 0 || p.y > height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();

            // Connect lines
            for(let j=i+1; j<particles.length; j++){
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < 120){
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * (1 - dist/120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        });
        animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
};

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Auth Form Inputs
  const [authInput, setAuthInput] = useState(''); // Used for Login Username and Register Generated Username
  const [authPassword, setAuthPassword] = useState(''); // Used for Login Pass and Register Create Pass
  
  // Registration Specific Inputs
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerDob, setRegisterDob] = useState('');
  const [registerCurp, setRegisterCurp] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerNetwork, setRegisterNetwork] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  // Navigation State
  const [currentView, setCurrentView] = useState<'register' | 'consult' | 'profile' | 'messages'>('register');

  // Form State
  const [formData, setFormData] = useState<SalesFormState>({
    promoterName: MOCK_USER,
    date: new Date().toLocaleDateString('es-MX'),
    folioSiac: '',
    customerName: '',
    email: '',
    clientNumber: '',
    lineType: LineType.NUEVA,
    customerType: CustomerType.RESIDENCIAL,
    serviceType: ServiceType.DOBLE_PLAY,
    selectedPackageId: '',
    portNumber: '',
    
    // Documents
    siacImage: null,
    idType: IdType.INE,
    idDocFront: null,
    idDocBack: null,
    winbackDoc: null,
    addressDoc: null,
    portabilityDocFront: null,
    portabilityDocBack: null,
    constitutiveActDoc: null,
  });

  const [idVerificationStatus, setIdVerificationStatus] = useState<'idle' | 'scanning' | 'matched' | 'mismatch' | 'error'>('idle');
  const [matchedName, setMatchedName] = useState<string>('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [duplicateFolioError, setDuplicateFolioError] = useState(false);

  // Search/Consult State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');
  const [searchStatus, setSearchStatus] = useState<string>('');

  // Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_USER_PROFILE);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [newPostContent, setNewPostContent] = useState('');

  // Messages State
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [newMessageInput, setNewMessageInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auth Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock validation
    if (authInput && authPassword) {
      setIsAuthenticated(true);
      // Reset form
      setAuthInput('');
      setAuthPassword('');
    } else {
      alert("Por favor ingresa tus credenciales");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (
        registerName && 
        registerEmail && 
        registerDob && 
        registerCurp && 
        registerPhone && 
        registerNetwork &&
        authPassword && 
        registerConfirmPassword
    ) {
      if (authPassword !== registerConfirmPassword) {
          alert("Las contraseñas no coinciden.");
          return;
      }

      // Generate System Username
      // Logic: First Name + First 4 of CURP + Random 2 digits
      const firstName = registerName.split(' ')[0].toUpperCase();
      const curpFragment = registerCurp.substring(0, 4).toUpperCase();
      const randomDigits = Math.floor(10 + Math.random() * 90);
      const generatedUser = `${firstName}${curpFragment}${randomDigits}`;

      alert(`Registro exitoso.\n\nTU USUARIO ASIGNADO ES: ${generatedUser}\n\nPor favor anótalo e inicia sesión.`);
      
      // Switch to login and prefill
      setAuthInput(generatedUser);
      setAuthPassword(''); // Clear password so they have to type it
      setAuthView('login');
      
      // Reset Register Fields
      setRegisterName('');
      setRegisterEmail('');
      setRegisterDob('');
      setRegisterCurp('');
      setRegisterPhone('');
      setRegisterNetwork('');
      setRegisterConfirmPassword('');

    } else {
       alert("Por favor completa todos los campos obligatorios");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('register');
  }

  // Handle AI Extracted Data
  const handleDataExtracted = (data: ExtractedData) => {
    const newFolio = data.folioSiac || formData.folioSiac;
    
    // Check duplication on extraction
    const isDuplicate = EXISTING_FOLIOS.some(f => f.id === newFolio);
    setDuplicateFolioError(isDuplicate);

    setFormData(prev => ({
      ...prev,
      folioSiac: newFolio,
      customerName: data.fullName || prev.customerName,
      email: data.email || prev.email,
      clientNumber: data.clientNumber || prev.clientNumber
    }));
  };

  const handleFolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setFormData({...formData, folioSiac: newVal});
    
    // Check duplication
    const isDuplicate = EXISTING_FOLIOS.some(f => f.id === newVal);
    setDuplicateFolioError(isDuplicate);
  }

  // Logic: Handle Service Type restrictions based on Line Type
  useEffect(() => {
    if (formData.lineType === LineType.PORTADA) {
      if (formData.serviceType !== ServiceType.DOBLE_PLAY) {
        setFormData(prev => ({ ...prev, serviceType: ServiceType.DOBLE_PLAY }));
      }
    }
  }, [formData.lineType, formData.serviceType]);

  // Filter Packages
  const availablePackages = useMemo(() => {
    return PACKAGES.filter(pkg => {
      if (pkg.customerType !== formData.customerType) return false;
      if (formData.serviceType === ServiceType.WINBACK) return true;
      if (pkg.type !== formData.serviceType) return false; 
      return true;
    });
  }, [formData.customerType, formData.serviceType]);

  const selectedPackage = useMemo(() => {
    return PACKAGES.find(p => p.id === formData.selectedPackageId);
  }, [formData.selectedPackageId]);

  // Search Logic
  const filteredFolios = useMemo(() => {
    return EXISTING_FOLIOS.filter(folio => {
      // 1. Text Search (Folio ID)
      const matchesText = folio.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Date Range Search
      let matchesDate = true;
      const folioDate = new Date(folio.date);
      if (searchStartDate) {
        const start = new Date(searchStartDate);
        if (folioDate < start) matchesDate = false;
      }
      if (searchEndDate) {
        const end = new Date(searchEndDate);
        if (folioDate > end) matchesDate = false;
      }

      // 3. Status Search
      let matchesStatus = true;
      if (searchStatus && searchStatus !== '') {
        if (folio.status !== searchStatus) matchesStatus = false;
      }

      return matchesText && matchesDate && matchesStatus;
    });
  }, [searchQuery, searchStartDate, searchEndDate, searchStatus]);

  // ID Validation Logic
  const handleIdUpload = async (file: File | null) => {
      setFormData(prev => ({ ...prev, idDocFront: file }));
      if (file && formData.customerName) {
          setIdVerificationStatus('scanning');
          try {
             const reader = new FileReader();
             reader.onloadend = async () => {
                 const base64String = reader.result as string;
                 const base64Data = base64String.split(',')[1];
                 const extractedName = await extractNameFromImage(base64Data);
                 if (extractedName) {
                     setMatchedName(extractedName);
                     const formNameLower = formData.customerName.toLowerCase();
                     const extractedNameLower = extractedName.toLowerCase();
                     // Simple inclusion check to account for middle names or slight variations
                     if (formNameLower.includes(extractedNameLower) || extractedNameLower.includes(formNameLower)) {
                         setIdVerificationStatus('matched');
                     } else {
                         setIdVerificationStatus('mismatch');
                     }
                 } else {
                     setIdVerificationStatus('error');
                 }
             };
             reader.readAsDataURL(file);
          } catch (e) {
              console.error(e);
              setIdVerificationStatus('error');
          }
      } else {
          setIdVerificationStatus('idle');
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateFolioError) {
        alert("No se puede registrar un folio duplicado.");
        return;
    }
    console.log("Submitting Form:", formData);
    alert("Venta registrada con éxito (Simulación)");
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  };

  // PDF Generation
  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
        const doc = new jsPDF();
        let yOffset = 10;
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 10;
        
        doc.setFontSize(16);
        doc.text(`Expediente: ${formData.folioSiac || 'SIN FOLIO'}`, margin, yOffset);
        yOffset += 10;
        doc.setFontSize(12);
        doc.text(`Cliente: ${formData.customerName || 'N/A'}`, margin, yOffset);
        yOffset += 6;
        doc.text(`Fecha: ${formData.date}`, margin, yOffset);
        yOffset += 6;
        doc.text(`Paquete: ${selectedPackage?.name || 'N/A'}`, margin, yOffset);
        yOffset += 10;

        const addImageToDoc = async (file: File | null, title: string) => {
            if (!file) return;
            try {
                const base64 = await fileToBase64(file);
                doc.addPage();
                doc.setFontSize(14);
                doc.text(title, margin, 20);
                const imgProps = doc.getImageProperties(base64);
                const pdfWidth = pageWidth - (margin * 2);
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                let renderHeight = pdfHeight;
                if (renderHeight > (pageHeight - 40)) {
                    renderHeight = pageHeight - 40;
                }
                doc.addImage(base64, 'JPEG', margin, 30, pdfWidth, renderHeight);
            } catch (e) {
                console.error(`Error adding image ${title}`, e);
            }
        };

        if (formData.siacImage) await addImageToDoc(formData.siacImage, "Captura Folio SIAC");
        if (formData.idDocFront) await addImageToDoc(formData.idDocFront, `Identificación (${formData.idType}) - Frente`);
        if (formData.idDocBack) await addImageToDoc(formData.idDocBack, `Identificación (${formData.idType}) - Reverso`);
        if (formData.addressDoc) await addImageToDoc(formData.addressDoc, "Comprobante de Domicilio");
        if (formData.winbackDoc) await addImageToDoc(formData.winbackDoc, "Estado de Cuenta (Winback)");
        if (formData.portabilityDocFront) await addImageToDoc(formData.portabilityDocFront, "Anexo Portabilidad - Frente");
        if (formData.portabilityDocBack) await addImageToDoc(formData.portabilityDocBack, "Anexo Portabilidad - Reverso");
        if (formData.constitutiveActDoc) await addImageToDoc(formData.constitutiveActDoc, "Acta Constitutiva");

        const filename = `${formData.folioSiac || 'EXPEDIENTE'}.pdf`;
        doc.save(filename);

    } catch (error) {
        console.error("Error generating PDF", error);
        alert("Hubo un error al generar el PDF.");
    } finally {
        setGeneratingPdf(false);
    }
  };

  // Excel (CSV) Export Logic
  const handleExportExcel = () => {
    // 1. Define Headers
    const headers = [
        "Fecha de Captura",
        "Folio SIAC",
        "Nombre de Cliente",
        "Email",
        "Número de Celular",
        "Nombre del Usuario",
        "Línea Contratada",
        "Tipo de Línea",
        "Tipo de Servicio",
        "Paquete",
        "Estatus"
    ];

    // 2. Map Data to Rows
    const rows = filteredFolios.map(f => [
        f.date,
        f.id,
        f.customerName,
        f.email,
        f.cellNumber,
        f.promoterName,
        f.lineType,
        f.customerType,
        f.serviceType,
        f.packageName,
        f.status
    ]);

    // 3. Convert to CSV string
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(",")) // Quote cells to handle commas in data
    ].join("\n");

    // 4. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_folios_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Profile Interaction Handlers
  const handleFollow = () => {
      setUserProfile(prev => ({
          ...prev,
          followers: prev.followers + 1
      }));
      alert("¡Ahora sigues a este usuario!");
  };

  const handleLikeProfile = () => {
      setUserProfile(prev => ({
          ...prev,
          likes: prev.likes + 1
      }));
  };

  const handleCreatePost = () => {
      if (!newPostContent.trim()) return;
      const newPost: Post = {
          id: `p-${Date.now()}`,
          authorName: userProfile.name,
          authorRole: 'Gerente (Tú)', // Simulating Manager Role
          content: newPostContent,
          date: 'Ahora mismo',
          likes: 0,
          isManagerPost: true
      };
      setPosts([newPost, ...posts]);
      setNewPostContent('');
  };

  const handleLikePost = (postId: string) => {
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  };

  // Chat/Messaging Logic
  useEffect(() => {
    if (currentView === 'messages' && chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentView, chatMessages, selectedContactId]);

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessageInput.trim() || !selectedContactId) return;

      const newMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          senderId: 'me',
          receiverId: selectedContactId,
          text: newMessageInput,
          timestamp: new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})
      };

      setChatMessages(prev => [...prev, newMsg]);
      setNewMessageInput('');

      // Simulate Reply
      setTimeout(() => {
          const replyMsg: ChatMessage = {
            id: `msg-${Date.now() + 1}`,
            senderId: selectedContactId,
            receiverId: 'me',
            text: 'Entendido, lo revisaré en breve. ¡Gracias!',
            timestamp: new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})
          };
          setChatMessages(prev => [...prev, replyMsg]);
      }, 1500);
  };

  const activeMessages = useMemo(() => {
      if (!selectedContactId) return [];
      return chatMessages.filter(m => 
        (m.senderId === 'me' && m.receiverId === selectedContactId) ||
        (m.senderId === selectedContactId && m.receiverId === 'me')
      );
  }, [chatMessages, selectedContactId]);


  const inputClass = "w-full bg-app-input border-2 border-app-input rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 font-bold transition-all";
  const labelClass = "flex items-center gap-3 text-lg font-bold text-gray-200 mb-2";
  const selectClass = `${inputClass} appearance-none cursor-pointer pr-10 pl-12`;

  const ChevronDownIcon = () => (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
    </div>
  );

  // AUTH VIEW (LOGIN / REGISTER)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#286eae] relative overflow-hidden">
         <ParticleNetwork />
         <div className={`w-full ${authView === 'register' ? 'max-w-2xl' : 'max-w-md'} bg-[#21313e]/90 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-[#25343f] max-h-[90vh] overflow-y-auto relative z-10`}>
            <div className="text-center mb-8">
               <h1 className="text-3xl font-extrabold text-white mb-2">
                 {authView === 'login' ? 'Iniciar Sesión' : 'Registro de Promotor'}
               </h1>
               <p className="text-gray-400 font-bold">
                 {authView === 'login' ? 'Registro de Ventas' : 'Crea tu cuenta para comenzar'}
               </p>
            </div>

            <form onSubmit={authView === 'login' ? handleLogin : handleRegister} className="space-y-6">
                
                {authView === 'register' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-gray-300 font-bold mb-2">Nombre Completo</label>
                      <input 
                        type="text" 
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className={inputClass}
                        placeholder="Nombre(s) y Apellidos"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-2">Fecha de Nacimiento</label>
                      <input 
                        type="date" 
                        value={registerDob}
                        onChange={(e) => setRegisterDob(e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-2">CURP</label>
                      <input 
                        type="text" 
                        value={registerCurp}
                        onChange={(e) => setRegisterCurp(e.target.value.toUpperCase())}
                        className={inputClass}
                        placeholder="Clave Única..."
                        maxLength={18}
                        required
                      />
                    </div>

                     <div>
                      <label className="block text-gray-300 font-bold mb-2">Correo Electrónico</label>
                      <input 
                        type="email" 
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className={inputClass}
                        placeholder="ejemplo@correo.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-2">Número Celular</label>
                      <input 
                        type="tel" 
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        className={inputClass}
                        placeholder="(55) 0000 0000"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-2">Red de Distribución</label>
                      <select 
                        value={registerNetwork}
                        onChange={(e) => setRegisterNetwork(e.target.value)}
                        className={inputClass + " appearance-none"}
                        required
                      >
                         <option value="">Selecciona Red / Punto</option>
                         <option value="INTERNA">Red Interna (Directo)</option>
                         <option value="DISTRIBUIDOR">Distribuidor Autorizado</option>
                         <option value="CAMBACEO">Cambaceo / Campo</option>
                         <option value="CALL_CENTER">Call Center</option>
                      </select>
                    </div>
                  </div>
                )}

                {authView === 'login' && (
                <div>
                   <label className="block text-gray-300 font-bold mb-2">Usuario</label>
                   <input 
                      type="text" 
                      value={authInput}
                      onChange={(e) => setAuthInput(e.target.value)}
                      className={inputClass}
                      placeholder="Ingresa tu usuario asignado"
                      required
                   />
                </div>
                )}

                <div>
                   <label className="block text-gray-300 font-bold mb-2">
                       {authView === 'register' ? 'Crear Contraseña' : 'Contraseña'}
                   </label>
                   <div className="relative">
                      <input 
                          type={showPassword ? "text" : "password"} 
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className={inputClass}
                          placeholder="••••••••"
                          required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-white"
                      >
                         {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                            </svg>
                         ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                         )}
                      </button>
                   </div>
                </div>

                {authView === 'register' && (
                    <div>
                        <label className="block text-gray-300 font-bold mb-2">Confirmar Contraseña</label>
                        <input 
                            type="password"
                            value={registerConfirmPassword}
                            onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                            className={inputClass}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                )}

                {authView === 'login' && (
                  <div className="flex items-center justify-between">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="form-checkbox h-4 w-4 text-orange-500 rounded border-gray-600 bg-gray-700 focus:ring-orange-500"
                        />
                        <span className="text-gray-300 text-sm font-bold">Recordar usuario</span>
                     </label>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-400 text-white font-extrabold py-3 rounded-lg shadow-lg transition-transform active:scale-[0.98]"
                >
                   {authView === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </button>
            </form>

            <div className="mt-6 text-center">
               <button 
                 onClick={() => {
                   setAuthView(authView === 'login' ? 'register' : 'login');
                   // Reset fields
                   setAuthInput('');
                   setAuthPassword('');
                   setRegisterName('');
                   setRegisterDob('');
                   setRegisterCurp('');
                   setRegisterPhone('');
                   setRegisterNetwork('');
                   setRegisterConfirmPassword('');
                 }}
                 className="text-blue-400 hover:text-blue-300 font-bold text-sm underline"
               >
                  {authView === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia Sesión'}
               </button>
            </div>
         </div>
      </div>
    );
  }

  // MAIN APP VIEW
  return (
    <div className="min-h-screen font-sans pb-12">
        
      {/* Header */}
      <header className="bg-black border-b-4 border-orange-500 py-6 mb-4 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 md:px-8 flex justify-between items-center">
          <div className="w-8"></div> {/* Spacer for centering */}
          <h1 className="text-3xl font-extrabold tracking-tight text-white text-center">Registro de Ventas</h1>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white" title="Cerrar Sesión">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 mb-6">
        <div className="flex bg-app-form rounded-lg p-1 border border-app-input overflow-hidden">
            <button 
                onClick={() => setCurrentView('register')}
                className={`flex-1 py-3 rounded-md font-bold text-base md:text-lg transition-colors ${currentView === 'register' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
                Registro
            </button>
            <button 
                onClick={() => setCurrentView('consult')}
                className={`flex-1 py-3 rounded-md font-bold text-base md:text-lg transition-colors ${currentView === 'consult' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
                Consulta
            </button>
             <button 
                onClick={() => setCurrentView('profile')}
                className={`flex-1 py-3 rounded-md font-bold text-base md:text-lg transition-colors ${currentView === 'profile' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
                Mi Perfil
            </button>
            <button 
                onClick={() => setCurrentView('messages')}
                className={`flex-1 py-3 rounded-md font-bold text-base md:text-lg transition-colors ${currentView === 'messages' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
                Mensajes
            </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8">

        {currentView === 'register' && (
        // VIEW: REGISTRO
        <>
            <SmartScanner 
                onDataExtracted={handleDataExtracted} 
                onFileSelected={(file) => setFormData(prev => ({ ...prev, siacImage: file }))}
            />

            <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 0: General Info */}
            <section className="bg-app-form p-6 rounded-xl shadow-lg border border-app-input">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <label className={labelClass}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Promotor
                    </label>
                    <input type="text" value={formData.promoterName} readOnly className={inputClass + " opacity-80 cursor-default bg-gray-700/50"} />
                    </div>
                    <div>
                    <label className={labelClass}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Fecha
                    </label>
                    <input type="text" value={formData.date} readOnly className={inputClass + " opacity-80 cursor-default bg-gray-700/50"} />
                    </div>
                </div>
            </section>

            {/* Section 1: Customer Data */}
            <section className="bg-app-form p-6 rounded-xl shadow-lg border border-app-input">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">1. Datos del Cliente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClass}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Folio SIAC
                    </label>
                    <input 
                        type="text" 
                        className={`${inputClass} ${duplicateFolioError ? 'border-red-500 focus:border-red-500 bg-red-500/10' : ''}`} 
                        value={formData.folioSiac} 
                        onChange={handleFolioChange} 
                        placeholder="Ej. S-12345678" 
                    />
                    {duplicateFolioError && (
                         <div className="mt-3 bg-red-900/80 border-l-4 border-red-500 rounded-r-lg p-4 flex items-start gap-3 shadow-lg backdrop-blur-sm animate-fadeIn">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                             <div>
                                 <p className="text-white font-bold text-base">Folio Duplicado Detectado</p>
                                 <p className="text-red-200 text-sm mt-1">
                                     El folio <span className="font-mono bg-red-950 px-1 rounded border border-red-800">{formData.folioSiac}</span> ya existe en la base de datos. Por favor verifica o ingresa uno nuevo.
                                 </p>
                             </div>
                         </div>
                    )}
                </div>
                <div>
                    <label className={labelClass}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Nombre Completo
                    </label>
                    <div className="relative">
                        <input 
                            type="text" 
                            className={`${inputClass} ${idVerificationStatus !== 'idle' ? 'pr-12' : ''}`} 
                            value={formData.customerName} 
                            onChange={e => setFormData({...formData, customerName: e.target.value})} 
                            placeholder="Nombre del Cliente" 
                        />
                        {idVerificationStatus === 'scanning' && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <svg className="animate-spin h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}
                        {idVerificationStatus === 'matched' && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3" title="Nombre coincide con ID">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                        {idVerificationStatus === 'mismatch' && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3" title={`No coincide con: ${matchedName}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                    {idVerificationStatus === 'mismatch' && (
                        <p className="text-red-400 text-xs mt-1 font-bold pl-1">
                            El nombre no coincide con la identificación.
                        </p>
                    )}
                </div>
                <div>
                    <label className={labelClass}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        Correo Electrónico
                    </label>
                    <input type="email" className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="cliente@email.com" />
                </div>
                <div>
                    <label className={labelClass}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        Número de Celular
                    </label>
                    <input type="tel" className={inputClass} value={formData.clientNumber} onChange={e => setFormData({...formData, clientNumber: e.target.value})} placeholder="5500000000" />
                </div>
                </div>
            </section>

            {/* Section 2: Details of Service */}
            <section className="bg-app-form p-6 rounded-xl shadow-lg border border-app-input">
                <h2 className="text-xl font-bold text-white mb-6">2. Detalles del Servicio</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className={labelClass}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>Línea Contratada</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                            <select className={selectClass} value={formData.lineType} onChange={e => setFormData({...formData, lineType: e.target.value as LineType})}>
                                <option value={LineType.NUEVA}>Línea Nueva</option>
                                <option value={LineType.PORTADA}>Portabilidad</option>
                            </select>
                            <ChevronDownIcon />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>Tipo de Línea</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                {formData.customerType === CustomerType.RESIDENCIAL ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                )}
                            </div>
                            <select className={selectClass} value={formData.customerType} onChange={e => setFormData({...formData, customerType: e.target.value as CustomerType})}>
                                <option value={CustomerType.RESIDENCIAL}>Residencial</option>
                                <option value={CustomerType.NEGOCIO}>Negocio</option>
                            </select>
                            <ChevronDownIcon />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>Tipo de Servicio</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                {formData.serviceType === ServiceType.DOBLE_PLAY && <div className="flex gap-0.5"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.778 8.232c-2.438-2.438-6.393-2.438-8.831 0a1 1 0 01-1.414-1.414C10.586 3.768 15.414 3.768 18.465 6.818a1 1 0 01-.687 1.414zM14.95 11.06a3.535 3.535 0 00-4.95 0 1 1 0 01-1.414-1.414 5.535 5.535 0 017.778 0 1 1 0 01-1.414 1.414zM12.12 13.889a1.536 1.536 0 00-2.171 0 1 1 0 01-1.415-1.414 3.535 3.535 0 015.001 0 1 1 0 01-1.415 1.414z" clipRule="evenodd" /></svg></div>}
                                {formData.serviceType === ServiceType.INFINITUM_PURO && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.778 8.232c-2.438-2.438-6.393-2.438-8.831 0a1 1 0 01-1.414-1.414C10.586 3.768 15.414 3.768 18.465 6.818a1 1 0 01-.687 1.414zM14.95 11.06a3.535 3.535 0 00-4.95 0 1 1 0 01-1.414-1.414 5.535 5.535 0 017.778 0 1 1 0 01-1.414 1.414zM12.12 13.889a1.536 1.536 0 00-2.171 0 1 1 0 01-1.415-1.414 3.535 3.535 0 015.001 0 1 1 0 01-1.415 1.414z" clipRule="evenodd" /></svg>}
                                {formData.serviceType === ServiceType.WINBACK && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>}
                            </div>
                            <select className={selectClass} value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value as ServiceType})}>
                                <option value={ServiceType.DOBLE_PLAY}>Doble Play (Telefonía e Internet)</option>
                                {formData.lineType === LineType.NUEVA && (
                                <>
                                    <option value={ServiceType.INFINITUM_PURO}>Infinitum Puro (Solo Internet)</option>
                                    <option value={ServiceType.WINBACK}>Winback (Cliente Recuperado)</option>
                                </>
                                )}
                            </select>
                            <ChevronDownIcon />
                        </div>
                    </div>
                    {formData.lineType === LineType.PORTADA ? (
                        <div>
                            <label className={labelClass + " text-blue-200"}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>Número a Portar (10 dígitos)</label>
                            <input type="tel" maxLength={10} className={inputClass + " border-blue-500/50"} value={formData.portNumber} onChange={e => setFormData({...formData, portNumber: e.target.value})} placeholder="Ej. 5512345678" />
                        </div>
                    ) : ( <div className="hidden md:block"></div> )}
                </div>

                <div>
                    <label className={labelClass}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>Paquete</label>
                    {availablePackages.length > 0 ? (
                        <div className="space-y-4">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg></div>
                            <select className={selectClass} value={formData.selectedPackageId} onChange={e => setFormData({...formData, selectedPackageId: e.target.value})}>
                            <option value="">-- Selecciona una opción --</option>
                            {availablePackages.map(pkg => (
                                <option key={pkg.id} value={pkg.id}>{pkg.name} - ${pkg.price}</option>
                            ))}
                            </select>
                            <ChevronDownIcon />
                        </div>
                        {selectedPackage && (
                            <div className="bg-blue-600/20 border border-blue-500 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center animate-fadeIn">
                            <div>
                                <span className="font-bold text-lg block text-white">{selectedPackage.name}</span>
                                {selectedPackage.type === ServiceType.DOBLE_PLAY && (
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/30">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                            <span className="text-xs font-bold text-orange-400">Telefonía</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/30">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.778 8.232c-2.438-2.438-6.393-2.438-8.831 0a1 1 0 01-1.414-1.414C10.586 3.768 15.414 3.768 18.465 6.818a1 1 0 01-.687 1.414zM14.95 11.06a3.535 3.535 0 00-4.95 0 1 1 0 01-1.414-1.414 5.535 5.535 0 017.778 0 1 1 0 01-1.414 1.414zM12.12 13.889a1.536 1.536 0 00-2.171 0 1 1 0 01-1.415-1.414 3.535 3.535 0 015.001 0 1 1 0 01-1.415 1.414z" clipRule="evenodd" /></svg>
                                            <span className="text-xs font-bold text-orange-400">WiFi</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 sm:mt-0">
                                <span className="font-extrabold text-2xl text-green-400">${selectedPackage.price}</span>
                                <span className="text-xs text-gray-400 block text-right font-bold">mensual</span>
                            </div>
                            </div>
                        )}
                        </div>
                    ) : ( <div className="text-gray-400 font-bold py-4 text-center border-2 border-dashed border-gray-600 rounded-lg">No hay paquetes disponibles para esta configuración.</div> )}
                </div>
            </section>

            {/* Section 3: Documents */}
            <section className="bg-app-form p-6 rounded-xl shadow-lg border border-app-input">
                <h2 className="text-xl font-bold text-white mb-6">3. Documentación</h2>
                <div className="mb-6">
                    <label className={labelClass}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>Tipo de Identificación</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg></div>
                        <select className={selectClass} value={formData.idType} onChange={e => setFormData({...formData, idType: e.target.value as IdType})}>
                            <option value={IdType.INE}>INE (Frente y Vuelta)</option>
                            <option value={IdType.CURP}>CURP</option>
                        </select>
                        <ChevronDownIcon />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="col-span-1 sm:col-span-2 lg:col-span-2 space-y-4">
                        {idVerificationStatus === 'scanning' && (<div className="bg-blue-500/20 text-blue-300 px-3 py-2 rounded text-sm font-bold flex items-center gap-2">Verificando nombre con IA...</div>)}
                        {idVerificationStatus === 'matched' && (<div className="bg-green-500/20 text-green-400 px-3 py-2 rounded text-sm font-bold flex items-center gap-2">Nombre verificado: {matchedName}</div>)}
                        {idVerificationStatus === 'mismatch' && (<div className="bg-red-500/20 text-red-400 px-3 py-2 rounded text-sm font-bold flex items-center gap-2">Alerta: El nombre en la ID ({matchedName}) no coincide.</div>)}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FileUpload label={<><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>Identificación - {formData.idType} (Frente)</>} accept="image/*,.pdf" onChange={handleIdUpload} />
                            {formData.idType === IdType.INE && <FileUpload label={<><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>Identificación - INE (Reverso)</>} accept="image/*,.pdf" onChange={(file) => setFormData({...formData, idDocBack: file})} />}
                        </div>
                </div>
                {formData.serviceType === ServiceType.WINBACK ? (
                    <FileUpload label={<><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Estado de Cuenta Megacable (Max 2 meses)</>} accept="image/*,.pdf" onChange={(file) => setFormData({...formData, winbackDoc: file})} />
                ) : (
                    <FileUpload label={<><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>Comprobante de Domicilio (Opcional)</>} accept="image/*,.pdf" onChange={(file) => setFormData({...formData, addressDoc: file})} />
                )}
                {formData.lineType === LineType.PORTADA && (
                    <>
                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 border-t border-gray-700 my-2"></div>
                        <FileUpload label={<><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>Anexo de Portabilidad (Frente)</>} accept="image/*,.pdf" onChange={(file) => setFormData({...formData, portabilityDocFront: file})} />
                        <FileUpload label={<><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>Anexo de Portabilidad (Reverso)</>} accept="image/*,.pdf" onChange={(file) => setFormData({...formData, portabilityDocBack: file})} />
                    </>
                )}
                {formData.customerType === CustomerType.NEGOCIO && (
                    <>
                        <div className="col-span-1 sm:col-span-2 lg:col-span-3 border-t border-gray-700 my-2"></div>
                        <FileUpload label={<><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>Acta Constitutiva (Opcional)</>} accept="image/*,.pdf" onChange={(file) => setFormData({...formData, constitutiveActDoc: file})} />
                    </>
                )}
                </div>
            </section>

            {/* Submit Action */}
            <div className="pt-4 pb-12">
                <button type="submit" disabled={duplicateFolioError} className={`w-full text-white font-extrabold text-xl py-4 rounded-xl shadow-xl transform transition-transform active:scale-[0.99] border-b-4 ${duplicateFolioError ? 'bg-gray-500 border-gray-700 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400 border-orange-700'}`}>
                    REGISTRAR FOLIO
                </button>
            </div>

            {/* Admin Area (Bottom of screen) */}
            <div className="border-t border-gray-700 pt-8 pb-8 text-center">
                <h3 className="text-gray-400 text-sm mb-4 font-bold uppercase tracking-widest">Área de Supervisores</h3>
                <button type="button" onClick={handleDownloadPdf} disabled={generatingPdf} className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full transition-colors">
                    {generatingPdf ? 'Generando PDF...' : 'Descargar Expediente (PDF)'}
                </button>
            </div>

            </form>
        </>
        )}
        
        {currentView === 'consult' && (
            // VIEW: CONSULTA DE FOLIOS
            <div className="bg-app-form p-6 rounded-xl shadow-lg border border-app-input animate-fadeIn">
                <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Consulta de Folios
                     </h2>
                     <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Descargar Excel
                     </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div>
                        <label className="flex items-center gap-2 text-gray-400 font-bold text-sm mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Buscar Folio
                        </label>
                        <input 
                            type="text" 
                            className="w-full bg-app-input border border-gray-600 rounded p-2 text-white" 
                            placeholder="Ej. S-123456" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div>
                         <label className="flex items-center gap-2 text-gray-400 font-bold text-sm mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Fecha Inicial
                         </label>
                         <input 
                            type="date" 
                            className="w-full bg-app-input border border-gray-600 rounded p-2 text-white" 
                            value={searchStartDate}
                            onChange={(e) => setSearchStartDate(e.target.value)}
                         />
                    </div>
                     <div>
                         <label className="flex items-center gap-2 text-gray-400 font-bold text-sm mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Fecha Final
                         </label>
                         <input 
                            type="date" 
                            className="w-full bg-app-input border border-gray-600 rounded p-2 text-white" 
                            value={searchEndDate}
                            onChange={(e) => setSearchEndDate(e.target.value)}
                         />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-gray-400 font-bold text-sm mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Estatus
                        </label>
                        <select 
                            className="w-full bg-app-input border border-gray-600 rounded p-2 text-white"
                            value={searchStatus}
                            onChange={(e) => setSearchStatus(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {Object.values(FolioStatus).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-gray-800 text-gray-100 uppercase font-bold">
                            <tr>
                                <th className="p-3 rounded-tl-lg">Fecha</th>
                                <th className="p-3">Folio</th>
                                <th className="p-3">Cliente</th>
                                <th className="p-3">Promotor</th>
                                <th className="p-3">Paquete</th>
                                <th className="p-3 rounded-tr-lg">Estatus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {filteredFolios.length > 0 ? (
                                filteredFolios.map((folio) => (
                                    <tr key={folio.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-3 font-mono">{folio.date}</td>
                                        <td className="p-3 font-bold text-orange-400">{folio.id}</td>
                                        <td className="p-3">
                                            <div className="font-bold text-white">{folio.customerName}</div>
                                            <div className="text-xs">{folio.cellNumber}</div>
                                        </td>
                                        <td className="p-3">{folio.promoterName}</td>
                                        <td className="p-3">{folio.packageName}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                folio.status === FolioStatus.POSTEADA ? 'bg-green-500/20 text-green-400' :
                                                folio.status === FolioStatus.CANCELADA ? 'bg-red-500/20 text-red-400' :
                                                folio.status === FolioStatus.PROCESO_INSTALACION ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {folio.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 font-bold">
                                        No se encontraron folios con los filtros seleccionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {currentView === 'profile' && (
            // VIEW: MI PERFIL & PUBLICACIONES
            <div className="space-y-6">
                
                {/* Profile Card */}
                <div className="bg-app-form p-6 rounded-xl shadow-lg border border-app-input flex flex-col items-center sm:flex-row gap-6">
                    <div className="relative">
                        <img 
                            src={userProfile.photoUrl} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full border-4 border-orange-500 shadow-xl object-cover"
                        />
                        <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-2 border-app-form"></div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-3xl font-extrabold text-white">{userProfile.name}</h2>
                        <p className="text-orange-400 font-bold text-lg mb-4">{userProfile.role}</p>
                        
                        <div className="flex flex-wrap justify-center sm:justify-start gap-4 mb-4">
                            <div className="bg-app-input px-4 py-2 rounded-lg text-center min-w-[100px]">
                                <span className="block text-2xl font-bold text-white">{userProfile.followers}</span>
                                <span className="text-xs text-gray-400 font-bold uppercase">Seguidores</span>
                            </div>
                            <div className="bg-app-input px-4 py-2 rounded-lg text-center min-w-[100px]">
                                <span className="block text-2xl font-bold text-white">{userProfile.following}</span>
                                <span className="text-xs text-gray-400 font-bold uppercase">Siguiendo</span>
                            </div>
                            <div className="bg-app-input px-4 py-2 rounded-lg text-center min-w-[100px]">
                                <span className="block text-2xl font-bold text-white">{userProfile.likes}</span>
                                <span className="text-xs text-gray-400 font-bold uppercase">Likes Recibidos</span>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center sm:justify-start">
                             <button onClick={handleLikeProfile} className="bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-transform active:scale-95">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                Dar Like
                             </button>
                             <button onClick={handleFollow} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-transform active:scale-95">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                </svg>
                                Seguir
                             </button>
                        </div>
                    </div>
                </div>

                {/* News Feed Header */}
                <div className="bg-app-form p-6 rounded-xl shadow-lg border border-app-input">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        Avisos Generales (Muro de Gerencia)
                    </h3>
                    
                    {/* Create Post (Simulating Manager) */}
                    <div className="bg-app-input p-4 rounded-lg mb-6">
                        <textarea 
                            className="w-full bg-gray-800 text-white p-3