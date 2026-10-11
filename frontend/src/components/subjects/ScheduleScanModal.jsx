import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
  Sparkles,
  Calendar,
  X,
  Clock,
  MapPin,
  User,
} from 'lucide-react';
import api from '../../api/client';

const ScheduleScanModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Extracted subjects for review
  const [extractedSubjects, setExtractedSubjects] = useState(null);
  const [saveToTimetable, setSaveToTimetable] = useState(true);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processSelectedFile(droppedFile);
  };

  const handleFileInput = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processSelectedFile(selectedFile);
  };

  const compressImageIfNeeded = async (imageFile) => {
    // Only compress if image is > 1MB
    if (!imageFile.type.startsWith('image/') || imageFile.size < 1024 * 1024) {
      return imageFile;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1600; // Optimal high resolution for OCR without payload bloat

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < imageFile.size) {
              const compressedFile = new File([blob], imageFile.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(imageFile);
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => resolve(imageFile);
      img.src = URL.createObjectURL(imageFile);
    });
  };

  const processSelectedFile = async (selectedFile) => {
    setErrorMessage('');
    setExtractedSubjects(null);

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      const readyFile = await compressImageIfNeeded(selectedFile);
      setFile(readyFile);
    } else {
      setPreviewUrl('');
      setFile(selectedFile);
    }
  };

  const handleScanSchedule = async () => {
    if (!file) {
      setErrorMessage('Pumili muna o mag-drag ng file/image ng school schedule.');
      return;
    }

    setScanning(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/subjects/scan-schedule', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data?.subjects) {
        setExtractedSubjects(res.data.subjects);
      } else {
        setErrorMessage(res.data?.message || 'Hindi ma-scan ang schedule.');
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        'Hindi ito school schedule o class timetable. Pakisiguradong Certificate of Registration (COR) o class schedule ang inyong nilapag.';
      setErrorMessage(msg);
    } finally {
      setScanning(false);
    }
  };

  const handleRemoveSubject = (index) => {
    setExtractedSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index, field, value) => {
    setExtractedSubjects((prev) =>
      prev.map((sub, i) => (i === index ? { ...sub, [field]: value } : sub))
    );
  };

  const handleConfirmImport = async () => {
    if (!extractedSubjects || extractedSubjects.length === 0) return;

    setSaving(true);
    setErrorMessage('');

    try {
      const res = await api.post('/subjects/batch-import', {
        subjects: extractedSubjects,
        saveToTimetable,
      });

      if (res.data?.success) {
        onSuccess?.(res.data.subjectsCount, res.data.timetableCount);
        handleClose();
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Nagka-problema sa pag-save ng subjects.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewUrl('');
    setExtractedSubjects(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Auto-Scan School Schedule
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                I-drag ang iyong COR, timetable image, o PDF para mag-auto add ng subjects
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs animate-in slide-in-from-top duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">
                <p className="font-bold">Hindi Matanggap ang File</p>
                <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* STEP 1: Upload / Dropzone (if not extracted yet) */}
          {!extractedSubjects && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[0.99]'
                    : file
                    ? 'border-blue-300 dark:border-blue-800 bg-slate-50 dark:bg-slate-900/40'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-900/20'
                }`}
                onClick={() => document.getElementById('sched-file-input')?.click()}
              >
                <input
                  id="sched-file-input"
                  type="file"
                  accept="image/*,.pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFileInput}
                />

                {previewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="Schedule preview"
                      className="max-h-48 rounded-xl object-contain mx-auto shadow-md border border-slate-200 dark:border-slate-800"
                    />
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {file?.name} ({(file?.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                    <p className="text-[11px] text-slate-400">I-click muli kung nais palitan</p>
                  </div>
                ) : file ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-2xl w-fit mx-auto">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB &bull; I-click para palitan
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-3xl w-fit mx-auto ring-8 ring-blue-500/10">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        I-drag at i-drop ang image o file dito
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        o i-click para mag-browse mula sa computer o phone
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">JPG/PNG</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">PDF</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">DOCX</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleScanSchedule}
                  disabled={!file || scanning}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-40 flex items-center gap-2 cursor-pointer transition-all"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sina-scan ng AI ang Schedule...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Simulan ang Scan at Extract</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Review and Confirm Extracted Subjects */}
          {extractedSubjects && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Na-extract na Subjects ({extractedSubjects.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Suriin o i-edit ang impormasyon bago tuluyang i-save sa system.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setExtractedSubjects(null);
                    setFile(null);
                    setPreviewUrl('');
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                >
                  Mag-scan ng Iba
                </button>
              </div>

              {/* Timetable Sync Checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={saveToTimetable}
                  onChange={(e) => setSaveToTimetable(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="text-slate-800 dark:text-slate-200 font-medium">
                  <span className="font-bold text-blue-700 dark:text-blue-300">
                    I-sync din sa Weekly Class Timetable (Schedule)
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Awtomatikong magkakaroon ng 15-minute phone push notification reminders bago ang klase.
                  </p>
                </div>
              </label>

              {/* Editable Subjects List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {extractedSubjects.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 space-y-2.5 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={sub.code}
                          onChange={(e) => handleFieldChange(idx, 'code', e.target.value)}
                          placeholder="Subject Code"
                          className="w-28 px-2 py-1 text-xs font-black uppercase rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400"
                        />
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                          placeholder="Subject Name"
                          className="flex-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveSubject(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={sub.instructor || ''}
                          onChange={(e) => handleFieldChange(idx, 'instructor', e.target.value)}
                          placeholder="Instructor"
                          className="w-full bg-transparent text-[11px] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={sub.room || ''}
                          onChange={(e) => handleFieldChange(idx, 'room', e.target.value)}
                          placeholder="Room / Lab"
                          className="w-full bg-transparent text-[11px] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={sub.scheduleText || (sub.days?.length ? `${sub.days.join(', ')} ${sub.startTime}-${sub.endTime}` : '')}
                          onChange={(e) => handleFieldChange(idx, 'scheduleText', e.target.value)}
                          placeholder="Sched: MWF 8-10AM"
                          className="w-full bg-transparent text-[11px] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {extractedSubjects.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-6">
                    Lahat ng subjects ay tinanggal. Mag-scan ulit kung nais.
                  </p>
                )}
              </div>

              {/* Confirm Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={saving || extractedSubjects.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-40 flex items-center gap-2 cursor-pointer transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sine-save ang mga Subjects...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>I-save ang {extractedSubjects.length} Subjects</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleScanModal;
