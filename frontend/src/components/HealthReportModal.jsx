import { useState } from "react";
import { biomarkersAPI } from "../utils/api";
import { useTranslation } from "react-i18next";

export const HealthReportModal = ({ onClose, patientId = null }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const generatePdf = async () => {
    setLoading(true);
    setError("");
    try {
      const blob = patientId
        ? await biomarkersAPI.getPatientReportPdf(patientId)
        : await biomarkersAPI.getReportPdf();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      setError(err.message || t("failedGenerateReport"));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `healix-health-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
  };

  const handleShare = async () => {
    if (!pdfUrl) return;
    try {
      const blob = await fetch(pdfUrl).then((r) => r.blob());
      const file = new File([blob], "healix-health-report.pdf", { type: "application/pdf" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "Healix Health Report", files: [file] });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "min(800px, 100%)",
          maxHeight: "90vh",
          background: "var(--bg-3)",
          border: "1px solid var(--border-solid)",
          borderRadius: "20px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-solid)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{
                color: "var(--text)",
                fontSize: "20px",
                fontWeight: "800",
                margin: 0,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {t("healthReport")}
            </h2>
            <p style={{ color: "var(--text-subtle)", fontSize: "13px", margin: "4px 0 0 0" }}>
              {t("healthReportDesc")}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              border: "1px solid var(--border-solid)",
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {!pdfUrl && !loading && !error && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
              <h3
                style={{
                  color: "var(--text)",
                  fontSize: "18px",
                  fontWeight: "700",
                  margin: "0 0 8px 0",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {t("generateYourReport")}
              </h3>
              <p
                style={{
                  color: "var(--text-subtle)",
                  fontSize: "14px",
                  margin: "0 0 24px 0",
                  maxWidth: "400px",
                  marginLeft: "auto",
                  marginRight: "auto",
                  lineHeight: 1.6,
                }}
              >
                {t("reportCompileDesc")}
              </p>
              <button
                onClick={generatePdf}
                style={{
                  padding: "12px 32px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #1d4ed8, #0891b2)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {t("generateReportBtn")}
              </button>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  border: "3px solid var(--border-solid)",
                  borderTopColor: "#3b82f6",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ color: "var(--text-subtle)", fontSize: "14px" }}>{t("generatingReport")}</p>
            </div>
          )}

          {error && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
              <p style={{ color: "#ef4444", fontSize: "14px", marginBottom: "16px" }}>{error}</p>
              <button
                onClick={generatePdf}
                style={{
                  padding: "10px 24px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-solid)",
                  background: "transparent",
                  color: "var(--text)",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {t("tryAgain")}
              </button>
            </div>
          )}

          {pdfUrl && (
            <iframe
              src={pdfUrl}
              title="Health Report Preview"
              style={{
                width: "100%",
                height: "60vh",
                border: "none",
                borderRadius: "12px",
                background: "#fff",
              }}
            />
          )}
        </div>

        {/* Action Bar */}
        {pdfUrl && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border-solid)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <button
              onClick={generatePdf}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: "1px solid var(--border-solid)",
                background: "transparent",
                color: "var(--text-muted)",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {t("regenerate")}
            </button>
            <button
              onClick={handleShare}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: "1px solid var(--border-solid)",
                background: "transparent",
                color: "var(--text)",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {t("share")}
            </button>
            <button
              onClick={handleDownload}
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #1d4ed8, #0891b2)",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {t("downloadPDF")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
