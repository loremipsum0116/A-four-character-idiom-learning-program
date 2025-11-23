-- Hanja와 Hangul 컬럼 값 교환
USE idiom_learning;

-- 임시 컬럼 생성
ALTER TABLE Idioms ADD COLUMN TempColumn VARCHAR(50);

-- 값 교환
UPDATE Idioms SET TempColumn = Hanja;
UPDATE Idioms SET Hanja = Hangul;
UPDATE Idioms SET Hangul = TempColumn;

-- 임시 컬럼 삭제
ALTER TABLE Idioms DROP COLUMN TempColumn;

-- 확인용 쿼리
SELECT IdiomId, Hanja, Hangul, Meaning
FROM Idioms
LIMIT 10;
