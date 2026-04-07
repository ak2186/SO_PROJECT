import { useTranslation } from "react-i18next";

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  function changeLanguage(langCode) {
    i18n.changeLanguage(langCode);
    document.documentElement.dir = langCode === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = langCode;
    localStorage.setItem("lang", langCode);
  }

  return (
    <select
      value={i18n.language}
      onChange={(e) => changeLanguage(e.target.value)}
      style={{
        background: "transparent",
        border: "1px solid var(--border-mid)",
        color: "var(--text-muted)",
        padding: "6px 10px",
        borderRadius: "7px",
        fontSize: "13px",
        cursor: "pointer",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      <option value="en">English</option>
      <option value="ar">العربية</option>
    </select>
  );
}

export default LanguageSwitcher;