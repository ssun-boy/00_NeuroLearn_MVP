'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

interface PdfViewerProps {
  fileUrl: string;
  onPageSelect?: (pageNumber: number) => void;
  selectedPage?: number | null;
  height?: number;
}

export default function PdfViewer({ 
  fileUrl, 
  onPageSelect, 
  selectedPage,
  height = 600 
}: PdfViewerProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pageInputValue, setPageInputValue] = useState<string>('1');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [iframeKey, setIframeKey] = useState<number>(0);

  // PDF 페이지 수 추정 (iframe에서는 정확하지 않을 수 있음)
  useEffect(() => {
    // PDF 파일을 fetch하여 페이지 수 추정 시도
    if (fileUrl) {
      fetch(fileUrl, { method: 'HEAD' })
        .then(() => {
          setIsLoading(false);
          // 정확한 페이지 수는 PDF를 파싱해야 알 수 있지만, 
          // iframe에서는 대략적인 값 사용
          setTotalPages(100); // 기본값, 실제로는 PDF 메타데이터에서 가져와야 함
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [fileUrl]);

  // selectedPage가 변경되면 해당 페이지로 이동
  useEffect(() => {
    if (selectedPage && selectedPage !== currentPage && selectedPage > 0) {
      const validPage = Math.max(1, selectedPage);
      setCurrentPage(validPage);
      setPageInputValue(String(validPage));
      setIframeKey((prev) => prev + 1);
    }
  }, [selectedPage]);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, page);
    setCurrentPage(validPage);
    setPageInputValue(String(validPage));
    
    // iframe을 다시 로드하여 페이지 이동 (강제 새로고침)
    setIframeKey((prev) => prev + 1);
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value);
  };

  const handlePageInputBlur = () => {
    const page = parseInt(pageInputValue, 10);
    if (!isNaN(page) && page > 0) {
      goToPage(page);
    } else {
      setPageInputValue(String(currentPage));
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
    }
  };

  const handlePageClick = () => {
    if (onPageSelect) {
      onPageSelect(currentPage);
    }
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.5));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));

  // PDF URL 생성 (좌측 미리보기 숨김, 페이지 맞춤, 페이지 번호)
  // navpanes=0: 좌측 미리보기 숨김
  // toolbar=0: 툴바 숨김 (선택사항)
  // zoom=page-width: 페이지 너비에 맞춤 (1페이지 전체 표시)
  const pdfUrlWithPage = `${fileUrl}#page=${currentPage}&navpanes=0&zoom=page-width`;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border shadow-sm">
      {/* 컨트롤 바 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b gap-4">
        {/* 페이지 네비게이션 */}
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            이전
          </Button>
          
          <div className="flex items-center gap-1">
            <Input
              type="text"
              value={pageInputValue}
              onChange={handlePageInputChange}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              className="w-16 text-center h-8"
            />
            {totalPages > 0 && (
              <span className="text-sm text-gray-600">/ {totalPages}</span>
            )}
          </div>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => goToPage(currentPage + 1)}
            disabled={totalPages > 0 && currentPage >= totalPages}
          >
            다음
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* 확대/축소 */}
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-16 text-center font-medium">{Math.round(scale * 100)}%</span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={zoomIn}
            disabled={scale >= 2.5}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* 페이지 선택 버튼 */}
        {onPageSelect && (
          <Button 
            size="sm"
            onClick={handlePageClick}
            className={
              selectedPage === currentPage 
                ? 'bg-green-600 hover:bg-green-700' 
                : selectedPage !== null && selectedPage !== currentPage
                ? 'bg-orange-600 hover:bg-orange-700'
                : ''
            }
          >
            {selectedPage === null 
              ? '페이지 매핑'
              : selectedPage === currentPage 
              ? '✓ 매핑됨' 
              : '재매핑'}
          </Button>
        )}
      </div>

      {/* PDF 뷰어 (iframe) */}
      <div 
        className="flex-1 overflow-hidden bg-gray-200"
        style={{ height: `${height}px` }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-gray-500">PDF 로딩 중...</p>
            </div>
          </div>
        ) : (
          <iframe
            key={iframeKey}
            id="pdf-iframe"
            src={pdfUrlWithPage}
            className="w-full h-full border-0"
            title="PDF Viewer"
            onLoad={() => setIsLoading(false)}
            style={{
              // 페이지 너비에 맞춰 자동 조정되므로 transform 제거
            }}
          />
        )}
      </div>
    </div>
  );
}
