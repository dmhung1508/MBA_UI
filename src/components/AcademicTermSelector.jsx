import React, { useEffect, useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import { API_ENDPOINTS } from "../config/api";
import {
  TERM_EVENT,
  getEffectiveAcademicTerm,
  setSelectedAcademicTerm,
  storeAcademicTermState,
} from "../config/academicTerm";

const AcademicTermSelector = ({ compact = false }) => {
  const [terms, setTerms] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedTerm, setSelectedTermState] = useState("");
  const [canSelect, setCanSelect] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadTerms = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        return;
      }
      try {
        const response = await fetch(API_ENDPOINTS.TERMS, {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "application/json",
          },
        });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        storeAcademicTermState({
          latestTerm: data.latest_term,
          selectedTerm: data.selected_term,
        });
        if (cancelled) {
          return;
        }
        setTerms(data.terms || []);
        setYears(data.years || []);
        setCanSelect(Boolean(data.can_select));
        setSelectedTermState(getEffectiveAcademicTerm());
      } catch (error) {
        console.error("Error fetching academic terms:", error);
      }
    };

    loadTerms();
    const handleTermChange = () => {
      loadTerms();
    };
    window.addEventListener(TERM_EVENT, handleTermChange);
    return () => {
      cancelled = true;
      window.removeEventListener(TERM_EVENT, handleTermChange);
    };
  }, []);

  if (!canSelect || terms.length === 0) {
    return null;
  }

  const handleChange = (event) => {
    const term = event.target.value;
    setSelectedAcademicTerm(term);
    setSelectedTermState(term);
    window.location.reload();
  };

  const getTermLabel = (term, year = null) => {
    if (term.label) {
      return term.label;
    }
    const yearLabel = year?.label || year?.academic_year || term.academic_year || "";
    const semesterLabel = term.semester ? `Kỳ ${term.semester}` : term.term;
    return yearLabel ? `${yearLabel} - ${semesterLabel}` : semesterLabel;
  };

  return (
    <label
      className={`flex items-center gap-2 text-gray-700 ${compact ? "px-4 py-3" : "px-2 py-2"}`}
      title="Chọn học kỳ"
    >
      <FaCalendarAlt className="text-sm text-red-600 flex-shrink-0" />
      <select
        value={selectedTerm}
        onChange={handleChange}
        className={`h-9 rounded-md border border-gray-300 bg-white px-2 text-sm font-medium text-gray-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 ${compact ? "w-full" : "min-w-[220px]"}`}
        aria-label="Chọn học kỳ"
      >
        {years.length > 0
          ? years.map((year) => (
              <optgroup key={year.year_key} label={year.label || year.academic_year}>
                {(year.semesters || []).map((term) => (
                  <option key={term.term} value={term.term}>
                    {getTermLabel(term, year)}
                  </option>
                ))}
              </optgroup>
            ))
          : terms.map((term) => (
              <option key={term.term} value={term.term}>
                {getTermLabel(term)}
              </option>
            ))}
      </select>
    </label>
  );
};

export default AcademicTermSelector;
