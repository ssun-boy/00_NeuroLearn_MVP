import os
from PyPDF2 import PdfReader, PdfWriter

def split_pdf_range(input_path, password, from_page, to_page):
    # 1. 경로 및 파일 이름 분리
    base_dir = os.path.dirname(input_path)
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    output_path = os.path.join(base_dir, f"{base_name}_split.pdf")

    # 2. PDF 열기
    reader = PdfReader(input_path)
    if reader.is_encrypted:
        try:
            reader.decrypt(password)
        except Exception as e:
            print("암호 해제 실패:", e)
            return

    total_pages = len(reader.pages)
    if from_page < 1 or to_page > total_pages or from_page > to_page:
        print(f"잘못된 페이지 범위입니다. PDF는 총 {total_pages}페이지입니다.")
        return

    # 3. 분할
    writer = PdfWriter()
    for i in range(from_page - 1, to_page):  # 0-index 기반
        writer.add_page(reader.pages[i])

    # 4. 저장
    with open(output_path, "wb") as f:
        writer.write(f)

    print(f"분할 완료: {output_path}")


# ===== 사용자 입력 =====
input_pdf_path = input("PDF 파일 경로를 입력하세요 (예: C:/docs/myfile.pdf): ").strip()
pdf_password = input("PDF 열람 비밀번호 (없으면 빈칸): ").strip()
from_page = int(input("분할 시작 페이지 번호 (1부터 시작): "))
to_page = int(input("분할 종료 페이지 번호: "))

split_pdf_range(input_pdf_path, pdf_password, from_page, to_page)
