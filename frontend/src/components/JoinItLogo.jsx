import { useId } from "react";

// โลโก้ Join-IT มี 3 แบบให้เลือก เปลี่ยนแบบที่ใช้ทั้งเว็บได้ที่ ACTIVE_VARIANT
// favicon แยกเป็นไฟล์ public/brand/join-it-{a,b,c}.svg เลือกใช้ใน index.html ให้ตรงกัน
//   A · Interlock  ห่วงโซ่สองวงคล้องกัน: วงน้ำเงิน = เจ้าหน้าที่ IT, วงส้ม = นักศึกษาฝึกงาน (Join / เชื่อมต่อ)
//   B · The j      ตัว j: ก้านและตะขอสีน้ำเงิน = เจ้าหน้าที่ (โครงสร้างที่ประคอง), จุดสีส้ม = นักศึกษา (ประกายที่กำลังเติบโต)
//   C · Overlap J  ตัว J จากสองชิ้น: ก้านน้ำเงิน = เจ้าหน้าที่, ตะขอส้ม = นักศึกษา, วงกลมสีเข้มตรงรอยต่อ = จุดที่ทำงานร่วมกัน
const ACTIVE_VARIANT = "B";

const NAVY = "#0f1f4d";
const BLUE = "#2563eb";
const INDIGO = "#4f46e5";
const ORANGE = "#f97316";
const ORANGE_LIGHT = "#fb923c";

const MARKS = {
    A: (id) => (
        <>
            <defs>
                <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor={INDIGO} />
                    <stop offset="1" stopColor={BLUE} />
                </linearGradient>
                <linearGradient id={`${id}o`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor={ORANGE_LIGHT} />
                    <stop offset="1" stopColor={ORANGE} />
                </linearGradient>
                {/* ส่วนที่วงน้ำเงินทับวงส้ม (ซ้ายบน + ขวาล่าง) ทำให้สองวงคล้องกันจริง */}
                <clipPath id={`${id}c`}>
                    <rect x="0" y="0" width="26" height="24" />
                    <rect x="26" y="24" width="22" height="24" />
                </clipPath>
            </defs>
            <g transform="rotate(-35 24 24)">
                <rect x="6" y="15" width="25" height="18" rx="9" fill="none" stroke={`url(#${id}b)`} strokeWidth="6" />
                <rect x="20" y="16.5" width="22" height="15" rx="7.5" fill="none" stroke={`url(#${id}o)`} strokeWidth="5" />
                <rect x="6" y="15" width="25" height="18" rx="9" fill="none" stroke={`url(#${id}b)`} strokeWidth="6" clipPath={`url(#${id}c)`} />
            </g>
        </>
    ),
    B: (id) => (
        <>
            <defs>
                <linearGradient id={`${id}b`} x1="0" y1="8" x2="0" y2="44" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor={INDIGO} />
                    <stop offset="1" stopColor={BLUE} />
                </linearGradient>
            </defs>
            <path d="M28 20V32a10 10 0 0 1-10 10h-4" fill="none" stroke={`url(#${id}b)`} strokeWidth="8" strokeLinecap="round" />
            <circle cx="28" cy="8.5" r="5.5" fill={ORANGE} />
            <circle cx="36.5" cy="14" r="2" fill={ORANGE_LIGHT} opacity=".55" />
        </>
    ),
    C: (id) => (
        <>
            <defs>
                <clipPath id={`${id}s`}>
                    <rect x="24" y="5" width="11" height="29" rx="5.5" />
                </clipPath>
            </defs>
            <rect x="24" y="5" width="11" height="29" rx="5.5" fill={BLUE} />
            <path d="M29.5 29a9.75 9.75 0 0 1-19.5 0" fill="none" stroke={ORANGE} strokeWidth="10" strokeLinecap="round" />
            <path d="M29.5 29a9.75 9.75 0 0 1-19.5 0" fill="none" stroke={NAVY} strokeWidth="10" strokeLinecap="round" clipPath={`url(#${id}s)`} />
        </>
    ),
};

// สัญลักษณ์อย่างเดียว (ไม่มีกรอบพื้นหลัง) ขนาดตาม className
const JoinItLogo = ({ className, variant = ACTIVE_VARIANT }) => {
    const id = useId();
    return (
        <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Join-IT">
            {MARKS[variant](id)}
        </svg>
    );
};

export default JoinItLogo;
