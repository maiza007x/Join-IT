import { useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { EDUCATION_LEVELS, EDUCATION_OTHER, EDUCATION_OPTIONS } from "../constants/education";

// เลือกระดับการศึกษา; ถ้าเลือก "อื่นๆ" จะมีช่องให้พิมพ์เอง
// value คือข้อความที่จะเก็บลง DB (ตัวเลือกมาตรฐานหรือข้อความที่พิมพ์) onChange รับเป็นข้อความ
function EducationLevelInput({ value, onChange, invalid }) {
  const [isOther, setIsOther] = useState(!!value && !EDUCATION_LEVELS.includes(value));

  const handleSelect = (selected) => {
    setIsOther(selected === EDUCATION_OTHER);
    onChange(selected === EDUCATION_OTHER ? "" : selected);
  };

  return (
    <>
      <Dropdown
        value={isOther ? EDUCATION_OTHER : value || null}
        options={EDUCATION_OPTIONS}
        onChange={(e) => handleSelect(e.value)}
        placeholder="เลือกระดับการศึกษา"
        invalid={invalid}
      />
      {isOther && (
        <InputText
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ระบุระดับการศึกษา"
          maxLength={50}
          invalid={invalid}
          className="mt-2"
        />
      )}
    </>
  );
}

export default EducationLevelInput;
