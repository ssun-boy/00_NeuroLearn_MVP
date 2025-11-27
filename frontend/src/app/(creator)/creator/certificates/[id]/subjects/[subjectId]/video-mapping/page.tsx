'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { 
  ChapterTreeNode, 
  Video, 
  Textbook,
  ChapterVideoMappingUpdateRequest 
} from '@/types';
import { formatSeconds, formatSecondsToHHMMSS } from '@/lib/timeUtils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import VideoPlayer from '@/components/video/VideoPlayer';
import PdfViewer from '@/components/pdf/PdfViewer';
import { ArrowLeft } from 'lucide-react';

// 목차 트리 아이템 (영상 매핑용)
function VideoMappingChapterItem({
  chapter,
  depth = 0,
  selectedId,
  onSelect,
}: {
  chapter: ChapterTreeNode;
  depth?: number;
  selectedId: string | null;
  onSelect: (chapter: ChapterTreeNode) => void;
}) {
  const isSelected = selectedId === chapter.id;
  const hasTextbookMapping = chapter.textbook_page !== null;
  const hasVideoMapping = chapter.video_id !== null;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-2 rounded cursor-pointer transition-colors text-sm ${
          isSelected
            ? 'bg-blue-100 border-2 border-blue-400'
            : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(chapter)}
      >
        {/* 제목 - 좌측 정렬 */}
        <span className="flex-1 font-medium truncate text-left">{chapter.title}</span>

        {/* 매핑 상태 - 우측 정렬 */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          <span className={`text-xs ${hasTextbookMapping ? 'text-green-500' : 'text-gray-400'}`}>
            📖
          </span>
          <span className={`text-xs ${hasVideoMapping ? 'text-green-500' : 'text-gray-400'}`}>
            🎬
          </span>

          {/* 영상 시작 시간 - 항상 동일한 공간 확보 */}
          <span className="text-xs min-w-[60px] text-center">
            {hasVideoMapping && chapter.video_start_seconds !== null ? (
              <span className="bg-purple-100 text-purple-700 px-1 rounded">
                {formatSecondsToHHMMSS(chapter.video_start_seconds)}
              </span>
            ) : null}
          </span>
        </div>
      </div>

      {/* 하위 목차 */}
      {chapter.children && chapter.children.length > 0 && (
        <div>
          {chapter.children.map((child) => (
            <VideoMappingChapterItem
              key={child.id}
              chapter={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VideoMappingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const certificateId = params.id as string;
  const subjectId = params.subjectId as string;

  const [chapters, setChapters] = useState<ChapterTreeNode[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<ChapterTreeNode | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedTextbook, setSelectedTextbook] = useState<Textbook | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 데이터 불러오기
  const fetchData = async () => {
    try {
      const [chaptersData, videosData, textbooksData] = await Promise.all([
        apiClient<ChapterTreeNode[]>(`/api/v1/subjects/${subjectId}/chapters/tree`),
        apiClient<Video[]>(`/api/v1/subjects/${subjectId}/videos`),
        apiClient<Textbook[]>(`/api/v1/subjects/${subjectId}/textbooks`),
      ]);
      setChapters(chaptersData);
      setVideos(videosData);
      setTextbooks(textbooksData);

      if (videosData.length > 0) {
        setSelectedVideo(videosData[0]);
      }
      if (textbooksData.length > 0) {
        setSelectedTextbook(textbooksData[0]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, subjectId]);

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // 영상 매핑 저장
  const handleTimeSelect = async (seconds: number) => {
    if (!selectedChapter) {
      alert('먼저 목차를 선택해주세요');
      return;
    }
    if (!selectedVideo) {
      alert('먼저 영상을 선택해주세요');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient(
        `/api/v1/subjects/${subjectId}/chapters/${selectedChapter.id}/video-mapping`,
        {
          method: 'PATCH',
          body: {
            video_id: selectedVideo.id,
            video_start_seconds: seconds,
          } as ChapterVideoMappingUpdateRequest,
        }
      );

      await fetchData();
      setSelectedChapter((prev) =>
        prev
          ? { ...prev, video_id: selectedVideo.id, video_start_seconds: seconds }
          : null
      );

      alert(
        `"${selectedChapter.title}"에 영상 ${formatSeconds(seconds)} 시점이 매핑되었습니다`
      );
    } catch (error) {
      console.error('Failed to save mapping:', error);
      alert('매핑 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  // 매핑 해제
  const handleClearMapping = async () => {
    if (!selectedChapter) return;
    if (!confirm('이 목차의 영상 매핑을 해제하시겠습니까?')) return;

    setIsSaving(true);
    try {
      await apiClient(
        `/api/v1/subjects/${subjectId}/chapters/${selectedChapter.id}/video-mapping`,
        {
          method: 'PATCH',
          body: {
            video_id: null,
            video_start_seconds: null,
          } as ChapterVideoMappingUpdateRequest,
        }
      );

      await fetchData();
      setSelectedChapter((prev) =>
        prev ? { ...prev, video_id: null, video_start_seconds: null } : null
      );
    } catch (error) {
      console.error('Failed to clear mapping:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white shadow flex-shrink-0">
        <div className="max-w-full mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(
                `/creator/certificates/${certificateId}/subjects/${subjectId}/videos`
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              영상 관리
            </Button>
            <h1 className="text-lg font-bold">목차-영상 매핑</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* PDF 토글 */}
            <Button
              variant={showPdf ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowPdf(!showPdf)}
            >
              {showPdf ? '📖 교재 숨기기' : '📖 교재 보기'}
            </Button>

            {/* 영상 선택 */}
            {videos.length > 0 && (
              <Select
                value={selectedVideo?.id || ''}
                onValueChange={(id) => {
                  const video = videos.find((v) => v.id === id);
                  if (video) setSelectedVideo(video);
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="영상 선택" />
                </SelectTrigger>
                <SelectContent>
                  {videos.map((video) => (
                    <SelectItem key={video.id} value={video.id}>
                      {video.title} ({formatSeconds(video.duration_seconds)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측: 목차 트리 (1/3) */}
        <div className="w-1/3 border-r bg-white overflow-auto">
          <div className="p-3 border-b bg-gray-50">
            <h2 className="font-semibold text-sm">목차</h2>
          </div>
          <div className="p-1">
            {chapters.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                목차가 없습니다
              </div>
            ) : (
              chapters.map((chapter) => (
                <VideoMappingChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  selectedId={selectedChapter?.id || null}
                  onSelect={setSelectedChapter}
                />
              ))
            )}
          </div>
        </div>

        {/* 우측: 영상 플레이어 (2/3) */}
        <div className="w-2/3 flex flex-col">
          {/* 선택된 목차 정보 */}
          {selectedChapter && (
            <div className="p-3 bg-blue-50 border-b flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600">선택된 목차: </span>
                <span className="font-semibold">{selectedChapter.title}</span>
                {selectedChapter.video_id && selectedChapter.video_start_seconds !== null && (
                  <span className="ml-2 text-sm text-purple-600">
                    (현재 매핑: {formatSeconds(selectedChapter.video_start_seconds)})
                  </span>
                )}
              </div>
              {selectedChapter.video_id && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearMapping}
                  disabled={isSaving}
                >
                  매핑 해제
                </Button>
              )}
            </div>
          )}

          {/* 영상 플레이어 */}
          {videos.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">🎬</p>
                <p>등록된 영상이 없습니다</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push(
                    `/creator/certificates/${certificateId}/subjects/${subjectId}/videos`
                  )}
                >
                  영상 등록하기
                </Button>
              </div>
            </div>
          ) : selectedVideo ? (
            <div className="flex-1">
              <VideoPlayer
                url={selectedVideo.url}
                title={selectedVideo.title}
                onTimeSelect={handleTimeSelect}
                initialTime={
                  selectedChapter?.video_id === selectedVideo.id && selectedChapter.video_start_seconds !== null
                    ? selectedChapter.video_start_seconds
                    : 0
                }
                key={`${selectedChapter?.id}-${selectedChapter?.video_start_seconds || 0}`}
                height={400}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              영상을 선택해주세요
            </div>
          )}
        </div>
      </div>

      {/* 저장 중 오버레이 */}
      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg">저장 중...</div>
        </div>
      )}
    </div>
  );
}

