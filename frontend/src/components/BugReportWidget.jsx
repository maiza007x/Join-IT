import { useEffect, useRef, useState } from "react";
import { confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import api, { getImageUrl } from "../services/api";
import socket from "../services/socket";
import { useAuth } from "../context/AuthContext";
import { toDateString, formatThaiDate } from "../utils/dateString";

const MAX_MESSAGE_LENGTH = 250;
// ต้องตรงกับ backend/api_routes/bugReports.js
const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE_MB = 5;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

// created_at จาก backend เป็น "YYYY-MM-DD HH:MM:SS" (เวลาไทย): วันนี้แสดงแค่เวลา วันอื่นแสดงวันที่ด้วย
const formatSentAt = (createdAt) => {
  const [date, time] = createdAt.split(" ");
  const hhmm = time.slice(0, 5);
  return date === toDateString(new Date()) ? hhmm : `${formatThaiDate(date)} ${hhmm}`;
};

// เสียงแจ้งเตือนข้อความด่วน สร้างด้วย Web Audio (ไม่ต้องมีไฟล์เสียง)
// เบราว์เซอร์จะยอมเล่นเสียงเมื่อผู้ใช้เคยคลิก/พิมพ์ในหน้านี้แล้วเท่านั้น
let audioContext;
const playUrgentSound = () => {
  audioContext ??= new AudioContext();
  audioContext.resume();
  [880, 660, 880].forEach((frequency, i) => {
    const start = audioContext.currentTime + i * 0.18;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.17);
  });
};

