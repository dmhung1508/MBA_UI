import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaDatabase,
  FaExclamationTriangle,
  FaPlus,
  FaRobot,
  FaSpinner,
  FaStar,
  FaTimes,
  FaTrash,
  FaUserTie,
} from "react-icons/fa";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { API_ENDPOINTS } from "../config/api";
import { getSelectedAcademicTerm, setSelectedAcademicTerm, storeAcademicTermState } from "../config/academicTerm";

const AdminTermManager = () => {
  const [terms, setTerms] = useState([]);
  const [years, setYears] = useState([]);
  const [latestTerm, setLatestTerm] = useState("");
  const [sourceTerm, setSourceTerm] = useState("");
  const [databaseName, setDatabaseName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdResult, setCreatedResult] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [settingDefaultTerm, setSettingDefaultTerm] = useState("");

  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      accept: "application/json",
    };
  };

  const termOptions = useMemo(() => {
    if (years.length === 0) {
      return terms;
    }
    return years.flatMap((year) => year.semesters || []);
  }, [terms, years]);

  const getTermLabel = (term) => {
    if (!term) return "";
    return term.label || `${term.academic_year || term.year_key || term.term} - Kỳ ${term.semester || ""}`;
  };

  const fetchTerms = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(API_ENDPOINTS.TERMS, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Không thể tải danh sách kỳ học");
      }
      const data = await response.json();
      const nextTerms = data.terms || [];
      setTerms(nextTerms);
      setYears(data.years || []);
      setLatestTerm(data.default_term || data.latest_term || "");
      storeAcademicTermState({
        latestTerm: data.default_term || data.latest_term,
        selectedTerm: data.selected_term,
      });
      setSourceTerm((current) => {
        if (current && nextTerms.some((term) => term.term === current)) {
          return current;
        }
        return data.selected_term || data.latest_term || nextTerms[0]?.term || "";
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userRole = localStorage.getItem("user_role");
    if (userRole !== "admin") {
      navigate("/mini/");
      return;
    }
    fetchTerms();
  }, [navigate]);

  const readError = async (response, fallback = "Không thể tạo kỳ học") => {
    try {
      const data = await response.json();
      return data.detail || data.message || fallback;
    } catch {
      return fallback;
    }
  };

  const createTerm = async (event) => {
    event.preventDefault();
    const cleanDatabaseName = databaseName.trim();
    if (!cleanDatabaseName) {
      setError("Tên database không được để trống");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");
      setCreatedResult(null);
      const response = await fetch(API_ENDPOINTS.ADMIN_TERMS, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          database_name: cleanDatabaseName,
          source_term: sourceTerm || latestTerm,
        }),
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      const data = await response.json();
      setCreatedResult(data);
      setSuccess(data.message || "Đã tạo kỳ học mới");
      setDatabaseName("");
      await fetchTerms();
      if (data.term?.term) {
        setSelectedAcademicTerm(data.term.term);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const canDeleteTerm = (term) => Boolean(term?.managed_by_catalog && term?.db_name && term.db_name !== "MBA");

  const isDefaultTerm = (term) => Boolean(term && (term.is_default || term.term === latestTerm));

  const setDefaultTerm = async (term) => {
    if (!term || isDefaultTerm(term)) return;
    try {
      setSettingDefaultTerm(term.term);
      setError("");
      setSuccess("");
      const response = await fetch(API_ENDPOINTS.ADMIN_DEFAULT_TERM, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          term: term.term,
        }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Không thể đặt kỳ học mặc định"));
      }
      const data = await response.json();
      const nextDefaultTerm = data.default_term || data.latest_term || term.term;
      setSuccess(data.message || "Đã đặt kỳ học mặc định");
      setSelectedAcademicTerm(nextDefaultTerm);
      storeAcademicTermState({
        latestTerm: nextDefaultTerm,
        selectedTerm: nextDefaultTerm,
      });
      await fetchTerms();
    } catch (err) {
      setError(err.message);
    } finally {
      setSettingDefaultTerm("");
    }
  };

  const openDeleteConfirm = (term) => {
    setDeleteTarget(term);
    setDeleteConfirm("");
    setError("");
    setSuccess("");
  };

  const closeDeleteConfirm = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteConfirm("");
  };

  const isSelectedTermTarget = (term) => {
    const selectedTerm = getSelectedAcademicTerm();
    if (!selectedTerm || !term) return false;
    return selectedTerm === term.term || selectedTerm === term.db_name || (term.aliases || []).includes(selectedTerm);
  };

  const deleteTerm = async () => {
    if (!deleteTarget) return;
    const cleanConfirm = deleteConfirm.trim();
    if (cleanConfirm !== deleteTarget.db_name) {
      setError("Tên database xác nhận không khớp");
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");
      const shouldMoveSelectedTerm = isSelectedTermTarget(deleteTarget);
      const response = await fetch(API_ENDPOINTS.ADMIN_TERM_BY_KEY(deleteTarget.term || deleteTarget.db_name), {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          confirm_database_name: cleanConfirm,
        }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Không thể xoá kỳ học"));
      }
      const data = await response.json();
      setSuccess(data.message || "Đã xoá kỳ học");
      if (shouldMoveSelectedTerm || latestTerm === deleteTarget.term) {
        setSelectedAcademicTerm(data.default_term || data.latest_term || "");
      }
      setDeleteTarget(null);
      setDeleteConfirm("");
      setCreatedResult(null);
      await fetchTerms();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container bg-gray-50" style={{ paddingTop: "100px" }}>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Quản lý kỳ học</h1>
                <p className="mt-1 text-sm text-gray-600">Tạo database kỳ học và copy chatbot, tài khoản giảng viên.</p>
              </div>
            </div>
          </div>

          {(error || success) && (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {error ? <FaExclamationTriangle /> : <FaCheckCircle />}
                <span>{error || success}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
            <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Danh sách kỳ học</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Kỳ học</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Database</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Trạng thái</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {loading ? (
                      <tr>
                        <td className="px-6 py-8 text-center text-sm text-gray-500" colSpan={4}>
                          <FaSpinner className="mr-2 inline animate-spin" />
                          Đang tải...
                        </td>
                      </tr>
                    ) : termOptions.length === 0 ? (
                      <tr>
                        <td className="px-6 py-8 text-center text-sm text-gray-500" colSpan={4}>
                          Chưa có kỳ học
                        </td>
                      </tr>
                    ) : (
                      termOptions.map((term) => (
                        <tr key={term.term} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{getTermLabel(term)}</div>
                            <div className="text-xs text-gray-500">{term.term}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{term.db_name}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {isDefaultTerm(term) && (
                                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Mặc định</span>
                              )}
                              {term.is_base && (
                                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">Gốc</span>
                              )}
                              {term.managed_by_catalog && (
                                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">Admin tạo</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              {isDefaultTerm(term) ? (
                                <span className="inline-flex items-center rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-500">
                                  <FaStar className="mr-2 text-red-500" />
                                  Mặc định
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDefaultTerm(term)}
                                  disabled={settingDefaultTerm === term.term}
                                  className="inline-flex items-center justify-center rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {settingDefaultTerm === term.term ? (
                                    <FaSpinner className="mr-2 animate-spin" />
                                  ) : (
                                    <FaStar className="mr-2" />
                                  )}
                                  Đặt mặc định
                                </button>
                              )}
                              {canDeleteTerm(term) && (
                                <button
                                  type="button"
                                  onClick={() => openDeleteConfirm(term)}
                                  className="inline-flex items-center justify-center rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                                >
                                  <FaTrash className="mr-2" />
                                  Xoá
                                </button>
                              )}
                              {!canDeleteTerm(term) && !isDefaultTerm(term) && (
                                <span className="text-xs text-gray-400">Không xoá</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Tạo kỳ học mới</h2>
              </div>
              <form onSubmit={createTerm} className="space-y-5 p-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Tên database</label>
                  <div className="relative">
                    <FaDatabase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={databaseName}
                      onChange={(event) => setDatabaseName(event.target.value)}
                      placeholder="MBA_2027_2028_semaster1"
                      className="w-full rounded-lg border border-gray-300 px-10 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Tên này sẽ được dùng làm database MongoDB.</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Copy dữ liệu từ kỳ</label>
                  <select
                    value={sourceTerm}
                    onChange={(event) => setSourceTerm(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  >
                    {termOptions.map((term) => (
                      <option key={term.term} value={term.term}>
                        {getTermLabel(term)} - {term.db_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  <div className="mb-2 flex items-center gap-2">
                    <FaRobot className="text-red-600" />
                    <span>Copy toàn bộ chatbot từ kỳ nguồn.</span>
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <FaUserTie className="text-red-600" />
                    <span>Copy tài khoản giảng viên, không copy môn đã phân.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaDatabase className="text-red-600" />
                    <span>Tạo đủ các collection khác, chỉ copy dữ liệu tài liệu/cấu hình cần dùng lại.</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creating || !databaseName.trim()}
                  className="flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <FaSpinner className="mr-2 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2" />
                      Tạo kỳ học
                    </>
                  )}
                </button>
              </form>

              {createdResult && (
                <div className="border-t border-gray-200 p-6">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Kết quả tạo kỳ</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">Database mới</dt>
                      <dd className="font-medium text-gray-900">{createdResult.target_db_name}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">Nguồn copy</dt>
                      <dd className="font-medium text-gray-900">{createdResult.source_db_name}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">Chatbot</dt>
                      <dd className="font-medium text-gray-900">{createdResult.copied_chatbots}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">Giảng viên</dt>
                      <dd className="font-medium text-gray-900">{createdResult.copied_teachers}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">Collection có dữ liệu</dt>
                      <dd className="text-right font-medium text-gray-900">
                        {Object.entries(createdResult.copied_collections || {})
                          .map(([name, count]) => `${name}: ${count}`)
                          .join(", ") || "Không có"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-500">Collection tạo rỗng</dt>
                      <dd className="text-right font-medium text-gray-900">
                        {(createdResult.empty_collections || []).join(", ") || "Không có"}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </section>
          </div>

          {deleteTarget && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FaExclamationTriangle className="text-red-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Xoá kỳ học</h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeDeleteConfirm}
                    disabled={deleting}
                    className="rounded-md p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Đóng"
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="space-y-4 px-6 py-5">
                  <div>
                    <div className="text-sm text-gray-500">Kỳ học</div>
                    <div className="font-semibold text-gray-900">{getTermLabel(deleteTarget)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Database sẽ bị xoá full data</div>
                    <div className="mt-1 rounded-md bg-gray-100 px-3 py-2 font-mono text-sm text-gray-900">
                      {deleteTarget.db_name}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Nhập đúng tên database để xác nhận
                    </label>
                    <input
                      value={deleteConfirm}
                      onChange={(event) => setDeleteConfirm(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      placeholder={deleteTarget.db_name}
                    />
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Thao tác này sẽ xoá toàn bộ collection và dữ liệu trong database kỳ học này.
                  </div>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeDeleteConfirm}
                    disabled={deleting}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Huỷ
                  </button>
                  <button
                    type="button"
                    onClick={deleteTerm}
                    disabled={deleting || deleteConfirm.trim() !== deleteTarget.db_name}
                    className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deleting ? (
                      <>
                        <FaSpinner className="mr-2 animate-spin" />
                        Đang xoá...
                      </>
                    ) : (
                      <>
                        <FaTrash className="mr-2" />
                        Xoá kỳ học
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AdminTermManager;
