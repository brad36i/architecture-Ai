import assert from "node:assert/strict";
import test from "node:test";

import {
  displayNameFromStoredFilename,
  normalizeMultipartFilename,
} from "./file-names.js";

test("multipart로 깨진 한글 파일명을 UTF-8로 복원한다", () => {
  const original = "학교 설계공모 지침서.hwp";
  const multipartValue = Buffer.from(original, "utf8").toString("latin1");

  assert.equal(normalizeMultipartFilename(multipartValue), original);
});

test("정상 파일명은 변경하지 않는다", () => {
  assert.equal(
    normalizeMultipartFilename("competition-guideline.pdf"),
    "competition-guideline.pdf",
  );
  assert.equal(normalizeMultipartFilename("café.pdf"), "café.pdf");
});

test("저장용 랜덤 접미사를 화면 파일명에서 제거한다", () => {
  assert.equal(
    displayNameFromStoredFilename(
      "학교 설계공모 지침서-1783338004391-732144324.hwp",
    ),
    "학교 설계공모 지침서.hwp",
  );
});

test("이미 손실된 레거시 파일명은 깨진 문자 대신 대체 이름을 표시한다", () => {
  assert.equal(
    displayNameFromStoredFilename(
      "1.âê3μê3 ë êì1ë-1783338004393-914672907.hwp",
    ),
    "1. 업로드 파일.hwp",
  );
});