// แชตแจ้งปัญหาที่พบในโปรแกรม: ทุกคนเห็นทุกข้อความ (แบบ Order-IT)
function BugReportWidget() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [reports, setReports] = useState([]); // จาก API เรียงใหม่ก่อน
  const [message, setMessage] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);
  const [attachments, setAttachments] = useState([]); // [{ file, previewUrl }] รูปที่รอส่ง
  const [viewerUrl, setViewerUrl] = useState(null); // รูปที่กำลังเปิดดูขนาดเต็ม
  const [urgentOnly, setUrgentOnly] = useState(false); // ปุ่มสลับ "ทั้งหมด / เฉพาะปัญหาด่วน"
  const toast = useRef(null);
  const openRef = useRef(open);
  const listRef = useRef(null);
  const fileInputRef = useRef(null);
  const attachmentsRef = useRef(attachments);

  const fetchReports = async () => {
    try {
      const res = await api.get("/bug-reports");
      setReports(res.data.data);
      return res.data.data;
    } catch (err) {
      console.error("Error fetching bug reports:", err);
      return [];
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    openRef.current = open;
    if (open) setUnread(0);
  }, [open]);

  // event ส่งมาแค่ id จึงดึงรายการใหม่จาก API (ข้อความไม่ส่งผ่าน socket)
  useEffect(() => {
    const handleNew = async ({ id, is_urgent }) => {
      if (!openRef.current) setUnread((count) => count + 1);
      const list = await fetchReports();
      const report = list.find((item) => item.id === id);
      if (!is_urgent || !report || report.user_id === user?.id) return;

      playUrgentSound();
      toast.current?.show({
        severity: "error",
        summary: `🚨 แจ้งปัญหาด่วนจาก ${report.sender_name}`,
        detail: report.message || `📷 รูปภาพ ${report.images.length} รูป`,
        life: 8000,
      });
    };
    const handleDeleted = ({ id }) => setReports((prev) => prev.filter((report) => report.id !== id));

    socket.on("new-bug-report", handleNew);
    socket.on("bug-report-deleted", handleDeleted);
    return () => {
      socket.off("new-bug-report", handleNew);
      socket.off("bug-report-deleted", handleDeleted);
    };
  }, [user?.id]);

  // คืนหน่วยความจำของรูปตัวอย่างเมื่อปิดหน้า
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);
  useEffect(() => () => attachmentsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)), []);

  // ปิดรูปขนาดเต็มด้วยปุ่ม Esc
  useEffect(() => {
    if (!viewerUrl) return undefined;
    const handleEsc = (e) => e.key === "Escape" && setViewerUrl(null);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [viewerUrl]);

  const addImages = (files) => {
    const images = [...files];
    if (images.length === 0) return;

    if (images.some((file) => !IMAGE_TYPES.includes(file.type))) {
      setError("รองรับเฉพาะรูปภาพ PNG, JPEG, WebP และ GIF");
      return;
    }
    if (images.some((file) => file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024)) {
      setError(`รูปภาพต้องมีขนาดไม่เกิน ${MAX_IMAGE_SIZE_MB}MB`);
      return;
    }
    if (attachments.length + images.length > MAX_IMAGES) {
      setError(`แนบรูปได้ไม่เกิน ${MAX_IMAGES} รูป`);
      return;
    }

    setError("");
    setAttachments((prev) => [...prev, ...images.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))]);
  };

  const removeAttachment = (index) => {
    URL.revokeObjectURL(attachments[index].previewUrl);
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // วางรูปจากคลิปบอร์ด (เช่น Print Screen) ให้กลายเป็นไฟล์แนบ; ข้อความยังวางได้ตามปกติ
  const handlePaste = (e) => {
    const images = [...e.clipboardData.files].filter((file) => file.type.startsWith("image/"));
    if (images.length > 0) addImages(images);
  };

  // เลื่อนไปข้อความล่าสุด (ด้านล่าง) เมื่อเปิดแผงหรือมีข้อความใหม่
  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, reports]);

  const handleSend = async () => {
    if ((!message.trim() && attachments.length === 0) || sending) return;

    setSending(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("message", message);
      formData.append("is_urgent", isUrgent);
      attachments.forEach((item) => formData.append("images", item.file));
      const res = await api.post("/bug-reports", formData);

      setReports((prev) => (prev.some((report) => report.id === res.data.data.id) ? prev : [res.data.data, ...prev]));
      setMessage("");
      setIsUrgent(false);
      attachments.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setAttachments([]);
    } catch (err) {
      setError(err.response?.data?.message || "ส่งข้อความไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  };

  // Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = (report) => {
    confirmDialog({
      message: "ต้องการลบข้อความนี้ ?",
      header: "ยืนยันการลบ",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "ลบ",
      rejectLabel: "ยกเลิก",
      accept: async () => {
        try {
          await api.delete(`/bug-reports/${report.id}`);
          setReports((prev) => prev.filter((item) => item.id !== report.id));
        } catch (err) {
          setError(err.response?.data?.message || "ลบข้อความไม่สำเร็จ");
        }
      },
    });
  };

  // แสดงแบบแชต: เก่าอยู่บน ใหม่อยู่ล่าง
  const messages = [...reports].reverse().filter((report) => !urgentOnly || report.is_urgent);
  // ข้อความด่วนล่าสุด ปักไว้บนสุดของแผง (reports เรียงใหม่ก่อน)
  const pinned = reports.find((report) => report.is_urgent);

  return (
    <>
      <Toast ref={toast} position="top-center" onClick={() => setOpen(true)} />
      {open && (
        <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-[380px] h-[560px] max-h-[calc(100vh-8rem)] z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-900 text-white">
            <div className="flex items-center gap-2 font-bold text-sm">
              <i className="pi pi-megaphone"></i>
              แจ้งปัญหาที่พบในโปรแกรม
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setUrgentOnly((value) => !value)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border-none text-[11px] font-bold cursor-pointer ${urgentOnly ? "bg-rose-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                title="สลับดูทั้งหมด / เฉพาะปัญหาด่วน"
              >
                📌 {urgentOnly ? "เฉพาะปัญหาด่วน" : "ทั้งหมด"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 border-none bg-transparent text-white cursor-pointer"
                aria-label="ปิด"
              >
                <i className="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>

          {!urgentOnly && pinned && (
            <div className="px-4 py-2 bg-rose-50 border-b border-rose-100 text-xs">
              <div className="font-bold text-rose-600">
                📌 ปัญหาด่วนล่าสุด · {pinned.sender_name} · {formatSentAt(pinned.created_at)}
              </div>
              <p className="m-0 mt-1 text-slate-700 line-clamp-2 whitespace-pre-wrap break-words">
                {pinned.message || `📷 รูปภาพ ${pinned.images.length} รูป`}
              </p>
            </div>
          )}

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 bg-slate-50">
            {messages.length === 0 && (
              <p className="m-auto text-slate-400 text-sm">{urgentOnly ? "ไม่มีปัญหาด่วน" : "ยังไม่มีข้อความ"}</p>
            )}
            {messages.map((report) => {
              const isMine = report.user_id === user?.id;
              const bubbleClass = report.is_urgent
                ? "bg-rose-500 text-white"
                : isMine
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200";

              return (
                <div key={report.id} className={`flex gap-2 max-w-[90%] ${isMine ? "self-end" : "self-start"}`}>
                  {!isMine && (
                    <img
                      src={getImageUrl(report.sender_avatar)}
                      alt={report.sender_name}
                      className="w-8 h-8 shrink-0 rounded-full object-cover border border-slate-200 bg-white"
                    />
                  )}
                  <div className={`flex flex-col min-w-0 ${isMine ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-500">{report.sender_name}</span>
                      <span>{formatSentAt(report.created_at)}</span>
                      {(isMine || isAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(report)}
                          className="border-none bg-transparent p-0 text-slate-300 hover:text-rose-500 cursor-pointer"
                          aria-label="ลบข้อความ"
                        >
                          <i className="pi pi-trash text-[11px]"></i>
                        </button>
                      )}
                    </div>
                    <div className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${bubbleClass}`}>
                      {report.is_urgent && (
                        <span className="block text-[10px] font-bold mb-1 opacity-90">🚨 ปัญหาด่วน</span>
                      )}
                      {report.message}
                      {report.images.length > 0 && (
                        <div className={`grid gap-1 ${report.images.length > 1 ? "grid-cols-2" : "grid-cols-1"} ${report.message ? "mt-2" : ""}`}>
                          {report.images.map((path) => (
                            <img
                              key={path}
                              src={getImageUrl(path)}
                              alt="รูปแนบ"
                              loading="lazy"
                              onClick={() => setViewerUrl(getImageUrl(path))}
                              className="w-full max-w-[200px] max-h-40 object-cover rounded-lg cursor-zoom-in bg-slate-100"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-200 px-3 py-2 bg-white">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-rose-600 cursor-pointer">
                <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
                🚨 ส่งเป็นแจ้งปัญหาด่วน
              </label>
              <span className="text-[11px] text-slate-400">{message.length}/{MAX_MESSAGE_LENGTH}</span>
            </div>
            {error && <p className="m-0 mb-2 text-xs text-rose-600">{error}</p>}
            {attachments.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {attachments.map((item, index) => (
                  <div key={item.previewUrl} className="relative">
                    <img src={item.previewUrl} alt="รูปที่จะส่ง" className="w-14 h-14 object-cover rounded-lg border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border-none bg-slate-800 text-white cursor-pointer flex items-center justify-center"
                      aria-label="เอารูปออก"
                    >
                      <i className="pi pi-times text-[9px]"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                disabled={attachments.length >= MAX_IMAGES}
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 cursor-pointer hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="แนบรูปภาพ"
                title={`แนบรูปภาพ (สูงสุด ${MAX_IMAGES} รูป) หรือวางรูปด้วย Ctrl+V`}
              >
                <i className="pi pi-image"></i>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={IMAGE_TYPES.join(",")}
                multiple
                hidden
                onChange={(e) => {
                  addImages(e.target.files);
                  e.target.value = "";
                }}
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                rows={2}
                placeholder="พิมพ์รายละเอียดปัญหาที่พบหรือข้อเสนอแนะในการปรับปรุง... (Shift+Enter ขึ้นบรรทัดใหม่)"
                className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={(!message.trim() && attachments.length === 0) || sending}
                className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border-none bg-blue-600 text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="ส่ง"
              >
                <i className={sending ? "pi pi-spin pi-spinner" : "pi pi-send"}></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {viewerUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setViewerUrl(null)}
        >
          <img src={viewerUrl} alt="รูปแนบขนาดเต็ม" className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full border-none bg-slate-900 text-white shadow-xl cursor-pointer flex items-center justify-center hover:bg-slate-700"
        aria-label="แจ้งปัญหาที่พบในโปรแกรม"
      >
        <i className={`pi ${open ? "pi-times" : "pi-megaphone"} text-xl`}></i>
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}

export default BugReportWidget;
