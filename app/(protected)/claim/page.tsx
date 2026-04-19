'use client';
import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { UploadCloud, FileText, AlertCircle, CheckCircle2, Receipt } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';

import Image from 'next/image';

interface UserInfo {
  name: string;
  accountInfo: string;
}

export default function ClaimPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useLanguage();
  
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState('');
  
  const [extractedData, setExtractedData] = useState<{
    parkingName: string;
    fee: number;
    entryTime: string;
    exitTime: string;
  } | null>(null);

  const [parkingLots, setParkingLots] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/user').then(res => res.json()).then(data => {
      setUserInfo(data);
    });
    fetch('/api/parking-lots').then(res => res.json()).then(data => {
      setParkingLots(data.parkingLots || []);
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewURL(url);
    setError('');
    setExtractedData(null);
  };

  const handleExtract = async () => {
    if (!file) return;
    setIsExtracting(true);
    setError('');
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: file.type || "image/jpeg",
                    data: base64Data
                  }
                },
                {
                   text: `이 주차비 영수증 이미지에서 다음 정보를 축출해줘:
                   - 주차장 이름 (parkingName): 등록된 주차장(${parkingLots.map(p => p.name).join(', ')}) 중 가장 일치하는 이름, 확실하지 않으면 영수증에 적힌 이름 그대로 작성
                   - 주차비용 결제금액 숫자만 (fee)
                   - 입차 시간 (entryTime - YYYY-MM-DD HH:mm 형식)
                   - 출차 시간 (exitTime - YYYY-MM-DD HH:mm 형식)`
                }
              ]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  parkingName: { type: Type.STRING },
                  fee: { type: Type.NUMBER },
                  entryTime: { type: Type.STRING },
                  exitTime: { type: Type.STRING }
                },
                required: ["parkingName", "fee", "entryTime", "exitTime"]
              }
            }
          });

          const responseText = response.text || '';
          const parsed = JSON.parse(responseText.trim());
          setExtractedData(parsed);
        } catch (genErr: any) {
          setError(t('extractFailed') + genErr.message);
        } finally {
          setIsExtracting(false);
        }
      };
      
      reader.onerror = () => {
        setError(t('fileReadError'));
        setIsExtracting(false);
      }

    } catch (err: any) {
      setError(err.message);
      setIsExtracting(false);
    }
  };

  const resizeImageTo300KB = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Initial scale down if very large
          const MAX_DIMENSION = 1200;
          if (width > height && width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          } else if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Iteratively reduce quality to hit 300KB target
          let quality = 0.9;
          const attemptResize = () => {
            canvas.toBlob((blob) => {
              if (!blob) return resolve(file);
              if (blob.size <= 300 * 1024 || quality <= 0.3) {
                const resizedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
              } else {
                quality -= 0.15;
                attemptResize();
              }
            }, 'image/jpeg', quality);
          };
          
          attemptResize();
        };
      };
    });
  };

  const handleSubmit = async () => {
    if (!file || !extractedData) return;
    setIsSubmitting(true);
    setError('');

    try {
      const resizedFile = await resizeImageTo300KB(file);
      
      const formData = new FormData();
      formData.append('file', resizedFile);
      formData.append('parkingName', extractedData.parkingName);
      formData.append('fee', extractedData.fee.toString());
      formData.append('entryTime', extractedData.entryTime);
      formData.append('exitTime', extractedData.exitTime);

      const res = await fetch('/api/claims', {
        method: 'POST',
        body: formData,
      });

      // Handle non-JSON responses gracefully
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
         const textError = await res.text();
         throw new Error(res.status === 413 ? '파일 용량이 너무 큽니다.' : `서버 오류 발생: ${textError}`);
      }

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || '알 수 없는 서버 오류');
      }
      
      alert(t('claimSuccess'));
      router.push('/history');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateApplicableFee = (name: string, originalFee: number) => {
    const validLot = parkingLots.find(p => p.name === name);
    if (!validLot) return originalFee;
    return Math.min(originalFee, validLot.maxFee);
  };

  const isInvalidParkingLot = !!(extractedData && !parkingLots.some(p => p.name === extractedData.parkingName));

  return (
    <div className="space-y-6 flex-1 flex flex-col">
      <header className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">{t('createClaim')}</h1>
        {extractedData && (
          <div className="text-sm font-medium text-slate-500">
            {t('receiptRecognized')} ({extractedData.entryTime.split(' ')[0]})
          </div>
        )}
      </header>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center text-sm border border-red-100 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 items-start">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 flex flex-col h-full shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wider">{t('receiptImg')}</label>
          <div className="flex-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center min-h-[400px] p-6 relative group overflow-hidden transition-colors hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer" onClick={() => !isExtracting && fileInputRef.current?.click()}>
            <input 
              type="file" 
              accept="image/*"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {previewURL ? (
              <div className="relative w-full h-[400px]">
                <Image src={previewURL} alt="Preview" fill className="object-contain drop-shadow-sm rounded" />
                <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg text-sm font-medium">{t('clickToChange')}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <UploadCloud size={48} className="mb-4 text-slate-300" />
                <p className="text-sm font-medium">{t('uploadPrompt1')}</p>
                <p className="text-xs mt-2 text-slate-400">{t('uploadPrompt2')}</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 mt-4">
            {file && !extractedData && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleExtract() }}
                disabled={isExtracting}
                className="w-full py-3.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 text-[0.95rem] shadow-sm"
              >
                <FileText className="w-5 h-5 mr-2" />
                {isExtracting ? t('recognizingBtn') : t('recognizeBtn')}
              </button>
            )}
          </div>
        </div>

        {extractedData ? (
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-full">
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{t('parkingName')}</label>
              <input type="text" readOnly value={extractedData.parkingName} className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-[0.95rem] outline-none" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('entryTime')}</label>
                <div className="flex gap-2">
                  <input type="text" readOnly value={extractedData.entryTime.split(' ')[0] || extractedData.entryTime} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none font-mono" placeholder="YYYY-MM-DD" />
                  <input type="text" readOnly value={extractedData.entryTime.split(' ')[1] || ''} className="w-24 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none text-center font-mono" placeholder="HH:mm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('exitTime')}</label>
                <div className="flex gap-2">
                  <input type="text" readOnly value={extractedData.exitTime.split(' ')[0] || extractedData.exitTime} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none font-mono" placeholder="YYYY-MM-DD" />
                  <input type="text" readOnly value={extractedData.exitTime.split(' ')[1] || ''} className="w-24 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none text-center font-mono" placeholder="HH:mm" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">{t('paymentAccount')}</label>
              <p className="text-[0.9rem] text-slate-800 font-mono mt-1">{userInfo?.accountInfo || t('noAccountInfo')}</p>
              <div className="text-xs text-slate-400 mt-2">{t('processGuide')}</div>
            </div>

            <div className="mb-8">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{t('claimAmount')}</label>
              <div className="relative">
                <input type="text" readOnly value={`${calculateApplicableFee(extractedData.parkingName, extractedData.fee).toLocaleString()}${t('currency')}`} className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-blue-600 text-xl font-bold outline-none" />
              </div>
              
              {extractedData.fee !== calculateApplicableFee(extractedData.parkingName, extractedData.fee) && !isInvalidParkingLot && (
                 <div className="mt-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2 border border-red-100">
                   <span>⚠️</span>
                   <div>
                     {t('limitApplied', { 
                       limit: calculateApplicableFee(extractedData.parkingName, extractedData.fee).toLocaleString(), 
                       actual: extractedData.fee.toLocaleString() 
                     })}
                   </div>
                 </div>
              )}
              {isInvalidParkingLot && (
                 <div className="mt-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2 border border-red-100">
                   <span>🚫</span>
                   <div>
                     {t('unregisteredParkingLot')}
                   </div>
                 </div>
              )}
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting || isInvalidParkingLot}
              className="w-full mt-auto py-3.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 text-base shadow-sm"
            >
              {isSubmitting ? t('submittingBtn') : t('submitBtn')}
            </button>
          </div>
        ) : (
          <div className="lg:col-span-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
            <Receipt size={48} className="mb-4 text-slate-300" />
            <p>{t('emptyClaim1')}</p>
            <p>{t('emptyClaim2')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
