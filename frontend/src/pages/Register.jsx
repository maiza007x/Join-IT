import { useState, useRef } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { TERM_OPTIONS } from "../constants/terms";
import EducationLevelInput from "../components/EducationLevelInput";
import { toDateString, dateToAcademicYear, formatAcademicYear } from "../utils/dateString";

const REQUIRED_FIELDS = [
  "first_name", "last_name", "nickname", "university_name", "faculty", "education_level", "term", "academic_year",
  "internship_start_date", "internship_end_date", "username", "password", "confirmPassword",
];

const getErrors = (form) => {
  const errors = {};
  REQUIRED_FIELDS.forEach((name) => {
    if (!form[name]) errors[name] = "กรุณากรอกข้อมูลช่องนี้";
  });
  if (!errors.internship_end_date && form.internship_start_date && form.internship_end_date < form.internship_start_date) {
    errors.internship_end_date = "ต้องไม่ก่อนวันที่เริ่มฝึกงาน";
  }
  if (!errors.password && form.password.length < 6) {
    errors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
  }
  if (!errors.confirmPassword && form.confirmPassword !== form.password) {
    errors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
  }
  return errors;
};

function Section({ title }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
      <h2 className="m-0 text-base font-bold text-slate-800">{title}</h2>
    </div>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-600">
        {label}<span className="text-red-500 ml-0.5">*</span>
      </label>
      {children}
      {error ? (
        <small className="text-red-500 text-xs">{error}</small>
      ) : (
        hint && <small className="text-slate-400 text-xs">{hint}</small>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  first_name: "", last_name: "", nickname: "", university_name: "", faculty: "", education_level: "",
  term: null, academic_year: null, internship_start_date: null, internship_end_date: null,
  username: "", password: "", confirmPassword: "",
};

function Register() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useRef(null);

  const setField = (name) => (e) => setForm((prev) => ({ ...prev, [name]: e.target?.value ?? e.value }));
  // แสดง error เฉพาะหลังกดสมัครแล้ว เพื่อไม่ให้ขึ้นแดงตั้งแต่เปิดหน้า
  const errors = submitted ? getErrors(form) : {};

  const handleRegister = async () => {
    setSubmitted(true);
    if (Object.keys(getErrors(form)).length > 0) {
      toast.current.show({ severity: 'warn', summary: 'ข้อมูลยังไม่ถูกต้อง', detail: 'กรุณาตรวจสอบช่องที่มีข้อความสีแดง', life: 3000 });
      return;
    }

    setLoading(true);
    try {
      await API.post("/auth/register", {
        username: form.username,
        password: form.password,
        full_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
        nickname: form.nickname.trim(),
        university_name: form.university_name.trim(),
        faculty: form.faculty.trim(),
        education_level: form.education_level.trim(),
        term: form.term,
        academic_year: dateToAcademicYear(form.academic_year),
        internship_start_date: toDateString(form.internship_start_date),
        internship_end_date: toDateString(form.internship_end_date),
      });
      setDone(true);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      toast.current.show({ severity: 'error', summary: 'สมัครไม่สำเร็จ', detail: errorMessage, life: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center overflow-x-hidden bg-[#f8fafc] py-10">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-[120px]"></div>

      <Toast ref={toast} />

      <div className="z-10 w-full max-w-xl px-4 sm:px-6">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/50 rounded-4xl p-6 sm:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">

          {done ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
                <i className="pi pi-check text-emerald-600 text-4xl"></i>
              </div>
              <h1 className="text-2xl font-black text-slate-800 mb-3">ส่งคำขอสมัครเรียบร้อย</h1>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                แอดมินจะตรวจสอบและอนุมัติบัญชีของคุณ<br />
                เมื่ออนุมัติแล้วจึงจะเข้าสู่ระบบได้ด้วย username และรหัสผ่านที่ตั้งไว้
              </p>
              <Button
                label="กลับไปหน้าเข้าสู่ระบบ"
                onClick={() => navigate("/login")}
                className="w-full py-4 bg-indigo-600 border-none rounded-2xl text-white font-bold text-sm hover:bg-indigo-700 transition-all"
              />
            </div>
          ) : (
            <form
              className="register-form flex flex-col gap-5"
              onSubmit={(e) => { e.preventDefault(); handleRegister(); }}
              noValidate
            >
              <div className="text-center mb-2">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">สมัครสมาชิก</h1>
                <p className="text-slate-500 text-sm">สำหรับนักศึกษาฝึกงาน กรอกข้อมูลให้ครบทุกช่อง</p>
              </div>

              <Section title="ข้อมูลส่วนตัว" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="ชื่อ" error={errors.first_name}>
                  <InputText value={form.first_name} onChange={setField("first_name")} invalid={!!errors.first_name} autoComplete="given-name" />
                </Field>
                <Field label="นามสกุล" error={errors.last_name}>
                  <InputText value={form.last_name} onChange={setField("last_name")} invalid={!!errors.last_name} autoComplete="family-name" />
                </Field>
              </div>
              <Field label="ชื่อเล่น" hint="เจ้าหน้าที่จะเรียกและมองเห็นชื่อนี้ในระบบ" error={errors.nickname}>
                <InputText value={form.nickname} onChange={setField("nickname")} invalid={!!errors.nickname} />
              </Field>

              <Section title="ข้อมูลการฝึกงาน" />
              <Field label="มหาวิทยาลัย / สถานศึกษา" error={errors.university_name}>
                <InputText value={form.university_name} onChange={setField("university_name")} invalid={!!errors.university_name} />
              </Field>
              <Field label="คณะ / สาขาวิชา" error={errors.faculty}>
                <InputText value={form.faculty} onChange={setField("faculty")} invalid={!!errors.faculty} />
              </Field>
              <Field label="ระดับการศึกษา" error={errors.education_level}>
                <EducationLevelInput value={form.education_level} onChange={(level) => setForm((prev) => ({ ...prev, education_level: level }))} invalid={!!errors.education_level} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="เทอม" error={errors.term}>
                  <Dropdown value={form.term} options={TERM_OPTIONS} onChange={setField("term")} placeholder="เลือกเทอม" invalid={!!errors.term} />
                </Field>
                <Field label="ปีการศึกษา" hint={formatAcademicYear(form.academic_year) ?? "เลือกปี (แสดงเป็น ค.ศ. ระบบบันทึกเป็น พ.ศ.)"} error={errors.academic_year}>
                  <Calendar value={form.academic_year} onChange={setField("academic_year")} view="year" dateFormat="yy" showIcon placeholder="เลือกปี" invalid={!!errors.academic_year} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="วันที่เริ่มฝึกงาน" error={errors.internship_start_date}>
                  <Calendar value={form.internship_start_date} onChange={setField("internship_start_date")} dateFormat="dd/mm/yy" showIcon placeholder="วว/ดด/ปปปป" invalid={!!errors.internship_start_date} />
                </Field>
                <Field label="วันที่สิ้นสุดฝึกงาน" error={errors.internship_end_date}>
                  <Calendar value={form.internship_end_date} onChange={setField("internship_end_date")} minDate={form.internship_start_date ?? undefined} dateFormat="dd/mm/yy" showIcon placeholder="วว/ดด/ปปปป" invalid={!!errors.internship_end_date} />
                </Field>
              </div>
              <p className="m-0 text-xs text-slate-400">
                คุณจะเห็นงานได้เฉพาะช่วงวันที่ฝึกงานนี้ และแก้ไขข้อมูลเองไม่ได้หลังสมัคร หากผิดพลาดแจ้งเจ้าหน้าที่
              </p>

              <Section title="บัญชีผู้ใช้" />
              <Field label="Username" error={errors.username}>
                <InputText value={form.username} onChange={setField("username")} invalid={!!errors.username} autoComplete="username" />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="รหัสผ่าน" hint="อย่างน้อย 6 ตัวอักษร" error={errors.password}>
                  <Password value={form.password} onChange={setField("password")} toggleMask feedback={false} invalid={!!errors.password} autoComplete="new-password" />
                </Field>
                <Field label="ยืนยันรหัสผ่าน" error={errors.confirmPassword}>
                  <Password value={form.confirmPassword} onChange={setField("confirmPassword")} toggleMask feedback={false} invalid={!!errors.confirmPassword} autoComplete="new-password" />
                </Field>
              </div>

              <div className="flex items-start gap-3 bg-indigo-50 text-indigo-700 rounded-2xl p-4 text-sm">
                <i className="pi pi-info-circle mt-0.5"></i>
                <span>หลังสมัคร แอดมินต้องอนุมัติบัญชีก่อน จึงจะเข้าสู่ระบบได้</span>
              </div>

              <Button
                type="submit"
                label={loading ? "กำลังส่งคำขอ..." : "สมัครสมาชิก"}
                loading={loading}
                className="w-full py-4 bg-indigo-600 border-none rounded-2xl text-white font-bold text-base shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all"
              />

              <p className="text-center text-slate-500 text-sm m-0">
                มีบัญชีอยู่แล้ว?
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="ml-1 text-indigo-600 font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  เข้าสู่ระบบ
                </button>
              </p>
            </form>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* ทุกช่องกรอกสูงเท่ากันและกว้างเต็มคอลัมน์ */
        .register-form .p-inputtext,
        .register-form .p-dropdown,
        .register-form .p-calendar,
        .register-form .p-password,
        .register-form .p-password input {
          width: 100%;
        }
        .register-form .p-inputtext,
        .register-form .p-dropdown {
          height: 3rem;
          border-radius: 0.875rem;
          font-size: 0.95rem;
        }
        .register-form .p-dropdown .p-dropdown-label { display: flex; align-items: center; }
        .register-form .p-calendar .p-inputtext {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }
        .register-form .p-calendar .p-datepicker-trigger {
          height: 3rem;
          border-radius: 0 0.875rem 0.875rem 0;
        }
        .p-inputtext:enabled:focus {
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12) !important;
          border-color: #6366f1 !important;
        }
      `}} />
    </div>
  );
}

export default Register;
