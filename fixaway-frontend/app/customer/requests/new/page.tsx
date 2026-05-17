'use client';

import { useState, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { uploadApi, requestsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const MapPicker = dynamic(() => import('@/components/ui/MapPicker'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-surface-container animate-pulse flex items-center justify-center">Loading Map...</div>
});

function NewServiceRequestContent() {
  const { accessToken } = useAuthStore();
  const [mediaFiles, setMediaFiles] = useState<{ file: File; preview: string }[]>([]);
  const [location, setLocation] = useState({ lat: 25.2048, lng: 55.2708, address: 'Al Safa 1, Street 12C, Villa 42, Dubai' });
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const typeParam = searchParams?.get('type') || '';
  const initialCategory = typeParam.charAt(0).toUpperCase() + typeParam.slice(1);
  const [title, setTitle] = useState(initialCategory ? `${initialCategory} Issue` : '');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setMediaFiles(prev => [...prev, ...newFiles].slice(0, 4));
    }
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => {
      const newArr = [...prev];
      URL.revokeObjectURL(newArr[index].preview);
      newArr.splice(index, 1);
      return newArr;
    });
  };

  const handleSubmit = async () => {
    if (!accessToken) {
      setSubmitError('You must be logged in to submit a request.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Step 1: Upload all media files to Supabase Storage
      const mediaUrls: string[] = [];
      for (const { file } of mediaFiles) {
        const url = await uploadApi.uploadMedia(accessToken, file);
        mediaUrls.push(url);
      }

      // Step 2: Create the service request with the uploaded media URLs
      await requestsApi.create(accessToken, {
        title: title || 'New Service Request',
        description: description || 'No additional details provided.',
        type: typeParam.toUpperCase() === 'ROADSIDE' ? 'ROADSIDE' : 'HOME',
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        mediaUrls,
      });

      setSubmitSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="max-w-container-max mx-auto px-gutter pt-16 pb-12 flex flex-col items-center justify-center gap-lg text-center">
        <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h1 className="font-h1 text-h1 text-primary">Request Submitted!</h1>
        <p className="font-body-lg text-on-surface-variant max-w-md">Your service request has been posted. Technicians in your area will start sending quotations shortly.</p>
        <a href="/customer/requests" className="mt-md px-xl py-lg bg-secondary-container text-on-primary font-h2 rounded-lg shadow-lg hover:bg-secondary transition-all">
          View My Requests
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto px-gutter pt-8 pb-12">
      {/* Progress Indicator */}
      <div className="mb-xl max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-sm">
          <span className="font-label-caps text-label-caps text-primary uppercase">Step 3 of 5</span>
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Media Upload</span>
        </div>
        <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden flex flex-row-reverse">
          <div className="h-full bg-secondary-container w-[60%] transition-all duration-500"></div>
        </div>
      </div>

      <section className="max-w-3xl mx-auto space-y-lg">
        {/* Step 1 & 2 Preview */}
        <div className="flex flex-wrap gap-sm opacity-60">
          <div className="bg-primary-container/10 px-md py-sm rounded-lg flex items-center gap-xs">
            <span className="material-symbols-outlined text-sm">{typeParam ? typeParam === 'electrical' ? 'bolt' : typeParam === 'ac' ? 'ac_unit' : typeParam === 'carpentry' ? 'carpenter' : typeParam === 'painting' ? 'format_paint' : typeParam === 'roadside' ? 'car_repair' : 'plumbing' : 'home_repair_service'}</span>
            <span className="font-body-md text-sm">{initialCategory || 'Home Service'}</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-sm pt-md text-right">
          <label className="font-label-caps text-label-caps text-primary uppercase block">Issue Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full p-md border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white"
            placeholder="e.g. Leaking Faucet in Kitchen"
          />
        </div>

        {/* Header */}
        <div className="text-right md:text-right space-y-xs">
          <h1 className="font-h1 text-h1 text-primary">Diagnostic Media</h1>
          <p className="font-body-lg text-on-surface-variant">Help our technicians understand the issue with clear photos or a short video.</p>
        </div>

        {/* Media Upload Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="col-span-1 md:col-span-3 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <input type="file" hidden multiple accept="image/*,video/mp4" ref={fileInputRef} onChange={handleFileChange} />
            <div className="border-2 border-dashed border-outline-variant rounded-xl p-xl flex flex-col items-center justify-center space-y-md bg-white hover:border-primary hover:bg-primary/5 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
              </div>
              <div className="text-center">
                <p className="font-h2 text-primary">Upload Photos & Videos</p>
                <p className="font-body-md text-on-surface-variant">Drag and drop or click to browse</p>
              </div>
              <span className="font-label-caps text-label-caps bg-surface-container-high px-md py-xs rounded-full text-on-surface-variant uppercase">Max 25MB • JPG, PNG, MP4</span>
            </div>
          </div>

          {mediaFiles.map((media, idx) => (
            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm border border-outline-variant/30">
              {media.file.type.startsWith('video/') ? (
                <video className="w-full h-full object-cover" src={media.preview} />
              ) : (
                <img className="w-full h-full object-cover" alt="Media preview" src={media.preview} />
              )}
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="bg-white/90 p-sm rounded-full text-error hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="space-y-sm pt-lg text-right">
          <label className="font-label-caps text-label-caps text-primary uppercase block">Additional Details</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full min-h-[120px] p-md border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white"
            placeholder="Describe any specific noises, smells, or when the problem started..."
          />
        </div>

        {/* GPS Location Card */}
        <div className="glass-panel p-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col md:flex-row-reverse gap-lg items-center">
          <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 border border-outline-variant/50 relative">
             <div className="absolute inset-0 pointer-events-none z-10"></div>
             <MapPicker onLocationSelect={() => {}} initialLocation={{ lat: location.lat, lng: location.lng }} />
          </div>
          <div className="flex-grow space-y-xs text-center md:text-right">
            <h3 className="font-h2 text-primary">Service Location</h3>
            <p className="font-body-md text-on-surface-variant">{location.address}</p>
            <button onClick={() => setIsMapModalOpen(!isMapModalOpen)} className="text-secondary font-label-caps text-label-caps uppercase hover:underline">
              {isMapModalOpen ? 'Close Map' : 'Change Location'}
            </button>
          </div>
          <div className="flex-shrink-0">
            <span className="material-symbols-outlined text-secondary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
          </div>
        </div>

        {isMapModalOpen && (
          <div className="h-[400px] w-full rounded-xl overflow-hidden border border-outline-variant shadow-inner fade-in">
             <MapPicker initialLocation={{ lat: location.lat, lng: location.lng }} onLocationSelect={(lat, lng, address) => setLocation({ lat, lng, address })} />
          </div>
        )}

        {submitError && (
          <div className="p-md rounded-lg bg-error/10 border border-error/30 text-error font-body-md text-center">
            {submitError}
          </div>
        )}

        {/* Footer CTA */}
        <div className="pt-xl flex flex-col gap-md">
          <button
            id="submit-request-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-lg bg-secondary-container text-on-primary font-h2 rounded-lg shadow-lg hover:bg-secondary transition-all active:scale-95 flex items-center justify-center gap-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                <span>{mediaFiles.length > 0 ? `Uploading ${mediaFiles.length} file(s)...` : 'Submitting...'}</span>
              </>
            ) : (
              <>
                <span>Find Technicians</span>
                <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
              </>
            )}
          </button>
          <button className="w-full py-md text-primary font-body-md rounded-lg hover:bg-primary-container/5 transition-all">
            Save as Draft
          </button>
        </div>
      </section>
    </div>
  );
}

export default function NewServiceRequest() {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center">Loading...</div>}>
      <NewServiceRequestContent />
    </Suspense>
  );
}
