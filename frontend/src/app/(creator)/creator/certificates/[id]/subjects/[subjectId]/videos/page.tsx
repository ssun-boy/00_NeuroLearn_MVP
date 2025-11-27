'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Video, VideoCreateRequest } from '@/types';
import { formatSeconds, extractYouTubeId, getYouTubeThumbnail } from '@/lib/timeUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';

export default function VideosPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const certificateId = params.id as string;
  const subjectId = params.subjectId as string;

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog 상태
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoDuration, setNewVideoDuration] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 수정 Dialog 상태
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  // 데이터 불러오기
  const fetchVideos = async () => {
    try {
      const data = await apiClient<Video[]>(`/api/v1/subjects/${subjectId}/videos`);
      setVideos(data);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchVideos();
    }
  }, [authLoading, user, subjectId]);

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // 영상 추가
  const handleAddVideo = async () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim() || !newVideoDuration) return;

    // 시간 파싱 (MM:SS 또는 HH:MM:SS)
    const parts = newVideoDuration.split(':').map(Number);
    let durationSeconds = 0;
    if (parts.length === 3) {
      durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      durationSeconds = parts[0] * 60 + parts[1];
    } else {
      durationSeconds = parseInt(newVideoDuration) || 0;
    }

    if (durationSeconds <= 0) {
      alert('영상 길이를 올바르게 입력해주세요 (예: 10:30)');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient(`/api/v1/subjects/${subjectId}/videos`, {
        method: 'POST',
        body: {
          title: newVideoTitle,
          url: newVideoUrl,
          duration_seconds: durationSeconds,
          order_index: videos.length,
        } as VideoCreateRequest,
      });

      await fetchVideos();
      setNewVideoTitle('');
      setNewVideoUrl('');
      setNewVideoDuration('');
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to add video:', error);
      alert('영상 등록에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 영상 삭제
  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('이 영상을 삭제하시겠습니까?')) return;

    try {
      await apiClient(`/api/v1/subjects/${subjectId}/videos/${videoId}`, {
        method: 'DELETE',
      });
      await fetchVideos();
    } catch (error) {
      console.error('Failed to delete video:', error);
      alert('영상 삭제에 실패했습니다');
    }
  };

  // YouTube 썸네일 미리보기
  const youtubeId = extractYouTubeId(newVideoUrl);

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(
                `/creator/certificates/${certificateId}/subjects/${subjectId}/chapters`
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              목차 관리
            </Button>
            <h1 className="text-xl font-bold">영상 관리</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 상단 액션 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">등록된 영상 ({videos.length}개)</h2>
          <Button onClick={() => setIsAddDialogOpen(true)}>+ 새 영상</Button>
        </div>

        {/* 영상 목록 */}
        {videos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              등록된 영상이 없습니다. 새 영상을 추가해보세요!
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">순서</TableHead>
                  <TableHead className="w-24">썸네일</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="w-24">길이</TableHead>
                  <TableHead className="w-48">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video, index) => {
                  const videoYoutubeId = extractYouTubeId(video.url);
                  return (
                    <TableRow key={video.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {videoYoutubeId ? (
                          <img
                            src={getYouTubeThumbnail(videoYoutubeId)}
                            alt={video.title}
                            className="w-20 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center">
                            🎬
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{video.title}</p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {video.url}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatSeconds(video.duration_seconds)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(video.url, '_blank')}
                          >
                            보기
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(
                              `/creator/certificates/${certificateId}/subjects/${subjectId}/video-mapping`
                            )}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            매핑
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteVideo(video.id)}
                          >
                            삭제
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>

      {/* 영상 추가 Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>새 영상 추가</DialogTitle>
            <DialogDescription>영상 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="videoTitle">영상 제목 *</Label>
              <Input
                id="videoTitle"
                placeholder="예: 1강. 컴퓨터 개요"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoUrl">영상 URL *</Label>
              <Input
                id="videoUrl"
                placeholder="https://youtube.com/watch?v=... 또는 영상 URL"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
              />
              {youtubeId && (
                <div className="mt-2">
                  <img
                    src={getYouTubeThumbnail(youtubeId)}
                    alt="YouTube 썸네일"
                    className="w-40 h-24 object-cover rounded"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoDuration">영상 길이 * (MM:SS 또는 HH:MM:SS)</Label>
              <Input
                id="videoDuration"
                placeholder="예: 45:30 또는 1:30:00"
                value={newVideoDuration}
                onChange={(e) => setNewVideoDuration(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleAddVideo}
              disabled={isSubmitting || !newVideoTitle.trim() || !newVideoUrl.trim()}
            >
              {isSubmitting ? '등록 중...' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

