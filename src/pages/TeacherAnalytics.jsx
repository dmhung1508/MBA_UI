import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { API_ENDPOINTS } from '../config/api';
import {
    FaChartPie,
    FaUsers,
    FaListOl,
    FaSearch,
    FaProjectDiagram,
    FaComments,
    FaSpinner,
    FaUserGraduate,
    FaQuestionCircle,
    FaLayerGroup,
    FaBullseye,
    FaExclamationTriangle,
    FaSortAmountDown,
    FaSyncAlt
} from 'react-icons/fa';

const TeacherAnalytics = () => {
    const mapViewportRef = useRef(null);
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState('');
    const [activeTab, setActiveTab] = useState('ranking'); // 'ranking' | 'clusters'

    const [rankingData, setRankingData] = useState([]);
    const [clustersData, setClustersData] = useState(null);
    const [rankingUpdatedAt, setRankingUpdatedAt] = useState(null);
    const [clustersUpdatedAt, setClustersUpdatedAt] = useState(null);
    
    const [selectedUser, setSelectedUser] = useState(null);
    const [userQuestions, setUserQuestions] = useState([]);
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [showStudentSuggestions, setShowStudentSuggestions] = useState(false);
    const [clusterSearchTerm, setClusterSearchTerm] = useState('');
    const [clusterSortBy, setClusterSortBy] = useState('size_desc');
    const [selectedClusterId, setSelectedClusterId] = useState(null);
    const [mapZoom, setMapZoom] = useState(1);
    
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const getApiError = async (response, fallbackMessage) => {
        try {
            const data = await response.json();
            return data?.detail || data?.message || fallbackMessage;
        } catch {
            return fallbackMessage;
        }
    };

    const isNotFoundError = (status, message = '') =>
        status === 404 || /not found/i.test(String(message));

    const parseTopicCode = (rawTopic) => {
        if (!rawTopic || typeof rawTopic !== 'string') return '';
        const normalized = rawTopic.trim();
        if (!normalized) return '';
        if (normalized.includes(' - ')) {
            return normalized.split(' - ')[0].trim();
        }
        if (normalized.includes('-')) {
            return normalized.split('-')[0].trim();
        }
        return normalized;
    };

    const normalizeDisplayName = (rawName) => {
        const cleaned = String(rawName || '').replace(/\s+/g, ' ').trim();
        if (!cleaned) return '';
        const parts = cleaned.split(' ');
        if (parts.length < 2) return cleaned;
        return [...parts.slice(1), parts[0]].join(' ');
    };

    const getStudentDisplayName = (student) => {
        const fixed = normalizeDisplayName(student?.full_name);
        return fixed || student?.username || '';
    };

    const getStudentSearchText = (student) => {
        const username = String(student?.username || '');
        const rawFullName = String(student?.full_name || '');
        const fixedFullName = normalizeDisplayName(rawFullName);
        return `${username} ${rawFullName} ${fixedFullName}`.toLowerCase();
    };

    useEffect(() => {
        const userRole = localStorage.getItem('user_role');
        if (userRole !== 'teacher' && userRole !== 'admin') {
            navigate('/mini/');
            return;
        }
        fetchTopics();
    }, [navigate]);

    const fetchTopics = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(API_ENDPOINTS.TEACHER_MY_TOPICS, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error(await getApiError(response, 'Không thể tải danh sách môn học'));
            }
            const data = await response.json();
            const fetchedTopics = data.assigned_topics || data.topics || [];
            let topicOptions = fetchedTopics.map((item) => {
                const raw = String(item || '').trim();
                const code = parseTopicCode(raw);
                return { code: code || raw, name: raw };
            });

            // Enrich topic label with subject name: "CODE - Subject Name"
            const chatbotsResponse = await fetch(API_ENDPOINTS.CHATBOTS, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (chatbotsResponse.ok) {
                const chatbotsData = await chatbotsResponse.json();
                const allChatbots = chatbotsData.chatbots || [];
                topicOptions = fetchedTopics.map((item) => {
                    const raw = String(item || '').trim();
                    const parsedCode = parseTopicCode(raw) || raw;
                    const chatbot = allChatbots.find((cb) => cb.source === parsedCode || cb.quizTopic === parsedCode);
                    return {
                        code: parsedCode,
                        name: chatbot?.name || raw
                    };
                });
            }

            setTopics(topicOptions);
            setError('');

            if (topicOptions.length > 0) {
                setSelectedTopic(topicOptions[0].code);
                fetchRanking(topicOptions[0].code);
            } else {
                setSelectedTopic('');
                setRankingData([]);
                setClustersData(null);
                setError('Bạn chưa được gán môn học nào để xem phân tích.');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchRanking = async (topic, forceRefresh = false) => {
        if (!topic) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(API_ENDPOINTS.TEACHER_STUDENT_RANKING(topic, forceRefresh), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const apiError = await getApiError(response, 'Không thể tải xếp hạng sinh viên');
                if (isNotFoundError(response.status, apiError)) {
                    setRankingData([]);
                    setSelectedUser(null);
                    setUserQuestions([]);
                    setError('');
                    return;
                }
                throw new Error(apiError);
            }
            const data = await response.json();
            setRankingData(data.ranking || []);
            setRankingUpdatedAt(data.updated_at || null);
            setSelectedUser(null);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchClusters = async (topic, forceRefresh = false) => {
        if (!topic) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(API_ENDPOINTS.TEACHER_QUESTION_CLUSTERS(topic, forceRefresh), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const apiError = await getApiError(response, 'Không thể phân cụm câu hỏi');
                if (isNotFoundError(response.status, apiError)) {
                    setClustersData({ message: 'Chưa có dữ liệu câu hỏi để phân cụm', clusters: [] });
                    setError('');
                    return;
                }
                throw new Error(apiError);
            }
            const data = await response.json();
            const clusters = Array.isArray(data?.clusters) ? [...data.clusters] : [];
            clusters.sort((a, b) => {
                const aIsNoise = a?.cluster_id === 'cluster_noise' || a?.cluster_name?.includes('Noise');
                const bIsNoise = b?.cluster_id === 'cluster_noise' || b?.cluster_name?.includes('Noise');
                if (aIsNoise && !bIsNoise) return 1;
                if (!aIsNoise && bIsNoise) return -1;
                return (b?.size || 0) - (a?.size || 0);
            });
            setClustersData({ ...data, clusters });
            setClustersUpdatedAt(data.updated_at || null);
            setSelectedClusterId(clusters[0]?.cluster_id || null);
            setMapZoom(1);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserQuestions = async (username) => {
        try {
            setSelectedUser(username);
            setLoadingDetails(true);
            const token = localStorage.getItem('access_token');
            const response = await fetch(API_ENDPOINTS.TEACHER_USER_QUESTIONS(username, selectedTopic), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const apiError = await getApiError(response, 'Không thể tải câu hỏi của user');
                if (isNotFoundError(response.status, apiError)) {
                    setUserQuestions([]);
                    setError('');
                    return;
                }
                throw new Error(apiError);
            }
            const data = await response.json();
            setUserQuestions(data.questions || []);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleTopicChange = (e) => {
        const topic = e.target.value;
        setSelectedTopic(topic);
        setStudentSearchTerm('');
        setShowStudentSuggestions(false);
        if (activeTab === 'ranking') {
            fetchRanking(topic);
        } else {
            fetchClusters(topic);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'ranking' && rankingData.length === 0) {
            fetchRanking(selectedTopic);
        } else if (tab === 'clusters' && !clustersData) {
            fetchClusters(selectedTopic);
        }
    };

    const handleRefreshCurrentTab = () => {
        if (!selectedTopic) return;
        if (activeTab === 'ranking') {
            fetchRanking(selectedTopic, true);
            return;
        }
        fetchClusters(selectedTopic, true);
    };

    const activeUpdatedAt = activeTab === 'ranking' ? rankingUpdatedAt : clustersUpdatedAt;
    const activeUpdatedAtText = activeUpdatedAt ? new Date(activeUpdatedAt).toLocaleString('vi-VN') : '';

    const baseClusters = Array.isArray(clustersData?.clusters) ? clustersData.clusters : [];
    const visibleClusters = baseClusters.filter((cluster) => {
        if (!clusterSearchTerm.trim()) return true;
        const keywordText = (cluster.keywords || cluster.key_terms || []).join(' ').toLowerCase();
        const haystack = `${cluster.title || ''} ${cluster.summary || ''} ${keywordText}`.toLowerCase();
        return haystack.includes(clusterSearchTerm.trim().toLowerCase());
    });

    const sortedVisibleClusters = [...visibleClusters].sort((a, b) => {
        const aIsNoise = a?.cluster_id === 'cluster_noise' || a?.cluster_name?.includes('Noise');
        const bIsNoise = b?.cluster_id === 'cluster_noise' || b?.cluster_name?.includes('Noise');
        if (aIsNoise && !bIsNoise) return 1;
        if (!aIsNoise && bIsNoise) return -1;
        if (clusterSortBy === 'size_asc') return (a?.size || 0) - (b?.size || 0);
        if (clusterSortBy === 'title_asc') return String(a?.title || '').localeCompare(String(b?.title || ''), 'vi');
        return (b?.size || 0) - (a?.size || 0);
    });
    const clustersForMap = sortedVisibleClusters.length > 0 ? sortedVisibleClusters : baseClusters;
    const normalizedStudentSearch = studentSearchTerm.trim().toLowerCase();
    const filteredRankingData = rankingData.filter((user) => {
        if (!normalizedStudentSearch) return true;
        return getStudentSearchText(user).includes(normalizedStudentSearch);
    });
    const studentSuggestions = normalizedStudentSearch
        ? rankingData
            .filter((user) => {
                return getStudentSearchText(user).includes(normalizedStudentSearch);
            })
            .slice(0, 8)
        : [];

    const activeCluster = sortedVisibleClusters.find((cluster) => cluster.cluster_id === selectedClusterId) || sortedVisibleClusters[0] || null;
    const activeRepresentativeItems = activeCluster
        ? (
            Array.isArray(activeCluster.representative_question_details) && activeCluster.representative_question_details.length > 0
                ? activeCluster.representative_question_details
                : (activeCluster.representative_questions?.length ? activeCluster.representative_questions : activeCluster.sample_questions || []).map((q) => ({
                    question: q,
                    students: [],
                    student_display_names: []
                }))
        )
        : [];
    const nonNoiseClusters = baseClusters.filter((cluster) => !(cluster?.cluster_id === 'cluster_noise' || cluster?.cluster_name?.includes('Noise')));
    const totalClusterQuestions = baseClusters.reduce((sum, cluster) => sum + (cluster?.size || 0), 0);
    const largestCluster = [...nonNoiseClusters].sort((a, b) => (b?.size || 0) - (a?.size || 0))[0] || null;
    const noiseCluster = baseClusters.find((cluster) => cluster?.cluster_id === 'cluster_noise' || cluster?.cluster_name?.includes('Noise'));
    const noiseRatio = totalClusterQuestions > 0 ? ((noiseCluster?.size || 0) / totalClusterQuestions) * 100 : 0;
    const diversityLevel = nonNoiseClusters.length >= 6 ? 'Cao' : nonNoiseClusters.length >= 3 ? 'Trung bình' : 'Thấp';
    const bubblePalette = [
        'bg-emerald-200 text-emerald-900',
        'bg-blue-200 text-blue-900',
        'bg-purple-200 text-purple-900',
        'bg-yellow-200 text-yellow-900',
        'bg-pink-200 text-pink-900',
        'bg-indigo-200 text-indigo-900',
        'bg-cyan-200 text-cyan-900',
        'bg-orange-200 text-orange-900'
    ];
    const mapCanvasSize = Math.max(980, Math.ceil(Math.sqrt(Math.max(clustersForMap.length, 1))) * 260);
    const maxClusterSizeForMap = Math.max(...clustersForMap.map((item) => item.size || 1), 1);

    const handleMapWheelZoom = (event) => {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        setMapZoom((prev) => {
            const next = prev + delta;
            return Math.max(0.7, Math.min(2.2, Number(next.toFixed(2))));
        });
    };

    useEffect(() => {
        if (activeTab !== 'clusters') return;
        if (!mapViewportRef.current) return;
        const viewport = mapViewportRef.current;
        const scaledSize = mapCanvasSize * mapZoom;
        const targetLeft = Math.max(0, (scaledSize - viewport.clientWidth) / 2);
        const targetTop = Math.max(0, (scaledSize - viewport.clientHeight) / 2);
        viewport.scrollTo({ left: targetLeft, top: targetTop, behavior: 'auto' });
    }, [activeTab, mapCanvasSize, mapZoom, selectedTopic]);

    return (
        <div className="bg-gradient-to-br from-red-100 to-pink-100 min-h-screen" style={{ paddingTop: '100px' }}>
            <Navbar />
            
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                                <FaChartPie className="mr-3 text-red-600" />
                                Phân tích câu hỏi sinh viên
                            </h1>
                            <p className="text-gray-600 mt-2">Theo dõi mức độ liên quan và xu hướng câu hỏi của sinh viên</p>
                        </div>
                        
                        <div className="mt-4 md:mt-0 w-full md:w-1/3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Môn học</label>
                            <select
                                className="w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border"
                                value={selectedTopic}
                                onChange={handleTopicChange}
                                disabled={topics.length === 0}
                            >
                                {topics.length === 0 && <option value="">-- Chưa có môn học --</option>}
                                {topics.map(t => (
                                    <option key={t.code} value={t.code}>{t.code} - {t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                            {error}
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex items-center justify-between border-b border-gray-200 mb-6">
                        <div className="flex">
                        <button
                            className={`py-2 px-4 font-medium text-sm flex items-center ${activeTab === 'ranking' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => handleTabChange('ranking')}
                        >
                            <FaListOl className="mr-2" /> Xếp hạng sinh viên
                        </button>
                        <button
                            className={`py-2 px-4 font-medium text-sm flex items-center ${activeTab === 'clusters' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => handleTabChange('clusters')}
                        >
                            <FaProjectDiagram className="mr-2" /> Gom cụm câu hỏi
                        </button>
                        </div>
                        <div className="mb-1 flex items-center gap-3">
                            {activeUpdatedAtText && (
                                <span className="text-xs text-gray-500">
                                    Cập nhật lúc: {activeUpdatedAtText}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={handleRefreshCurrentTab}
                                disabled={loading || !selectedTopic}
                                className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold border ${loading || !selectedTopic ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
                                title="Cập nhật dữ liệu mới nhất và lưu snapshot"
                            >
                                <FaSyncAlt className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
                                Cập nhật
                            </button>
                        </div>
                    </div>

                    {loading && (
                        <div className="flex justify-center my-12">
                            <FaSpinner className="animate-spin text-4xl text-red-600" />
                        </div>
                    )}

                    {/* RANKING TAB */}
                    {!loading && activeTab === 'ranking' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Danh sách Ranking */}
                            <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg border border-gray-200 h-96 overflow-y-auto">
                                <h3 className="font-semibold text-lg text-gray-700 mb-4 flex items-center">
                                    <FaUsers className="mr-2 text-blue-600" /> Bảng xếp hạng
                                </h3>
                                <div className="mb-3 relative">
                                    <div className="relative">
                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                        <input
                                            type="text"
                                            placeholder="Tìm theo mã SV hoặc tên"
                                            value={studentSearchTerm}
                                            onChange={(e) => {
                                                setStudentSearchTerm(e.target.value);
                                                setShowStudentSuggestions(true);
                                            }}
                                            onFocus={() => setShowStudentSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowStudentSuggestions(false), 120)}
                                            className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                                        />
                                    </div>
                                    {showStudentSuggestions && studentSuggestions.length > 0 && (
                                        <div className="absolute left-0 right-0 mt-1 max-h-44 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                            {studentSuggestions.map((user) => (
                                                <button
                                                    key={`suggest-${user.username}`}
                                                    type="button"
                                                    onClick={() => {
                                                        setStudentSearchTerm(getStudentDisplayName(user));
                                                        setShowStudentSuggestions(false);
                                                        fetchUserQuestions(user.username);
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-red-50 border-b border-gray-100 last:border-b-0"
                                                >
                                                    <p className="text-sm font-medium text-gray-800">{getStudentDisplayName(user)}</p>
                                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {rankingData.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">Chưa có dữ liệu sinh viên hỏi môn này.</p>
                                ) : filteredRankingData.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">Không tìm thấy sinh viên phù hợp.</p>
                                ) : (
                                    <ul className="divide-y divide-gray-200">
                                        {filteredRankingData.map((user, idx) => (
                                            <li 
                                                key={user.username} 
                                                className={`py-3 px-2 cursor-pointer rounded hover:bg-red-50 transition-colors ${selectedUser === user.username ? 'bg-red-100 border-l-4 border-red-500' : ''}`}
                                                onClick={() => fetchUserQuestions(user.username)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold mr-3">
                                                            {idx + 1}
                                                        </span>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 flex items-center">
                                                                <FaUserGraduate className="mr-1 text-gray-400" /> {getStudentDisplayName(user)}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                @{user.username} - {user.related_question_count || 0} câu liên quan / {user.question_count || 0} câu hỏi
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-green-600">
                                                            {user.avg_relevance_score.toFixed(2)}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500">Avg Relevance</p>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Chi tiết câu hỏi của sinh viên */}
                            <div className="lg:col-span-2">
                                {!selectedUser ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-gray-200 p-8">
                                        <FaSearch className="text-4xl mb-3" />
                                        <p>Chọn một sinh viên bên trái để xem chi tiết các câu hỏi</p>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg border border-gray-200 p-4 h-96 overflow-y-auto">
                                        <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center border-b pb-2">
                                            <FaComments className="mr-2 text-red-500" /> Chi tiết câu hỏi của {selectedUser}
                                        </h3>
                                        
                                        {loadingDetails ? (
                                            <div className="flex justify-center my-8">
                                                <FaSpinner className="animate-spin text-2xl text-red-500" />
                                            </div>
                                        ) : userQuestions.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">Không tìm thấy câu hỏi.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {userQuestions.map((q, i) => (
                                                    <div
                                                        key={i}
                                                        className={`p-3 rounded-lg border ${q.is_top_related ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-100'}`}
                                                    >
                                                        <p className={`text-sm italic mb-2 ${q.is_top_related ? 'text-green-900 font-bold' : 'text-gray-800'}`}>
                                                            "{q.question}"
                                                        </p>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-500">{new Date(q.timestamp).toLocaleString('vi-VN')}</span>
                                                            <span className={`font-semibold px-2 py-1 rounded-full ${q.relevance_score > 0.7 ? 'bg-green-100 text-green-800' : q.relevance_score > 0.4 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                                Độ liên quan: {q.relevance_score.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* CLUSTERS TAB */}
                    {!loading && activeTab === 'clusters' && clustersData && (
                        <div>
                            {clustersData.message ? (
                                <div className="text-center p-8 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500 italic">{clustersData.message}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                                        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                                            <p className="text-xs text-indigo-700 font-semibold flex items-center"><FaQuestionCircle className="mr-1" /> Tổng số câu hỏi</p>
                                            <p className="text-2xl font-bold text-indigo-900 mt-1">{clustersData.total_unique_questions || 0}</p>
                                        </div>
                                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                                            <p className="text-xs text-emerald-700 font-semibold flex items-center"><FaLayerGroup className="mr-1" /> Số cụm chủ đề</p>
                                            <p className="text-2xl font-bold text-emerald-900 mt-1">{nonNoiseClusters.length}</p>
                                        </div>
                                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                            <p className="text-xs text-blue-700 font-semibold flex items-center"><FaBullseye className="mr-1" /> Cụm lớn nhất</p>
                                            <p className="text-base font-bold text-blue-900 mt-1 break-words">{largestCluster?.title || 'Chưa có'}</p>
                                            <p className="text-xs text-blue-700">{largestCluster?.size || 0} câu hỏi</p>
                                        </div>
                                        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                                            <p className="text-xs text-amber-700 font-semibold flex items-center"><FaExclamationTriangle className="mr-1" /> Tỷ lệ câu hỏi rải rác</p>
                                            <p className="text-2xl font-bold text-amber-900 mt-1">{noiseRatio.toFixed(1)}%</p>
                                        </div>
                                        <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
                                            <p className="text-xs text-purple-700 font-semibold">Mức đa dạng chủ đề</p>
                                            <p className="text-2xl font-bold text-purple-900 mt-1">{diversityLevel}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                        <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-semibold text-gray-800">Bản đồ chủ đề</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">Zoom</span>
                                                    <input
                                                        type="range"
                                                        min="0.7"
                                                        max="2.2"
                                                        step="0.1"
                                                        value={mapZoom}
                                                        onChange={(e) => setMapZoom(parseFloat(e.target.value))}
                                                        className="w-24"
                                                    />
                                                    <span className="text-xs text-gray-500">{Math.round(mapZoom * 100)}%</span>
                                                </div>
                                            </div>
                                            <div
                                                ref={mapViewportRef}
                                                className="h-[420px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-100 overflow-auto"
                                                onWheel={handleMapWheelZoom}
                                            >
                                                <div
                                                    className="relative"
                                                    style={{
                                                        width: `${mapCanvasSize}px`,
                                                        height: `${mapCanvasSize}px`,
                                                        transform: `scale(${mapZoom})`,
                                                        transformOrigin: 'top left'
                                                    }}
                                                >
                                                {clustersForMap.map((cluster, idx) => {
                                                    const scale = (cluster.size || 1) / maxClusterSizeForMap;
                                                    const diameter = 110 + (scale * 120);
                                                    const center = mapCanvasSize / 2;
                                                    const goldenAngle = 2.3999632297;
                                                    const radius = Math.min(center - 70, 40 + Math.sqrt(idx + 1) * 52);
                                                    const theta = idx * goldenAngle;
                                                    const x = center + radius * Math.cos(theta);
                                                    const y = center + radius * Math.sin(theta);
                                                    const color = bubblePalette[idx % bubblePalette.length];
                                                    return (
                                                        <button
                                                            key={cluster.cluster_id || idx}
                                                            type="button"
                                                            onClick={() => setSelectedClusterId(cluster.cluster_id)}
                                                            className={`absolute rounded-full shadow-sm transition hover:scale-105 ${color} ${selectedClusterId === cluster.cluster_id ? 'ring-4 ring-white/80' : ''}`}
                                                            title={cluster.title || `Cụm ${idx + 1}`}
                                                            style={{
                                                                width: `${diameter}px`,
                                                                height: `${diameter}px`,
                                                                left: `${Math.max(8, Math.min(mapCanvasSize - diameter - 8, x - diameter / 2))}px`,
                                                                top: `${Math.max(8, Math.min(mapCanvasSize - diameter - 8, y - diameter / 2))}px`
                                                            }}
                                                        >
                                                            <div className="px-2 text-center">
                                                                <p className="text-[10px] font-semibold leading-tight break-words">{cluster.title || `Cụm ${idx + 1}`}</p>
                                                                <p className="text-[11px] opacity-80 mt-1">{cluster.size} câu</p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                                {clustersForMap.length === 0 && (
                                                    <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                                                        Chưa có cụm để hiển thị trên bản đồ.
                                                    </div>
                                                )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-semibold text-gray-800">Danh sách cụm chủ đề</h3>
                                                <FaSortAmountDown className="text-gray-400" />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                                                    <input
                                                        type="text"
                                                        placeholder="Tìm cụm theo tiêu đề/tóm tắt"
                                                        className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                                                        value={clusterSearchTerm}
                                                        onChange={(e) => setClusterSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                                <select
                                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                                                    value={clusterSortBy}
                                                    onChange={(e) => setClusterSortBy(e.target.value)}
                                                >
                                                    <option value="size_desc">Sắp xếp: Theo số lượng (giảm dần)</option>
                                                    <option value="size_asc">Sắp xếp: Theo số lượng (tăng dần)</option>
                                                    <option value="title_asc">Sắp xếp: Theo tên cụm</option>
                                                </select>
                                            </div>
                                            <div className="mt-3 max-h-[255px] overflow-y-auto space-y-2">
                                                {sortedVisibleClusters.map((cluster, idx) => (
                                                    <button
                                                        key={cluster.cluster_id || idx}
                                                        type="button"
                                                        onClick={() => setSelectedClusterId(cluster.cluster_id)}
                                                        className={`w-full text-left p-3 rounded-lg border transition ${selectedClusterId === cluster.cluster_id ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                                    >
                                                        <div className="flex justify-between gap-3">
                                                            <p className="text-sm font-semibold text-gray-800 break-words">{cluster.title || `Nhóm ${idx + 1}`}</p>
                                                            <p className="text-xs text-gray-500 whitespace-nowrap">{cluster.size} câu</p>
                                                        </div>
                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{cluster.summary || 'Chưa có tóm tắt.'}</p>
                                                    </button>
                                                ))}
                                                {sortedVisibleClusters.length === 0 && (
                                                    <p className="text-sm text-gray-500 italic">Không có cụm phù hợp với từ khóa tìm kiếm.</p>
                                                )}
                                            </div>
                                        </div>
                                                </div>
                                                
                                    {activeCluster && (
                                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                            <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-4">
                                                <h3 className="font-semibold text-gray-800 mb-3">Câu hỏi tiêu biểu</h3>
                                                <div className="overflow-hidden rounded-lg border border-gray-100">
                                                    {activeRepresentativeItems.slice(0, 6).map((item, idx) => (
                                                        <div key={`${item.question}-${idx}`} className={`px-3 py-3 ${idx !== 0 ? 'border-t border-gray-100' : ''}`}>
                                                            <div className="flex items-start justify-between gap-3">
                                                                <p className="text-sm text-gray-700 italic">"{item.question}"</p>
                                                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-1">
                                                                    {(0.95 - idx * 0.06).toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                                <span className="text-[11px] text-gray-500">Sinh viên:</span>
                                                                {(item.student_display_names?.length ? item.student_display_names : item.students || []).length > 0 ? (
                                                                    (item.student_display_names?.length ? item.student_display_names : item.students || []).slice(0, 4).map((student, studentIdx) => (
                                                                        <span key={`${student}-${studentIdx}`} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                                                            {normalizeDisplayName(student)}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-[11px] italic text-gray-400">Chưa xác định</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-gray-200 bg-white p-4">
                                                <h3 className="font-semibold text-gray-800 mb-2">Tóm tắt cụm</h3>
                                                <p className="text-sm font-semibold text-indigo-700 mb-2">{activeCluster.title || 'Chủ đề chính'}</p>
                                                <p className="text-sm text-gray-700 leading-relaxed">{activeCluster.summary || 'Chưa có tóm tắt chi tiết.'}</p>
                                                {(activeCluster.intents || []).length > 0 && (
                                                    <div className="mt-3">
                                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Mục đích hỏi</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {activeCluster.intents.map((intent, idx) => (
                                                                <span key={`${intent}-${idx}`} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                                    {intent}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {((activeCluster.keywords || activeCluster.key_terms || []).length > 0) && (
                                                    <div className="mt-3">
                                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Từ khóa liên quan</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {(activeCluster.keywords || activeCluster.key_terms || []).slice(0, 6).map((term, idx) => (
                                                                <span key={`${term}-${idx}`} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                                                    {term}
                                                                </span>
                                        ))}
                                    </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default TeacherAnalytics;
