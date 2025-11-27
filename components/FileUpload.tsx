import React from 'react';

interface FileUploadProps {
  label: React.ReactNode;
  accept?: string;
  onChange: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ label, accept, onChange }) => {
  const [fileName, setFileName] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileName(file ? file.name : null);
    onChange(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-gray-300 flex items-center gap-2">{label}</label>
      <div className="relative group">
        <div className="bg-app-input rounded-lg border-2 border-dashed border-gray-600 hover:border-blue-400 transition-colors p-4 text-center cursor-pointer">
          <input
            type="file"
            accept={accept}
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {fileName ? (
            <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {fileName}
            </div>
          ) : (
             <div className="text-gray-400 font-bold">
                <span className="text-blue-400">Clic para subir</span> o arrastra aquí
             </div>
          )}
        </div>
      </div>
    </div>
  );
};