import React, { useState, useRef } from 'react';
import { ExtractedData } from '../types';
import { extractDataFromImage } from '../services/geminiService';

interface SmartScannerProps {
  onDataExtracted: (data: ExtractedData) => void;
  onFileSelected: (file: File) => void;
}

export const SmartScanner: React.FC<SmartScannerProps> = ({ onDataExtracted, onFileSelected }) => {
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onFileSelected(file); // Pass file back to parent
    setIsScanning(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64String.split(',')[1];
        
        try {
            const data = await extractDataFromImage(base64Data);
            onDataExtracted(data);
        } catch (err) {
            console.error("Error processing image", err);
            alert("No se pudieron extraer los datos. Por favor intenta con una imagen más clara.");
        } finally {
            setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-app-form p-4 rounded-lg shadow-lg mb-6 border border-app-input">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Escaneo Inteligente
            </h3>
            <p className="text-gray-300 text-sm font-bold">
                Sube tu captura del Folio SIAC.
            </p>
        </div>
        
        <div className="relative">
            <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*" 
                onChange={handleFileChange}
                className="hidden"
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className={`px-6 py-3 rounded-lg font-bold text-white transition-all shadow-md ${
                    isScanning ? 'bg-gray-500 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400 active:bg-orange-600'
                }`}
            >
                {isScanning ? (
                    <span className="flex items-center gap-2">
                         <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                        Procesando...
                    </span>
                ) : 'Subir Captura'}
            </button>
        </div>
      </div>
    </div>
  );
};