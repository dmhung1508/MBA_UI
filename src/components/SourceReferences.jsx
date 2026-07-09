import React, { useMemo, useState } from "react";
import { buildDocumentPreviewUrl, downloadDocument } from "../services/documentApi";
import "./SourceReferences.css";

function normalizeSource(source, position) {
  if (typeof source === "string") {
    return {
      index: position + 1,
      filename: source,
      page: 0,
      snippet: "",
      documentId: null,
      previewSupported: false,
      downloadAvailable: false,
    };
  }

  const documentId = Number(source?.document_id);
  const filename = source?.filename || source?.source || "Tài liệu";
  const fileType = String(source?.file_type || "").toLowerCase();
  return {
    index: Number(source?.citation_id || source?.index) || position + 1,
    filename,
    page: Math.max(Number(source?.page) || 0, 0),
    heading: source?.heading || "",
    snippet: source?.snippet || source?.content || "",
    documentId: Number.isInteger(documentId) && documentId > 0 ? documentId : null,
    previewSupported: Boolean(source?.preview_supported ?? fileType === ".pdf"),
    downloadAvailable: Boolean(source?.download_available ?? (documentId > 0)),
  };
}

export default function SourceReferences({ sources = [], compact = false }) {
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const normalized = useMemo(
    () => (Array.isArray(sources) ? sources.map(normalizeSource) : []),
    [sources]
  );

  if (!normalized.length) return null;

  const openPreview = (source) => {
    if (!source.documentId || !source.previewSupported) return;
    const url = buildDocumentPreviewUrl(source.documentId, source.page);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (source) => {
    if (!source.documentId || downloadingId) return;
    setError("");
    setDownloadingId(source.documentId);
    try {
      await downloadDocument(source.documentId, source.filename);
    } catch (downloadError) {
      setError(downloadError.message || "Không thể tải tài liệu");
    } finally {
      setDownloadingId(null);
    }
  };

  const copyCitation = async (source) => {
    setError("");
    try {
      await navigator.clipboard.writeText(
        `[${source.index}] ${source.filename}${source.page ? `, trang ${source.page}` : ""}`
      );
      setCopiedIndex(source.index);
      window.setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      setError("Trình duyệt không cho phép copy citation tự động.");
    }
  };

  return (
    <section className={`source-references${compact ? " source-references--compact" : ""}`}>
      <div className="source-references__title">Nguồn tham khảo</div>
      <div className="source-references__list">
        {normalized.map((source, position) => (
          <article
            className="source-reference"
            key={`${source.documentId || source.filename}-${source.page}-${position}`}
          >
            <div className="source-reference__header">
              <span className="source-reference__index">[{source.index}]</span>
              <span className="source-reference__filename" title={source.filename}>
                {source.filename}
              </span>
              {source.page > 0 && <span className="source-reference__page">Trang {source.page}</span>}
            </div>
            {source.heading && <div className="source-reference__heading">{source.heading}</div>}
            {source.snippet && <blockquote className="source-reference__snippet">{source.snippet}</blockquote>}
            <div className="source-reference__actions">
              {source.previewSupported && source.documentId && (
                <button type="button" onClick={() => openPreview(source)}>
                  Xem tài liệu
                </button>
              )}
              <button type="button" onClick={() => copyCitation(source)}>
                {copiedIndex === source.index ? "Đã copy" : "Copy citation"}
              </button>
              {source.downloadAvailable && source.documentId && (
                <button
                  type="button"
                  onClick={() => handleDownload(source)}
                  disabled={downloadingId === source.documentId}
                >
                  {downloadingId === source.documentId ? "Đang tải…" : "Tải xuống"}
                </button>
              )}
              {!source.documentId && (
                <span className="source-reference__legacy">Nguồn cũ chưa có liên kết file</span>
              )}
            </div>
          </article>
        ))}
      </div>
      {error && <div className="source-references__error">{error}</div>}
    </section>
  );
}
