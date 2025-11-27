"""데이터베이스에 order_index 컬럼 추가 스크립트"""
from sqlalchemy import text
from app.core.database import engine

def add_order_index_column():
    """questions 테이블에 order_index 컬럼 추가"""
    with engine.begin() as conn:
        try:
            # 컬럼이 이미 존재하는지 확인
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='questions' AND column_name='order_index'
            """))
            
            if result.fetchone():
                print("✓ order_index 컬럼이 이미 존재합니다.")
                return
            
            # 컬럼 추가
            print("order_index 컬럼을 추가하는 중...")
            conn.execute(text("""
                ALTER TABLE questions 
                ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0
            """))
            print("✓ order_index 컬럼이 성공적으로 추가되었습니다.")
        except Exception as e:
            print(f"✗ 오류 발생: {e}")
            raise

if __name__ == "__main__":
    print("데이터베이스에 order_index 컬럼 추가 중...")
    add_order_index_column()
    print("완료!")

